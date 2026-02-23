import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"
import { NextResponse } from "next/server"
import { isAdminUser, isAdminUserRh } from "../notification/route"

// ➕ CREATE Paie + Primes
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if(!body){
      return NextResponse.json({ error: "Les informations sont vide" ,  status: 500 })
    }

    const affectation = await prisma.affectation.findFirst({
      where : {
        agentId : body.agentId
      }
    })

    if(!affectation){
      return NextResponse.json({ message: "cet agent n'a pas encore été affecté à quelconque service et ne peu encore recevoir la paie"  , status : 404})
    }

    const ispaie =await prisma.paie.findFirst({
      where : {
        agentId : body.agentId ,
        datePaiement : new Date()
      }
    })

    if(ispaie){
      return NextResponse.json({ message: "cet agent a dejà recu sa paie pour ce mois"  , status : 404})
    }

    const auth = await getAuthenticatedUser()
    const isRh = isAdminUserRh(auth)
    const isAdmin = isAdminUser(auth)
    if(!auth){
      return NextResponse.json({ message: "Acces refusé pour des utilisateurs non reconnu"  , status : 404})
    }
    //  if(!isRh || !isAdmin){
    //   return NextResponse.json({ message: "Acces refusé"  , status : 404})
    // }

    const paie = await prisma.paie.create({
      data: {
        agentId: body.agentId,
        periode: body.periode,
        datePaiement: new Date(),
        salaireBase: body.salaireBase,
        brut: body.brut,
        net: body.net,
        etat: body.etat,

        primes: {
          create: body.primes || []
        }
      },
      include: { primes: true, agent: true }
    })

    return NextResponse.json({status : 200 , data : paie , message : 'paiement enregistré avec success'})
  } catch (error) {
    return NextResponse.json({ error: "Erreur création paie" , status: 500 })
  }
}

// 📄 GET toutes les paies
export async function GET() {
  const paies = await prisma.paie.findMany({
    include: {
      agent: true,
      primes: true
    },
    orderBy: { periode: "desc" }
  })

  console.log(paies)

  return NextResponse.json(paies)
}

// ✏️ UPDATE Paie
export async function PUT(req: Request) {
  const body = await req.json()

  const paie = await prisma.paie.update({
    where: { id: body.id },
    data: {
      agentId: body.agentId,
      periode: body.periode,
      datePaiement: new Date(),
      salaireBase: body.salaireBase,
      brut: body.brut,
      net: body.net,
      etat: body.etat,
    }
  })

  return NextResponse.json(paie)
}

// ❌ DELETE Paie (supprime aussi les primes grâce au cascade)
export async function DELETE(req: Request) {
  const body = await req.json()

  await prisma.paie.delete({
    where: { id: body.id }
  })

  return NextResponse.json({ success: true })
}
