const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

const demoLogins = [
  "dg@rtnc.cd",
  "dga@rtnc.cd",
  "drh@rtnc.cd",
  "dp.kin@rtnc.cd",
  "dir.rh.kin@rtnc.cd",
  "dir.tech.rtnc2@rtnc.cd",
  "agent.info.kin@rtnc.cd",
  "agent.tech.mitendi@rtnc.cd",
];

const legacyLogins = [
  "admin.rtnc.demo",
  "rh.central.rtnc.demo",
  "dir.kin.rtnc.demo",
  "rh.kin.rtnc.demo",
  "chef.kin.rtnc.demo",
  "agent.jt.kin.rtnc.demo",
  "agent.tech.kin.rtnc.demo",
];

const allLogins = [...new Set([...demoLogins, ...legacyLogins])];
const demoMatricules = [
  "RTNC-DG-0001",
  "RTNC-DGA-0001",
  "RTNC-RH-0001",
  "RTNC-KIN-0001",
  "RTNC-KIN-0002",
  "RTNC-KIN-0003",
  "RTNC-KIN-0004",
  "RTNC-KIN-0005",
];
const demoRoleCodes = [
  "rtnc_direction_generale",
  "rtnc_drh_centrale",
  "rtnc_directeur_provincial",
  "rtnc_directeur_direction",
  "rtnc_agent",
];
const demoTypeUnitCodes = [
  "CA_RTNC",
  "DG_RTNC",
  "DIRECTION_RTNC",
  "SOUS_DIRECTION_RTNC",
  "SECTION_RTNC",
  "CELLULE_RTNC",
  "DIRECTION_PROVINCIALE_RTNC",
  "STATION_RTNC",
  "SOUS_STATION_RTNC",
];
const demoGradeCodes = ["RTNC-GR-A1", "RTNC-GR-A2", "RTNC-GR-B1"];
const demoTypeCongeCodes = ["RTNC-ANNUEL", "RTNC-MISSION"];
const demoUnitCodePrefix = "RTNC-";
const demoTitlePrefix = "[DEMO RTNC]";

