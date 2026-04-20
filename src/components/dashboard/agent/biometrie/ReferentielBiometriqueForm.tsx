"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { hasAnyPermission } from "@/security/permissions";

type FaceApiModule = typeof import("face-api.js");

type AgentReferenceSummary = {
  agentId: number;
  matricule: string;
  nom: string;
  prenom: string;
  fullName: string;
  referencesCount: number;
  lastReferenceAt: string | null;
};

const MODEL_BASE_PATH = "/models/face-api";
const PAGE_SIZE = 6;

const ANGLES = [
  { code: "front", label: "Face" },
  { code: "left", label: "Profil gauche" },
  { code: "right", label: "Profil droit" },
  { code: "up", label: "Leger haut/bas" },
] as const;
const REQUIRED_REFERENCES_COUNT = ANGLES.length;

type AngleCode = (typeof ANGLES)[number]["code"];

type FileState = Record<AngleCode, File | null>;

const EMPTY_FILES: FileState = {
  front: null,
  left: null,
  right: null,
  up: null,
};

function formatDateTime(value: string | null) {
  if (!value) return "--";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReferentielBiometriqueForm() {
  const { auth } = useAuth() as { auth: unknown };
  const canManageReferences = hasAnyPermission(auth as any, ["agent.update"]);

  const [agents, setAgents] = useState<AgentReferenceSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [files, setFiles] = useState<FileState>(EMPTY_FILES);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const faceApiRef = useRef<FaceApiModule | null>(null);
  const modelsLoadedRef = useRef(false);
  const inputRefs = useRef<Record<AngleCode, HTMLInputElement | null>>({
    front: null,
    left: null,
    right: null,
    up: null,
  });

  const selectedAgent = useMemo(
    () => agents.find((agent) => String(agent.agentId) === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const totalPages = Math.max(1, Math.ceil(agents.length / PAGE_SIZE));

  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return agents.slice(start, start + PAGE_SIZE);
  }, [agents, currentPage]);

  const allPhotosSelected = useMemo(
    () => ANGLES.every((angle) => Boolean(files[angle.code])),
    [files]
  );

  const hasExistingReferences = useMemo(
    () => (selectedAgent?.referencesCount ?? 0) >= REQUIRED_REFERENCES_COUNT,
    [selectedAgent]
  );

  const canLaunchBiometricScan =
    Boolean(selectedAgentId) && (allPhotosSelected || hasExistingReferences) && !isSubmitting;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function fetchAgents() {
    if (!canManageReferences) return;

    setLoadingAgents(true);
    try {
      const response = await fetch("/api/biometrie/referentiels", {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(String(payload?.message ?? "Impossible de charger la liste des agents."));
        return;
      }

      const data = Array.isArray(payload?.data)
        ? (payload.data as AgentReferenceSummary[])
        : [];
      setAgents(data);

      if (!selectedAgentId && data.length) {
        setSelectedAgentId(String(data[0].agentId));
      }
    } catch {
      toast.error("Erreur reseau lors du chargement des agents.");
    } finally {
      setLoadingAgents(false);
    }
  }

  useEffect(() => {
    void fetchAgents();
  }, [canManageReferences]);

  async function ensureFaceApiModelsLoaded() {
    if (modelsLoadedRef.current && faceApiRef.current) {
      return faceApiRef.current;
    }

    const faceapi = await import("face-api.js");
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE_PATH),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE_PATH),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE_PATH),
    ]);

    faceApiRef.current = faceapi;
    modelsLoadedRef.current = true;
    return faceapi;
  }

  async function extractDescriptorFromFile(
    faceapi: FaceApiModule,
    file: File
  ): Promise<number[] | null> {
    const objectUrl = URL.createObjectURL(file);

    try {
      const image = await faceapi.fetchImage(objectUrl);
      const optionsList = [
        { inputSize: 416, scoreThreshold: 0.45 },
        { inputSize: 512, scoreThreshold: 0.35 },
        { inputSize: 320, scoreThreshold: 0.2 },
      ] as const;

      for (const option of optionsList) {
        const detectorOptions = new faceapi.TinyFaceDetectorOptions(option);

        const singleDetection = await faceapi
          .detectSingleFace(image, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (singleDetection?.descriptor) {
          return Array.from(singleDetection.descriptor);
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
            return Array.from(largestFace.descriptor);
          }
        }
      }

      return null;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function handleFileChange(angleCode: AngleCode, file: File | null) {
    setFiles((current) => ({
      ...current,
      [angleCode]: file,
    }));
  }

  function openModalForAgent(agentId: number) {
    setSelectedAgentId(String(agentId));
    setFiles(EMPTY_FILES);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFiles(EMPTY_FILES);
  }

  async function handleSubmit() {
    if (!selectedAgentId) {
      toast.error("Selectionne un agent.");
      return;
    }

    if (!allPhotosSelected && !hasExistingReferences) {
      toast.error("Selectionne d'abord les 4 photos requises.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!allPhotosSelected && hasExistingReferences) {
        toast.success("Referentiel deja present en base. Aucun upload requis.");
        closeModal();
        return;
      }

      const faceapi = await ensureFaceApiModelsLoaded();
      const descriptors: Array<{
        angleCode: AngleCode;
        angleLabel: string;
        descriptor: number[];
      }> = [];

      for (const angle of ANGLES) {
        const file = files[angle.code]!;
        const descriptor = await extractDescriptorFromFile(faceapi, file);

        if (!descriptor) {
          toast.error(
            `Aucun visage detectable dans la photo "${angle.label}". Utilise une image nette et bien eclairee.`
          );
          return;
        }

        descriptors.push({
          angleCode: angle.code,
          angleLabel: angle.label,
          descriptor,
        });
      }

      const formData = new FormData();
      formData.set("agentId", selectedAgentId);
      formData.set("descriptors", JSON.stringify(descriptors));

      const response = await fetch("/api/biometrie/referentiels", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(String(payload?.message ?? "Enregistrement du referentiel biometrque echoue."));
        return;
      }

      toast.success(String(payload?.message ?? "Referentiel biometrque enregistre."));
      setFiles(EMPTY_FILES);
      await fetchAgents();
    } catch {
      toast.error("Erreur pendant la generation du referentiel biometrque.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canManageReferences) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Permission manquante: agent.update.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserRoundCheck className="h-5 w-5" />
            Referentiel Biometrique
          </CardTitle>
          <CardDescription>
            Choisis un agent depuis les cartes puis ouvre le modal photo pour charger les 4 angles.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {loadingAgents && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement des agents...
            </div>
          )}

          {!loadingAgents && agents.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun agent disponible.</p>
          )}

          {!loadingAgents && agents.length > 0 && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedAgents.map((agent) => {
                  const isSelected = String(agent.agentId) === selectedAgentId;

                  return (
                    <div
                      key={agent.agentId}
                      className={cn(
                        "space-y-3 rounded-xl border p-4",
                        isSelected && "border-primary bg-primary/5"
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold">{agent.fullName}</p>
                        <p className="text-xs text-muted-foreground">{agent.matricule}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Refs: {agent.referencesCount}</Badge>
                        <Badge variant="outline">Maj: {formatDateTime(agent.lastReferenceAt)}</Badge>
                      </div>

                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => openModalForAgent(agent.agentId)}
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        Ajouter des photos
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Precedent
                </Button>

                <span className="text-xs text-muted-foreground">
                  Page {currentPage}/{totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Suivant <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isModalOpen}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setIsModalOpen(true);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-2xl"
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Scan Biometrique</DialogTitle>
            <DialogDescription>
              {selectedAgent
                ? `Agent: ${selectedAgent.fullName} (${selectedAgent.matricule})`
                : "Selectionne un agent depuis les cartes."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {ANGLES.map((angle) => {
              const file = files[angle.code];

              return (
                <div key={angle.code} className="space-y-2 rounded-lg border p-3">
                  <Label>{angle.label}</Label>
                  <Input
                    ref={(node) => {
                      inputRefs.current[angle.code] = node;
                    }}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isSubmitting}
                    onChange={(event) => {
                      const pickedFile = event.target.files?.[0] ?? null;
                      handleFileChange(angle.code, pickedFile);
                    }}
                  />
                  <Button
                    type="button"
                    variant={file ? "default" : "outline"}
                    className="w-full justify-start"
                    disabled={isSubmitting}
                    onClick={() => inputRefs.current[angle.code]?.click()}
                  >
                    {file ? (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    ) : (
                      <ImagePlus className="mr-2 h-4 w-4" />
                    )}
                    {file ? "Photo choisie" : "Choisir une photo"}
                  </Button>
                  <p className="truncate text-xs text-muted-foreground">
                    {file?.name ?? "Aucun fichier selectionne"}
                  </p>
                </div>
              );
            })}
          </div>

          {!allPhotosSelected && hasExistingReferences && (
            <p className="text-xs text-muted-foreground">
              Ce collaborateur a deja un referentiel biometrque complet en base. Tu peux lancer
              sans upload, ou choisir 4 photos pour le remplacer.
            </p>
          )}

          {!allPhotosSelected && !hasExistingReferences && (
            <p className="text-xs text-muted-foreground">
              Les 4 photos sont obligatoires pour activer le scan biometric.
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
              Fermer
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canLaunchBiometricScan}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSubmitting && <UserRoundCheck className="mr-2 h-4 w-4" />}
              Lancer le scan biometric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
