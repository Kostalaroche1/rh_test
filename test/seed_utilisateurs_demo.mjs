import bcrypt from "bcryptjs";
import prismaPkg from "../src/generated/prisma/index.js";

const { PrismaClient } = prismaPkg;

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Demo@12345";

const ROLES = [
  {
    key: "admin",
    nom: "ADMIN",
    description: "Administrateur de la plateforme",
    actif: true,
  },
  {
    key: "chefservice",
    nom: "CHEF_SERVICE",
    description: "Chef de service",
    actif: true,
  },
  {
    key: "rh",
    nom: "RH",
    description: "Gestion des ressources humaines",
    actif: true,
  },
  {
    key: "ag",
    nom: "AGENT",
    description: "Agent standard",
    actif: true,
  },
];

const DEMO_USERS = [
  {
    roleNom: "ADMIN",
    login: "admin.demo@rtnc.local",
    matricule: "DEMO-ADM-0001",
    nom: "Mubiala",
    prenom: "Alex",
    genre: "MASCULIN",
    statut: "ACTIF",
    dateEntree: "2021-01-10",
    dateNaissance: "1988-03-12",
    affectation: {
      uniteCode: "DEP-RH-ADM",
      posteCode: "PST-RH-RESP",
      fonctionCode: "FCT-RH-ADMIN",
      gradeCode: "GRD-A1",
    },
  },
  {
    roleNom: "RH",
    login: "rh.demo@rtnc.local",
    matricule: "DEMO-RH-0002",
    nom: "Kasongo",
    prenom: "Grace",
    genre: "FEMININ",
    statut: "ACTIF",
    dateEntree: "2022-02-15",
    dateNaissance: "1990-07-19",
    affectation: {
      uniteCode: "DEP-RH-PAIE",
      posteCode: "PST-RH-PAIE",
      fonctionCode: "FCT-RH-PAIE",
      gradeCode: "GRD-B1",
    },
  },
  {
    roleNom: "CHEF_SERVICE",
    login: "chef.demo@rtnc.local",
    matricule: "DEMO-CHF-0003",
    nom: "Ilunga",
    prenom: "Patrick",
    genre: "MASCULIN",
    statut: "ACTIF",
    dateEntree: "2020-06-08",
    dateNaissance: "1985-11-04",
    affectation: {
      uniteCode: "DEP-PROD-TV",
      posteCode: "PST-PROD-CHEF",
      fonctionCode: "FCT-PROD-PLAN",
      gradeCode: "GRD-A1",
    },
  },
  {
    roleNom: "AGENT",
    login: "agent.demo@rtnc.local",
    matricule: "DEMO-AGT-0004",
    nom: "Kabeya",
    prenom: "Joel",
    genre: "MASCULIN",
    statut: "ACTIF",
    dateEntree: "2023-03-12",
    dateNaissance: "1997-09-27",
    affectation: {
      uniteCode: "DEP-IT-SYS",
      posteCode: "PST-IT-TECH",
      fonctionCode: "FCT-IT-MAINT",
      gradeCode: "GRD-C1",
    },
  },
];

const TYPES_CONGE = [
  {
    code: "ANNUEL",
    libelle: "Conge annuel",
    dureeMax: 30,
    allocationConge: 2.5,
  },
  {
    code: "MALADIE",
    libelle: "Conge maladie",
    dureeMax: 15,
    allocationConge: 0,
  },
  {
    code: "MISSION",
    libelle: "Mission de service",
    dureeMax: 10,
    allocationConge: 0,
  },
];

async function findOrgEntities(tx, affectation) {
  const uniteCode = affectation.uniteCode ?? affectation.departementCode ?? affectation.directionCode;
  if (!uniteCode) {
    throw new Error("Affectation invalide: uniteCode manquant");
  }

  const [unite, poste, fonction, grade] = await Promise.all([
    tx.uniteOrganisationnelle.findUnique({ where: { code: uniteCode } }),
    tx.poste.findUnique({ where: { code: affectation.posteCode } }),
    tx.fonction.findUnique({ where: { code: affectation.fonctionCode } }),
    tx.grade.findUnique({ where: { code: affectation.gradeCode } }),
  ]);

  if (!unite || !poste || !fonction || !grade) {
    throw new Error(
      "Organisation incomplete. Lancez d'abord: node test/seed_organisation_demo.mjs"
    );
  }

  if (poste.uniteOrganisationnelleId !== unite.id) {
    throw new Error(
      `Incoherence organisationnelle: le poste ${poste.code} n'appartient pas a l'unite ${unite.code}`
    );
  }

  return { unite, poste, fonction, grade };
}

