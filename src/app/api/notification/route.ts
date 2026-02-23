import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { NextResponse } from "next/server";

export function isAdminUser(utilisateur: any) {
  const roles = Array.isArray(utilisateur?.role) ? utilisateur.role : [];
  return roles.some((r: any) => r?.actif && (r?.id === 1 || r?.key === "admin"));
}

export function isAdminUserRh(utilisateur: any) {
  const roles = Array.isArray(utilisateur?.role) ? utilisateur.role : [];
  return roles.some((r: any) => r?.actif && (r?.id === 3 || r?.key === "rh"));
}

export function getUserRoleIds(utilisateur: any) {
  const roles = Array.isArray(utilisateur?.role) ? utilisateur.role : [];
  return roles
    .filter((r: any) => r?.actif)
    .map((r: any) => Number(r.id))
    .filter((id: any) => Number.isFinite(id));
}

export async function GET(req: Request) {
  try {
    const utilisateur: any = await getAuthenticatedUser();
    if (!utilisateur) return NextResponse.json([], { status: 200 });

    const compteId = Number(utilisateur.compteId);

    // ✅ ids des rôles du user
    const roleIds = (Array.isArray(utilisateur.role) ? utilisateur.role : [])
      .filter((r: any) => r?.actif)
      .map((r: any) => Number(r.id))
      .filter((id: any) => Number.isFinite(id));

    const isAdmin = isAdminUser(utilisateur);

    const where = isAdmin
      ? {} // ✅ admin voit tout
      : {
          OR: [
            // ✅ public : tout le monde
            { compteId: null, roleId: null },

            // ✅ privé : seulement ses notifications
            { compteId: compteId },

            // ✅ par rôle : toutes les notifs ciblées sur un des rôles du user
            // si le user n'a aucun rôle, on évite un IN [] inutile
            ...(roleIds.length > 0 ? [{ roleId: { in: roleIds } }] : []),
          ],
        };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { dateEnvoi: "desc" },
      include: { role: true, compte: true },
    });

    return NextResponse.json( { status: 200 , data : notifications } );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de récupérer les notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const utilisateur: any = await getAuthenticatedUser();
    if (!utilisateur) {
      return NextResponse.json({ error: "Non autorisé" ,  status: 401 });
    }

    const body = await req.json();
    const { titre, message, type, url, icon, compteId,  roleId } = body;

    // if (!titre || !message) {
    //   return NextResponse.json(
    //     { error: "titre et message obligatoires" },
    //     { status: 400 }
    //   );
    // }

    // let targetCompteId: number | null = null;

    // if (agentId != null && agentId !== "") {
    //   const compte = await prisma.compteAgent.findUnique({
    //     where: { agentId: Number(agentId) },
    //     select: { id: true },
    //   });

    //   if (!compte) {
    //     return NextResponse.json(
    //       { error: "Compte introuvable pour cet agent" , status: 404 }
    //     );
    //   }

    //   targetCompteId = compte.id;
    // } else if (compteId != null && compteId !== "") {
    //   targetCompteId = Number(compteId);
    // }

    // const targetRoleId =
    //   roleId != null && roleId !== "" ? Number(roleId) : null;

    // if (targetCompteId != null && targetRoleId != null) {
    //   return NextResponse.json(
    //     { error: "Choisis soit (compteId/agentId) soit roleId, pas les deux." , status: 400 }
    //   );
    // }

    // const isAdmin = isAdminUser(utilisateur);
    // if (targetRoleId === 1 && !isAdmin) {
    //   return NextResponse.json(
    //     { error: "Seul un admin peut cibler le rôle Admin." , status: 403 }
    //   );
    // }

    const notif = await prisma.notification.create({
      data: {
        compteId: compteId,
        roleId: roleId,
        dateEnvoi: new Date(),
        titre : titre,
        message : message,
        type: type || "INFO",
        url: url || null,
        icon: icon || "bell",
        statut: "NON_LU",
        expedider: "SYSTEM",
      },
      include: { role: true, compte: true },
    });

    return NextResponse.json( { status: 201  , data : notif});
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de créer la notification" , status: 500 }
    );
  }
}



/**
 * PUT /api/notifications
 * body: { id: number, statut?: "LU" | "NON_LU" }
 */
export async function PUT(req: Request) {
  try {
    const utilisateur: any = await getAuthenticatedUser();
    if (!utilisateur) {
      return NextResponse.json({ error: "Non autorisé" , status: 401 });
    }

    const { id, statut } = await req.json();
    const notifId = Number(id);

    if (!Number.isFinite(notifId)) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    const isAdmin = isAdminUser(utilisateur);
    const compteId = Number(utilisateur.compteId);
    const roleIds = getUserRoleIds(utilisateur);

    // 1) charger la notif
    const notif = await prisma.notification.findUnique({
      where: { id: notifId },
      select: { id: true, compteId: true, roleId: true, statut: true },
    });

    if (!notif) {
      return NextResponse.json({ error: "Notification introuvable" }, { status: 404 });
    }

    // 2) vérifier qu'il a le droit de la voir (mêmes règles que GET)
    const canSee = isAdmin
      ? true
      : (
          // public
          (notif.compteId == null && notif.roleId == null) ||
          // privé
          (notif.compteId != null && Number(notif.compteId) === compteId) ||
          // par rôle
          (notif.roleId != null && roleIds.includes(Number(notif.roleId)))
        );

    if (!canSee) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // 3) update
    const newStatut = statut === "NON_LU" ? "NON_LU" : "LU";

    const updated = await prisma.notification.update({
      where: { id: notifId },
      data: { statut: newStatut },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour la notification" },
      { status: 500 }
    );
  }
}

