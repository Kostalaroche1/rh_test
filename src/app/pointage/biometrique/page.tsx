"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FaceMatcher } from "face-api.js";
import { AlertCircle, Camera, CheckCircle2, Loader2, Square, UserRoundCheck } from "lucide-react";

import { useAuth } from "@/app/contexts/auth/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { hasAnyPermission } from "@/security/permissions";

type FaceApiModule = typeof import("face-api.js");

type ReferenceFace = {
  agentId: number;
  matricule: string;
  nom: string;
  prenom: string;
  fullName: string;
  descriptors: number[][];
};

type RecognitionEvent = {
  id: number;
  kind: "success" | "error" | "info";
  text: string;
  at: number;
};

type AccessWarning = {
  reason: "permission" | "references";
  title: string;
  message: string;
};

type LocalReferencesCache = {
  data: ReferenceFace[];
  expiresAt: number;
};

type PendingDepartureCandidate = {
  agentId: number;
  fullName: string;
  matricule: string;
  distance: number | null;
  detectedAt: number;
  confirming: boolean;
  errorMessage?: string;
};

type PointageResponsePayload = {
  message?: string;
  requiresDepartureConfirmation?: boolean;
  action?: "ARRIVEE" | "DEPART" | "AUCUNE";
  completed?: boolean;
  alreadySigned?: boolean;
};

type LifecycleStatus =
  | "idle"
  | "loading-models"
  | "loading-references"
  | "starting-camera"
  | "running"
  | "stopped"
  | "error";

const MODEL_BASE_PATH = "/models/face-api";
const FRAME_INTERVAL_MS = 700;
const FACE_MATCH_THRESHOLD = 0.48;
const MIN_STREAK_FOR_POINTAGE = 2;
const SUCCESS_COOLDOWN_MS = 45_000;
const ERROR_COOLDOWN_MS = 12_000;
const LOCAL_REFERENCES_CACHE_TTL_MS = 90_000;
const DIRECTION_CONTACT_URL = "https://cria.cd/contact";

