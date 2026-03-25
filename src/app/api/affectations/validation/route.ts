import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { notifyCompteAndRoles } from "@/server/services/notification.service";
import { canAccessAgentForPermissions } from "@/server/access/scope";

export async function PUT(req: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ message: "Non autorise" }, { status: 401 });
    }
    try {
      await requireAccess({
        permissions: ["affectation.update", "affectation.assign"],
      });
    } catch {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }

    const body = await req.json();
    const affectationId = Number(body.affectationId ?? body.id ?? body.agentId);
    if (!Number.isFinite(affectationId)) {
      return NextResponse.json({ message: "Affectation invalide" }, { status: 400 });
    }

    const existing = await prisma.affectation.findUnique({
      where: { id: affectationId },
      select: { id: true, agentId: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Affectation introuvable" }, { status: 404 });
    }

    const allowed = await canAccessAgentForPermissions(
      auth.userId,
      existing.agentId,
      ["affectation.update", "affectation.assign"]
    );

    if (!allowed) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }

    const data = await prisma.affectation.update({
      where: { id: affectationId },
      data:
        body.statut === "REJETE"
          ? {
              statut: "REJETE",
            }
          : {
              dateFin: body.dateFin ? new Date(body.dateFin) : null,
              statutContrat: "ACTIF",
              statut: body.statut ?? "VALIDE",
              typeContrat: body.typeContrat ?? undefined,
            },
      include: {
        agent: {
          include: {
            compte: { select: { id: true } },
          },
        },
      },
    });

    await notifyCompteAndRoles(
      data.agent?.compte?.id ?? null,
      ["admin", "rh"],
      {
        titre: "Validation de parcours",
        message: `Le parcours de ${data.agent.nom} ${data.agent.prenom} est passe en statut ${data.statut}.`,
        type: "AFFECTATION",
        icon: "check-circle",
        url: "/dashboard/carrieres",
      }
    );

    return NextResponse.json({ status: 200 }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/affectations/validation failed:", error);
    return NextResponse.json({ status: 500 }, { status: 500 });
  }
}

