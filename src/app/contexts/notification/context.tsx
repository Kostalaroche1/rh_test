'use client'

import React, { createContext, useContext, useMemo } from "react";
import {
  GetNotifications,
  AddNotification,
  MarkNotificationRead,
} from "@/app/action/notification/action";
import { toast } from "sonner";
import { useGet, usePost } from "@/hooks/useApi";
import { useAuth } from "../auth/context";

const NotificationContext = createContext<any>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { auth }: any = useAuth();

  const {
    data: notifications = [], // ✅ GET renvoie un tableau
    isLoading,
    refetch: refetchNotice,
  } = useGet(["Notifications"], GetNotifications);

  const { mutateAsync: createNotification, isPending } = usePost(AddNotification);
  const { mutateAsync: markReadApi, isPending: isMarking } = usePost(MarkNotificationRead);

  // ✅ sécurité au cas où
  const safeNotifications = useMemo(() => (Array.isArray(notifications) ? notifications : []), [notifications]);

  // Public = visible par tout le monde
  const publicNotifications = useMemo(() => {
    return safeNotifications.filter((n: any) => n?.compteId == null && n?.roleId == null);
  }, [safeNotifications]);

  // Privé = uniquement moi
  const myNotifications = useMemo(() => {
    const myCompteId = auth?.compteId;
    if (!myCompteId) return [];
    return safeNotifications.filter((n: any) => Number(n?.compteId) === Number(myCompteId));
  }, [safeNotifications, auth?.compteId]);

  // Par rôle = ciblées à un rôle
  const roleNotifications = useMemo(() => {
    return safeNotifications.filter((n: any) => n?.roleId != null);
  }, [safeNotifications]);

  const sendNotification = async (payload: any) => {
    try {
      const created: any = await createNotification(payload);
      toast.success("Notification créée");
      refetchNotice();
      return created;
    } catch (err) {
      console.error(err);
      toast.error("Impossible de créer la notification");
    }
  };

  const sendPublic = (payload: any) =>
    sendNotification({ ...payload, compteId: null, roleId: null });

  const sendToRole = (roleId: number, payload: any) =>
    sendNotification({ ...payload, roleId: Number(roleId), compteId: null });

  const sendToUser = (compteId: number, payload: any) =>
    sendNotification({ ...payload, compteId: Number(compteId), roleId: null });

  const sendToAgent = (agentId: number, payload: any) =>
    sendNotification({ ...payload, agentId: Number(agentId), roleId: null });

  // ✅ Mark as read (PUT côté API via action)
  const markAsRead = async (id: number) => {
    try {
      await markReadApi({ id, statut: "LU" }); // statut optionnel; par défaut "LU"
      refetchNotice();
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Impossible de marquer comme lu");
      return false;
    }
  };

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
