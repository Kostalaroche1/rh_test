const bcrypt = require("bcryptjs");
const { PrismaClient, PorteeDonnees } = require("../src/generated/prisma");

const prisma = new PrismaClient();
const PASSWORD = process.env.RTNC_DEMO_PASSWORD || "DemoRTNC2026!";

const roleDefs = [
  { code: "rtnc_direction_generale", nom: "Direction Generale RTNC", perms: "*", scope: PorteeDonnees.TOUTE_ORGANISATION },
  { code: "rtnc_drh_centrale", nom: "Direction des Ressources Humaines RTNC", perms: ["agent.read", "agent.create", "agent.update", "user.read", "user.create", "user.update", "province.read", "type_unite_organisationnelle.read", "unite_organisationnelle.read", "poste.read", "fonction.read", "grade.read", "affectation.read", "affectation.assign", "affectation.update", "presence.read", "presence.sign", "presence.confirm", "presence.validate", "demande_conge.read", "demande_conge.request", "demande_conge.confirm", "demande_conge.validate", "type_conge.read", "type_conge.create", "horaire_travail.read", "horaire_travail.create", "horaire_travail.update", "horaire_agent.read", "horaire_agent.assign", "horaire_agent.update", "paie.read", "paie.create", "paie.update", "paie.publish", "notification.read", "notification.create", "rapport.read", "rapport.create", "planification.read", "planification.create", "planification.update", "planification.validate"], scope: PorteeDonnees.TOUTE_ORGANISATION },
  { code: "rtnc_directeur_provincial", nom: "Directeur provincial RTNC", perms: ["province.read", "agent.read", "presence.read", "presence.confirm", "presence.validate", "demande_conge.read", "demande_conge.confirm", "demande_conge.validate", "type_conge.read", "affectation.read", "horaire_travail.read", "horaire_agent.read", "planification.read", "planification.create", "notification.read", "rapport.read"], scope: PorteeDonnees.PROVINCE, overrides: { "notification.read": PorteeDonnees.SOI_MEME, "rapport.read": PorteeDonnees.SOI_MEME } },
  { code: "rtnc_directeur_direction", nom: "Directeur de direction RTNC", perms: ["province.read", "agent.read", "agent.update", "user.read", "presence.read", "presence.sign", "presence.confirm", "presence.validate", "demande_conge.read", "demande_conge.request", "demande_conge.confirm", "demande_conge.validate", "type_conge.read", "horaire_travail.read", "horaire_agent.read", "horaire_agent.assign", "affectation.read", "planification.read", "planification.create", "notification.read", "rapport.read"], scope: PorteeDonnees.UNITE_ET_DESCENDANTS, overrides: { "presence.sign": PorteeDonnees.SOI_MEME, "demande_conge.request": PorteeDonnees.SOI_MEME, "notification.read": PorteeDonnees.SOI_MEME, "rapport.read": PorteeDonnees.SOI_MEME } },
  { code: "rtnc_agent", nom: "Agent RTNC", perms: ["presence.sign", "presence.read", "demande_conge.request", "demande_conge.read", "type_conge.read", "paie.read", "notification.read", "rapport.read"], scope: PorteeDonnees.SOI_MEME },
];

const centralDirectionDefs = [
  { code: "RTNC-LING-DG", nom: "Direction Generale RTNC", fonction: "Direction Generale" },
  { code: "RTNC-LING-RH", nom: "Direction des Ressources Humaines", fonction: "Gestion RH" },
  { code: "RTNC-LING-FIN", nom: "Direction Financiere", fonction: "Gestion financiere" },
  { code: "RTNC-LING-COM", nom: "Direction Commerciale", fonction: "Commercial et partenariats" },
  { code: "RTNC-LING-INF", nom: "Direction des Informations", fonction: "Information et redaction" },
  { code: "RTNC-LING-PROG", nom: "Direction des Programmes", fonction: "Programmation" },
  { code: "RTNC-LING-PROD", nom: "Direction de la Production", fonction: "Production" },
  { code: "RTNC-LING-TECH", nom: "Direction Technique", fonction: "Technique" },
  { code: "RTNC-LING-NT", nom: "Direction des Nouvelles Technologies", fonction: "Transformation numerique" },
  { code: "RTNC-LING-PATR", nom: "Direction du Patrimoine et de la Logistique", fonction: "Patrimoine et logistique" },
  { code: "RTNC-LING-JUR", nom: "Direction Juridique", fonction: "Affaires juridiques" },
  { code: "RTNC-LING-ARCH", nom: "Direction des Archives et de la Documentation", fonction: "Archives et documentation" },
  { code: "RTNC-LING-RAD", nom: "Direction de la Radio", fonction: "Radio" },
  { code: "RTNC-LING-TV", nom: "Direction de la Television", fonction: "Television" },
];

