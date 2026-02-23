import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"
import { disconnect } from "process"

export const POST = async (req: NextRequest) => {

    const data = await req.json()
    const { dateDebut, dateFin, dateDemande, motif, typeCongeId } = data
    console.log(data , 'update demande congé')
    const utilisateur = await getAuthenticatedUser()
    console.log(utilisateur, "utilisateur from  cookie side in PUT rest to api/agent/conge/demande", data,
        "sigle data from data", dateDebut, dateFin, dateDemande, motif, typeCongeId);
        
    if (!utilisateur) {
        throw new Error("pas vous n'etes pas autorisé")
    }

    try {

        const result = await prisma.demandeConge.create({
            data: {
                agentId: utilisateur.userId,
                typeCongeId: parseInt(typeCongeId),
                dateDemande: new Date(dateDemande),
                dateDebut: new Date(dateDebut),
                dateFin: new Date(dateFin),
                motif: motif,
            }
        })
        console.log(result, "result and result.ok")
        return NextResponse.json({
            status: 200,
            result

        })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ status: 200 })
    }

}

export const PUT = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const {
      id,
      dateDebut,
      dateFin,
      dateDemande,
      motif,
      statut,
      role,
      agent,
      typeConge,
    } = body;

    const utilisateur = await getAuthenticatedUser();

    // 🔐 Vérification authentification
    if (!utilisateur) {
      return NextResponse.json(
        { message: "Non autorisé" ,status: 401},
      );
    }

    // 🔎 Vérifier que la demande existe
    const demande = await prisma.demandeConge.findUnique({
      where: { id : id },
    });

    if (!demande) {
      return NextResponse.json(
        { message: "Demande introuvable" , status: 404  },
       
      );
    }

    let result;

    // ==========================
    // RH
    // ==========================
    if (role === "RH") {
        const demande = await prisma.demandeConge.findUnique({
    where: { id: id }
  });

  if (demande?.statut !== "CONFIRME") {
     return NextResponse.json(
        { message: "La demande doit être confirmée avant validation " ,status: 404 },
    
      );
  }

  result = await prisma.demandeConge.update({
    where: { id: id },
    data: {
      statut: statut,
      validePar: utilisateur.userId,
      dateValidation: new Date()
    }
  });
      result = await prisma.demandeConge.update({
        where: { id  : id},
        data: {
          validePar: demande.validePar ? null : utilisateur.userId,
          dateValidation: new Date(),
        },
      });
    }

    // ==========================
    // Chef de service
    // ==========================
    else if (role === "chefservice") {
      result = await prisma.demandeConge.update({
        where: { id },
        data: {
          statut,
          confirmePar: utilisateur.userId,
        },
      });
    }

    // ==========================
    // Agent
    // ==========================
    else if (role === "agent") {
      result = await prisma.demandeConge.update({
        where: { id },
        data: {
          agent: {
            connect: { id: agent?.id },
          },
          typeConge: {
            connect: { id: typeConge?.id },
          },
          dateDemande: new Date(dateDemande),
          dateDebut: new Date(dateDebut),
          dateFin: new Date(dateFin),
          motif,
          statut,
        },
      });
    }

    else {
      return NextResponse.json(
        { message: "Rôle non autorisé" ,status: 403},
        
      );
    }

    return NextResponse.json({ status: 200 , message : "VOus avez "+statut + "cette demande de congé" });

  } catch (error) {
    console.error("Erreur PUT /demandeConge :", error);

    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
};


export const GET = async () => {

    try {
        const getData = await prisma.demandeConge.findMany(
            {
                include: {
                    typeConge: true,
                    agent: true,
                }
            }
        )
        // console.log(getData, 'from database in api/agent/conge/demande get rest')
        return NextResponse.json({ status: 200, getData })
    } catch (error) {
        console.log(error)
    }
}

export const DELETE = async (req: Request) => {
    const data = await req.json()
    const { id } = data
    const utilisateur = await getAuthenticatedUser()
    console.log("utilisateur from  cookie side in DELETE rest to api/agent/conge/demande", data, id)

    if (!utilisateur) {
        throw new Error(" pas vous n'etes pas autorisé")
    }
    try {
        const result = await prisma.demandeConge
            // update
            .delete({
                where: {
                    id: id
                },
                // data: { actif: false }
            })
        console.log(result, "result from")

        return NextResponse.json({ status: 200, result })
    } catch (error) {
        console.log(error, "error catch")
        return NextResponse.json({ status: 500 })
    }
}