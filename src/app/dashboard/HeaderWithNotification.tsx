"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotification } from "@/app/contexts/notification/context";

type NotificationHeaderProps = {
  breadcrumbItems?: Array<{ href: string; label: string }>;
};

export default function HeaderWithNotifications({ breadcrumbItems: _breadcrumbItems }: NotificationHeaderProps) {
  const { notifications, markAsRead } = useNotification();
  const unreadCount = notifications.filter((notification) => notification.statut === "NON_LU").length;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative ml-auto flex justify-end">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="hover:bg-accent hover:text-accent-foreground relative rounded-xl border border-border/70 bg-card/85 p-2.5 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground/90" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 max-h-96 w-80 overflow-y-auto rounded-xl border border-border/70 bg-popover/95 shadow-[0_24px_45px_-26px_rgba(8,18,36,0.9)] backdrop-blur-sm">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucune notification</p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => markAsRead(notification.id)}
                className={`w-full border-b border-border/60 p-3 text-left last:border-b-0 ${
                  notification.statut === "NON_LU" ? "bg-primary/10" : "bg-transparent"
                }`}
              >
                <p className="font-semibold">{notification.titre}</p>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <p className="pt-1 text-xs text-muted-foreground/85">
                  {new Date(notification.dateEnvoi).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