async function main() {
  const users = await prisma.utilisateur.findMany({
    where: { login: { in: allLogins } },
    select: { id: true, login: true },
  });
  const userIds = users.map((user) => user.id);

  const agents = await prisma.agent.findMany({
    where: { matricule: { in: demoMatricules } },
    select: { id: true, matricule: true },
  });
  const agentIds = agents.map((agent) => agent.id);

  const comptes = userIds.length
    ? await prisma.compteAgent.findMany({
        where: {
          OR: [{ utilisateurId: { in: userIds } }, { agentId: { in: agentIds } }],
        },
        select: { id: true },
      })
    : [];
  const compteIds = comptes.map((compte) => compte.id);

  const roles = await prisma.role.findMany({
    where: { code: { in: demoRoleCodes } },
    select: { id: true, code: true },
  });
  const roleIds = roles.map((role) => role.id);

  const typeUnits = await prisma.typeUniteOrganisationnelle.findMany({
    where: { code: { in: demoTypeUnitCodes } },
    select: { id: true },
  });
  const typeUnitIds = typeUnits.map((item) => item.id);

  const units = await prisma.uniteOrganisationnelle.findMany({
    where: { code: { startsWith: demoUnitCodePrefix } },
    select: { id: true },
  });
  const unitIds = units.map((item) => item.id);

  const postes = await prisma.poste.findMany({
    where: { code: { startsWith: "POSTE-RTNC-" } },
    select: { id: true },
  });
  const posteIds = postes.map((item) => item.id);

  const fonctions = await prisma.fonction.findMany({
    where: { code: { startsWith: "FONCTION-RTNC-" } },
    select: { id: true },
  });
  const fonctionIds = fonctions.map((item) => item.id);

  const grades = await prisma.grade.findMany({
    where: { code: { in: demoGradeCodes } },
    select: { id: true },
  });
  const gradeIds = grades.map((item) => item.id);

  const horaires = await prisma.horaireTravail.findMany({
    where: { nomHoraire: { startsWith: "RTNC " } },
    select: { id: true },
  });
  const horaireIds = horaires.map((item) => item.id);

  const typeConges = await prisma.typeConge.findMany({
    where: {
      OR: [
        { code: { in: demoTypeCongeCodes } },
        { createurId: { in: userIds } },
      ],
    },
    select: { id: true },
  });
  const typeCongeIds = typeConges.map((item) => item.id);

  const plans = await prisma.planification.findMany({
    where: {
      OR: [
        { titre: { startsWith: demoTitlePrefix } },
        { creeParId: { in: userIds } },
        { assigneParId: { in: userIds } },
        { valideParId: { in: userIds } },
      ],
    },
    select: { id: true },
  });
  const planIds = plans.map((item) => item.id);

  const allHoraireIds = (
    await prisma.horaireTravail.findMany({
      where: {
        OR: [
          { id: { in: horaireIds } },
          { creerParId: { in: userIds } },
        ],
      },
      select: { id: true },
    })
  ).map((item) => item.id);

  const allTypeCongeIds = (
    await prisma.typeConge.findMany({
      where: {
        OR: [
          { id: { in: typeCongeIds } },
          { createurId: { in: userIds } },
        ],
      },
      select: { id: true },
    })
  ).map((item) => item.id);

  await prisma.$transaction([
    prisma.planificationParticipant.deleteMany({ where: { planificationId: { in: planIds } } }),
    prisma.notification.deleteMany({ where: { compteId: { in: compteIds }, titre: { startsWith: demoTitlePrefix } } }),
    prisma.rapport.deleteMany({ where: { compteId: { in: compteIds }, Libelle: { startsWith: demoTitlePrefix } } }),
    prisma.prime.deleteMany({ where: { paie: { agentId: { in: agentIds } } } }),
    prisma.paie.deleteMany({ where: { agentId: { in: agentIds } } }),
    prisma.presence.deleteMany({ where: { agentId: { in: agentIds } } }),
    prisma.demandeConge.deleteMany({
      where: {
        OR: [
          { agentId: { in: agentIds } },
          { typeCongeId: { in: allTypeCongeIds } },
          { confirmePar: { in: userIds } },
          { validePar: { in: userIds } },
        ],
      },
    }),
    prisma.horaireAgent.deleteMany({
      where: {
        OR: [
          { agentId: { in: agentIds } },
          { horaireId: { in: allHoraireIds } },
          { creerParId: { in: userIds } },
        ],
      },
    }),
    prisma.affectation.deleteMany({ where: { agentId: { in: agentIds } } }),
    prisma.planification.deleteMany({ where: { id: { in: planIds } } }),
    prisma.compteAgent.deleteMany({ where: { id: { in: compteIds } } }),
    prisma.utilisateurRole.deleteMany({ where: { OR: [{ utilisateurId: { in: userIds } }, { roleId: { in: roleIds } }] } }),
    prisma.reglePorteeRole.deleteMany({ where: { roleId: { in: roleIds } } }),
    prisma.rolePermission.deleteMany({ where: { roleId: { in: roleIds } } }),
    prisma.typeConge.deleteMany({ where: { id: { in: allTypeCongeIds } } }),
    prisma.horaireTravail.deleteMany({ where: { id: { in: allHoraireIds } } }),
    prisma.utilisateur.deleteMany({ where: { id: { in: userIds } } }),
    prisma.agent.deleteMany({ where: { id: { in: agentIds } } }),
    prisma.fonction.deleteMany({ where: { id: { in: fonctionIds } } }),
    prisma.poste.deleteMany({ where: { id: { in: posteIds } } }),
    prisma.typeOrgaUniteProvince.deleteMany({ where: { OR: [{ typeUniteId: { in: typeUnitIds } }, { uniteOrganisationnelleId: { in: unitIds } }] } }),
    prisma.uniteOrganisationnelle.deleteMany({ where: { id: { in: unitIds } } }),
    prisma.typeUniteOrganisationnelle.deleteMany({ where: { id: { in: typeUnitIds } } }),
    prisma.grade.deleteMany({ where: { id: { in: gradeIds } } }),
    prisma.role.deleteMany({ where: { id: { in: roleIds } } }),
  ]);

  console.log(
    JSON.stringify(
      {
        status: "ok",
        removed: {
          users: users.length,
          agents: agents.length,
          roles: roles.length,
          units: units.length,
          plans: plans.length,
        },
        note: "RTNC demo data cleanup completed.",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("cleanup-rtnc-demo failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
