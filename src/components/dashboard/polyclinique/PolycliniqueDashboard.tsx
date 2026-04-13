"use client";

import { useEffect, useMemo, useState } from "react";
import { Hospital, ShieldCheck, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import {
  CreateDemandeSoinPolyclinique,
  CreerDossierMedicalPolyclinique,
  GetPolycliniqueDashboard,
  type PolycliniqueDashboardResponse,
  ValiderDemandeSoinPolyclinique,
} from "@/app/action/polyclinique/action";
import { useAuth } from "@/app/contexts/auth/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useGet } from "@/hooks/useApi";
import { POLYCLINIQUE_ACCESS_CODES } from "@/polyclinique/permissions";
import { hasAnyPermission } from "@/security/permissions";

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("fr-FR");
}

function statusLabel(value: string) {
  if (value === "EN_ATTENTE") return "En attente";
  if (value === "VALIDEE_DRH") return "Validee DRH";
  if (value === "REJETEE_DRH") return "Rejetee DRH";
  if (value === "DOSSIER_ETABLI") return "Dossier etabli";
  return value;
}

function statusVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  if (value === "EN_ATTENTE") return "secondary";
  if (value === "VALIDEE_DRH") return "default";
  if (value === "REJETEE_DRH") return "destructive";
  return "outline";
}

