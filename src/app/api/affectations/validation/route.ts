import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Créer une nouvelle affectation / décision
export async function PUT(req : Request) {
  try {
    const body = await req.json();
    console.log(body , 'body agent affectation approuve')
    if(body.statut === "REJETE")
    {
        const affectation = await prisma.affectation.update({
        where : {
            id : body.agentId,
        },
        data : {
            statut : body.statut,
        }
    });
    }
    
     if(body.statut !== "REJETE")
    {
        const affectation = await prisma.affectation.update({
        where : {
            id : body.agentId,
        },
        data : {
            dateFin : new Date(body.dateFin),
            statutContrat : 'ACTIF',
            statut : body.statut,
            typeContrat : body.typeContrat
        }
    });
    }
    

    return NextResponse.json({status : 200});
  } catch (error : any) {
    console.log(error , "error Validation affectation")
    return NextResponse.json({ status: 500 });
  }
}

