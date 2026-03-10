

//gabriel code


import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { data } from "@/utilities/menu_dashboard"
import { getAuthenticatedUser } from "@/security/auth"


export const POST = async (req: Request) => {
  const data = await req.json()
  const { code, libelle, dureeMax, allocationConge } = data
  console.log(code, libelle, dureeMax, "and data json", data)
  const utilisateur = await getAuthenticatedUser()
  if (!utilisateur) {
    throw new Error("no authorize");
  }
  try {
    const result = await prisma.typeConge.create(
      {
        data: {
          code: code,
          libelle: libelle,
          dureeMax: Number(dureeMax),
          allocationConge: Number(allocationConge),
          createur: {
            connect: {
              id: utilisateur.userId
            }
          }
        }
      }
    )

    console.log(result, 'result to api/agent/')

    return NextResponse.json({ status: 200, result })

  } catch (error) {
    console.log(error, "error")
    console.log("data insie api/agent/conge")

    return NextResponse.json({ status: 200, error })

  }
}

export const PUT = async (req: Request) => {

  const data = await req.json()
  const { code, libelle, dureeMax, id, allocationConge } = data

  const utilisateur = await getAuthenticatedUser()
  console.log(utilisateur, "utilisateur from  cookie side in PUT rest to api/agent/conge", data,
    "sigle data from data")

  if (!utilisateur) {
    throw new Error(" pas vous n'etes pas autorisé")
  }

  try {

    const result = await prisma.typeConge.update(

      {
        where: {
          id: id
        },
        data: {
          code: code,
          libelle: libelle,
          dureeMax: parseInt(dureeMax),
          allocationConge: Number(allocationConge),
          createurId: utilisateur.userId
        }
      }
    )


    console.log(result)
    return NextResponse.json({ status: 200, result })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ status: 500 })
  }
}

export const GET = async () => {
  try {
    const getData = await prisma.typeConge.findMany({
      include: { createur: true }
    })
    console.log(getData, 'from database in api/agent/conge/get rest')
    return NextResponse.json({ status: 200, getData })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ status: 200, error })

  }
}

export const DELETE = async (req: Request) => {

  const data = await req.json()
  const { id } = data
  const utilisateur = await getAuthenticatedUser()
  console.log(utilisateur, "utilisateur from  cookie side in DELETE rest to api/agent/conge", data, "sigle data from data", id)

  if (!utilisateur) {
    throw new Error(" pas vous n'etes pas autorisé")
  }
  try {
    const result = await prisma.typeConge.delete({
      where: {
        id: id
      }
    })
    console.log(result, "result from database")

    return NextResponse.json({ status: 200 })
  } catch (error) {
    console.log(error, "error catch")
    return NextResponse.json({ status: 500 })
  }
}



//habacuk code


// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { getAuthenticatedUser } from "@/security/auth";
// import { isAdmin, isRh } from "@/security/roles";
// import { notifyRoles } from "@/server/services/notification.service";

// async function ensureRhOrAdmin() {
//   const user = await getAuthenticatedUser();
//   if (!user) {
//     return { ok: false as const, response: NextResponse.json({ message: "Non autorise" }, { status: 401 }) };
//   }
//   if (!isRh(user) && !isAdmin(user)) {
//     return { ok: false as const, response: NextResponse.json({ message: "Acces reserve au RH/Admin" }, { status: 403 }) };
//   }
//   return { ok: true as const, user };
// }

// export async function POST(req: Request) {
//   const guard = await ensureRhOrAdmin();
//   if (!guard.ok) return guard.response;

//   const data = await req.json();
//   const { code, libelle, dureeMax } = data;
//   if (!code || !libelle || !dureeMax) {
//     return NextResponse.json({ message: "code, libelle et dureeMax sont obligatoires" }, { status: 400 });
//   }

//   const result = await prisma.typeConge.create({
//     data: {
//       code: String(code).trim(),
//       libelle: String(libelle).trim(),
//       dureeMax: Number(dureeMax),
//       createur: {
//         connect: { id: guard.user.userId },
//       },
//     },
//   });

//   await notifyRoles(["admin"], {
//     titre: "Nouveau type de conge",
//     message: `Le RH a cree le type de conge "${result.libelle}".`,
//     type: "CONGE",
//     icon: "calendar-plus",
//     url: "/dashboard/conges",
//   });

//   return NextResponse.json({ status: 200, result }, { status: 200 });
// }

// export async function PUT(req: Request) {
//   const guard = await ensureRhOrAdmin();
//   if (!guard.ok) return guard.response;

//   const data = await req.json();
//   const result = await prisma.typeConge.update({
//     where: { id: Number(data.id) },
//     data: {
//       code: data.code,
//       libelle: data.libelle,
//       dureeMax: Number(data.dureeMax),
//       createurId: guard.user.userId,
//     },
//   });

//   return NextResponse.json({ status: 200, result }, { status: 200 });
// }

// export async function GET() {
//   try {
//     const getData = await prisma.typeConge.findMany({
//       orderBy: { libelle: "asc" },
//     });
//     return NextResponse.json({ status: 200, getData }, { status: 200 });
//   } catch (error) {
//     console.error("GET /api/agent/conge failed:", error);
//     return NextResponse.json({ status: 500 }, { status: 500 });
//   }
// }

// export async function DELETE(req: Request) {
//   const guard = await ensureRhOrAdmin();
//   if (!guard.ok) return guard.response;

//   const data = await req.json();
//   await prisma.typeConge.delete({
//     where: { id: Number(data.id) },
//   });

//   return NextResponse.json({ status: 200 }, { status: 200 });
// }

