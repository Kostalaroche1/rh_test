const { PrismaClient } = require("../src/generated/prisma");

const CRUD_ACTIONS = ["read", "create", "update", "delete"];

const CRUD_RESOURCES = [
  "role",
  "permission",
  "user",
  "agent",
  "presence",
  "conge",
  "type_conge",
  "paie",
  "horaire_travail",
  "horaire_agent",
  "affectation",
  "direction",
  "departement",
  "site",
  "poste",
  "fonction",
  "grade",
  "notification",
  "rapport",
];

const EXTRA_PERMISSIONS = [
  "presence.sign",
  "presence.signal_absence",
  "presence.confirm",
  "presence.validate",
  "conge.confirm",
  "conge.validate",
  "conge.request",
  "paie.publish",
  "affectation.assign",
  "horaire_agent.assign",
];

const DEFAULT_PERMISSION_CODES = [
  ...CRUD_RESOURCES.flatMap((resource) =>
    CRUD_ACTIONS.map((action) => `${resource}.${action}`)
  ),
  ...EXTRA_PERMISSIONS,
].sort();

async function main() {
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.permisions.findMany({
      select: { code: true },
    });

    const existingCodes = new Set(
      existing.map((item) => String(item.code || "").trim().toLowerCase())
    );

    const missingCodes = DEFAULT_PERMISSION_CODES.filter(
      (code) => !existingCodes.has(code)
    );

    if (missingCodes.length) {
      await prisma.permisions.createMany({
        data: missingCodes.map((code) => ({ code })),
      });
    }

    console.log(
      `Permissions seed complete. Created=${missingCodes.length} Existing=${
        DEFAULT_PERMISSION_CODES.length - missingCodes.length
      }`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Permission seed failed:", error);
  process.exit(1);
});