const stationTypes = [
  { code: "RTNC_LINGWALA", nom: "RTNC-LINGWALA", provinceCode: "KIN", ordre: 1 },
  { code: "RTNC_2", nom: "RTNC 2", provinceCode: "KIN", ordre: 2 },
  { code: "RTNC_MITENDI", nom: "RTNC-MITENDI", provinceCode: "KIN", ordre: 3 },
];

const provinceStationNames = {
  "sankuru": "Station provinciale RTNC Lusambo",
  "ituri": "Station provinciale RTNC Bunia",
  "nord-kivu": "Station provinciale RTNC Goma",
  "sud-kivu": "Station provinciale RTNC Bukavu",
  "tshopo": "Station provinciale RTNC Kisangani",
  "haut-katanga": "Station provinciale RTNC Lubumbashi",
  "kongo-central": "Station provinciale RTNC Matadi",
  "equateur": "Station provinciale RTNC Mbandaka",
  "kasaï-central": "Station provinciale RTNC Kananga",
  "kasai-central": "Station provinciale RTNC Kananga",
  "kasaï-oriental": "Station provinciale RTNC Mbuji-Mayi",
  "kasai-oriental": "Station provinciale RTNC Mbuji-Mayi",
};

const provinceDirectionNames = [
  { suffix: "DP", nom: "Direction provinciale RTNC", fonction: "Direction provinciale" },
  { suffix: "RH", nom: "Direction des Ressources Humaines", fonction: "Gestion RH provinciale" },
  { suffix: "TECH", nom: "Direction Technique", fonction: "Technique provinciale" },
  { suffix: "INF", nom: "Direction des Informations", fonction: "Information provinciale" },
];

const grades = [
  { code: "RTNC-GR-A1", libelle: "Cadre A1", indiceSalarial: 950 },
  { code: "RTNC-GR-A2", libelle: "Cadre A2", indiceSalarial: 780 },
  { code: "RTNC-GR-B1", libelle: "Agent B1", indiceSalarial: 520 },
];