function formatClock(value: number) {
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function PointageBiometriquePage() {
  const { auth, isPending: authPending } = useAuth() as {
    auth: unknown;
    isPending?: boolean;
  };
  const canUseBiometric = hasAnyPermission(auth as any, [
    "presence.biometric",
    "presence.sign",
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceApiRef = useRef<FaceApiModule | null>(null);
  const matcherRef = useRef<FaceMatcher | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameTimerRef = useRef<number | null>(null);
  const isFrameProcessingRef = useRef(false);
  const knownAgentsRef = useRef<Map<number, ReferenceFace>>(new Map());
  const streakByAgentRef = useRef<Map<number, number>>(new Map());
  const cooldownByAgentRef = useRef<Map<number, number>>(new Map());
  const pendingPointageRef = useRef<Set<number>>(new Set());
  const pendingDepartureByAgentRef = useRef<Set<number>>(new Set());
  const isRunningRef = useRef(false);
  const localReferencesCacheRef = useRef<LocalReferencesCache | null>(null);

  const [status, setStatus] = useState<LifecycleStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [referencesTotal, setReferencesTotal] = useState(0);
  const [referencesReady, setReferencesReady] = useState(0);
  const [facesInFrame, setFacesInFrame] = useState(0);
  const [events, setEvents] = useState<RecognitionEvent[]>([]);
  const [accessWarning, setAccessWarning] = useState<AccessWarning | null>(null);
  const [pendingDepartures, setPendingDepartures] = useState<PendingDepartureCandidate[]>([]);
  const [departureModalOpen, setDepartureModalOpen] = useState(false);

  const statusLabel = useMemo(() => {
    if (status === "loading-models") return "Chargement des modeles...";
    if (status === "loading-references") return "Preparation des profils...";
    if (status === "starting-camera") return "Demarrage de la camera...";
    if (status === "running") return "Reconnaissance active";
    if (status === "stopped") return "Capture arretee";
    if (status === "error") return "Erreur";
    return "Pret";
  }, [status]);

  function pushEvent(kind: RecognitionEvent["kind"], text: string) {
    setEvents((prev) => [
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        kind,
        text,
        at: Date.now(),
      },
      ...prev,
    ].slice(0, 10));
  }

  function clearPendingDepartures() {
    pendingDepartureByAgentRef.current.clear();
    setPendingDepartures([]);
    setDepartureModalOpen(false);
  }

  function queueDepartureConfirmation(agentId: number, distance: number) {
    const agent = knownAgentsRef.current.get(agentId);
    pendingDepartureByAgentRef.current.add(agentId);
    setDepartureModalOpen(true);
    setPendingDepartures((prev) => {
      const existing = prev.find((item) => item.agentId === agentId);
      if (existing) {
        return prev.map((item) =>
          item.agentId === agentId
            ? {
                ...item,
                distance: Number.isFinite(distance) ? distance : item.distance,
                detectedAt: Date.now(),
                confirming: false,
                errorMessage: undefined,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          agentId,
          fullName: agent?.fullName ?? `Agent #${agentId}`,
          matricule: agent?.matricule ?? "-",
          distance: Number.isFinite(distance) ? distance : null,
          detectedAt: Date.now(),
          confirming: false,
        },
      ];
    });
  }

  function updatePendingDeparture(
    agentId: number,
    updater: (current: PendingDepartureCandidate) => PendingDepartureCandidate
  ) {
    setPendingDepartures((prev) =>
      prev.map((item) => (item.agentId === agentId ? updater(item) : item))
    );
  }

  function removePendingDeparture(agentId: number) {
    pendingDepartureByAgentRef.current.delete(agentId);
    setPendingDepartures((prev) => prev.filter((item) => item.agentId !== agentId));
  }

  function activateAccessWarning(warning: AccessWarning) {
    stopRecognition("error");
    setErrorMessage(warning.message);
    setAccessWarning(warning);
  }

  function clearOverlay() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function stopFrameLoop() {
    if (frameTimerRef.current != null) {
      window.clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    isFrameProcessingRef.current = false;
  }

  function stopCamera() {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    clearOverlay();
    setFacesInFrame(0);
  }

  function stopRecognition(nextStatus: LifecycleStatus = "stopped") {
    isRunningRef.current = false;
    stopFrameLoop();
    stopCamera();
    streakByAgentRef.current.clear();
    pendingPointageRef.current.clear();
    clearPendingDepartures();
    setStatus(nextStatus);
  }

  async function startCameraStream() {
    if (!window.isSecureContext) {
      throw new Error(
        "Acces camera bloque: sur mobile il faut HTTPS (ou http://localhost sur le meme appareil)."
      );
    }

    const hasModernGetUserMedia = Boolean(
      navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function"
    );
    const legacyGetUserMedia =
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      null;

    if (!hasModernGetUserMedia && !legacyGetUserMedia) {
      throw new Error(
        "Ce navigateur ne fournit pas l'API camera. Essayez Chrome/Firefox recent et verifiez les permissions."
      );
    }

    const getMediaStream = (constraints: MediaStreamConstraints) => {
      if (hasModernGetUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
      }

      return new Promise<MediaStream>((resolve, reject) => {
        legacyGetUserMedia.call(navigator, constraints, resolve, reject);
      });
    };

    const cameraStrategies: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          width: { ideal: 960 },
          height: { ideal: 540 },
        },
        audio: false,
      },
      { video: true, audio: false },
    ];

    let stream: MediaStream | null = null;
    let lastError: unknown = null;
    for (const constraints of cameraStrategies) {
      try {
        stream = await getMediaStream(constraints);
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!stream) {
      const message = String((lastError as any)?.message ?? "").toLowerCase();
      const securityLike =
        message.includes("secure") ||
        message.includes("https") ||
        message.includes("permission policy");
      if (securityLike) {
        throw new Error(
          "Acces camera refuse par le navigateur. Ouvrez l'application en HTTPS et autorisez la camera."
        );
      }

      throw (lastError instanceof Error
        ? lastError
        : new Error("Impossible d'ouvrir la camera sur cet appareil."));
    }

    streamRef.current = stream;

    const video = videoRef.current;
    if (!video) {
      throw new Error("Lecteur video indisponible.");
    }

    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.muted = true;
    video.autoplay = true;
    video.srcObject = stream;
    await video.play().catch(() => undefined);
    await new Promise<void>((resolve) => {
      if (video.readyState >= 1) {
        resolve();
        return;
      }

      const timeoutId = window.setTimeout(() => {
        video.removeEventListener("loadedmetadata", onLoadedData);
        video.removeEventListener("loadeddata", onLoadedData);
        resolve();
      }, 4000);

      const onLoadedData = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener("loadedmetadata", onLoadedData);
        video.removeEventListener("loadeddata", onLoadedData);
        resolve();
      };

      video.addEventListener("loadedmetadata", onLoadedData);
      video.addEventListener("loadeddata", onLoadedData);
    });
    await video.play().catch(() => undefined);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = video.videoWidth || video.clientWidth || 960;
      canvas.height = video.videoHeight || video.clientHeight || 540;
    }
  }

  async function loadReferencesMatcher(faceapi: FaceApiModule) {
    setStatus("loading-references");
    setReferencesTotal(0);
    setReferencesReady(0);
    matcherRef.current = null;
    knownAgentsRef.current.clear();

    try {
      let references: ReferenceFace[] = [];
      let referencesSource: "local-memory" | "api" = "api";
      const localCache = localReferencesCacheRef.current;

      if (localCache && localCache.expiresAt > Date.now()) {
        references = localCache.data;
        referencesSource = "local-memory";
      } else {
        const referencesResponse = await fetch("/api/biometrie/references", {
          method: "GET",
          cache: "no-store",
        });

        const referencesPayload = await referencesResponse.json().catch(() => null);
        if (!referencesResponse.ok) {
          const message = String(
            referencesPayload?.message ??
              "Impossible de charger les references biometrques."
          );

          if (referencesResponse.status === 401 || referencesResponse.status === 403) {
            activateAccessWarning({
              reason: "permission",
              title: "Pointage biometrque non autorise",
              message:
                "Vous n'avez pas l'autorisation de pointer par biometrie. Contactez la direction RH.",
            });
            return;
          }

          setErrorMessage(message);
          pushEvent("error", message);
          return;
        }

        references = Array.isArray(referencesPayload?.data)
          ? (referencesPayload.data as ReferenceFace[])
          : [];

        localReferencesCacheRef.current = {
          data: references,
          expiresAt: Date.now() + LOCAL_REFERENCES_CACHE_TTL_MS,
        };
      }

      setReferencesTotal(references.length);
      if (!references.length) {
        activateAccessWarning({
          reason: "references",
          title: "Referentiel biometrque introuvable",
          message:
            "Aucun referentiel biometrque actif n'est disponible en base pour votre perimetre. Contactez la direction RH.",
        });
        return;
      }

      const labeledDescriptors: import("face-api.js").LabeledFaceDescriptors[] = [];
      const knownAgents = new Map<number, ReferenceFace>();
      let preparedCount = 0;

      for (const reference of references) {
        const descriptors = Array.isArray(reference.descriptors)
          ? reference.descriptors
              .filter((descriptor) => Array.isArray(descriptor) && descriptor.length === 128)
              .map((descriptor) => Float32Array.from(descriptor.map((value) => Number(value))))
              .filter((descriptor) => descriptor.length === 128)
          : [];

        if (!descriptors.length) {
          continue;
        }

        labeledDescriptors.push(
          new faceapi.LabeledFaceDescriptors(String(reference.agentId), descriptors)
        );
        knownAgents.set(reference.agentId, reference);
        preparedCount += 1;
        setReferencesReady(preparedCount);
      }

      if (!labeledDescriptors.length) {
        activateAccessWarning({
          reason: "references",
          title: "Referentiel biometrque invalide",
          message:
            "Les referentiels biometrques trouves sont invalides ou incomplets. Contactez la direction RH.",
        });
        return;
      }

      matcherRef.current = new faceapi.FaceMatcher(
        labeledDescriptors,
        FACE_MATCH_THRESHOLD
      );
      knownAgentsRef.current = knownAgents;
      setErrorMessage("");
      setAccessWarning(null);
      pushEvent(
        "info",
        referencesSource === "local-memory"
          ? `References biometrques rechargees depuis la memoire locale (${labeledDescriptors.length} profil(s)).`
          : `References biometrques pretes: ${labeledDescriptors.length} profil(s) detectables.`
      );
    } catch {
      const message =
        "Erreur de chargement des references. Camera active, pointage auto inactif.";
      setErrorMessage(message);
      pushEvent("error", message);
    } finally {
      if (isRunningRef.current) {
        setStatus("running");
      }
    }
  }

  async function submitBiometricPointage(
    agentId: number,
    distance: number,
    options?: { confirmDeparture?: boolean; silent?: boolean }
  ) {
    const confirmDeparture = options?.confirmDeparture === true;
    const silent = options?.silent === true;

    if (pendingPointageRef.current.has(agentId)) {
      return false;
    }

    if (!confirmDeparture && pendingDepartureByAgentRef.current.has(agentId)) {
      return false;
    }

    pendingPointageRef.current.add(agentId);
    const agent = knownAgentsRef.current.get(agentId);

    try {
      const response = await fetch("/api/biometrie/pointer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          distance,
          confirmDeparture,
        }),
      });

      const payload = (await response.json().catch(() => null)) as PointageResponsePayload | null;
      const message = String(payload?.message ?? "").trim();

      if (!response.ok) {
        cooldownByAgentRef.current.set(agentId, Date.now() + ERROR_COOLDOWN_MS);
        if (confirmDeparture) {
          updatePendingDeparture(agentId, (current) => ({
            ...current,
            confirming: false,
            errorMessage: message || "Erreur de confirmation du depart.",
          }));
        }
        pushEvent(
          "error",
          `${agent?.fullName ?? `Agent #${agentId}`} : ${message || "Pointage refuse."}`
        );
        return false;
      }

      if (payload?.requiresDepartureConfirmation) {
        queueDepartureConfirmation(agentId, distance);
        if (!silent) {
          pushEvent(
            "info",
            `${agent?.fullName ?? `Agent #${agentId}`} : confirmez l'heure de depart dans la fenetre de validation.`
          );
        }
        return false;
      }

      cooldownByAgentRef.current.set(agentId, Date.now() + SUCCESS_COOLDOWN_MS);
      if (confirmDeparture) {
        removePendingDeparture(agentId);
      }
      pushEvent(
        "success",
        `${agent?.fullName ?? `Agent #${agentId}`} : ${message || "Presence pointee."}`
      );
      return true;
    } catch {
      cooldownByAgentRef.current.set(agentId, Date.now() + ERROR_COOLDOWN_MS);
      if (confirmDeparture) {
        updatePendingDeparture(agentId, (current) => ({
          ...current,
          confirming: false,
          errorMessage: "Erreur reseau lors de la confirmation du depart.",
        }));
      }
      pushEvent(
        "error",
        `${agent?.fullName ?? `Agent #${agentId}`} : Erreur reseau lors du pointage.`
      );
      return false;
    } finally {
      pendingPointageRef.current.delete(agentId);
    }
  }

  async function confirmDepartureForAgent(agentId: number) {
    const candidate = pendingDepartures.find((item) => item.agentId === agentId);
    if (!candidate || candidate.confirming) {
      return;
    }

    updatePendingDeparture(agentId, (current) => ({
      ...current,
      confirming: true,
      errorMessage: undefined,
    }));

    const success = await submitBiometricPointage(agentId, candidate.distance ?? 0, {
      confirmDeparture: true,
      silent: true,
    });

    if (!success) {
      updatePendingDeparture(agentId, (current) => ({
        ...current,
        confirming: false,
      }));
    }
  }

  function rejectDepartureForAgent(agentId: number) {
    const candidate = pendingDepartures.find((item) => item.agentId === agentId);
    removePendingDeparture(agentId);
    cooldownByAgentRef.current.set(agentId, Date.now() + ERROR_COOLDOWN_MS);
    pushEvent(
      "info",
      `${candidate?.fullName ?? `Agent #${agentId}`} : depart non confirme.`
    );
  }

  function rejectAllPendingDepartures() {
    const all = [...pendingDepartures];
    clearPendingDepartures();
    for (const candidate of all) {
      cooldownByAgentRef.current.set(candidate.agentId, Date.now() + ERROR_COOLDOWN_MS);
    }
    if (all.length > 0) {
      pushEvent("info", "Aucune confirmation de depart n'a ete validee.");
    }
  }

  async function processFrame() {
    if (isFrameProcessingRef.current || !isRunningRef.current) {
      return;
    }

    const faceapi = faceApiRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!faceapi || !video || !canvas || video.readyState < 2) {
      return;
    }

    isFrameProcessingRef.current = true;

    try {
      const detections = await faceapi
        .detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.45,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      const displaySize = {
        width: video.videoWidth || 960,
        height: video.videoHeight || 540,
      };

      faceapi.matchDimensions(canvas, displaySize);
      const resized = faceapi.resizeResults(detections, displaySize);
      setFacesInFrame(resized.length);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2.5;
      ctx.font = "13px Arial";

      const seenLabels = new Set<number>();
      const submittedInFrame = new Set<number>();

      for (const detection of resized) {
        const matcher = matcherRef.current;
        const bestMatch = matcher ? matcher.findBestMatch(detection.descriptor) : null;
        const numericLabel = Number(bestMatch?.label ?? NaN);
        const isKnown =
          Boolean(bestMatch) &&
          bestMatch!.label !== "unknown" &&
          Number.isInteger(numericLabel);
        const box = detection.detection.box;
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        const labelPadding = 8;

        let label = matcher
          ? "Visage non reconnu"
          : "Reference biometrque non chargee";
        let strokeColor = "#f59e0b";

        if (isKnown) {
          const agentId = numericLabel;
          seenLabels.add(agentId);
          strokeColor = "#22c55e";
          const streak = (streakByAgentRef.current.get(agentId) ?? 0) + 1;
          streakByAgentRef.current.set(agentId, streak);

          const agent = knownAgentsRef.current.get(agentId);
          label = agent
            ? `${agent.fullName} (${agent.matricule})`
            : `Agent #${agentId}`;

          const cooldownUntil = cooldownByAgentRef.current.get(agentId) ?? 0;
          const inCooldown = Date.now() < cooldownUntil;
          const awaitingDepartureConfirmation =
            pendingDepartureByAgentRef.current.has(agentId);

          if (awaitingDepartureConfirmation) {
            strokeColor = "#f59e0b";
            label = `${label} (depart a confirmer)`;
          }

          if (
            !inCooldown &&
            !awaitingDepartureConfirmation &&
            streak >= MIN_STREAK_FOR_POINTAGE &&
            !submittedInFrame.has(agentId)
          ) {
            submittedInFrame.add(agentId);
            streakByAgentRef.current.set(agentId, 0);
            void submitBiometricPointage(agentId, bestMatch!.distance);
          }
        }

        ctx.strokeStyle = strokeColor;
        const squareSize = Math.max(box.width, box.height);
        const squareX = centerX - squareSize / 2;
        const squareY = centerY - squareSize / 2;
        ctx.strokeRect(squareX, squareY, squareSize, squareSize);

        const labelWidth = ctx.measureText(label).width + labelPadding * 2;
        const labelX = Math.max(0, box.x);
        const labelY = Math.max(18, box.y - 8);

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(labelX, labelY - 16, Math.min(labelWidth, canvas.width - labelX), 18);
        ctx.fillStyle = "#f8fafc";
        ctx.fillText(label, labelX + labelPadding, labelY - 3);
      }

      for (const agentId of [...streakByAgentRef.current.keys()]) {
        if (!seenLabels.has(agentId)) {
          streakByAgentRef.current.delete(agentId);
        }
      }
    } catch (error) {
      setErrorMessage("Erreur pendant la detection temps reel.");
      stopRecognition("error");
    } finally {
      isFrameProcessingRef.current = false;
    }
  }

  async function startRecognition() {
    if (isRunningRef.current) {
      return;
    }
    if (!canUseBiometric) {
      activateAccessWarning({
        reason: "permission",
        title: "Pointage biometrque non autorise",
        message:
          "Vous n'avez pas l'autorisation de pointer par biometrie. Contactez la direction RH.",
      });
      return;
    }

    setAccessWarning(null);
    setErrorMessage("");
    setEvents([]);
    setReferencesTotal(0);
    setReferencesReady(0);
    clearPendingDepartures();

    try {
      setStatus("loading-models");
      const faceapi = await import("face-api.js");
      faceApiRef.current = faceapi;

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE_PATH),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE_PATH),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE_PATH),
      ]);

      setStatus("starting-camera");
      await startCameraStream();

      streakByAgentRef.current.clear();
      cooldownByAgentRef.current.clear();
      pendingPointageRef.current.clear();
      stopFrameLoop();

      isRunningRef.current = true;
      setStatus("running");
      pushEvent("info", "Camera active. Chargement des references biometrques...");

      frameTimerRef.current = window.setInterval(() => {
        void processFrame();
      }, FRAME_INTERVAL_MS);

      void loadReferencesMatcher(faceapi);
    } catch (error) {
      stopRecognition("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de demarrer la reconnaissance biometrque."
      );
    }
  }

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      stopFrameLoop();
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (pendingDepartures.length === 0) {
      setDepartureModalOpen(false);
      return;
    }
    setDepartureModalOpen(true);
  }, [pendingDepartures.length]);

  useEffect(() => {
    if (authPending) {
      return;
    }

    if (!canUseBiometric) {
      activateAccessWarning({
        reason: "permission",
        title: "Pointage biometrque non autorise",
        message:
          "Vous n'avez pas l'autorisation de pointer par biometrie. Contactez la direction RH.",
      });
      return;
    }

    setAccessWarning((current) =>
      current?.reason === "permission" ? null : current
    );
  }, [authPending, canUseBiometric]);

  useEffect(() => {
    if (authPending || !canUseBiometric) {
      return;
    }

    let cancelled = false;

    const preflightReferences = async () => {
      try {
        const response = await fetch("/api/biometrie/references", {
          method: "GET",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            activateAccessWarning({
              reason: "permission",
              title: "Pointage biometrque non autorise",
              message:
                "Vous n'avez pas l'autorisation de pointer par biometrie. Contactez la direction RH.",
            });
          }
          return;
        }

        const references = Array.isArray(payload?.data)
          ? (payload.data as ReferenceFace[])
          : [];

        localReferencesCacheRef.current = {
          data: references,
          expiresAt: Date.now() + LOCAL_REFERENCES_CACHE_TTL_MS,
        };

        if (!references.length) {
          activateAccessWarning({
            reason: "references",
            title: "Referentiel biometrque introuvable",
            message:
              "Aucun referentiel biometrque actif n'est disponible en base pour votre perimetre. Contactez la direction RH.",
          });
          return;
        }

        setAccessWarning((current) =>
          current?.reason === "references" ? null : current
        );
      } catch {
        // Ignore preflight network errors here and keep runtime fallback on startRecognition.
      }
    };

    void preflightReferences();

    return () => {
      cancelled = true;
    };
  }, [authPending, canUseBiometric]);

  if (accessWarning && !authPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <AlertCircle className="h-10 w-10 text-rose-600" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">{accessWarning.title}</h1>
          <p className="text-muted-foreground">{accessWarning.message}</p>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/dashboard/presenceAbsence">Retour Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href={DIRECTION_CONTACT_URL} target="_blank" rel="noopener noreferrer">
                Contacter la direction
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 px-2 py-4 sm:px-3 md:px-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Pointage Biometrique
        </h1>
        <p className="text-sm text-muted-foreground">
          Reconnaissance faciale asynchrone sur flux camera: arrivee automatique, depart avec confirmation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[7fr_3fr]">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <CardTitle>Camera de Detection</CardTitle>
                <CardDescription>
                  Les visages reconnus sont encadres en vert. L'arrivee est automatique; le depart demande une confirmation.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/dashboard/presenceAbsence">
                  <Button variant="outline" size="sm">
                    Retour Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={() => void startRecognition()}
                  disabled={
                    !canUseBiometric ||
                    status === "loading-models" ||
                    status === "loading-references" ||
                    status === "starting-camera" ||
                    Boolean(authPending)
                  }
                  size="sm"
                >
                  {(status === "loading-models" ||
                    status === "loading-references" ||
                    status === "starting-camera") && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Camera className="mr-2 h-4 w-4" />
                  Demarrer
                </Button>
                <Button
                  onClick={() => stopRecognition("stopped")}
                  disabled={!isRunningRef.current && status !== "error"}
                  variant="secondary"
                  size="sm"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Arreter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="relative overflow-hidden border-y bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="h-[70vh] min-h-[440px] w-full object-cover md:min-h-[620px]"
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations de Presence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={status === "running" ? "default" : "secondary"}>
                  {statusLabel}
                </Badge>
                <Badge variant="outline">Visages detectes: {facesInFrame}</Badge>
                <Badge variant="outline">
                  References pretes: {referencesReady}/{referencesTotal}
                </Badge>
                {!canUseBiometric && (
                  <Badge variant="destructive">
                    Pas de permission presence.biometric
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {errorMessage && (
            <Card className="border-rose-200">
              <CardContent className="flex items-start gap-2 py-4 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRoundCheck className="h-4 w-4" />
                Journal Temps Reel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun evenement pour l'instant.
                </p>
              )}
              {events.map((event) => (
                <div key={event.id}>
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      {event.kind === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                      {event.kind === "error" && (
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                      )}
                      {event.kind === "info" && (
                        <Camera className="h-4 w-4 text-sky-600" />
                      )}
                      <span>{event.text}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatClock(event.at)}
                    </span>
                  </div>
                  <Separator className="mt-3" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={pendingDepartures.length > 0 ? true : departureModalOpen}
        onOpenChange={(open) => {
          if (!open && pendingDepartures.length > 0) return;
          setDepartureModalOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl" showCloseButton={pendingDepartures.length === 0}>
          <DialogHeader>
            <DialogTitle>Confirmation des pointages de depart</DialogTitle>
            <DialogDescription>
              {pendingDepartures.length > 1
                ? "Plusieurs visages reconnus ont une arrivee deja pointee. Confirmez ou refusez chaque depart."
                : "Le visage reconnu a deja une arrivee pointee. Confirmez ou refusez le depart."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
            {pendingDepartures.map((candidate) => (
              <div
                key={`pending-departure-${candidate.agentId}`}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{candidate.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      Matricule: {candidate.matricule} | Detecte a {formatClock(candidate.detectedAt)}
                    </p>
                    {candidate.errorMessage && (
                      <p className="text-xs text-rose-600">{candidate.errorMessage}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => void confirmDepartureForAgent(candidate.agentId)}
                      disabled={candidate.confirming}
                    >
                      {candidate.confirming ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Confirmer depart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectDepartureForAgent(candidate.agentId)}
                      disabled={candidate.confirming}
                    >
                      Non
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Tant qu'un depart n'est pas confirme, le systeme ne le pointera pas automatiquement.
            </p>
            <Button
              variant="secondary"
              onClick={rejectAllPendingDepartures}
              disabled={pendingDepartures.length === 0}
            >
              Refuser tous les departs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

