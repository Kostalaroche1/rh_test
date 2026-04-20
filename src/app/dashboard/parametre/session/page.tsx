"use client";

import { Activity, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SessionItem = {
  userId: number;
  login: string;
  actif: boolean;
  compteId: number | null;
  agentId: number | null;
  nom: string | null;
  prenom: string | null;
  matricule: string | null;
  statutSession: "EN_LIGNE" | "DECONNECTE";
  lastSeenAt: string | null;
};

const PAGE_SIZE = 12;

export default function ParametreSessionPage() {
  const [items, setItems] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const onlineCount = useMemo(
    () => items.filter((item) => item.statutSession === "EN_LIGNE").length,
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const agentLabel = `${item.nom ?? ""} ${item.prenom ?? ""}`.trim().toLowerCase();
      const login = String(item.login ?? "").toLowerCase();
      const matricule = String(item.matricule ?? "").toLowerCase();
      const sessionLabel = item.statutSession === "EN_LIGNE" ? "en ligne" : "deconnecte";
      const accountLabel = item.actif ? "actif" : "desactive";
      const lastSeen = item.lastSeenAt
        ? new Date(item.lastSeenAt).toLocaleString("fr-FR").toLowerCase()
        : "";

      return (
        agentLabel.includes(query) ||
        login.includes(query) ||
        matricule.includes(query) ||
        sessionLabel.includes(query) ||
        accountLabel.includes(query) ||
        lastSeen.includes(query)
      );
    });
  }, [items, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const fetchSessions = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/session", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(String(payload?.message ?? "Impossible de charger les sessions."));
        return;
      }

      const data = Array.isArray(payload?.data) ? (payload.data as SessionItem[]) : [];
      setItems(data);
      setErrorMessage("");
    } catch {
      setErrorMessage("Erreur reseau lors du chargement des sessions.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetchSessions(true);
    }, 15_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchSessions]);

  return (
    <CoquillePageTableauBord>
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Parametre - Session utilisateurs
            </CardTitle>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void fetchSessions(true);
              }}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Total: {items.length}</Badge>
              <Badge>{onlineCount} en ligne</Badge>
              <Badge variant="secondary">{Math.max(items.length - onlineCount, 0)} deconnectes</Badge>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher agent, login, matricule, statut..."
                className="w-full md:max-w-sm"
              />
              <p className="text-sm text-muted-foreground">
                Resultats: {filteredItems.length}
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </div>
            )}

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement des sessions...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Etat compte</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Derniere activite</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.userId}>
                      <TableCell>
                        {item.nom || item.prenom
                          ? `${item.nom ?? ""} ${item.prenom ?? ""}`.trim()
                          : "--"}
                      </TableCell>
                      <TableCell>{item.login}</TableCell>
                      <TableCell>{item.matricule ?? "--"}</TableCell>
                      <TableCell>
                        <Badge variant={item.actif ? "outline" : "destructive"}>
                          {item.actif ? "Actif" : "Desactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.statutSession === "EN_LIGNE" ? "default" : "secondary"}
                        >
                          {item.statutSession === "EN_LIGNE" ? "En ligne" : "Deconnecte"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.lastSeenAt
                          ? new Date(item.lastSeenAt).toLocaleString("fr-FR")
                          : "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Aucune session utilisateur disponible.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {!isLoading && filteredItems.length > 0 && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  Precedent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CoquillePageTableauBord>
  );
}
