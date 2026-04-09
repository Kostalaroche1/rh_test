"use client";

import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NotificationItem = {
  id: number;
  titre?: string | null;
  message?: string | null;
  dateEnvoi?: string | Date | null;
  statut?: string | null;
};

export default function NotificationsCard({
  notifications,
  onMarkAsRead,
}: {
  notifications: NotificationItem[];
  onMarkAsRead?: (id: number) => void;
}) {
  const unreadCount = notifications.filter((item) => item?.statut === "NON_LU").length;

  return (
    <Card className="erp-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Notifications recentes</CardTitle>
          <Badge variant={unreadCount > 0 ? "default" : "outline"}>
            <Bell className="mr-1 h-3.5 w-3.5" />
            {unreadCount} non lues
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune notification disponible.</p>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="rounded-lg border border-border/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{notification.titre || "Notification"}</p>
                <Badge variant={notification.statut === "NON_LU" ? "default" : "outline"} className="text-[10px]">
                  {notification.statut === "NON_LU" ? "Nouveau" : "Lu"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{notification.message}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground/80">
                  {notification.dateEnvoi ? new Date(notification.dateEnvoi).toLocaleString("fr-FR") : "-"}
                </p>
                {notification.statut === "NON_LU" && onMarkAsRead && (
                  <Button size="sm" variant="ghost" onClick={() => onMarkAsRead(notification.id)}>
                    Marquer lu
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