export default function PolycliniqueDashboard() {
  const { auth }: any = useAuth();
  const canAccessPolyclinique = hasAnyPermission(auth, POLYCLINIQUE_ACCESS_CODES);

  const { data, isPending, refetch } = useGet<PolycliniqueDashboardResponse | null>(
    ["polyclinique-dashboard"],
    GetPolycliniqueDashboard
  );

  const [motif, setMotif] = useState("");
  const [symptomes, setSymptomes] = useState("");
  const [demandeLoading, setDemandeLoading] = useState(false);

  const [validationCommentById, setValidationCommentById] = useState<Record<number, string>>({});
  const [validationLoadingId, setValidationLoadingId] = useState<number | null>(null);

  const [selectedDemandeId, setSelectedDemandeId] = useState("");
  const [resumeTraitements, setResumeTraitements] = useState("");
  const [traitementsSuivis, setTraitementsSuivis] = useState("");
  const [observations, setObservations] = useState("");
  const [fichierPath, setFichierPath] = useState("");
  const [dossierLoading, setDossierLoading] = useState(false);

  const permissions = data?.permissions;
  const canRequest = permissions?.canRequest ?? false;
  const canValidate = permissions?.canValidate ?? false;
  const canCreateDossier = permissions?.canCreateDossier ?? false;
  const canReadDossier = permissions?.canReadDossier ?? false;

  const demandes = Array.isArray(data?.demandes) ? data!.demandes : [];
  const demandesEnAttenteValidation = Array.isArray(data?.demandesEnAttenteValidation)
    ? data!.demandesEnAttenteValidation
    : [];
  const demandesValideesSansDossier = Array.isArray(data?.demandesValideesSansDossier)
    ? data!.demandesValideesSansDossier
    : [];
  const dossiersRecents = Array.isArray(data?.dossiersRecents) ? data!.dossiersRecents : [];

  useEffect(() => {
    if (!demandesValideesSansDossier.length) {
      setSelectedDemandeId("");
      return;
    }

    if (!selectedDemandeId) {
      setSelectedDemandeId(String(demandesValideesSansDossier[0].id));
      return;
    }

    const exists = demandesValideesSansDossier.some(
      (item) => String(item.id) === selectedDemandeId
    );
    if (!exists) {
      setSelectedDemandeId(String(demandesValideesSansDossier[0].id));
    }
  }, [demandesValideesSansDossier, selectedDemandeId]);

  const selectedDemandeForDossier = useMemo(() => {
    return demandesValideesSansDossier.find(
      (item) => String(item.id) === selectedDemandeId
    );
  }, [demandesValideesSansDossier, selectedDemandeId]);

  async function refreshDashboard() {
    await refetch();
  }

  async function handleCreateDemande() {
    const safeMotif = motif.trim();
    if (!safeMotif) {
      toast.error("Le motif est obligatoire.");
      return;
    }

    try {
      setDemandeLoading(true);
      const response = await CreateDemandeSoinPolyclinique({
        motif: safeMotif,
        symptomes: symptomes.trim(),
      });

      if (response?.status !== 200) {
        toast.error(response?.message ?? "Creation de la demande impossible.");
        return;
      }

      toast.success(response?.message ?? "Demande de soin enregistree.");
      setMotif("");
      setSymptomes("");
      await refreshDashboard();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi de la demande de soin.");
    } finally {
      setDemandeLoading(false);
    }
  }

  async function handleValidation(demandeId: number, decision: "VALIDEE_DRH" | "REJETEE_DRH") {
    try {
      setValidationLoadingId(demandeId);
      const response = await ValiderDemandeSoinPolyclinique(demandeId, {
        decision,
        commentaireDecision: validationCommentById[demandeId] ?? "",
      });

      if (response?.status !== 200) {
        toast.error(response?.message ?? "Operation impossible.");
        return;
      }

      toast.success(response?.message ?? "Demande mise a jour.");
      await refreshDashboard();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la validation de la demande.");
    } finally {
      setValidationLoadingId(null);
    }
  }

  async function handleCreateDossier() {
    if (!selectedDemandeForDossier) {
      toast.error("Selectionnez une demande validee.");
      return;
    }

    const safeResume = resumeTraitements.trim();
    if (!safeResume) {
      toast.error("Le resume des traitements est obligatoire.");
      return;
    }

    try {
      setDossierLoading(true);
      const response = await CreerDossierMedicalPolyclinique(selectedDemandeForDossier.id, {
        resumeTraitements: safeResume,
        traitementsSuivis: traitementsSuivis.trim(),
        observations: observations.trim(),
        fichierPath: fichierPath.trim(),
      });

      if (response?.status !== 200) {
        toast.error(response?.message ?? "Creation du dossier medical impossible.");
        return;
      }

      toast.success(response?.message ?? "Dossier medical cree.");
      setResumeTraitements("");
      setTraitementsSuivis("");
      setObservations("");
      setFichierPath("");
      await refreshDashboard();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la creation du dossier medical.");
    } finally {
      setDossierLoading(false);
    }
  }

  if (!canAccessPolyclinique) {
    return (
      <div className="erp-page">
        <div>
          <h1 className="text-3xl font-bold">Polyclinique des agents</h1>
          <p className="text-muted-foreground">Gestion des demandes de soin et dossiers medicaux.</p>
        </div>
        <Separator />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun acces a la polyclinique avec les permissions actuelles.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="erp-page">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Hospital className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Polyclinique des agents</h1>
        </div>
        <p className="text-muted-foreground">
          Workflow complet: demande de soin agent, validation DRH, dossier medical etabli par un medecin employe.
        </p>
      </div>

      <Separator />

      {isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Agent connecte</CardTitle>
                <CardDescription>Informations de l'agent associe au compte actif.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                {data?.connectedAgent ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Nom complet</p>
                      <p className="font-medium">
                        {data.connectedAgent.prenom} {data.connectedAgent.nom}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Matricule</p>
                      <p className="font-medium">{data.connectedAgent.matricule}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Statut RH</p>
                      <p className="font-medium">{data.connectedAgent.statut ?? "--"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Compte</p>
                      <p className="font-medium">
                        {`${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim() || auth?.email || "--"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Aucun agent n'est lie a cette session.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permissions actives</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant={canRequest ? "default" : "secondary"}>Demande agent</Badge>
                <Badge variant={canValidate ? "default" : "secondary"}>Validation DRH</Badge>
                <Badge variant={canCreateDossier ? "default" : "secondary"}>Medecin</Badge>
                <Badge variant={canReadDossier ? "default" : "secondary"}>Lecture dossier</Badge>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card className="dashboard-stat-card dashboard-stat-tone-blue py-4">
              <CardHeader className="gap-1 px-4 pb-2">
                <p className="dashboard-stat-title">Demandes</p>
                <CardTitle className="dashboard-stat-value text-2xl">
                  {data?.stats.totalDemandes ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="dashboard-stat-card dashboard-stat-tone-soft py-4">
              <CardHeader className="gap-1 px-4 pb-2">
                <p className="dashboard-stat-title">En attente</p>
                <CardTitle className="dashboard-stat-value text-2xl">
                  {data?.stats.enAttente ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="dashboard-stat-card dashboard-stat-tone-sky py-4">
              <CardHeader className="gap-1 px-4 pb-2">
                <p className="dashboard-stat-title">Validees DRH</p>
                <CardTitle className="dashboard-stat-value text-2xl">
                  {data?.stats.validees ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="dashboard-stat-card dashboard-stat-tone-red py-4">
              <CardHeader className="gap-1 px-4 pb-2">
                <p className="dashboard-stat-title">Rejetees</p>
                <CardTitle className="dashboard-stat-value text-2xl">
                  {data?.stats.rejetees ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="dashboard-stat-card dashboard-stat-tone-blue py-4">
              <CardHeader className="gap-1 px-4 pb-2">
                <p className="dashboard-stat-title">Dossiers medicaux</p>
                <CardTitle className="dashboard-stat-value text-2xl">
                  {data?.stats.dossiersMedicaux ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </section>

          <Tabs defaultValue="demande" className="w-full">
            <TabsList className="grid w-full grid-cols-1 gap-2 md:grid-cols-3">
              <TabsTrigger value="demande" className="gap-2">
                <Hospital className="h-4 w-4" />
                Demande de soin
              </TabsTrigger>
              <TabsTrigger value="validation" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Validation DRH
              </TabsTrigger>
              <TabsTrigger value="dossier" className="gap-2">
                <Stethoscope className="h-4 w-4" />
                Dossier medical
              </TabsTrigger>
            </TabsList>

            <TabsContent value="demande" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Nouvelle demande de soin</CardTitle>
                  <CardDescription>
                    L'agent envoie sa demande. La validation se fait ensuite par la DRH.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canRequest ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Motif</label>
                        <Input
                          value={motif}
                          onChange={(event) => setMotif(event.target.value)}
                          placeholder="Ex: Consultation generale, douleurs, suivi traitement..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Symptomes / contexte</label>
                        <Textarea
                          value={symptomes}
                          onChange={(event) => setSymptomes(event.target.value)}
                          placeholder="Description rapide des symptomes..."
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={handleCreateDemande} disabled={demandeLoading}>
                          {demandeLoading ? "Enregistrement..." : "Envoyer la demande"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Vous n'avez pas la permission de creer une demande de soin.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Demandes de soin</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Motif</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Decision DRH</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demandes.map((demande) => (
                        <TableRow key={demande.id}>
                          <TableCell>{formatDate(demande.dateDemande)}</TableCell>
                          <TableCell>
                            {demande.agent
                              ? `${demande.agent.prenom} ${demande.agent.nom}`
                              : "--"}
                          </TableCell>
                          <TableCell>{demande.motif}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(demande.statut)}>
                              {statusLabel(demande.statut)}
                            </Badge>
                          </TableCell>
                          <TableCell>{demande.commentaireDecision || "--"}</TableCell>
                        </TableRow>
                      ))}
                      {demandes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Aucune demande de soin.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="validation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Validation DRH</CardTitle>
                  <CardDescription>
                    La direction RH valide ou rejette les demandes en attente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {canValidate ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Motif</TableHead>
                          <TableHead>Commentaire DRH</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {demandesEnAttenteValidation.map((demande) => (
                          <TableRow key={`validation-${demande.id}`}>
                            <TableCell>{formatDate(demande.dateDemande)}</TableCell>
                            <TableCell>
                              {demande.agent
                                ? `${demande.agent.prenom} ${demande.agent.nom}`
                                : "--"}
                            </TableCell>
                            <TableCell>{demande.motif}</TableCell>
                            <TableCell className="min-w-[260px]">
                              <Input
                                value={validationCommentById[demande.id] ?? ""}
                                onChange={(event) =>
                                  setValidationCommentById((prev) => ({
                                    ...prev,
                                    [demande.id]: event.target.value,
                                  }))
                                }
                                placeholder="Commentaire facultatif de validation/rejet"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={validationLoadingId === demande.id}
                                  onClick={() =>
                                    handleValidation(demande.id, "REJETEE_DRH")
                                  }
                                >
                                  Rejeter
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={validationLoadingId === demande.id}
                                  onClick={() =>
                                    handleValidation(demande.id, "VALIDEE_DRH")
                                  }
                                >
                                  Valider
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {demandesEnAttenteValidation.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Aucune demande en attente de validation.
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Vous n'avez pas la permission DRH de validation des demandes.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dossier" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Creation du dossier medical</CardTitle>
                  <CardDescription>
                    Un medecin employe cree le dossier medical apres validation DRH.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canCreateDossier ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Demande validee</label>
                        <select
                          value={selectedDemandeId}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          onChange={(event) => setSelectedDemandeId(event.target.value)}
                        >
                          {demandesValideesSansDossier.map((demande) => (
                            <option key={`demande-dossier-${demande.id}`} value={String(demande.id)}>
                              #{demande.id} - {demande.agent?.prenom} {demande.agent?.nom} - {demande.motif}
                            </option>
                          ))}
                          {demandesValideesSansDossier.length === 0 ? (
                            <option value="">Aucune demande validee disponible</option>
                          ) : null}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Resume des traitements</label>
                        <Textarea
                          value={resumeTraitements}
                          onChange={(event) => setResumeTraitements(event.target.value)}
                          rows={4}
                          placeholder="Resume medical principal du suivi effectue..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Traitements suivis</label>
                        <Textarea
                          value={traitementsSuivis}
                          onChange={(event) => setTraitementsSuivis(event.target.value)}
                          rows={3}
                          placeholder="Medicaments / suivi / examens / recommandations..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Observations complementaires</label>
                        <Textarea
                          value={observations}
                          onChange={(event) => setObservations(event.target.value)}
                          rows={2}
                          placeholder="Notes complementaires..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Reference fichier (optionnel)</label>
                        <Input
                          value={fichierPath}
                          onChange={(event) => setFichierPath(event.target.value)}
                          placeholder="Ex: /secure/polyclinique/dossier-2026-001.pdf"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          disabled={
                            dossierLoading ||
                            !selectedDemandeForDossier ||
                            demandesValideesSansDossier.length === 0
                          }
                          onClick={handleCreateDossier}
                        >
                          {dossierLoading ? "Creation..." : "Etablir le dossier medical"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Vous n'avez pas la permission medecin de creation de dossier medical.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dossiers medicaux recents</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {canReadDossier || canCreateDossier ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Medecin</TableHead>
                          <TableHead>Resume</TableHead>
                          <TableHead>Traitements</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dossiersRecents.map((dossier) => (
                          <TableRow key={`dossier-recent-${dossier.id}`}>
                            <TableCell>{formatDate(dossier.createdAt)}</TableCell>
                            <TableCell>
                              {dossier.agent
                                ? `${dossier.agent.prenom} ${dossier.agent.nom}`
                                : "--"}
                            </TableCell>
                            <TableCell>
                              {dossier.medecinUtilisateur?.agent
                                ? `${dossier.medecinUtilisateur.agent.prenom} ${dossier.medecinUtilisateur.agent.nom}`
                                : dossier.medecinUtilisateur?.login ?? "--"}
                            </TableCell>
                            <TableCell>{dossier.resumeTraitements}</TableCell>
                            <TableCell>{dossier.traitementsSuivis || "--"}</TableCell>
                          </TableRow>
                        ))}
                        {dossiersRecents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Aucun dossier medical enregistre.
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Vous n'avez pas la permission de lecture des dossiers medicaux.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
