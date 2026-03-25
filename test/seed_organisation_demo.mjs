import prismaPkg from "../src/generated/prisma/index.js";

const { PrismaClient } = prismaPkg;

const prisma = new PrismaClient();

const TYPES_UNITE = [
  {
    code: "SITE",
    nom: "Site",
    description: "Site geographique",
    ordre: 1,
  },
  {
    code: "DIRECTION",
    nom: "Direction",
    description: "Niveau direction",
    ordre: 2,
  },
  {
    code: "DEPARTEMENT",
    nom: "Departement",
    description: "Niveau departement",
    ordre: 3,
  },
];

const DIRECTIONS = [
  {
    code: "DIR-RH",
    nom: "Direction Ressources Humaines",
    description: "Gestion du personnel et administration RH",
  },
  {
    code: "DIR-PROD",
    nom: "Direction Production",
    description: "Coordination des contenus et emissions",
  },
  {
    code: "DIR-IT",
    nom: "Direction Informatique",
    description: "Support technique, infrastructure et reseau",
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
  },
  {
    code: "SITE-KIN-GOMBE",
    nom: "RTNC Gombe",
    description: "Boulevard 30 Juin, Kinshasa",
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

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const typeByCode = new Map();
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
      typeByCode.set(typeUnite.code, persisted);
    }

    const directionsByCode = new Map();
    const directionType = typeByCode.get("DIRECTION");
    if (!directionType) {
      throw new Error("Type d'unite DIRECTION introuvable");
    }

    for (const direction of DIRECTIONS) {
      const path = buildUnitPath(null, direction.code);
      const persisted = await tx.uniteOrganisationnelle.upsert({
        where: { code: direction.code },
        update: {
          nom: direction.nom,
          description: direction.description,
          typeUniteId: directionType.id,
          parentId: null,
          chemin: path,
          niveau: 0,
          actif: true,
        },
        create: {
          code: direction.code,
          nom: direction.nom,
          description: direction.description,
          typeUniteId: directionType.id,
          parentId: null,
          chemin: path,
          niveau: 0,
          actif: true,
        },
      });
      directionsByCode.set(direction.code, persisted);
    }

    const departementsByCode = new Map();
    const departementType = typeByCode.get("DEPARTEMENT");
    if (!departementType) {
      throw new Error("Type d'unite DEPARTEMENT introuvable");
    }

    for (const departement of DEPARTEMENTS) {
      const parent = directionsByCode.get(departement.directionCode);
      if (!parent) {
        throw new Error(
          `Direction introuvable pour departement ${departement.code}`
        );
      }

      const path = buildUnitPath(parent, departement.code);
      const persisted = await tx.uniteOrganisationnelle.upsert({
        where: { code: departement.code },
        update: {
          nom: departement.nom,
          description: departement.description,
          typeUniteId: departementType.id,
          parentId: parent.id,
          chemin: path,
          niveau: 1,
          actif: true,
        },
        create: {
          code: departement.code,
          nom: departement.nom,
          description: departement.description,
          typeUniteId: departementType.id,
          parentId: parent.id,
          chemin: path,
          niveau: 1,
          actif: true,
        },
      });
      departementsByCode.set(departement.code, persisted);
    }

    const siteType = typeByCode.get("SITE");
    if (!siteType) {
      throw new Error("Type d'unite SITE introuvable");
    }

    const sitesByCode = new Map();
    for (const site of SITES) {
      const path = buildUnitPath(null, site.code);
      const persisted = await tx.uniteOrganisationnelle.upsert({
        where: { code: site.code },
        update: {
          nom: site.nom,
          description: site.description,
          typeUniteId: siteType.id,
          parentId: null,
          chemin: path,
          niveau: 0,
          actif: true,
        },
        create: {
          code: site.code,
          nom: site.nom,
          description: site.description,
          typeUniteId: siteType.id,
          parentId: null,
          chemin: path,
          niveau: 0,
          actif: true,
        },
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
