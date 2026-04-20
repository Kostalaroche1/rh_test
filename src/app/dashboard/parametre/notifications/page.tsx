"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/app/contexts/notification/context";

const PAGE_SIZE = 8;

export default function ParametreNotificationsPage() {
  const { notifications, markAsRead, isLoading, isMarking } = useNotification();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return notifications;

    return notifications.filter((notification) => {
      const titre = String(notification.titre ?? "").toLowerCase();
      const message = String(notification.message ?? "").toLowerCase();
      const statut = String(notification.statut ?? "").toLowerCase();
      const sentAt = notification.dateEnvoi
        ? new Date(notification.dateEnvoi).toLocaleString("fr-FR").toLowerCase()
        : "";

      return (
        titre.includes(query) ||
        message.includes(query) ||
        statut.includes(query) ||
        sentAt.includes(query)
      );
    });
  }, [notifications, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <CoquillePageTableauBord>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Parametre - Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher titre, message, statut..."
                className="w-full md:max-w-sm"
              />
              <p className="text-sm text-muted-foreground">
                Total: {notifications.length} | Resultats: {filteredNotifications.length}
              </p>
            </div>

            {isLoading && (
              <p className="text-sm text-muted-foreground">Chargement des notifications...</p>
            )}

            {!isLoading && notifications.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune notification disponible.</p>
            )}

            {!isLoading && notifications.length > 0 && filteredNotifications.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun resultat pour cette recherche.</p>
            )}

            {!isLoading &&
              paginatedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg border border-border/70 p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{notification.titre || "Notification"}</p>
                    <Badge variant={notification.statut === "NON_LU" ? "default" : "outline"}>
                      {notification.statut === "NON_LU" ? "Nouveau" : "Lu"}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{notification.message}</p>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {notification.dateEnvoi
                        ? new Date(notification.dateEnvoi).toLocaleString("fr-FR")
                        : "--"}
                    </p>
                    {notification.statut === "NON_LU" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isMarking}
                        onClick={() => {
                          void markAsRead(notification.id);
                        }}
                      >
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Marquer lu
                      </Button>
                    )}
                  </div>
                </div>
              ))}

            {!isLoading && filteredNotifications.length > 0 && (
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
