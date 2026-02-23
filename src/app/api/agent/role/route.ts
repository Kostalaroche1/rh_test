import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    // const auth = getAuthenticatedUser()
    // if (!auth) {
    //     return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    // }
    const role = await prisma.role.findMany({
        select : {
            id : true,
            nom: true,
            description: true,
            actif: true,
            _count : true,
            utilisateurs : true
        }
    })
   
    if(role){
          return NextResponse.json({status:200 ,data : role })
    }
    return NextResponse.json({status:400 ,data : [] })
}

// export async function POST(req: Request) {
//     const auth = getAuthenticatedUser()
//     if (!auth) {
//         return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
//     }
//     const { nom, description } = await req.json()
//     return NextResponse.json(await creerRole(nom, description))
// }

// export async function PUT(req: Request) {
//     const { id, data } = await req.json()
//     return NextResponse.json(await modifierRole(id, data))
// }
