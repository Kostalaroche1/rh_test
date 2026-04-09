const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

const PROVINCES_RDC = [
  { code: "KIN", nom: "Kinshasa" },
  { code: "KON", nom: "Kongo Central" },
  { code: "KWI", nom: "Kwilu" },
  { code: "KWG", nom: "Kwango" },
  { code: "MAI", nom: "Mai-Ndombe" },
  { code: "KAS", nom: "Kasai" },
  { code: "KSC", nom: "Kasai Central" },
  { code: "KSO", nom: "Kasai Oriental" },
  { code: "LOM", nom: "Lomami" },
  { code: "SAN", nom: "Sankuru" },
  { code: "MAN", nom: "Maniema" },
  { code: "SKD", nom: "Sud-Kivu" },
  { code: "NKV", nom: "Nord-Kivu" },
  { code: "TAN", nom: "Tanganyika" },
  { code: "HTL", nom: "Haut-Lomami" },
  { code: "LUA", nom: "Lualaba" },
  { code: "HTK", nom: "Haut-Katanga" },
  { code: "ITU", nom: "Ituri" },
  { code: "HUE", nom: "Haut-Uele" },
  { code: "TSH", nom: "Tshopo" },
  { code: "BAS", nom: "Bas-Uele" },
  { code: "NOR", nom: "Nord-Ubangi" },
  { code: "SUD", nom: "Sud-Ubangi" },
  { code: "MON", nom: "Mongala" },
  { code: "EQU", nom: "Equateur" },
  { code: "TSU", nom: "Tshuapa" },
];

async function main() {
  for (const province of PROVINCES_RDC) {
    await prisma.province.upsert({
      where: { code: province.code },
      update: { nom: province.nom, actif: true },
      create: { code: province.code, nom: province.nom, actif: true },
    });
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        provinces: PROVINCES_RDC.length,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("seed-provinces failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