const users = [
  { login: "dg@rtnc.cd", role: "rtnc_direction_generale", matricule: "RTNC-DG-0001", nom: "Elenge Nyembo", prenom: "Sylvie", genre: "FEMININ", dateEntree: "2022-08-22", province: "KIN", station: "RTNC_LINGWALA", unit: "RTNC-LING-DG", poste: "Directeur General", fonction: "Direction Generale", grade: "RTNC-GR-A1", contrat: "CDI" },
  { login: "dga@rtnc.cd", role: "rtnc_direction_generale", matricule: "RTNC-DGA-0001", nom: "Voto Tongba", prenom: "Jose-Adolphe", genre: "MASCULIN", dateEntree: "2022-08-22", province: "KIN", station: "RTNC_LINGWALA", unit: "RTNC-LING-DG", poste: "Directeur General Adjoint", fonction: "Direction Generale Adjointe", grade: "RTNC-GR-A1", contrat: "CDI" },
  { login: "drh@rtnc.cd", role: "rtnc_drh_centrale", matricule: "RTNC-RH-0001", nom: "Banza", prenom: "Mireille", genre: "FEMININ", dateEntree: "2020-04-20", province: "KIN", station: "RTNC_LINGWALA", unit: "RTNC-LING-RH", poste: "Directeur", fonction: "Direction des Ressources Humaines", grade: "RTNC-GR-A1", contrat: "CDI" },
  { login: "dir.info.lingwala@rtnc.cd", role: "rtnc_directeur_direction", matricule: "RTNC-KIN-0001", nom: "Nsimba", prenom: "Aline", genre: "FEMININ", dateEntree: "2019-09-14", province: "KIN", station: "RTNC_LINGWALA", unit: "RTNC-LING-INF", poste: "Directeur", fonction: "Direction des Informations", grade: "RTNC-GR-A2", contrat: "CDI" },
  { login: "dir.tech.rtnc2@rtnc.cd", role: "rtnc_directeur_direction", matricule: "RTNC-KIN-0002", nom: "Lutula", prenom: "Patrick", genre: "MASCULIN", dateEntree: "2017-02-08", province: "KIN", station: "RTNC_2", unit: "RTNC-2-TECH", poste: "Directeur", fonction: "Direction Technique", grade: "RTNC-GR-A2", contrat: "CDI" },
  { login: "agent.info.lingwala@rtnc.cd", role: "rtnc_agent", matricule: "RTNC-KIN-0003", nom: "Mbuyi", prenom: "Grace", genre: "FEMININ", dateEntree: "2022-11-05", province: "KIN", station: "RTNC_LINGWALA", unit: "RTNC-LING-INF", poste: "Agent", fonction: "Journaliste presentatrice", grade: "RTNC-GR-B1", contrat: "CDD" },
  { login: "agent.tech.mitendi@rtnc.cd", role: "rtnc_agent", matricule: "RTNC-KIN-0004", nom: "Kanku", prenom: "Didier", genre: "MASCULIN", dateEntree: "2021-07-18", province: "KIN", station: "RTNC_MITENDI", unit: "RTNC-MIT-TECH", poste: "Agent", fonction: "Technicien diffusion", grade: "RTNC-GR-B1", contrat: "CDI" },
  { login: "dp.bukavu@rtnc.cd", role: "rtnc_directeur_provincial", matricule: "RTNC-SK-0001", nom: "Bahati", prenom: "Samuel", genre: "MASCULIN", dateEntree: "2018-03-12", province: "SKD", station: "RTNC_ST_SKD", unit: "RTNC-SKD-DP", poste: "Directeur provincial", fonction: "Direction provinciale RTNC Sud-Kivu", grade: "RTNC-GR-A1", contrat: "CDI" },
  { login: "agent.rh.bukavu@rtnc.cd", role: "rtnc_agent", matricule: "RTNC-SK-0002", nom: "Mukwege", prenom: "Claire", genre: "FEMININ", dateEntree: "2023-01-08", province: "SKD", station: "RTNC_ST_SKD", unit: "RTNC-SKD-RH", poste: "Agent", fonction: "Gestionnaire RH provincial", grade: "RTNC-GR-B1", contrat: "CDI" },
];

const horaires = [
  { key: "administratif", nomHoraire: "RTNC Administratif jour", heureDebut: "08:00", heureFin: "16:00" },
  { key: "matinale", nomHoraire: "RTNC Matinale antenne", heureDebut: "06:00", heureFin: "14:00" },
  { key: "soiree", nomHoraire: "RTNC Soiree technique", heureDebut: "14:00", heureFin: "22:00" },
];

const leaveTypes = [
  { code: "RTNC-ANNUEL", libelle: "Conge annuel", dureeMax: 30, allocationConge: 1 },
  { code: "RTNC-MISSION", libelle: "Conge mission / couverture", dureeMax: 10, allocationConge: 1 },
];

function d(v) { return v instanceof Date ? v : new Date(v); }
function t(v) { return new Date(`1970-01-01T${v}:00.000Z`); }
function slugLower(v) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
async function upsertUnique(model, where, create, update = create) {
  return prisma[model].upsert({ where, create, update });
}

