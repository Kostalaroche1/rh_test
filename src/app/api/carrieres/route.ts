import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

import { requireAccess } from "@/security/authorization";
import { getAccessibleAgentIdsForPermissions } from "@/server/access/scope";

export async function POST(req: Request) {
  try {
    await requireAccess({ permissions: ["affectation.assign"] });
    const body = await req.json();

    const affectation = await prisma.affectation.create({
      data: {
        agentId: body.agentId,
        posteId: body.posteId,
        fonctionId: body.fonctionId,
        gradeId: body.gradeId,
        uniteOrganisationnelleId: body.uniteOrganisationnelleId,
        dateDebut: new Date(body.dateDebut),
        motif: body.motif,
        type: body.type,
        typeContrat: body.typeContrat,
        statutContrat: body.statutContrat,
      },
      include: {
        agent: true,
        poste: true,
        grade: true,
        fonction: true,
        uniteOrganisationnelle: true,
      },
    });

    return NextResponse.json(affectation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireAccess({ permissions: ["affectation.read", "agent.read"] });
    const auth = await import("@/security/auth").then((m) => m.getAuthenticatedUser());
    if (!auth) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
      "agent.read",
      "affectation.read",
    ]);

    const carrieres = await prisma.agent.findMany({
      where:
        accessibleAgentIds === null
          ? undefined
          : accessibleAgentIds.length
          ? { id: { in: accessibleAgentIds } }
          : { id: -1 },
      select: {
        actif: true,
        matricule: true,
        nom: true,
        photo: true,
        statut: true,
        genre: true,
        datenais: true,
        id: true,
        dateEntree: true,
        affectations: {
          select: {
            id: true,
            agentId: true,
            fonctionId: true,
            gradeId: true,
            posteId: true,
            uniteOrganisationnelleId: true,
            uniteOrganisationnelle: { select: { nom: true, code: true } },
            poste: { select: { libelle: true } },
            fonction: { select: { libelle: true } },
            grade: { select: { libelle: true } },
          },
        },
      },
    });

    return NextResponse.json({ data: carrieres });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
