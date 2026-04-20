"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FaceMatcher } from "face-api.js";
import { AlertCircle, Camera, CheckCircle2, Loader2, Square, UserRoundCheck } from "lucide-react";

import { useAuth } from "@/app/contexts/auth/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { hasAnyPermission } from "@/security/permissions";

type FaceApiModule = typeof import("face-api.js");

type ReferenceFace = {
  agentId: number;
  matricule: string;
  nom: string;
  prenom: string;
  fullName: string;
  photoUrl: string;
};

type RecognitionEvent = {
  id: number;
  kind: "success" | "error" | "info";
  text: string;
  at: number;
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
  const isRunningRef = useRef(false);

  const [status, setStatus] = useState<LifecycleStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [referencesTotal, setReferencesTotal] = useState(0);
  const [referencesReady, setReferencesReady] = useState(0);
  const [facesInFrame, setFacesInFrame] = useState(0);
  const [events, setEvents] = useState<RecognitionEvent[]>([]);

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
    setStatus(nextStatus);
  }

  async function startCameraStream() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Cette machine ne supporte pas l'acces camera.");
    }

    if (!window.isSecureContext) {
      throw new Error(
        "Acces camera bloque: ouvre l'application en HTTPS ou en http://localhost."
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    streamRef.current = stream;

    const video = videoRef.current;
    if (!video) {
      throw new Error("Lecteur video indisponible.");
    }

    video.srcObject = stream;
    await video.play();
    await new Promise<void>((resolve) => {
      if (video.readyState >= 2) {
        resolve();
        return;
      }

      const onLoadedData = () => {
        video.removeEventListener("loadeddata", onLoadedData);
        resolve();
      };

      video.addEventListener("loadeddata", onLoadedData);
    });

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = video.videoWidth || 960;
      canvas.height = video.videoHeight || 540;
    }
  }

  async function extractReferenceDescriptor(
    faceapi: FaceApiModule,
    image: HTMLImageElement
  ) {
    const optionsList = [
      { inputSize: 416, scoreThreshold: 0.45 },
      { inputSize: 512, scoreThreshold: 0.3 },
      { inputSize: 320, scoreThreshold: 0.2 },
    ] as const;

    for (const option of optionsList) {
      const detectorOptions = new faceapi.TinyFaceDetectorOptions(option);
      const singleDetection = await faceapi
        .detectSingleFace(image, detectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (singleDetection?.descriptor) {
        return singleDetection.descriptor;
      }

      const allDetections = await faceapi
        .detectAllFaces(image, detectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();
      if (allDetections.length) {
        const largestFace = allDetections.reduce((currentLargest, current) => {
          const currentArea = current.detection.box.width * current.detection.box.height;
          const largestArea =
            currentLargest.detection.box.width * currentLargest.detection.box.height;
          return currentArea > largestArea ? current : currentLargest;
        });

        if (largestFace?.descriptor) {
          return largestFace.descriptor;
        }
      }
    }

    return null;
  }

  async function loadReferencesMatcher(faceapi: FaceApiModule) {
    setStatus("loading-references");
    setReferencesTotal(0);
    setReferencesReady(0);
    matcherRef.current = null;
    knownAgentsRef.current.clear();

    try {
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
        setErrorMessage(message);
        pushEvent("error", message);
        return;
      }

      const references = Array.isArray(referencesPayload?.data)
        ? (referencesPayload.data as ReferenceFace[])
        : [];

      setReferencesTotal(references.length);
      if (!references.length) {
        const message =
          "Aucune reference chargee. La camera reste active, mais le pointage auto est inactif.";
        setErrorMessage(message);
        pushEvent("info", message);
        return;
      }

      const labeledDescriptors: import("face-api.js").LabeledFaceDescriptors[] = [];
      const knownAgents = new Map<number, ReferenceFace>();
      let preparedCount = 0;
      let skippedCount = 0;

      for (const reference of references) {
        if (!reference.photoUrl) {
          skippedCount += 1;
          continue;
        }

        try {
          const image = await faceapi.fetchImage(reference.photoUrl);
          const descriptor = await extractReferenceDescriptor(faceapi, image);
          if (!descriptor) {
            skippedCount += 1;
            continue;
          }

          labeledDescriptors.push(
            new faceapi.LabeledFaceDescriptors(String(reference.agentId), [
              descriptor,
            ])
          );
          knownAgents.set(reference.agentId, reference);
          preparedCount += 1;
          setReferencesReady(preparedCount);
        } catch {
          skippedCount += 1;
          continue;
        }
      }

      if (!labeledDescriptors.length) {
        const message =
          "Aucun visage exploitable n'a ete extrait des photos. Utilise une photo nette, frontale, bien eclairee. Camera active, pointage auto inactif.";
        setErrorMessage(message);
        pushEvent("error", message);
        return;
      }

      if (skippedCount > 0) {
        pushEvent(
          "info",
          `${skippedCount} photo(s) reference ignoree(s): visage non detecte ou image invalide.`
        );
      }

      matcherRef.current = new faceapi.FaceMatcher(
        labeledDescriptors,
        FACE_MATCH_THRESHOLD
      );
      knownAgentsRef.current = knownAgents;
      setErrorMessage("");
      pushEvent(
        "info",
        `References pretes: ${labeledDescriptors.length} profil(s) detectables.`
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

  async function submitBiometricPointage(agentId: number, distance: number) {
    if (pendingPointageRef.current.has(agentId)) {
      return;
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
        }),
      });

      const payload = await response.json().catch(() => null);
      const message = String(payload?.message ?? "").trim();

      if (!response.ok) {
        cooldownByAgentRef.current.set(agentId, Date.now() + ERROR_COOLDOWN_MS);
        pushEvent(
          "error",
          `${agent?.fullName ?? `Agent #${agentId}`} : ${message || "Pointage refuse."}`
        );
        return;
      }

      cooldownByAgentRef.current.set(agentId, Date.now() + SUCCESS_COOLDOWN_MS);
      pushEvent(
        "success",
        `${agent?.fullName ?? `Agent #${agentId}`} : ${message || "Presence pointee."}`
      );
    } catch {
      cooldownByAgentRef.current.set(agentId, Date.now() + ERROR_COOLDOWN_MS);
      pushEvent(
        "error",
        `${agent?.fullName ?? `Agent #${agentId}`} : Erreur reseau lors du pointage.`
      );
    } finally {
      pendingPointageRef.current.delete(agentId);
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

          if (
            !inCooldown &&
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
      const message =
        "Acces refuse: permission presence.biometric (ou presence.sign legacy) requise.";
      setErrorMessage(message);
      pushEvent("error", message);
      return;
    }

    setErrorMessage("");
    setEvents([]);
    setReferencesTotal(0);
    setReferencesReady(0);

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

  return (
    <div className="flex w-full flex-col gap-4 px-2 py-4 sm:px-3 md:px-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Pointage Biometrique
        </h1>
        <p className="text-sm text-muted-foreground">
          Reconnaissance faciale asynchrone sur flux camera avec pointage automatique.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle>Camera de Detection</CardTitle>
              <CardDescription>
                Les visages reconnus sont encadres par un carre vert puis pointes automatiquement.
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
  );
}