async function main() {
  const permissionRows = await prisma.permisions.findMany({ select: { id: true, code: true } });
  const provinces = await prisma.province.findMany({ select: { id: true, code: true, nom: true } });
  if (provinces.length < 26 || permissionRows.length === 0) {
    throw new Error('Run "npm run db:seed" before "npm run db:seed:rtnc-demo".');
  }

  const permByCode = new Map(permissionRows.map((p) => [p.code, p.id]));
  const provByCode = new Map(provinces.map((p) => [p.code, p]));

  const roleMap = {};
  for (const def of roleDefs) {
    const role = await upsertUnique("role", { nom: def.nom }, { code: def.code, key: def.code, nom: def.nom, description: def.nom, actif: true }, { code: def.code, key: def.code, description: def.nom, actif: true });
    roleMap[def.code] = role;
    const codes = def.perms === "*" ? [...permByCode.keys()] : def.perms.filter((c) => permByCode.has(c));
    await prisma.reglePorteeRole.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (codes.length) {
      await prisma.rolePermission.createMany({ data: codes.map((code) => ({ roleId: role.id, permissionId: permByCode.get(code) })), skipDuplicates: true });
      await prisma.reglePorteeRole.createMany({ data: codes.map((code) => ({ roleId: role.id, permissionId: permByCode.get(code), portee: def.overrides?.[code] || def.scope })), skipDuplicates: true });
    }
  }

  const typeMap = {};
  async function ensureStationType(code, nom, provinceCode, ordre) {
    const province = provByCode.get(provinceCode);
    if (!province) throw new Error(`Province missing for station ${code}`);
    const type = await upsertUnique(
      "typeUniteOrganisationnelle",
      { code },
      { nom, code, description: nom, parentId: null, ordre, actif: true, systeme: false },
      { nom, description: nom, ordre, actif: true },
    );
    typeMap[code] = type;
    const existingLink = await prisma.typeOrgaUniteProvince.findFirst({
      where: { typeUniteId: type.id, provinceId: province.id, uniteOrganisationnelleId: null },
    });
    if (!existingLink) {
      await prisma.typeOrgaUniteProvince.create({
        data: { typeUniteId: type.id, provinceId: province.id, uniteOrganisationnelleId: null, actif: true },
      });
    } else if (!existingLink.actif) {
      await prisma.typeOrgaUniteProvince.update({ where: { id: existingLink.id }, data: { actif: true } });
    }
    return type;
  }

  for (const station of stationTypes) {
    await ensureStationType(station.code, station.nom, station.provinceCode, station.ordre);
  }

  let ordreBase = 10;
  for (const province of provinces) {
    if (province.code === "KIN") continue;
    const code = `RTNC_ST_${province.code}`;
    const nom = provinceStationNames[slugLower(province.nom)] || `Station provinciale RTNC ${province.nom}`;
    await ensureStationType(code, nom, province.code, ordreBase++);
  }

  const unitMap = {};
  async function ensureDirectionUnit(code, nom) {
    unitMap[code] = await upsertUnique(
      "uniteOrganisationnelle",
      { code },
      { code, nom, description: nom, parentId: null, niveau: 0, chemin: `/${code}`, actif: true },
      { nom, description: nom, actif: true },
    );
    return unitMap[code];
  }

  for (const direction of centralDirectionDefs) {
    await ensureDirectionUnit(direction.code, direction.nom);
  }
  await ensureDirectionUnit("RTNC-2-PROG", "Direction des Programmes");
  await ensureDirectionUnit("RTNC-2-TECH", "Direction Technique");
  await ensureDirectionUnit("RTNC-MIT-TECH", "Direction Technique");
  await ensureDirectionUnit("RTNC-MIT-COM", "Direction Commerciale");

  for (const province of provinces) {
    if (province.code === "KIN") continue;
    const prefix = `RTNC-${province.code}`;
    for (const item of provinceDirectionNames) {
      const nom = item.suffix === "DP" ? `${item.nom} ${province.nom}` : item.nom;
      await ensureDirectionUnit(`${prefix}-${item.suffix}`, nom);
    }
  }

  const stationLinks = [];
  function addStationLink(stationCode, provinceCode, unitCode) {
    stationLinks.push({ stationCode, provinceCode, unitCode });
  }

  for (const direction of centralDirectionDefs) addStationLink("RTNC_LINGWALA", "KIN", direction.code);
  addStationLink("RTNC_2", "KIN", "RTNC-2-PROG");
  addStationLink("RTNC_2", "KIN", "RTNC-2-TECH");
  addStationLink("RTNC_MITENDI", "KIN", "RTNC-MIT-TECH");
  addStationLink("RTNC_MITENDI", "KIN", "RTNC-MIT-COM");
  for (const province of provinces) {
    if (province.code === "KIN") continue;
    const stationCode = `RTNC_ST_${province.code}`;
    const prefix = `RTNC-${province.code}`;
    addStationLink(stationCode, province.code, `${prefix}-DP`);
    addStationLink(stationCode, province.code, `${prefix}-RH`);
    addStationLink(stationCode, province.code, `${prefix}-TECH`);
    addStationLink(stationCode, province.code, `${prefix}-INF`);
  }

  const stationLinkMap = {};
  for (const link of stationLinks) {
    const stationType = typeMap[link.stationCode];
    const province = provByCode.get(link.provinceCode);
    const unit = unitMap[link.unitCode];
    if (!stationType || !province || !unit) throw new Error(`Missing link data for ${link.stationCode} / ${link.unitCode}`);
    const existing = await prisma.typeOrgaUniteProvince.findFirst({
      where: {
        typeUniteId: stationType.id,
        provinceId: province.id,
        uniteOrganisationnelleId: unit.id,
      },
    });
    const record = existing
      ? await prisma.typeOrgaUniteProvince.update({ where: { id: existing.id }, data: { actif: true } })
      : await prisma.typeOrgaUniteProvince.create({
        data: {
          typeUniteId: stationType.id,
          provinceId: province.id,
          uniteOrganisationnelleId: unit.id,
          actif: true,
        },
      });
    stationLinkMap[`${link.stationCode}:${link.unitCode}:${link.provinceCode}`] = record.id;
  }

  const gradesByCode = {};
  for (const g of grades) gradesByCode[g.code] = await upsertUnique("grade", { code: g.code }, g, { libelle: g.libelle, indiceSalarial: g.indiceSalarial });

  const postesByCode = {};
  const fonctionsByCode = {};
  async function ensurePosteFonction(item) {
    const posteCode = `POSTE-${item.matricule}`.replace(/[^A-Z0-9-]/g, "");
    const fonctionCode = `FONCTION-${item.matricule}`.replace(/[^A-Z0-9-]/g, "");
    postesByCode[posteCode] = await upsertUnique(
      "poste",
      { code: posteCode },
      { code: posteCode, libelle: item.poste, description: item.poste, uniteOrganisationnelleId: unitMap[item.unit].id, actif: true },
      { libelle: item.poste, description: item.poste, uniteOrganisationnelleId: unitMap[item.unit].id, actif: true },
    );
    fonctionsByCode[fonctionCode] = await upsertUnique(
      "fonction",
      { code: fonctionCode },
      { code: fonctionCode, libelle: item.fonction, posteId: postesByCode[posteCode].id },
      { libelle: item.fonction, posteId: postesByCode[posteCode].id },
    );
  }

  for (const item of users) await ensurePosteFonction(item);

  const agentsByMat = {};
  const usersByLogin = {};
  const accountsByLogin = {};
  for (const item of users) {
    usersByLogin[item.login] = await upsertUnique("utilisateur", { login: item.login }, { login: item.login, motDePasse: await bcrypt.hash(PASSWORD, 10), actif: true }, { motDePasse: await bcrypt.hash(PASSWORD, 10), actif: true });
    agentsByMat[item.matricule] = await upsertUnique("agent", { matricule: item.matricule }, { matricule: item.matricule, nom: item.nom, prenom: item.prenom, genre: item.genre, statut: "ACTIF", dateEntree: d(item.dateEntree), actif: true }, { nom: item.nom, prenom: item.prenom, genre: item.genre, statut: "ACTIF", dateEntree: d(item.dateEntree), actif: true });
  }

  const admin = usersByLogin["dg@rtnc.cd"];
  for (const item of users) {
    const existing = await prisma.compteAgent.findUnique({ where: { agentId: agentsByMat[item.matricule].id } });
    accountsByLogin[item.login] = existing
      ? await prisma.compteAgent.update({ where: { id: existing.id }, data: { utilisateurId: usersByLogin[item.login].id, liePar: admin.id } })
      : await prisma.compteAgent.create({ data: { agentId: agentsByMat[item.matricule].id, utilisateurId: usersByLogin[item.login].id, liePar: admin.id } });
    await prisma.utilisateurRole.upsert({ where: { utilisateurId_roleId: { utilisateurId: usersByLogin[item.login].id, roleId: roleMap[item.role].id } }, update: { attribuePar: admin.id }, create: { utilisateurId: usersByLogin[item.login].id, roleId: roleMap[item.role].id, attribuePar: admin.id } });
  }

  async function ensureAffect(item) {
    const posteCode = `POSTE-${item.matricule}`.replace(/[^A-Z0-9-]/g, "");
    const fonctionCode = `FONCTION-${item.matricule}`.replace(/[^A-Z0-9-]/g, "");
    const existing = await prisma.affectation.findFirst({ where: { agentId: agentsByMat[item.matricule].id, principale: true, actif: true }, orderBy: { id: "asc" } });
    const linkId = stationLinkMap[`${item.station}:${item.unit}:${item.province}`];
    if (!linkId) throw new Error(`Missing organisation link for ${item.login}`);
    const data = {
      posteId: postesByCode[posteCode].id,
      fonctionId: fonctionsByCode[fonctionCode].id,
      gradeId: gradesByCode[item.grade].id,
      typeOrgaUniteProvinceId: linkId,
      dateDebut: d(item.dateEntree),
      dateFin: null,
      statut: "VALIDE",
      statutOrganisationnel: "ACTIVE",
      motif: "Affectation de demonstration",
      typeContrat: item.contrat,
      statutContrat: "ACTIF",
      type: "AFFECTATION",
      principale: true,
      actif: true,
    };
    if (existing) await prisma.affectation.update({ where: { id: existing.id }, data });
    else await prisma.affectation.create({ data: { agentId: agentsByMat[item.matricule].id, ...data } });
  }

  for (const item of users) await ensureAffect(item);

  const horaireMap = {};
  for (const h of horaires) {
    const found = await prisma.horaireTravail.findFirst({ where: { nomHoraire: h.nomHoraire } });
    horaireMap[h.key] = found
      ? await prisma.horaireTravail.update({ where: { id: found.id }, data: { nomHoraire: h.nomHoraire, heureDebut: t(h.heureDebut), heureFin: t(h.heureFin), creerParId: admin.id } })
      : await prisma.horaireTravail.create({ data: { nomHoraire: h.nomHoraire, heureDebut: t(h.heureDebut), heureFin: t(h.heureFin), creerParId: admin.id } });
  }

  const sched = [
    { m: "RTNC-RH-0001", h: "administratif" },
    { m: "RTNC-KIN-0001", h: "administratif" },
    { m: "RTNC-KIN-0002", h: "soiree" },
    { m: "RTNC-KIN-0003", h: "matinale" },
    { m: "RTNC-KIN-0004", h: "soiree" },
    { m: "RTNC-SK-0001", h: "administratif" },
    { m: "RTNC-SK-0002", h: "administratif" },
  ];
  for (const s of sched) {
    const found = await prisma.horaireAgent.findFirst({ where: { agentId: agentsByMat[s.m].id, dateDebut: d("2026-08-01") } });
    const data = { horaireId: horaireMap[s.h].id, dateDebut: d("2026-08-01"), dateFin: null, creerParId: admin.id, lundi: true, mardi: true, mercredi: true, jeudi: true, vendredi: true, samedi: s.h !== "administratif", dimanche: false };
    if (found) await prisma.horaireAgent.update({ where: { id: found.id }, data });
    else await prisma.horaireAgent.create({ data: { agentId: agentsByMat[s.m].id, ...data } });
  }

  for (const c of leaveTypes) {
    await upsertUnique("typeConge", { code: c.code }, { ...c, actif: true, createurId: admin.id }, { libelle: c.libelle, dureeMax: c.dureeMax, allocationConge: c.allocationConge, actif: true, createurId: admin.id });
  }

  const annual = await prisma.typeConge.findUnique({ where: { code: "RTNC-ANNUEL" } });
  const leaveFound = await prisma.demandeConge.findFirst({ where: { agentId: agentsByMat["RTNC-KIN-0003"].id, typeCongeId: annual.id, dateDebut: d("2026-08-25"), dateFin: d("2026-08-29") } });
  const leaveData = { dateDemande: d("2026-08-01T09:30:00.000Z"), dateDebut: d("2026-08-25"), dateFin: d("2026-08-29"), motif: "Conge annuel de demonstration apres couverture intensive.", statut: "VALIDE", statusAllocation: true, dateValidation: d("2026-08-02"), confirmePar: usersByLogin["dir.info.lingwala@rtnc.cd"].id, validePar: usersByLogin["drh@rtnc.cd"].id };
  if (leaveFound) await prisma.demandeConge.update({ where: { id: leaveFound.id }, data: leaveData });
  else await prisma.demandeConge.create({ data: { agentId: agentsByMat["RTNC-KIN-0003"].id, typeCongeId: annual.id, ...leaveData } });

  const pres = [
    { m: "RTNC-RH-0001", d: "2026-08-11", a: "08:03", p: "16:21", s: "PRESENCE", w: "VALIDE", c: "dg@rtnc.cd", v: "dg@rtnc.cd" },
    { m: "RTNC-KIN-0001", d: "2026-08-11", a: "08:07", p: "16:10", s: "PRESENCE", w: "VALIDE", c: "drh@rtnc.cd", v: "dg@rtnc.cd" },
    { m: "RTNC-KIN-0003", d: "2026-08-11", a: "06:14", p: "14:07", s: "RETARD", w: "CONFIRME", c: "dir.info.lingwala@rtnc.cd", v: null },
    { m: "RTNC-SK-0002", d: "2026-08-11", a: "08:12", p: "16:05", s: "PRESENCE", w: "CONFIRME", c: "dp.bukavu@rtnc.cd", v: null },
  ];
  for (const p of pres) {
    const found = await prisma.presence.findFirst({ where: { agentId: agentsByMat[p.m].id, date: d(`${p.d}T00:00:00.000Z`) } });
    const data = { heureArrivee: p.a ? d(`${p.d}T${p.a}:00.000Z`) : null, heureDepart: p.p ? d(`${p.d}T${p.p}:00.000Z`) : null, statut: p.s, statutWorkflow: p.w, confirmeParId: p.c ? usersByLogin[p.c].id : null, valideParId: p.v ? usersByLogin[p.v].id : null };
    if (found) await prisma.presence.update({ where: { id: found.id }, data });
    else await prisma.presence.create({ data: { agentId: agentsByMat[p.m].id, date: d(`${p.d}T00:00:00.000Z`), ...data } });
  }

  const payFound = await prisma.paie.findFirst({ where: { agentId: agentsByMat["RTNC-KIN-0003"].id, periode: "2026-07" } });
  const pay = payFound
    ? await prisma.paie.update({ where: { id: payFound.id }, data: { periode: "2026-07", datePaiement: d("2026-07-30T10:00:00.000Z"), salaireBase: "850.00", brut: "975.00", net: "905.00", etat: "PUBLIE" } })
    : await prisma.paie.create({ data: { agentId: agentsByMat["RTNC-KIN-0003"].id, periode: "2026-07", datePaiement: d("2026-07-30T10:00:00.000Z"), salaireBase: "850.00", brut: "975.00", net: "905.00", etat: "PUBLIE" } });
  const prime = await prisma.prime.findFirst({ where: { paieId: pay.id, type: "Prime antenne", tag: "ANTENNE" } });
  if (prime) await prisma.prime.update({ where: { id: prime.id }, data: { montant: "75.00" } });
  else await prisma.prime.create({ data: { paieId: pay.id, type: "Prime antenne", montant: "75.00", tag: "ANTENNE" } });

  const evalType = await prisma.typePlanification.findUnique({ where: { code: "EVALUATION" } });
  const planFound = await prisma.planification.findFirst({ where: { titre: "[DEMO RTNC] Revue nationale des stations et directions" } });
  const plan = planFound
    ? await prisma.planification.update({ where: { id: planFound.id }, data: { titre: "[DEMO RTNC] Revue nationale des stations et directions", description: "Revue transversale des effectifs, affectations et horaires des stations et directions de la RTNC.", typePlanificationId: evalType.id, dateDebut: d("2026-08-18T08:30:00.000Z"), dateFin: d("2026-08-18T11:30:00.000Z"), statut: "PLANIFIE", priorite: "ELEVEE", cible: "TOUTE_ORGANISATION", creeParId: usersByLogin["drh@rtnc.cd"].id, assigneParId: usersByLogin["drh@rtnc.cd"].id, valideParId: usersByLogin["dg@rtnc.cd"].id, dateValidation: d("2026-08-12T09:00:00.000Z") } })
    : await prisma.planification.create({ data: { titre: "[DEMO RTNC] Revue nationale des stations et directions", description: "Revue transversale des effectifs, affectations et horaires des stations et directions de la RTNC.", typePlanificationId: evalType.id, dateDebut: d("2026-08-18T08:30:00.000Z"), dateFin: d("2026-08-18T11:30:00.000Z"), statut: "PLANIFIE", priorite: "ELEVEE", cible: "TOUTE_ORGANISATION", creeParId: usersByLogin["drh@rtnc.cd"].id, assigneParId: usersByLogin["drh@rtnc.cd"].id, valideParId: usersByLogin["dg@rtnc.cd"].id, dateValidation: d("2026-08-12T09:00:00.000Z") } });
  await prisma.planificationParticipant.upsert({ where: { planificationId_agentId: { planificationId: plan.id, agentId: agentsByMat["RTNC-RH-0001"].id } }, update: { roleDansPlan: "BENEFICIAIRE", obligatoire: true }, create: { planificationId: plan.id, agentId: agentsByMat["RTNC-RH-0001"].id, roleDansPlan: "BENEFICIAIRE", obligatoire: true } });

  const notifFound = await prisma.notification.findFirst({ where: { titre: "[DEMO RTNC] Revue nationale RH planifiee", compteId: accountsByLogin["drh@rtnc.cd"].id } });
  if (notifFound) await prisma.notification.update({ where: { id: notifFound.id }, data: { message: "La revue nationale RH de demonstration est planifiee pour le 18 aout 2026.", type: "INFO", statut: "NON_LU", icon: "calendar", expedider: "NON", roleId: null, url: "/dashboard" } });
  else await prisma.notification.create({ data: { compteId: accountsByLogin["drh@rtnc.cd"].id, titre: "[DEMO RTNC] Revue nationale RH planifiee", message: "La revue nationale RH de demonstration est planifiee pour le 18 aout 2026.", type: "INFO", statut: "NON_LU", icon: "calendar", expedider: "NON", roleId: null, url: "/dashboard" } });

  const reportFound = await prisma.rapport.findFirst({ where: { compteId: accountsByLogin["drh@rtnc.cd"].id, type: "RAPPORT_RH", Libelle: "[DEMO RTNC] Rapport des stations et directions" } });
  if (reportFound) await prisma.rapport.update({ where: { id: reportFound.id }, data: { periodeDebut: d("2026-08-01T00:00:00.000Z"), periodeFin: d("2026-08-31T23:59:59.000Z"), fichierPath: "/demo/rtnc/rapport-stations-directions-aout-2026.pdf" } });
  else await prisma.rapport.create({ data: { compteId: accountsByLogin["drh@rtnc.cd"].id, type: "RAPPORT_RH", Libelle: "[DEMO RTNC] Rapport des stations et directions", periodeDebut: d("2026-08-01T00:00:00.000Z"), periodeFin: d("2026-08-31T23:59:59.000Z"), fichierPath: "/demo/rtnc/rapport-stations-directions-aout-2026.pdf" } });

  console.log(JSON.stringify({ status: "ok", password: PASSWORD, accounts: users.map((u) => u.login), provinces: provinces.length, note: "RTNC demo seed added on top of base seeds only." }, null, 2));
}

main().catch((error) => {
  console.error("seed-rtnc-demo failed:", error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
