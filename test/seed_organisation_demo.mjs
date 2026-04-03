import prismaPkg from "../src/generated/prisma/index.js";

const { PrismaClient } = prismaPkg;

const prisma = new PrismaClient();

const PROVINCES = [
  { code: "KIN", nom: "Kinshasa" },
  { code: "KON", nom: "Kongo Central" },
  { code: "NKV", nom: "Nord-Kivu" },
];

const TYPES_UNITE = PROVINCES.map((province, index) => ({
  code: `RTNC-${province.code}`,
  nom: `RTNC ${province.nom}`,
  description: `Type organisationnel principal de ${province.nom}`,
  ordre: index + 1,
  provinceCode: province.code,
}));

const DIRECTIONS = [
  {
    code: "DIR-RH",
    nom: "Direction Ressources Humaines",
    description: "Gestion du personnel et administration RH",
    provinceCode: "KIN",
  },
  {
    code: "DIR-PROD",
    nom: "Direction Production",
    description: "Coordination des contenus et emissions",
    provinceCode: "KIN",
  },
  {
    code: "DIR-IT",
    nom: "Direction Informatique",
    description: "Support technique, infrastructure et reseau",
    provinceCode: "KIN",
  },
];

const DEPARTEMENTS = [
  {
    code: "DEP-RH-ADM",
    nom: "Administration RH",
    directionCode: "DIR-RH",
    description: "Administration des ressources humaines",
  },
  {
    code: "DEP-RH-PAIE",
    nom: "Paie et Avantages",
    directionCode: "DIR-RH",
    description: "Traitement paie et avantages",
  },
  {
    code: "DEP-PROD-TV",
    nom: "Production TV",
    directionCode: "DIR-PROD",
    description: "Production TV",
  },
  {
    code: "DEP-IT-SYS",
    nom: "Systemes et Reseau",
    directionCode: "DIR-IT",
    description: "Maintenance systemes et reseau",
  },
];

const SITES = [
  {
    code: "SITE-KIN-SIEGE",
    nom: "RTNC Siege",
    description: "Avenue de la Radio 1, Kinshasa",
    provinceCode: "KIN",
  },
  {
    code: "SITE-KIN-GOMBE",
    nom: "RTNC Gombe",
    description: "Boulevard 30 Juin, Kinshasa",
    provinceCode: "KIN",
  },
];

const POSTES = [
  {
    code: "PST-RH-RESP",
    libelle: "Responsable RH",
    uniteCode: "DEP-RH-ADM",
  },
  {
    code: "PST-RH-PAIE",
    libelle: "Gestionnaire Paie",
    uniteCode: "DEP-RH-PAIE",
  },
  {
    code: "PST-PROD-CHEF",
    libelle: "Chef de Service Production",
    uniteCode: "DEP-PROD-TV",
  },
  {
    code: "PST-IT-TECH",
    libelle: "Technicien Systeme",
    uniteCode: "DEP-IT-SYS",
  },
];

const FONCTIONS = [
  {
    code: "FCT-RH-ADMIN",
    libelle: "Administration du personnel",
    posteCode: "PST-RH-RESP",
  },
  {
    code: "FCT-RH-PAIE",
    libelle: "Traitement de la paie",
    posteCode: "PST-RH-PAIE",
  },
  {
    code: "FCT-PROD-PLAN",
    libelle: "Planification des emissions",
    posteCode: "PST-PROD-CHEF",
  },
  {
    code: "FCT-IT-MAINT",
    libelle: "Maintenance IT et reseau",
    posteCode: "PST-IT-TECH",
  },
];

const GRADES = [
  { code: "GRD-A1", libelle: "Grade A1", indiceSalarial: 500 },
  { code: "GRD-B1", libelle: "Grade B1", indiceSalarial: 350 },
  { code: "GRD-C1", libelle: "Grade C1", indiceSalarial: 250 },
];

function buildUnitPath(parent, code) {
  if (!parent) {
    return code;
  }
  const basePath = parent.chemin && parent.chemin.length > 0 ? parent.chemin : parent.code;
  return `${basePath}/${code}`;
}

