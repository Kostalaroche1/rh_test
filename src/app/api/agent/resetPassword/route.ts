import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newPassword  = body;
    console.log(newPassword , 'nouveau mot de passe')

    if (!newPassword) {
      return NextResponse.json({ status: 400, error: "Mot de passe requis" });
    }

    const cookieStore = cookies();
    const userEmail = (await cookieStore).get("userEmail")?.value;

    if (!userEmail) {
      return NextResponse.json({ status: 401, error: "Session expirée ou cookie manquant" });
    }

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { login: userEmail },
    });

    if (!utilisateur) {
      return NextResponse.json({ status: 404, error: "Compte non trouvé" });
    }

    // Hash du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mise à jour du mot de passe
    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { motDePasse: hashedPassword },
    });

    (await cookieStore).delete("userEmail");

    return NextResponse.json({ status: 200, message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: 500, error: "Erreur serveur" });
  }
}