async function upsertAccountBundle(tx, payload) {
  const utilisateur = await tx.utilisateur.upsert({
    where: { login: payload.login },
    update: {
      actif: true,
    },
    create: {
      login: payload.login,
      motDePasse: payload.passwordHash,
      actif: true,
    },
  });

  const agent = await tx.agent.upsert({
    where: { matricule: payload.matricule },
    update: {
      nom: payload.nom,
      prenom: payload.prenom,
      genre: payload.genre,
      statut: payload.statut,
      dateEntree: new Date(payload.dateEntree),
      datenais: new Date(payload.dateNaissance),
      actif: true,
    },
    create: {
      matricule: payload.matricule,
      nom: payload.nom,
      prenom: payload.prenom,
      genre: payload.genre,
      statut: payload.statut,
      dateEntree: new Date(payload.dateEntree),
      datenais: new Date(payload.dateNaissance),
      actif: true,
    },
  });

  return { utilisateur, agent };
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const result = await prisma.$transaction(async (tx) => {
    const roleByNom = new Map();
    for (const role of ROLES) {
      const persisted = await tx.role.upsert({
        where: { nom: role.nom },
        update: {
          key: role.key,
          description: role.description,
          actif: role.actif,
        },
        create: role,
      });
      roleByNom.set(role.nom, persisted);
    }

    const adminSeed = DEMO_USERS.find((item) => item.roleNom === "ADMIN");
    if (!adminSeed) {
      throw new Error("Compte admin de demo manquant dans le seed");
    }

    const { utilisateur: adminUser, agent: adminAgent } = await upsertAccountBundle(tx, {
      ...adminSeed,
      passwordHash,
    });

    await tx.compteAgent.upsert({
      where: { agentId: adminAgent.id },
      update: {
        utilisateurId: adminUser.id,
        liePar: adminUser.id,
      },
      create: {
        agentId: adminAgent.id,
        utilisateurId: adminUser.id,
        liePar: adminUser.id,
      },
    });

    const adminRole = roleByNom.get("ADMIN");
    if (!adminRole) {
      throw new Error("Role ADMIN introuvable");
    }

    await tx.utilisateurRole.upsert({
      where: {
        utilisateurId_roleId: {
          utilisateurId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {
        attribuePar: adminUser.id,
      },
      create: {
        utilisateurId: adminUser.id,
        roleId: adminRole.id,
        attribuePar: adminUser.id,
      },
    });

    for (const seed of DEMO_USERS) {
      const role = roleByNom.get(seed.roleNom);
      if (!role) {
        throw new Error(`Role introuvable pour ${seed.login}`);
      }

      const { utilisateur, agent } = await upsertAccountBundle(tx, {
        ...seed,
        passwordHash,
      });

      await tx.compteAgent.upsert({
        where: { agentId: agent.id },
        update: {
          utilisateurId: utilisateur.id,
          liePar: adminUser.id,
        },
        create: {
          agentId: agent.id,
          utilisateurId: utilisateur.id,
          liePar: adminUser.id,
        },
      });

      await tx.utilisateurRole.upsert({
        where: {
          utilisateurId_roleId: {
            utilisateurId: utilisateur.id,
            roleId: role.id,
          },
        },
        update: {
          attribuePar: adminUser.id,
        },
        create: {
          utilisateurId: utilisateur.id,
          roleId: role.id,
          attribuePar: adminUser.id,
        },
      });

      const org = await findOrgEntities(tx, seed.affectation);
      const existingAffectation = await tx.affectation.findFirst({
        where: {
          agentId: agent.id,
          motif: "SEED_DEMO",
        },
      });

      if (existingAffectation) {
        await tx.affectation.update({
          where: { id: existingAffectation.id },
          data: {
            posteId: org.poste.id,
            fonctionId: org.fonction.id,
            gradeId: org.grade.id,
            uniteOrganisationnelleId: org.unite.id,
            dateDebut: new Date("2024-01-01"),
            dateFin: null,
            statut: "EN_ATTENTE",
            motif: "SEED_DEMO",
            typeContrat: "CDI",
            statutContrat: "ACTIF",
            type: "AFFECTATION",
          },
        });
      } else {
        await tx.affectation.create({
          data: {
            agentId: agent.id,
            posteId: org.poste.id,
            fonctionId: org.fonction.id,
            gradeId: org.grade.id,
            uniteOrganisationnelleId: org.unite.id,
            dateDebut: new Date("2024-01-01"),
            dateFin: null,
            statut: "EN_ATTENTE",
            motif: "SEED_DEMO",
            typeContrat: "CDI",
            statutContrat: "ACTIF",
            type: "AFFECTATION",
          },
        });
      }
    }

    for (const typeConge of TYPES_CONGE) {
      await tx.typeConge.upsert({
        where: { code: typeConge.code },
        update: {
          libelle: typeConge.libelle,
          dureeMax: typeConge.dureeMax,
          allocationConge: typeConge.allocationConge,
          actif: true,
          createurId: adminUser.id,
        },
        create: {
          code: typeConge.code,
          libelle: typeConge.libelle,
          dureeMax: typeConge.dureeMax,
          allocationConge: typeConge.allocationConge,
          actif: true,
          createurId: adminUser.id,
        },
      });
    }

    return {
      roles: ROLES.length,
      users: DEMO_USERS.length,
      typeConges: TYPES_CONGE.length,
      defaultPassword: DEFAULT_PASSWORD,
    };
  });

  console.log("Seed utilisateurs termine:", result);
  console.log("Comptes de demo:");
  for (const account of DEMO_USERS) {
    console.log(`- ${account.roleNom}: ${account.login} / ${DEFAULT_PASSWORD}`);
  }
}

main()
  .catch((error) => {
    if (error?.code === "P2021") {
      console.error(
        "Table manquante dans la base. Lancez d'abord: npx prisma migrate deploy"
      );
    }
    console.error("Seed utilisateurs echoue:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