async function ensureTypeProvinceTemplate(tx, { typeUniteId, provinceId }) {
  const existingTemplate = await tx.typeOrgaUniteProvince.findFirst({
    where: {
      typeUniteId,
      provinceId,
      uniteOrganisationnelleId: null,
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  if (existingTemplate) {
    await tx.typeOrgaUniteProvince.update({
      where: { id: existingTemplate.id },
      data: { actif: true },
    });
    return existingTemplate.id;
  }

  const createdTemplate = await tx.typeOrgaUniteProvince.create({
    data: {
      typeUniteId,
      provinceId,
      uniteOrganisationnelleId: null,
      actif: true,
    },
    select: { id: true },
  });

  return createdTemplate.id;
}

async function linkUnitToTypeProvince(tx, { typeUniteId, uniteOrganisationnelleId, provinceId }) {
  const existingLink = await tx.typeOrgaUniteProvince.findFirst({
    where: {
      typeUniteId,
      uniteOrganisationnelleId,
      provinceId,
    },
    select: { id: true },
  });

  if (existingLink) {
    await tx.typeOrgaUniteProvince.update({
      where: { id: existingLink.id },
      data: { actif: true },
    });
    return existingLink.id;
  }

  const template = await tx.typeOrgaUniteProvince.findFirst({
    where: {
      typeUniteId,
      provinceId,
      uniteOrganisationnelleId: null,
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  if (template) {
    const linkedFromTemplate = await tx.typeOrgaUniteProvince.update({
      where: { id: template.id },
      data: {
        uniteOrganisationnelleId,
        actif: true,
      },
      select: { id: true },
    });
    return linkedFromTemplate.id;
  }

  const createdLink = await tx.typeOrgaUniteProvince.create({
    data: {
      typeUniteId,
      uniteOrganisationnelleId,
      provinceId,
      actif: true,
    },
    select: { id: true },
  });

  return createdLink.id;
}

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const provinceByCode = new Map();
    for (const province of PROVINCES) {
      const persisted = await tx.province.upsert({
        where: { code: province.code },
        update: {
          nom: province.nom,
          actif: true,
        },
        create: {
          code: province.code,
          nom: province.nom,
          actif: true,
        },
      });
      provinceByCode.set(province.code, persisted);
    }

    const typeByProvinceCode = new Map();
    for (const typeUnite of TYPES_UNITE) {
      const persisted = await tx.typeUniteOrganisationnelle.upsert({
        where: { code: typeUnite.code },
        update: {
          nom: typeUnite.nom,
          description: typeUnite.description,
          ordre: typeUnite.ordre,
          actif: true,
        },
        create: {
          code: typeUnite.code,
          nom: typeUnite.nom,
          description: typeUnite.description,
          ordre: typeUnite.ordre,
          actif: true,
          systeme: false,
        },
      });
      typeByProvinceCode.set(typeUnite.provinceCode, persisted);
    }

    const directionsByCode = new Map();
    const directionProvinceByCode = new Map();

    for (const provinceDef of PROVINCES) {
      const province = provinceByCode.get(provinceDef.code);
      const provinceType = typeByProvinceCode.get(provinceDef.code);
      if (!province || !provinceType) {
        throw new Error(`Configuration province/type introuvable pour ${provinceDef.code}`);
      }
      await ensureTypeProvinceTemplate(tx, {
        typeUniteId: provinceType.id,
        provinceId: province.id,
      });
    }

    for (const direction of DIRECTIONS) {
      const province = provinceByCode.get(direction.provinceCode ?? "KIN");
      if (!province) {
        throw new Error(`Province introuvable pour direction ${direction.code}`);
      }
      const provinceType = typeByProvinceCode.get(direction.provinceCode ?? "KIN");
      if (!provinceType) {
        throw new Error(`Type d'unite introuvable pour la province ${direction.provinceCode ?? "KIN"}`);
      }

      const path = buildUnitPath(null, direction.code);
      const persisted = await tx.uniteOrganisationnelle.upsert({
        where: { code: direction.code },
        update: {
          nom: direction.nom,
          description: direction.description,
          parentId: null,
          chemin: path,
          niveau: 0,
          actif: true,
        },
        create: {
          code: direction.code,
          nom: direction.nom,
          description: direction.description,
          parentId: null,
          chemin: path,
          niveau: 0,
          actif: true,
        },
      });

      await linkUnitToTypeProvince(tx, {
        typeUniteId: provinceType.id,
        uniteOrganisationnelleId: persisted.id,
        provinceId: province.id,
      });

      directionsByCode.set(direction.code, persisted);
      directionProvinceByCode.set(direction.code, province);
    }

    const departementsByCode = new Map();

    for (const departement of DEPARTEMENTS) {
      const parent = directionsByCode.get(departement.directionCode);
      if (!parent) {
        throw new Error(
          `Direction introuvable pour departement ${departement.code}`
        );
      }
      const province = directionProvinceByCode.get(departement.directionCode);
      if (!province) {
        throw new Error(
          `Province introuvable pour departement ${departement.code}`
        );
      }
      const provinceType = typeByProvinceCode.get(province.code);
      if (!provinceType) {
        throw new Error(
          `Type d'unite introuvable pour la province ${province.code}`
        );
      }

      const path = buildUnitPath(parent, departement.code);
      const persisted = await tx.uniteOrganisationnelle.upsert({
        where: { code: departement.code },
        update: {
          nom: departement.nom,
          description: departement.description,
          parentId: parent.id,
          chemin: path,
          niveau: 1,
          actif: true,
        },
        create: {
          code: departement.code,
          nom: departement.nom,
          description: departement.description,
          parentId: parent.id,
          chemin: path,
          niveau: 1,
          actif: true,
        },
      });

      await linkUnitToTypeProvince(tx, {
        typeUniteId: provinceType.id,
        uniteOrganisationnelleId: persisted.id,
        provinceId: province.id,
      });

      departementsByCode.set(departement.code, persisted);
    }

    const sitesByCode = new Map();
    for (const site of SITES) {
      const province = provinceByCode.get(site.provinceCode ?? "KIN");
      if (!province) {
        throw new Error(`Province introuvable pour site ${site.code}`);
      }
      const provinceType = typeByProvinceCode.get(site.provinceCode ?? "KIN");
      if (!provinceType) {
        throw new Error(`Type d'unite introuvable pour la province ${site.provinceCode ?? "KIN"}`);
      }

      const path = buildUnitPath(null, site.code);
      const persisted = await tx.uniteOrganisationnelle.upsert({
        where: { code: site.code },
        update: {
          nom: site.nom,
          description: site.description,
          parentId: null,
          chemin: path,
          niveau: 0,
          actif: true,
        },
        create: {
          code: site.code,
          nom: site.nom,
          description: site.description,
          parentId: null,
          chemin: path,
          niveau: 0,
          actif: true,
        },
      });

      await linkUnitToTypeProvince(tx, {
        typeUniteId: provinceType.id,
        uniteOrganisationnelleId: persisted.id,
        provinceId: province.id,
      });

      sitesByCode.set(site.code, persisted);
    }

    const postesByCode = new Map();
    for (const poste of POSTES) {
      const unite = departementsByCode.get(poste.uniteCode);
      if (!unite) {
        throw new Error(`Unite introuvable pour poste ${poste.code}`);
      }

      const persisted = await tx.poste.upsert({
        where: { code: poste.code },
        update: {
          libelle: poste.libelle,
          uniteOrganisationnelleId: unite.id,
          actif: true,
        },
        create: {
          code: poste.code,
          libelle: poste.libelle,
          uniteOrganisationnelleId: unite.id,
          actif: true,
        },
      });
      postesByCode.set(poste.code, persisted);
    }

    for (const fonction of FONCTIONS) {
      const poste = postesByCode.get(fonction.posteCode);
      if (!poste) {
        throw new Error(`Poste introuvable pour fonction ${fonction.code}`);
      }

      await tx.fonction.upsert({
        where: { code: fonction.code },
        update: {
          libelle: fonction.libelle,
          posteId: poste.id,
        },
        create: {
          code: fonction.code,
          libelle: fonction.libelle,
          posteId: poste.id,
        },
      });
    }

    for (const grade of GRADES) {
      await tx.grade.upsert({
        where: { code: grade.code },
        update: {
          libelle: grade.libelle,
          indiceSalarial: grade.indiceSalarial,
        },
        create: grade,
      });
    }

    return {
      typesUnite: TYPES_UNITE.length,
      provinces: PROVINCES.length,
      directions: DIRECTIONS.length,
      departements: DEPARTEMENTS.length,
      sites: SITES.length,
      postes: POSTES.length,
      fonctions: FONCTIONS.length,
      grades: GRADES.length,
      unites: directionsByCode.size + departementsByCode.size + sitesByCode.size,
    };
  });

  console.log("Seed organisation termine:", result);
}

main()
  .catch((error) => {
    if (error?.code === "P2021") {
      console.error(
        "Table manquante dans la base. Lancez d'abord: npx prisma migrate deploy"
      );
    }
    console.error("Seed organisation echoue:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
