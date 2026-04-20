import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { getAccessibleAgentIdsForPermissions } from "@/server/access/scope";
import { getOnlineSessionMap } from "@/server/session-presence";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({ permissions: ["user.read"] });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
    "user.read",
  ]);

  const users = await prisma.utilisateur.findMany({
    where: {
      ...(accessibleAgentIds === null
        ? {}
        : {
            compteAgent: {
              is: {
                agentId: {
                  in: accessibleAgentIds.length ? accessibleAgentIds : [-1],
                },
              },
            },
          }),
    },
    select: {
      id: true,
      login: true,
      actif: true,
      compteAgent: {
        select: {
          id: true,
          agent: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              matricule: true,
            },
          },
        },
      },
    },
    orderBy: [{ login: "asc" }],
  });

  const onlineMap = getOnlineSessionMap();

  const data = users
    .map((user) => {
      const entry = onlineMap.get(user.id);
      const isOnline = Boolean(entry);

      return {
        userId: user.id,
        login: user.login,
        actif: user.actif,
        compteId: user.compteAgent?.id ?? null,
        agentId: user.compteAgent?.agent?.id ?? null,
        nom: user.compteAgent?.agent?.nom ?? null,
        prenom: user.compteAgent?.agent?.prenom ?? null,
        matricule: user.compteAgent?.agent?.matricule ?? null,
        statutSession: isOnline ? "EN_LIGNE" : "DECONNECTE",
        lastSeenAt: entry ? new Date(entry.lastSeenAt).toISOString() : null,
      };
    })
    .sort((left, right) => {
      if (left.statutSession !== right.statutSession) {
        return left.statutSession === "EN_LIGNE" ? -1 : 1;
      }
      return left.login.localeCompare(right.login, "fr");
    });

  return NextResponse.json({ data }, { status: 200 });
}

