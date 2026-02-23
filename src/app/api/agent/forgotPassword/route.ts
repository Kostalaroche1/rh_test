"use server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email  = body;
    console.log(body ,'recuperation de mot de passe')
    if (!email) {
      return NextResponse.json(
        { status: 400, error: "Email requis" }
      );
    }

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { login: email },
    });

    if (!utilisateur) {
      return NextResponse.json(
        { status: 404, error: "Compte non trouvé" }
      );
    }

    // Stocke l'email dans un cookie sécurisé (expiration 15min)
    const cookieStore = cookies();
    (await cookieStore).set("userEmail", email, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    });

    return NextResponse.json({
      status: 200,
      message: "Compte trouvé, redirection possible",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: 500, error: "Erreur serveur" }
    );
  }
}
