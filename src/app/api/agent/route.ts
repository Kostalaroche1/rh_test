import { NextResponse ,NextRequest } from "next/server"
import { getAuthenticatedUser } from "@/security/auth"
import { modifierAgent } from "@/app/application/agent/modifierAgent"
import prisma from "@/lib/prisma"
import { generateMatricule } from "@/services/generateMat"

export async function GET() {
    const datas = await prisma.utilisateur.findMany({
           select : {
            id : true,
            login:true,
            actif: true,
            roles : true,
            compteAgent : {
                select : {
                    agent: true,
                    agentId:true,
                    liePar : true,
                    utilisateurId:true,
                    id:true,
                    dateLiaison:true,
                }
            }
           }
        })
        if(datas){
            
    return NextResponse.json({status : 200 ,data : datas});
        }
        
    return NextResponse.json({status : 400 ,data : []});
}

export async function POST(req: Request) {
    try {
         const auth = getAuthenticatedUser();
    console.log("Api Agent")
    if (!auth) {
        return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    }
    const data = await req.json();
    const agent = await prisma.agent.create( {
        data : {
            matricule : generateMatricule(),
            nom : data.nom +" "+data.postnom,
            prenom : data.prenom,
            statut : data.statut,
            dateEntree : new Date(data.dateEntree) ,
        } 
    });
    if(agent){
        return NextResponse.json({status : 200 , message: "Agent ajouté avec success"});
    }
        return NextResponse.json({status : 400 , message: "Agent n'ajouté pas été ajouté"});
    } catch (error) {
        console.log(error ,"error prisma")
          return NextResponse.json({status : 500 , error : error , message: "Agent n'ajouté pas été ajouté"});
    }
   

}

export async function PUT(req: Request) {
    // const auth = getAuthenticatedUser()
    // if (!auth) {
    //     return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    // }

    const data  = await req.json()
    const agent = await prisma.agent.update({
        where : {id : data.agentId},
        data : {
            nom : data.nom,
            prenom : data.prenom,
            statut : data.statut,
        }
    });
    const UtilisateurId = await prisma.utilisateurRole.findFirst({
        where : {utilisateurId : data.utilisateurId}
    })
    const role = await prisma.utilisateurRole.update({
        where : {id : UtilisateurId?.id },
        data:{roleId : parseInt(data?.roleId) }
    });
    
    console.log(role , 'adata updates')
    return NextResponse.json({status : 200})
}

export async function DELETE(req: Request) {
    // const auth = getAuthenticatedUser()
    // if (!auth) {
    //     return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    // }

    const data  = await req.json()
    
    console.log(data.agentId , 'adata updates')
    if (!data.agentId) {
  return new Response(
    JSON.stringify({ error: "agentId manquant" }),
    { status: 400 }
  )
}
 const compteAgent = await prisma.compteAgent.delete({
        where : {agentId : data.agentId},
    });
    const agent = await prisma.agent.delete({
        where : {id : data.agentId},
    });
    const UtilisateurId = await prisma.utilisateurRole.findFirst({
        where : {utilisateurId : data.utilisateurId}
    })
    const role = await prisma.utilisateurRole.delete({
        where : {id : UtilisateurId?.id },
    });
     const utilisateur = await prisma.utilisateur.delete({
        where : {id : data.utilisateurId },
    });
    
    return NextResponse.json({status : 200})
}
