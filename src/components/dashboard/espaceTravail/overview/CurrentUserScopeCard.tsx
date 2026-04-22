"use client";

import { useEffect, useState } from "react";
import { MapPin, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { compressProfileImage } from "@/lib/client/compressProfileImage";
import { emitProfilePhotoUpdated, resolveAgentPhotoSrc } from "@/lib/client/profilePhoto";

function extractInitials(label: string) {
  const cleaned = label.trim();
  if (!cleaned) return "AG";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "AG";
}

export default function CurrentUserScopeCard({
  agentId,
  photo,
  canUploadPhoto = false,
  userLabel,
  province,
  station,
  direction,
  niveauDirection,
  affectationLabel,
  affectationState,
  onPhotoUpdated,
}: {
  agentId?: number | null;
  photo?: string | null;
  canUploadPhoto?: boolean;
  userLabel: string;
  province?: string | null;
  station?: string | null;
  direction?: string | null;
  niveauDirection?: string | null;
  affectationLabel?: string | null;
  affectationState?: "ACTIVE" | "ENDED" | "UNDEFINED" | null;
  onPhotoUpdated?: (path: string) => void;
}) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPath, setPhotoPath] = useState<string>(String(photo ?? ""));
  const [photoVersion, setPhotoVersion] = useState<number>(Date.now());

  useEffect(() => {
    setPhotoPath(String(photo ?? ""));
    setPhotoVersion(Date.now());
  }, [photo]);

  return (
    <Card className="erp-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Mon rattachement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={resolveAgentPhotoSrc(photoPath, photoVersion)} alt={userLabel} />
              <AvatarFallback>{extractInitials(userLabel)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{userLabel}</span>
              </div>
            </div>
          </div>
          {canUploadPhoto && agentId ? (
            <div className="flex items-center gap-2">
              <label htmlFor="current-user-photo-upload">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploadingPhoto}
                  className="cursor-pointer"
                  asChild
                >
                  <span>{uploadingPhoto ? "Upload..." : "Ajouter ma photo"}</span>
                </Button>
              </label>
              <input
                id="current-user-photo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file || !agentId) {
                    event.currentTarget.value = "";
                    return;
                  }

                  try {
                    setUploadingPhoto(true);
                    const compressedFile = await compressProfileImage(file);
                    const payload = new FormData();
                    payload.append("agentId", String(agentId));
                    payload.append("photo", compressedFile);

                    const response = await fetch("/api/agent/photo", {
                      method: "POST",
                      body: payload,
                    });
                    const json = await response.json();
                    if (!response.ok) {
                      toast.error(json?.message ?? "Echec de mise a jour de la photo.");
                      return;
                    }

                    const nextPath = String(json?.data?.photo ?? "").trim();
                    if (nextPath) {
                      setPhotoPath(nextPath);
                      setPhotoVersion(Date.now());
                      onPhotoUpdated?.(nextPath);
                      emitProfilePhotoUpdated(nextPath);
                    }
                    toast.success("Photo mise a jour.");
                  } catch (error) {
                    console.error(error);
                    toast.error("Erreur lors de l'upload.");
                  } finally {
                    setUploadingPhoto(false);
                    event.currentTarget.value = "";
                  }
                }}
              />
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={
              affectationState === "ACTIVE"
                ? "default"
                : affectationState === "ENDED"
                ? "destructive"
                : "secondary"
            }
          >
            {affectationLabel || "Affectation non definie"}
          </Badge>
          <Badge variant="outline">
            <MapPin className="mr-1 h-3.5 w-3.5" />
            Province: {province || "Non definie"}
          </Badge>
          <Badge variant="outline">Station: {station || "Non definie"}</Badge>
          <Badge variant="outline">
            {niveauDirection || "Direction"}: {direction || "Non definie"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
