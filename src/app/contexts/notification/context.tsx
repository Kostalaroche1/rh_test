'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import {
  GetNotifications,
  AddNotification,
  MarkNotificationRead,
} from "@/app/action/notification/action";
import { toast } from "sonner";
import { useGet, usePost, usePut } from "@/hooks/useApi";
import { useAuth } from "../auth/context";

type NotificationItem = {
  id: number;
  compteId: number | null;
  roleId: number | null;
  titre: string;
  message: string;
  statut: "LU" | "NON_LU";
  dateEnvoi: string;
};

type NotificationPayload = {
  titre?: string;
  message?: string;
  compteId?: number | null;
  roleId?: number | null;
  agentId?: number | null;
  [key: string]: unknown;
};

type NotificationContextValue = {
  notifications: NotificationItem[];
  publicNotifications: NotificationItem[];
  roleNotifications: NotificationItem[];
  myNotifications: NotificationItem[];
  isLoading: boolean;
  isPending: boolean;
  isMarking: boolean;
  sendNotification: (payload: NotificationPayload) => Promise<unknown>;
  sendPublic: (payload: NotificationPayload) => Promise<unknown>;
  sendToRole: (roleId: number, payload: NotificationPayload) => Promise<unknown>;
  sendToUser: (compteId: number, payload: NotificationPayload) => Promise<unknown>;
  sendToAgent: (agentId: number, payload: NotificationPayload) => Promise<unknown>;
  markAsRead: (id: number) => Promise<boolean>;
  refetchNotice: () => Promise<unknown>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { auth } = useAuth() as { auth?: { compteId?: number } };
  const authSession = auth as { userId?: number; compteId?: number } | undefined;
  const seenNotificationIdsRef = useRef<Set<number>>(new Set());
  const didInitNotificationCacheRef = useRef(false);

  const {
    data: notifications = [],
    isLoading,
    refetch: refetchNotice,
  } = useGet(["Notifications"], GetNotifications);

  const { mutateAsync: createNotification, isPending } = usePost(AddNotification);
  const { mutateAsync: markReadApi, isPending: isMarking } = usePut(MarkNotificationRead);

  const safeNotifications = useMemo<NotificationItem[]>(
    () => (Array.isArray(notifications) ? (notifications as NotificationItem[]) : []),
    [notifications]
  );

  const publicNotifications = useMemo(() => {
    return safeNotifications.filter((n) => n?.compteId == null && n?.roleId == null);
  }, [safeNotifications]);

  const myNotifications = useMemo(() => {
    const myCompteId = auth?.compteId;
    if (!myCompteId) return [];
    return safeNotifications.filter((n) => Number(n?.compteId) === Number(myCompteId));
  }, [safeNotifications, auth?.compteId]);

  const roleNotifications = useMemo(() => {
    return safeNotifications.filter((n) => n?.roleId != null);
  }, [safeNotifications]);

  const sendNotification = async (payload: NotificationPayload) => {
    try {
      const created = await createNotification(payload);
      toast.success("Notification creee");
      refetchNotice();
      return created;
    } catch (err) {
      console.error(err);
      toast.error("Impossible de creer la notification");
      throw err;
    }
  };

  const sendPublic = (payload: NotificationPayload) =>
    sendNotification({ ...payload, compteId: null, roleId: null });

  const sendToRole = (roleId: number, payload: NotificationPayload) =>
    sendNotification({ ...payload, roleId: Number(roleId), compteId: null });

  const sendToUser = (compteId: number, payload: NotificationPayload) =>
    sendNotification({ ...payload, compteId: Number(compteId), roleId: null });

  const sendToAgent = (agentId: number, payload: NotificationPayload) =>
    sendNotification({ ...payload, agentId: Number(agentId), roleId: null });

  const markAsRead = useCallback(async (id: number) => {
    try {
      await markReadApi({ id, statut: "LU" });
      refetchNotice();
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Impossible de marquer comme lu");
      return false;
    }
  }, [markReadApi, refetchNotice]);

  useEffect(() => {
    if (!authSession?.userId && !authSession?.compteId) return;

    const timer = window.setInterval(() => {
      void refetchNotice();
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [authSession?.compteId, authSession?.userId, refetchNotice]);

  useEffect(() => {
    if (isLoading) return;

    if (!didInitNotificationCacheRef.current) {
      safeNotifications.forEach((notification) => {
        seenNotificationIdsRef.current.add(notification.id);
      });
      didInitNotificationCacheRef.current = true;
      return;
    }

    const freshNotifications = safeNotifications.filter(
      (notification) => !seenNotificationIdsRef.current.has(notification.id)
    );

    if (freshNotifications.length === 0) return;

    freshNotifications.forEach((notification) => {
      seenNotificationIdsRef.current.add(notification.id);
    });

    freshNotifications
      .filter((notification) => notification.statut === "NON_LU")
      .reverse()
      .forEach((notification) => {
        toast(notification.titre || "Nouvelle notification", {
          description: notification.message,
          position: "bottom-left",
          duration: 4000,
          className:
            "animate-in slide-in-from-right-full duration-300 border border-primary/25 bg-card text-card-foreground shadow-lg",
          action: {
            label: "Marquer lu",
            onClick: () => {
              void markAsRead(notification.id);
            },
          },
        });
      });
  }, [isLoading, markAsRead, safeNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: safeNotifications,
        publicNotifications,
        roleNotifications,
        myNotifications,
        isLoading,
        isPending,
        isMarking,
        sendNotification,
        sendPublic,
        sendToRole,
        sendToUser,
        sendToAgent,
        markAsRead,
        refetchNotice,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
};
