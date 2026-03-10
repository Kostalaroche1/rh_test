import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { isAdmin, isRh } from "@/security/roles";
import { NextResponse } from "next/server";
import { notifyCompteAndRoles } from "@/server/services/notification.service";

async function assertRhOrAdmin() {
  const auth = await getAuthenticatedUser();
  if (!auth) return { auth: null, response: NextResponse.json({ message: "Non autorise" }, { status: 401 }) };
  if (!isRh(auth) && !isAdmin(auth)) {
    return { auth: null, response: NextResponse.json({ message: "Acces refuse" }, { status: 403 }) };
  }
  return { auth, response: null };
}

export async function POST(req: Request) {
  try {
    const { response } = await assertRhOrAdmin();
    if (response) return response;


    const body = await req.json();
    console.log(body, "body from paie frontend")

    if (!body?.agentId) {
      return NextResponse.json({ message: "agentId obligatoire" }, { status: 400 });
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
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  const paies = await prisma.paie.findMany({
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
    const { response } = await assertRhOrAdmin();
    if (response) return response;

    const body = await req.json();
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
    const { response } = await assertRhOrAdmin();
    if (response) return response;

    const body = await req.json();
    await prisma.paie.delete({
      where: { id: Number(body.id) },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/paie failed:", error);
    return NextResponse.json({ error: "Erreur suppression paie" }, { status: 500 });
  }
}

