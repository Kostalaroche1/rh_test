import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { NextResponse } from "next/server";
import { notifyCompteAndRoles } from "@/server/services/notification.service";
import { canAccessAgentForPermissions, getAccessibleAgentIdsForPermissions } from "@/server/access/scope";

async function assertPaieAccess(permission: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) return { auth: null, response: NextResponse.json({ message: "Non autorise" }, { status: 401 }) };
  try {
    await requireAccess({
      permissions: [permission],
    });
  } catch {
    return { auth: null, response: NextResponse.json({ message: "Acces refuse" }, { status: 403 }) };
  }
  return { auth, response: null };
}

export async function POST(req: Request) {
  try {
    const { auth, response } = await assertPaieAccess("paie.create");
    if (response) return response;


    const body = await req.json();
    console.log(body, "body from paie frontend")

    if (!body?.agentId) {
      return NextResponse.json({ message: "agentId obligatoire" }, { status: 400 });
    }

    if (!(await canAccessAgentForPermissions(auth!.userId, Number(body.agentId), ["paie.create"]))) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }

    const affectation = await prisma.affectation.findFirst({
      where: { agentId: Number(body.agentId), statut: { not: "REJETE" } },
      orderBy: { dateDebut: "desc" },
    });

    if (!affectation) {
      return NextResponse.json(
        { message: "Cet agent n'est pas affecte a un service actif." },
        { status: 409 }
      );
    }

    const periode = new Date(body.periode).toLocaleDateString();
    if (!periode) {
      return NextResponse.json({ message: "Periode obligatoire" }, { status: 400 });
    }

    const alreadyPaid = await prisma.paie.findFirst({
      where: {
        agentId: Number(body.agentId),
        periode,
      },
      select: { id: true },
    });

    if (alreadyPaid) {
      return NextResponse.json(
        { message: "Cet agent a deja recu une paie pour cette periode." },
        { status: 409 }
      );
    }

    const paie = await prisma.paie.create({
      data: {
        agentId: Number(body.agentId),
        periode: periode,
        datePaiement: new Date(),
        salaireBase: body.salaireBase,
        brut: body.brut,
        net: body.net,
        etat: body.etat ?? "PAYE",
        // primes: {
        //   create: Array.isArray(body.primes) ? body.primes : [],
        // },

        primes: {
          
          create: Array.isArray(body.primes)
            ? body.primes.map((p: any) => ({
              type: p.type,
              montant: p.montant,
              tag: p.tag ?? "-",   // default minus if undefined
            }))
            : [],
        },
      },
      include: {
        primes: true,
        agent: {
          include: {
            compte: { select: { id: true } },
          },
        },
      },
    });

    await notifyCompteAndRoles(
      paie.agent?.compte?.id ?? null,
      ["admin", "rh"],
      {
        titre: "Paiement effectue",
        message: `La paie de ${paie.agent.nom} ${paie.agent.prenom} (${periode}) est disponible.`,
        type: "PAIE",
        icon: "wallet",
        url: "/dashboard/paie",
      }
    );

    return NextResponse.json(
      { status: 200, data: paie, message: "Paiement enregistre avec succes" },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/paie failed:", error);
    return NextResponse.json({ error: "Erreur creation paie" }, { status: 500 });
  }
}

export async function GET() {
  const { auth, response } = await assertPaieAccess("paie.read");
  if (response) return response;

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth!.userId, [
    "paie.read",
  ]);

  const paies = await prisma.paie.findMany({
    where:
      accessibleAgentIds === null
        ? undefined
        : {
            agentId: {
              in: accessibleAgentIds.length ? accessibleAgentIds : [-1],
            },
          },
    include: {
      agent: true,
      primes: true,
    },
    orderBy: [{ datePaiement: "desc" }, { periode: "desc" }],
  });

  return NextResponse.json(paies, { status: 200 });
}

export async function PUT(req: Request) {
  try {
    const { auth, response } = await assertPaieAccess("paie.update");
    if (response) return response;

    const body = await req.json();
    const targetAgentId = Number(body.agentId);

    if (!(await canAccessAgentForPermissions(auth!.userId, targetAgentId, ["paie.update"]))) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }

    const paie = await prisma.paie.update({
      where: { id: Number(body.id) },
      data: {
        agentId: Number(body.agentId),
        periode: body.periode,
        datePaiement: new Date(),
        salaireBase: body.salaireBase,

        brut: body.brut,
        net: body.net,
        etat: body.etat,
      },
    });

    return NextResponse.json(paie, { status: 200 });
  } catch (error) {
    console.error("PUT /api/paie failed:", error);
    return NextResponse.json({ error: "Erreur mise a jour paie" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { auth, response } = await assertPaieAccess("paie.delete");
    if (response) return response;

    const body = await req.json();
    const existingPaie = await prisma.paie.findUnique({
      where: { id: Number(body.id) },
      select: { agentId: true },
    });

    if (!existingPaie) {
      return NextResponse.json({ message: "Paie introuvable" }, { status: 404 });
    }

    if (!(await canAccessAgentForPermissions(auth!.userId, existingPaie.agentId, ["paie.delete"]))) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }

    await prisma.paie.delete({
      where: { id: Number(body.id) },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/paie failed:", error);
    return NextResponse.json({ error: "Erreur suppression paie" }, { status: 500 });
  }
}

