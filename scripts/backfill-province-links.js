const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);
}

function detectProvinceIdForUnit(unit, provinces) {
  const codeTokens = tokenize(unit.code);
  const nameTokens = tokenize(unit.nom);
  const tokens = new Set([...codeTokens, ...nameTokens]);
  const haystack = `${normalize(unit.code)} ${normalize(unit.nom)}`;

  for (const province of provinces) {
    const provinceCodeToken = normalize(province.code);
    const provinceName = normalize(province.nom);
    const provinceNameTokens = tokenize(province.nom);

    if (provinceCodeToken && tokens.has(provinceCodeToken)) {
      return province.id;
    }

    if (
      provinceNameTokens.length &&
      provinceNameTokens.every((part) => haystack.includes(part))
    ) {
      return province.id;
    }

    if (provinceName && haystack.includes(provinceName)) {
      return province.id;
    }
  }

  return null;
}

async function main() {
  const provinces = await prisma.province.findMany({
    select: { id: true, code: true, nom: true },
    orderBy: { id: "asc" },
  });

  if (!provinces.length) {
    throw new Error(
      "Aucune province detectee. Lancez d'abord: npm run seed:provinces"
    );
  }

  const units = await prisma.uniteOrganisationnelle.findMany({
    select: {
      id: true,
      code: true,
      nom: true,
      parentId: true,
      provinceId: true,
      niveau: true,
    },
    orderBy: [{ niveau: "asc" }, { id: "asc" }],
  });

  const provinceByUnitId = new Map();
  for (const unit of units) {
    if (unit.provinceId) {
      provinceByUnitId.set(unit.id, unit.provinceId);
      continue;
    }

    const detectedProvinceId = detectProvinceIdForUnit(unit, provinces);
    if (detectedProvinceId) {
      provinceByUnitId.set(unit.id, detectedProvinceId);
      continue;
    }

    if (unit.parentId && provinceByUnitId.has(unit.parentId)) {
      provinceByUnitId.set(unit.id, provinceByUnitId.get(unit.parentId));
      continue;
    }

    if (provinces.length === 1) {
      provinceByUnitId.set(unit.id, provinces[0].id);
    }
  }

  let unitUpdates = 0;
  for (const unit of units) {
    const nextProvinceId = provinceByUnitId.get(unit.id) ?? null;
    if (!nextProvinceId || unit.provinceId === nextProvinceId) {
      continue;
    }

    await prisma.uniteOrganisationnelle.update({
      where: { id: unit.id },
      data: { provinceId: nextProvinceId },
    });
    unitUpdates += 1;
  }

  const unitsWithoutProvince = await prisma.uniteOrganisationnelle.count({
    where: { provinceId: null },
  });

  const affectations = await prisma.affectation.findMany({
    select: {
      id: true,
      provinceId: true,
      uniteOrganisationnelle: {
        select: {
          provinceId: true,
        },
      },
    },
  });

  let affectationUpdates = 0;
  for (const affectation of affectations) {
    const expectedProvinceId = affectation.uniteOrganisationnelle?.provinceId ?? null;
    if (!expectedProvinceId || affectation.provinceId === expectedProvinceId) {
      continue;
    }

    await prisma.affectation.update({
      where: { id: affectation.id },
      data: { provinceId: expectedProvinceId },
    });
    affectationUpdates += 1;
  }

  const affectationsWithoutProvince = await prisma.affectation.count({
    where: { provinceId: null },
  });

  console.log(
    JSON.stringify(
      {
        status: "ok",
        provinceCount: provinces.length,
        unitUpdates,
        unitsWithoutProvince,
        affectationUpdates,
        affectationsWithoutProvince,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("backfill-province-links failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
