"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderOpen } from "lucide-react";

import { GetAgent } from "@/app/action/agent/getAgent/action";
import { getAgentParcours } from "@/app/action/agent/parcours/action";
import { useAuth } from "@/app/contexts/auth/context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGet } from "@/hooks/useApi";
import { hasAnyPermission } from "@/security/permissions";

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("fr-FR");
};

const formatNumber = (value: unknown) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return number.toLocaleString("fr-FR");
};

const getInitials = (first = "", last = "") => {
  const left = first.trim().charAt(0) || "";
  const right = last.trim().charAt(0) || "";
  const initials = `${left}${right}`.trim().toUpperCase();
  return initials || "AG";
};

export default function DossierAgentDashboard() {
  const { auth }: any = useAuth();
  const canReadAgentDossier = hasAnyPermission(auth, ["agent_dossier.read", "agent.read"]);

  const [agentSearch, setAgentSearch] = useState("");
  const [agentPage, setAgentPage] = useState(1);
  const [agentPageSize, setAgentPageSize] = useState(9);
  const [selectedAgentProfile, setSelectedAgentProfile] = useState<any | null>(null);
  const [openAgentDossierModal, setOpenAgentDossierModal] = useState(false);

  const { data: agents = [] } = useGet(["agents"], GetAgent);
  const selectedAgentId = Number(selectedAgentProfile?.id ?? 0);
  const { data: selectedAgentDossier, isPending: loadingAgentDossier } = useGet(
    ["agent-parcours-modal", String(selectedAgentId)],
    () => getAgentParcours(selectedAgentId)
  );

  const agentProfiles = useMemo(() => {
    return (agents as any[])
      .filter((item) => item?.compteAgent?.agent)
      .map((item) => {
        const agent = item.compteAgent.agent;
        return {
          id: agent.id,
          userId: item.id,
          login: item.login ?? "--",
          actif: Boolean(item.actif),
          matricule: agent.matricule ?? "--",
          nom: agent.nom ?? "",
          prenom: agent.prenom ?? "",
          fullName: `${agent.prenom ?? ""} ${agent.nom ?? ""}`.trim() || "Agent",
          genre: agent.genre ?? "--",
          statut: agent.statut ?? "--",
          dateEntree: agent.dateEntree,
          dateNaissance: agent.datenais,
          photo: agent.photo ?? "",
        };
      });
  }, [agents]);

  const filteredAgentProfiles = useMemo(() => {
    const keyword = agentSearch.trim().toLowerCase();
    if (!keyword) return agentProfiles;
    return agentProfiles.filter((profile) =>
      [profile.fullName, profile.matricule, profile.login]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [agentProfiles, agentSearch]);

  const totalAgentPages = Math.max(1, Math.ceil(filteredAgentProfiles.length / agentPageSize));
  const currentAgentPage = Math.min(agentPage, totalAgentPages);
  const paginatedAgentProfiles = useMemo(() => {
    const start = (currentAgentPage - 1) * agentPageSize;
    return filteredAgentProfiles.slice(start, start + agentPageSize);
  }, [filteredAgentProfiles, currentAgentPage, agentPageSize]);

  useEffect(() => {
    setAgentPage(1);
  }, [agentSearch, agentPageSize]);

  useEffect(() => {
    if (agentPage > totalAgentPages) {
      setAgentPage(totalAgentPages);
    }
  }, [agentPage, totalAgentPages]);

  const openAgentDossier = (profile: any) => {
    setSelectedAgentProfile(profile);
    setOpenAgentDossierModal(true);
  };

  if (!canReadAgentDossier) {
    return (
      <div className="erp-page">
        <div>
          <h1 className="text-3xl font-bold">Dossier agent</h1>
          <p className="text-muted-foreground">Consultation complete du dossier administratif de chaque agent.</p>
        </div>
        <Separator />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun acces en lecture sur les dossiers agents.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="erp-page">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <FolderOpen className="h-7 w-7" />
          Dossier agent
        </h1>
        <p className="text-muted-foreground">Parcours, affectations, historique, conges et paies des agents.</p>
      </div>
      <Separator />

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Menu profils agents</CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder="Rechercher par nom, matricule ou login"
              value={agentSearch}
              onChange={(event) => setAgentSearch(event.target.value)}
              className="md:max-w-md"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Profils par page</span>
              <select
                value={String(agentPageSize)}
                className="rounded-md border bg-background px-2 py-1 text-foreground"
                onChange={(event) => setAgentPageSize(Number(event.target.value))}
              >
                <option value="9">9</option>
                <option value="12">12</option>
                <option value="18">18</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {paginatedAgentProfiles.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              Aucun profil agent pour ce filtre.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedAgentProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className="w-full rounded-xl border bg-card p-4 text-left transition hover:border-primary/60 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => openAgentDossier(profile)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={profile.photo || undefined} alt={profile.fullName} />
                      <AvatarFallback>{getInitials(profile.prenom, profile.nom)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{profile.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{profile.matricule}</p>
                      <p className="truncate text-xs text-muted-foreground">{profile.login}</p>
                    </div>
                    <Badge variant={profile.actif ? "default" : "secondary"}>{profile.actif ? "Actif" : "Inactif"}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <p className="text-sm text-muted-foreground">
              {filteredAgentProfiles.length} profil(s) | Page {currentAgentPage} sur {totalAgentPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentAgentPage <= 1}
                onClick={() => setAgentPage((current) => Math.max(1, current - 1))}
              >
                Precedent
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentAgentPage >= totalAgentPages}
                onClick={() => setAgentPage((current) => Math.min(totalAgentPages, current + 1))}
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openAgentDossierModal} onOpenChange={setOpenAgentDossierModal}>
        <DialogContent
          showCloseButton={false}
          className="h-[94vh] w-[min(1600px,97vw)] max-w-[97vw] p-0 sm:h-[92vh] sm:max-w-[97vw]"
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <div className="flex h-full min-h-0 flex-col">
            <DialogHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
              <div className="mx-auto w-full max-w-[1450px]">
                <DialogTitle>
                  Dossier agent: {selectedAgentProfile?.fullName ?? "--"}
                </DialogTitle>
                <DialogDescription>
                  Vue complete du profil administratif, affectations et historique.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="mx-auto w-full max-w-[1450px]">
              {loadingAgentDossier ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-52 w-full" />
                </div>
              ) : !selectedAgentDossier?.agent ? (
                <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                  Dossier agent introuvable ou inaccessible.
                </div>
              ) : (
                <div className="space-y-5">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <div className="flex items-center gap-3 md:min-w-72">
                          <Avatar className="h-16 w-16 border">
                            <AvatarImage
                              src={selectedAgentDossier.agent.photo || selectedAgentProfile?.photo || undefined}
                              alt={selectedAgentProfile?.fullName ?? "Agent"}
                            />
                            <AvatarFallback>
                              {getInitials(selectedAgentDossier.agent.prenom, selectedAgentDossier.agent.nom)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-lg font-semibold">
                              {selectedAgentDossier.agent.prenom} {selectedAgentDossier.agent.nom}
                            </p>
                            <p className="text-sm text-muted-foreground">{selectedAgentDossier.agent.matricule}</p>
                          </div>
                        </div>
                        <div className="grid flex-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-muted-foreground">Genre</p>
                            <p className="font-medium">{selectedAgentDossier.agent.genre ?? "--"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Statut</p>
                            <p className="font-medium">{selectedAgentDossier.agent.statut ?? "--"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date entree</p>
                            <p className="font-medium">{formatDate(selectedAgentDossier.agent.dateEntree)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date naissance</p>
                            <p className="font-medium">{formatDate(selectedAgentDossier.agent.datenais)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card className="dashboard-stat-card dashboard-stat-tone-blue py-4">
                      <CardHeader className="gap-1 px-4 pb-2">
                        <p className="dashboard-stat-title">Affectations</p>
                        <CardTitle className="dashboard-stat-value text-2xl">
                          {Array.isArray(selectedAgentDossier.agent.affectations)
                            ? selectedAgentDossier.agent.affectations.length
                            : 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="dashboard-stat-card dashboard-stat-tone-soft py-4">
                      <CardHeader className="gap-1 px-4 pb-2">
                        <p className="dashboard-stat-title">Historique</p>
                        <CardTitle className="dashboard-stat-value text-2xl">
                          {Array.isArray(selectedAgentDossier.agent.historique)
                            ? selectedAgentDossier.agent.historique.length
                            : 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="dashboard-stat-card dashboard-stat-tone-sky py-4">
                      <CardHeader className="gap-1 px-4 pb-2">
                        <p className="dashboard-stat-title">Conges</p>
                        <CardTitle className="dashboard-stat-value text-2xl">
                          {Array.isArray(selectedAgentDossier.agent.demandeConge)
                            ? selectedAgentDossier.agent.demandeConge.length
                            : 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="dashboard-stat-card dashboard-stat-tone-red py-4">
                      <CardHeader className="gap-1 px-4 pb-2">
                        <p className="dashboard-stat-title">Paies</p>
                        <CardTitle className="dashboard-stat-value text-2xl">
                          {Array.isArray(selectedAgentDossier.agent.paie) ? selectedAgentDossier.agent.paie.length : 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </section>

                  <Card>
                    <CardHeader>
                      <CardTitle>Affectations detaillees</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date debut</TableHead>
                            <TableHead>Date fin</TableHead>
                            <TableHead>Province</TableHead>
                            <TableHead>Unite</TableHead>
                            <TableHead>Poste</TableHead>
                            <TableHead>Fonction</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(Array.isArray(selectedAgentDossier.agent.affectations)
                            ? selectedAgentDossier.agent.affectations
                            : []
                          ).map((item: any) => (
                            <TableRow key={`dossier-affectation-${item.id}`}>
                              <TableCell>{formatDate(item.dateDebut)}</TableCell>
                              <TableCell>{formatDate(item.dateFin)}</TableCell>
                              <TableCell>{item.province?.nom ?? item.uniteOrganisationnelle?.province?.nom ?? "--"}</TableCell>
                              <TableCell>{item.uniteOrganisationnelle?.nom ?? "--"}</TableCell>
                              <TableCell>{item.poste?.libelle ?? "--"}</TableCell>
                              <TableCell>{item.fonction?.libelle ?? "--"}</TableCell>
                              <TableCell>{item.grade?.libelle ?? "--"}</TableCell>
                              <TableCell>{item.type ?? "--"}</TableCell>
                              <TableCell>{item.statutOrganisationnel ?? "--"}</TableCell>
                            </TableRow>
                          ))}
                          {(Array.isArray(selectedAgentDossier.agent.affectations)
                            ? selectedAgentDossier.agent.affectations.length
                            : 0) === 0 && (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center text-muted-foreground">
                                Aucune affectation.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Historique agent</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Champ</TableHead>
                            <TableHead>Ancienne valeur</TableHead>
                            <TableHead>Nouvelle valeur</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(Array.isArray(selectedAgentDossier.agent.historique)
                            ? selectedAgentDossier.agent.historique
                            : []
                          ).map((item: any) => (
                            <TableRow key={`dossier-historique-${item.id}`}>
                              <TableCell>{formatDate(item.date)}</TableCell>
                              <TableCell>{item.champ ?? "--"}</TableCell>
                              <TableCell>{item.ancienneValeur ?? "--"}</TableCell>
                              <TableCell>{item.nouvelleValeur ?? "--"}</TableCell>
                            </TableRow>
                          ))}
                          {(Array.isArray(selectedAgentDossier.agent.historique)
                            ? selectedAgentDossier.agent.historique.length
                            : 0) === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                Aucun historique.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Demandes de conge</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date demande</TableHead>
                            <TableHead>Type conge</TableHead>
                            <TableHead>Periode</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Motif</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(Array.isArray(selectedAgentDossier.agent.demandeConge)
                            ? selectedAgentDossier.agent.demandeConge
                            : []
                          ).map((item: any) => (
                            <TableRow key={`dossier-conge-${item.id}`}>
                              <TableCell>{formatDate(item.dateDemande)}</TableCell>
                              <TableCell>{item.typeConge?.libelle ?? "--"}</TableCell>
                              <TableCell>
                                {formatDate(item.dateDebut)} - {formatDate(item.dateFin)}
                              </TableCell>
                              <TableCell>{item.statut ?? "--"}</TableCell>
                              <TableCell>{item.motif ?? "--"}</TableCell>
                            </TableRow>
                          ))}
                          {(Array.isArray(selectedAgentDossier.agent.demandeConge)
                            ? selectedAgentDossier.agent.demandeConge.length
                            : 0) === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                Aucune demande de conge.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Historique paie</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Periode</TableHead>
                            <TableHead>Date paiement</TableHead>
                            <TableHead>Salaire base</TableHead>
                            <TableHead>Brut</TableHead>
                            <TableHead>Net</TableHead>
                            <TableHead>Primes</TableHead>
                            <TableHead>Etat</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(Array.isArray(selectedAgentDossier.agent.paie) ? selectedAgentDossier.agent.paie : []).map((item: any) => (
                            <TableRow key={`dossier-paie-${item.id}`}>
                              <TableCell>{item.periode ?? "--"}</TableCell>
                              <TableCell>{formatDate(item.datePaiement)}</TableCell>
                              <TableCell>{formatNumber(item.salaireBase)}</TableCell>
                              <TableCell>{formatNumber(item.brut)}</TableCell>
                              <TableCell>{formatNumber(item.net)}</TableCell>
                              <TableCell>{Array.isArray(item.primes) ? item.primes.length : 0}</TableCell>
                              <TableCell>{item.etat ?? "--"}</TableCell>
                            </TableRow>
                          ))}
                          {(Array.isArray(selectedAgentDossier.agent.paie) ? selectedAgentDossier.agent.paie.length : 0) ===
                            0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                Aucune paie.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Timeline des evenements</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Evenement</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(Array.isArray(selectedAgentDossier.timeline) ? selectedAgentDossier.timeline : []).map(
                            (item: any, index: number) => (
                              <TableRow key={`dossier-timeline-${index}`}>
                                <TableCell>{formatDate(item.date)}</TableCell>
                                <TableCell>{item.type ?? "--"}</TableCell>
                                <TableCell>{item.label ?? "--"}</TableCell>
                              </TableRow>
                            )
                          )}
                          {(Array.isArray(selectedAgentDossier.timeline) ? selectedAgentDossier.timeline.length : 0) ===
                            0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">
                                Aucun evenement.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
              </div>
            </div>

            <DialogFooter className="justify-center border-t px-4 py-4 sm:justify-center sm:px-6">
              <Button variant="outline" onClick={() => setOpenAgentDossierModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
