import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Créer une nouvelle affectation / décision
export async function POST(req : Request) {
  try {
    const body = await req.json();

    const affectation = await prisma.affectation.create({
      data: {
        agentId: body.agentId,
        posteId: body.posteId,
        fonctionId: body.fonctionId,
        gradeId: body.gradeId,
        departementId: body.departementId,
        directionId: body.directionId,
        siteId: body.siteId,
        dateDebut: new Date(body.dateDebut),
        motif: body.motif,
        type: body.type,
        typeContrat: body.typeContrat,
        statutContrat: body.statutContrat,
      },
      include: { agent: true, poste: true, grade: true, departement: true, direction: true, site: true },
    });

    return NextResponse.json(affectation);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Récupérer toutes les affectations / décisions
export async function GET() {
  try {
    const carrieres = await prisma.agent.findMany({
      select: {
        
        actif : true,
        matricule : true,
        nom : true,
        photo : true,
        statut : true,
        genre : true,
        datenais : true,
        id : true,
        dateEntree : true,
        affectations : {
          select : {
            id : true,
            agentId : true,
            departementId : true,
            fonctionId : true,
            gradeId : true,
            posteId : true,
            siteId : true,
            site: {
              select : {
                nom : true
              }
            },
            departement : {
              select : {
                nom : true
              }
            },
            poste : {
              select : {
                libelle : true
              }
            }
            ,
            fonction : {
              select : {
                libelle : true
              }
            }
          }
        },
      },
    });
    console.log(carrieres , "carrieres agents")
    return NextResponse.json({data:carrieres});
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
