const bcrypt = require("bcryptjs");
const { PrismaClient, PorteeDonnees } = require("../src/generated/prisma");

const prisma = new PrismaClient();
const PASSWORD = process.env.RTNC_DEMO_PASSWORD || "DemoRTNC2026!";
const HQ = "KIN";

const roleDefs = [
  { code: "rtnc_admin_central", nom: "RTNC Admin central", perms: "*", scope: PorteeDonnees.TOUTE_ORGANISATION },
  { code: "rtnc_rh_central", nom: "RTNC RH central", perms: ["agent.read","agent.create","agent.update","user.read","user.create","user.update","province.read","type_unite_organisationnelle.read","unite_organisationnelle.read","poste.read","fonction.read","grade.read","affectation.read","affectation.assign","affectation.update","presence.read","presence.sign","presence.confirm","presence.validate","demande_conge.read","demande_conge.request","demande_conge.confirm","demande_conge.validate","type_conge.read","type_conge.create","horaire_travail.read","horaire_travail.create","horaire_travail.update","horaire_agent.read","horaire_agent.assign","horaire_agent.update","paie.read","paie.create","paie.update","paie.publish","notification.read","notification.create","rapport.read","rapport.create","planification.read","planification.create","planification.update","planification.validate"], scope: PorteeDonnees.TOUTE_ORGANISATION },
  { code: "rtnc_directeur_provincial", nom: "RTNC Directeur provincial", perms: ["province.read","agent.read","presence.read","presence.confirm","presence.validate","demande_conge.read","demande_conge.confirm","demande_conge.validate","type_conge.read","affectation.read","horaire_travail.read","horaire_agent.read","planification.read","planification.create","notification.read","rapport.read"], scope: PorteeDonnees.PROVINCE, overrides: {"notification.read":PorteeDonnees.SOI_MEME,"rapport.read":PorteeDonnees.SOI_MEME} },
  { code: "rtnc_rh_provincial", nom: "RTNC RH provincial", perms: ["province.read","agent.read","agent.update","user.read","presence.read","presence.sign","presence.confirm","presence.validate","presence.update","demande_conge.read","demande_conge.request","demande_conge.confirm","demande_conge.validate","type_conge.read","horaire_travail.read","horaire_agent.read","horaire_agent.assign","affectation.read","planification.read","planification.create","notification.read","rapport.read"], scope: PorteeDonnees.PROVINCE, overrides: {"presence.sign":PorteeDonnees.SOI_MEME,"demande_conge.request":PorteeDonnees.SOI_MEME,"notification.read":PorteeDonnees.SOI_MEME,"rapport.read":PorteeDonnees.SOI_MEME} },
  { code: "rtnc_chef_station", nom: "RTNC Chef de station", perms: ["province.read","agent.read","presence.read","presence.sign","presence.confirm","demande_conge.read","demande_conge.request","demande_conge.confirm","type_conge.read","affectation.read","horaire_travail.read","horaire_agent.read","horaire_agent.assign","planification.read","notification.read","rapport.read"], scope: PorteeDonnees.UNITE_ET_DESCENDANTS, overrides: {"presence.sign":PorteeDonnees.SOI_MEME,"demande_conge.request":PorteeDonnees.SOI_MEME,"notification.read":PorteeDonnees.SOI_MEME,"rapport.read":PorteeDonnees.SOI_MEME} },
  { code: "rtnc_agent", nom: "RTNC Agent", perms: ["presence.sign","presence.read","demande_conge.request","demande_conge.read","type_conge.read","paie.read","notification.read","rapport.read"], scope: PorteeDonnees.SOI_MEME },
];

const users = [
  { login: "admin.rtnc.demo", role: "rtnc_admin_central", matricule: "RTNC-ADM-0001", nom: "Kabila", prenom: "Demo", genre: "MASCULIN", dateEntree: "2021-01-12", province: "KIN", unit: "RTNC-CENT-ADM", type: "SRV_RTNC", poste: "Administrateur demo", fonction: "Administration demo", grade: "RTNC-GR-A2", contrat: "CDI" },
  { login: "rh.central.rtnc.demo", role: "rtnc_rh_central", matricule: "RTNC-RH-0001", nom: "Banza", prenom: "Mireille", genre: "FEMININ", dateEntree: "2020-04-20", province: "KIN", unit: "RTNC-CENT-RH", type: "SRV_RTNC", poste: "Gestionnaire RH central", fonction: "Pilotage RH central", grade: "RTNC-GR-A1", contrat: "CDI" },
  { login: "dir.kin.rtnc.demo", role: "rtnc_directeur_provincial", matricule: "RTNC-KIN-0001", nom: "Mbemba", prenom: "Jean", genre: "MASCULIN", dateEntree: "2018-06-01", province: "KIN", unit: "RTNC-DP-KIN", type: "DP_RTNC", poste: "Directeur provincial Kinshasa", fonction: "Direction provinciale", grade: "RTNC-GR-A1", contrat: "CDI" },
  { login: "rh.kin.rtnc.demo", role: "rtnc_rh_provincial", matricule: "RTNC-KIN-0002", nom: "Nsimba", prenom: "Aline", genre: "FEMININ", dateEntree: "2019-09-14", province: "KIN", unit: "RTNC-KIN-SRV-RH", type: "SRV_RTNC", poste: "Responsable RH provincial Kinshasa", fonction: "Gestion RH provinciale", grade: "RTNC-GR-A2", contrat: "CDI" },
  { login: "chef.kin.rtnc.demo", role: "rtnc_chef_station", matricule: "RTNC-KIN-0003", nom: "Lutula", prenom: "Patrick", genre: "MASCULIN", dateEntree: "2017-02-08", province: "KIN", unit: "RTNC-SP-KIN", type: "SP_RTNC", poste: "Chef de station Kinshasa", fonction: "Supervision de station", grade: "RTNC-GR-A2", contrat: "CDI" },
  { login: "agent.jt.kin.rtnc.demo", role: "rtnc_agent", matricule: "RTNC-KIN-0004", nom: "Mbuyi", prenom: "Grace", genre: "FEMININ", dateEntree: "2022-11-05", province: "KIN", unit: "RTNC-SP-KIN", type: "SP_RTNC", poste: "Journaliste presentatrice", fonction: "Presentation / reportage", grade: "RTNC-GR-B1", contrat: "CDD" },
  { login: "agent.tech.kin.rtnc.demo", role: "rtnc_agent", matricule: "RTNC-KIN-0005", nom: "Kanku", prenom: "Didier", genre: "MASCULIN", dateEntree: "2021-07-18", province: "KIN", unit: "RTNC-KIN-SRV-TECH", type: "SRV_RTNC", poste: "Technicien diffusion", fonction: "Technique diffusion", grade: "RTNC-GR-B1", contrat: "CDI" }
];

const execAgents = [
  { matricule: "RTNC-EXEC-0001", nom: "Elenge Nyembo", prenom: "Sylvie", genre: "FEMININ", dateEntree: "2022-08-22", province: "KIN", unit: "RTNC-DG-001", type: "DG_RTNC", poste: "Directrice generale", fonction: "Direction generale", grade: "RTNC-GR-A1", contrat: "CDI", typeAffectation: "NOMINATION", motif: "Direction generale RTNC (source publique)." },
  { matricule: "RTNC-EXEC-0002", nom: "Voto Tongba", prenom: "Jose-Adolphe", genre: "MASCULIN", dateEntree: "2022-08-22", province: "KIN", unit: "RTNC-DG-001", type: "DG_RTNC", poste: "Directeur general adjoint", fonction: "Direction generale adjointe", grade: "RTNC-GR-A1", contrat: "CDI", typeAffectation: "NOMINATION", motif: "Direction generale adjointe RTNC (source publique)." }
];

const grades = [
  { code: "RTNC-GR-A1", libelle: "Cadre A1", indiceSalarial: 950 },
  { code: "RTNC-GR-A2", libelle: "Cadre A2", indiceSalarial: 780 },
  { code: "RTNC-GR-B1", libelle: "Agent B1", indiceSalarial: 520 }
];

const typeUnits = [
  { code: "DG_RTNC", nom: "Direction generale", parent: null, ordre: 1 },
  { code: "DP_RTNC", nom: "Direction provinciale", parent: "DG_RTNC", ordre: 2 },
  { code: "SP_RTNC", nom: "Station provinciale", parent: "DP_RTNC", ordre: 3 },
  { code: "SRV_RTNC", nom: "Service", parent: null, ordre: 4 }
];

const centralServices = [
  { code: "RTNC-CENT-ADM", nom: "Administration centrale" },
  { code: "RTNC-CENT-RH", nom: "Gestion RH centrale" },
  { code: "RTNC-CENT-TECH", nom: "Technique diffusion" },
  { code: "RTNC-CENT-INF", nom: "Information et redaction" }
];

const provincialExtras = {
  KIN: [
    { code: "RTNC-KIN-SRV-RH", nom: "Service RH Kinshasa" },
    { code: "RTNC-KIN-SRV-TECH", nom: "Service technique Kinshasa" }
  ]
};

const leaveTypes = [
  { code: "RTNC-ANNUEL", libelle: "Conge annuel", dureeMax: 30, allocationConge: 1 },
  { code: "RTNC-MISSION", libelle: "Conge mission / couverture", dureeMax: 10, allocationConge: 1 }
];

const horaires = [
  { key: "administratif", nomHoraire: "RTNC Administratif jour", heureDebut: "08:00", heureFin: "16:00" },
  { key: "matinale", nomHoraire: "RTNC Matinale antenne", heureDebut: "06:00", heureFin: "14:00" },
  { key: "soiree", nomHoraire: "RTNC Soiree technique", heureDebut: "14:00", heureFin: "22:00" }
];

function d(v){ return v instanceof Date ? v : new Date(v); }
function t(v){ return new Date(`1970-01-01T${v}:00.000Z`); }
async function upsertUnique(model, where, create, update=create){ return prisma[model].upsert({ where, create, update }); }
async function main(){
  const provinceCount = await prisma.province.count();
  const permissionRows = await prisma.permisions.findMany({ select:{id:true,code:true} });
  if (provinceCount < 26 || permissionRows.length === 0) throw new Error('Run "npm run db:seed" before "npm run db:seed:rtnc-demo".');
  const permByCode = new Map(permissionRows.map(p=>[p.code,p.id]));
  const provinces = await prisma.province.findMany({ select:{id:true,code:true,nom:true} });
  const provByCode = new Map(provinces.map(p=>[p.code,p]));
  const hq = provByCode.get(HQ); if (!hq) throw new Error('Kinshasa province missing.');

  const roleMap = {};
  for (const def of roleDefs){
    const role = await upsertUnique('role',{ nom:def.nom },{ code:def.code, key:def.code, nom:def.nom, description:def.nom, actif:true },{ code:def.code, key:def.code, description:def.nom, actif:true });
    roleMap[def.code]=role;
    const codes = def.perms === '*' ? [...permByCode.keys()] : def.perms.filter(c=>permByCode.has(c));
    await prisma.reglePorteeRole.deleteMany({ where:{ roleId: role.id } });
    await prisma.rolePermission.deleteMany({ where:{ roleId: role.id } });
    if (codes.length){
      await prisma.rolePermission.createMany({ data: codes.map(code=>({ roleId: role.id, permissionId: permByCode.get(code) })), skipDuplicates:true });
      await prisma.reglePorteeRole.createMany({ data: codes.map(code=>({ roleId: role.id, permissionId: permByCode.get(code), portee: def.overrides?.[code] || def.scope })), skipDuplicates:true });
    }
  }

  const typeMap = {};
  for (const def of typeUnits){
    const parentId = def.parent ? typeMap[def.parent]?.id ?? null : null;
    typeMap[def.code] = await upsertUnique('typeUniteOrganisationnelle',{ code:def.code },{ nom:def.nom, code:def.code, description:def.nom, parentId, ordre:def.ordre, actif:true, systeme:false },{ nom:def.nom, description:def.nom, parentId, ordre:def.ordre, actif:true });
  }

  async function ensureUnit(code, nom, parentId=null){
    const parent = parentId ? await prisma.uniteOrganisationnelle.findUnique({ where:{ id:parentId }, select:{ chemin:true, niveau:true } }) : null;
    const niveau = parent ? (parent.niveau ?? 0) + 1 : 0;
    const chemin = parent?.chemin ? `${parent.chemin}/${code}` : `/${code}`;
    return upsertUnique('uniteOrganisationnelle',{ code },{ code, nom, description:nom, parentId, niveau, chemin, actif:true },{ nom, description:nom, parentId, niveau, chemin, actif:true });
  }
  async function ensureLink(typeCode, unit, province){
    const found = await prisma.typeOrgaUniteProvince.findFirst({ where:{ typeUniteId:typeMap[typeCode].id, uniteOrganisationnelleId:unit.id, provinceId:province.id } });
    return found ? prisma.typeOrgaUniteProvince.update({ where:{ id:found.id }, data:{ actif:true }}) : prisma.typeOrgaUniteProvince.create({ data:{ typeUniteId:typeMap[typeCode].id, uniteOrganisationnelleId:unit.id, provinceId:province.id, actif:true }});
  }
  const unitMap = {};
  unitMap['RTNC-DG-001'] = await ensureUnit('RTNC-DG-001','Direction generale RTNC');
  await ensureLink('DG_RTNC',unitMap['RTNC-DG-001'],hq);
  for (const s of centralServices){ unitMap[s.code]=await ensureUnit(s.code,s.nom,unitMap['RTNC-DG-001'].id); await ensureLink('SRV_RTNC',unitMap[s.code],hq); }
  for (const p of provinces){
    const dp=`RTNC-DP-${p.code}`, sp=`RTNC-SP-${p.code}`;
    unitMap[dp]=await ensureUnit(dp,`Direction provinciale RTNC ${p.nom}`,unitMap['RTNC-DG-001'].id); await ensureLink('DP_RTNC',unitMap[dp],p);
    unitMap[sp]=await ensureUnit(sp,`Station provinciale RTNC ${p.nom}`,unitMap[dp].id); await ensureLink('SP_RTNC',unitMap[sp],p);
    for (const extra of (provincialExtras[p.code]||[])){ unitMap[extra.code]=await ensureUnit(extra.code,extra.nom,unitMap[sp].id); await ensureLink('SRV_RTNC',unitMap[extra.code],p); }
  }
  const gradesByCode = {};
  for (const g of grades){ gradesByCode[g.code]=await upsertUnique('grade',{ code:g.code },g,{ libelle:g.libelle, indiceSalarial:g.indiceSalarial }); }
  const postesByCode = {}, fonctionsByCode = {};
  async function ensurePosteFonction(item){
    const posteCode = `POSTE-${item.matricule}`.replace(/[^A-Z0-9-]/g,'');
    const fonctionCode = `FONCTION-${item.matricule}`.replace(/[^A-Z0-9-]/g,'');
    postesByCode[posteCode] = await upsertUnique('poste',{ code:posteCode },{ code:posteCode, libelle:item.poste, description:item.poste, uniteOrganisationnelleId:unitMap[item.unit].id, actif:true },{ libelle:item.poste, description:item.poste, uniteOrganisationnelleId:unitMap[item.unit].id, actif:true });
    fonctionsByCode[fonctionCode] = await upsertUnique('fonction',{ code:fonctionCode },{ code:fonctionCode, libelle:item.fonction, posteId:postesByCode[posteCode].id },{ libelle:item.fonction, posteId:postesByCode[posteCode].id });
    return { poste: postesByCode[posteCode], fonction: fonctionsByCode[fonctionCode] };
  }

  const agentsByMat = {}, usersByLogin = {}, accountsByLogin = {};
  for (const item of [...execAgents, ...users]){ await ensurePosteFonction(item); }
  for (const item of execAgents){ agentsByMat[item.matricule] = await upsertUnique('agent',{ matricule:item.matricule },{ matricule:item.matricule, nom:item.nom, prenom:item.prenom, genre:item.genre, statut:'ACTIF', dateEntree:d(item.dateEntree), actif:true },{ nom:item.nom, prenom:item.prenom, genre:item.genre, statut:'ACTIF', dateEntree:d(item.dateEntree), actif:true }); }
  for (const item of users){
    usersByLogin[item.login] = await upsertUnique('utilisateur',{ login:item.login },{ login:item.login, motDePasse:await bcrypt.hash(PASSWORD,10), actif:true },{ motDePasse:await bcrypt.hash(PASSWORD,10), actif:true });
    agentsByMat[item.matricule] = await upsertUnique('agent',{ matricule:item.matricule },{ matricule:item.matricule, nom:item.nom, prenom:item.prenom, genre:item.genre, statut:'ACTIF', dateEntree:d(item.dateEntree), actif:true },{ nom:item.nom, prenom:item.prenom, genre:item.genre, statut:'ACTIF', dateEntree:d(item.dateEntree), actif:true });
  }
  const admin = usersByLogin['admin.rtnc.demo'];
  for (const item of users){
    const existing = await prisma.compteAgent.findUnique({ where:{ agentId: agentsByMat[item.matricule].id } });
    accountsByLogin[item.login] = existing ? await prisma.compteAgent.update({ where:{ id:existing.id }, data:{ utilisateurId:usersByLogin[item.login].id, liePar:admin.id }}) : await prisma.compteAgent.create({ data:{ agentId:agentsByMat[item.matricule].id, utilisateurId:usersByLogin[item.login].id, liePar:admin.id }});
    await prisma.utilisateurRole.upsert({ where:{ utilisateurId_roleId:{ utilisateurId:usersByLogin[item.login].id, roleId:roleMap[item.role].id } }, update:{ attribuePar:admin.id }, create:{ utilisateurId:usersByLogin[item.login].id, roleId:roleMap[item.role].id, attribuePar:admin.id } });
  }

  const links = await prisma.typeOrgaUniteProvince.findMany({ select:{ id:true, typeUniteId:true, uniteOrganisationnelleId:true, provinceId:true } });
  const linkId = (typeCode, unitCode, provCode) => links.find(l => l.typeUniteId===typeMap[typeCode].id && l.uniteOrganisationnelleId===unitMap[unitCode].id && l.provinceId===provByCode.get(provCode).id)?.id;
  async function ensureAffect(item, kind='AFFECTATION', motif='Affectation de demonstration'){
    const posteCode = `POSTE-${item.matricule}`.replace(/[^A-Z0-9-]/g,''); const fonctionCode = `FONCTION-${item.matricule}`.replace(/[^A-Z0-9-]/g,'');
    const existing = await prisma.affectation.findFirst({ where:{ agentId:agentsByMat[item.matricule].id, principale:true, actif:true }, orderBy:{ id:'asc' } });
    const data = { posteId:postesByCode[posteCode].id, fonctionId:fonctionsByCode[fonctionCode].id, gradeId:gradesByCode[item.grade].id, typeOrgaUniteProvinceId:linkId(item.type,item.unit,item.province), dateDebut:d(item.dateEntree), dateFin:null, statut:'VALIDE', statutOrganisationnel:'ACTIVE', motif, typeContrat:item.contrat, statutContrat:'ACTIF', type:kind, principale:true, actif:true };
    if (existing) await prisma.affectation.update({ where:{ id:existing.id }, data }); else await prisma.affectation.create({ data:{ agentId:agentsByMat[item.matricule].id, ...data } });
  }
  for (const item of execAgents){ await ensureAffect(item,item.typeAffectation,item.motif); }
  for (const item of users){ await ensureAffect(item); }

  const horaireMap = {};
  for (const h of horaires){ const found=await prisma.horaireTravail.findFirst({ where:{ nomHoraire:h.nomHoraire } }); horaireMap[h.key]= found ? await prisma.horaireTravail.update({ where:{ id:found.id }, data:{ nomHoraire:h.nomHoraire, heureDebut:t(h.heureDebut), heureFin:t(h.heureFin), creerParId:admin.id }}) : await prisma.horaireTravail.create({ data:{ nomHoraire:h.nomHoraire, heureDebut:t(h.heureDebut), heureFin:t(h.heureFin), creerParId:admin.id }}); }
  const sched = [{m:'RTNC-RH-0001',h:'administratif'},{m:'RTNC-KIN-0002',h:'administratif'},{m:'RTNC-KIN-0003',h:'matinale'},{m:'RTNC-KIN-0004',h:'matinale'},{m:'RTNC-KIN-0005',h:'soiree'}];
  for (const s of sched){ const found=await prisma.horaireAgent.findFirst({ where:{ agentId:agentsByMat[s.m].id, dateDebut:d('2026-08-01') } }); const data={ horaireId:horaireMap[s.h].id, dateDebut:d('2026-08-01'), dateFin:null, creerParId:admin.id, lundi:true, mardi:true, mercredi:true, jeudi:true, vendredi:true, samedi:s.h!=='administratif', dimanche:false }; if(found) await prisma.horaireAgent.update({ where:{ id:found.id }, data }); else await prisma.horaireAgent.create({ data:{ agentId:agentsByMat[s.m].id, ...data } }); }

  for (const c of leaveTypes){ await upsertUnique('typeConge',{ code:c.code },{ ...c, actif:true, createurId:admin.id },{ libelle:c.libelle, dureeMax:c.dureeMax, allocationConge:c.allocationConge, actif:true, createurId:admin.id }); }
  const annual = await prisma.typeConge.findUnique({ where:{ code:'RTNC-ANNUEL' } });
  const leaveFound = await prisma.demandeConge.findFirst({ where:{ agentId:agentsByMat['RTNC-KIN-0004'].id, typeCongeId:annual.id, dateDebut:d('2026-08-25'), dateFin:d('2026-08-29') } });
  const leaveData = { dateDemande:d('2026-08-01T09:30:00.000Z'), dateDebut:d('2026-08-25'), dateFin:d('2026-08-29'), motif:'Repos annuel apres serie de couvertures speciales.', statut:'VALIDE', statusAllocation:true, dateValidation:d('2026-08-02'), confirmePar:usersByLogin['chef.kin.rtnc.demo'].id, validePar:usersByLogin['rh.kin.rtnc.demo'].id };
  if (leaveFound) await prisma.demandeConge.update({ where:{ id:leaveFound.id }, data:leaveData }); else await prisma.demandeConge.create({ data:{ agentId:agentsByMat['RTNC-KIN-0004'].id, typeCongeId:annual.id, ...leaveData } });

  const pres = [
    { m:'RTNC-RH-0001', d:'2026-08-11', a:'08:03', p:'16:21', s:'PRESENCE', w:'VALIDE', c:'admin.rtnc.demo', v:'admin.rtnc.demo' },
    { m:'RTNC-KIN-0003', d:'2026-08-11', a:'06:01', p:'14:12', s:'PRESENCE', w:'VALIDE', c:'rh.kin.rtnc.demo', v:'rh.kin.rtnc.demo' },
    { m:'RTNC-KIN-0004', d:'2026-08-11', a:'06:14', p:'14:07', s:'RETARD', w:'CONFIRME', c:'chef.kin.rtnc.demo', v:null }
  ];
  for (const p of pres){ const found=await prisma.presence.findFirst({ where:{ agentId:agentsByMat[p.m].id, date:d(`${p.d}T00:00:00.000Z`) } }); const data={ heureArrivee:p.a?d(`${p.d}T${p.a}:00.000Z`):null, heureDepart:p.p?d(`${p.d}T${p.p}:00.000Z`):null, statut:p.s, statutWorkflow:p.w, confirmeParId:p.c?usersByLogin[p.c].id:null, valideParId:p.v?usersByLogin[p.v].id:null }; if(found) await prisma.presence.update({ where:{ id:found.id }, data }); else await prisma.presence.create({ data:{ agentId:agentsByMat[p.m].id, date:d(`${p.d}T00:00:00.000Z`), ...data } }); }

  const payFound = await prisma.paie.findFirst({ where:{ agentId:agentsByMat['RTNC-KIN-0004'].id, periode:'2026-07' } });
  const pay = payFound ? await prisma.paie.update({ where:{ id:payFound.id }, data:{ periode:'2026-07', datePaiement:d('2026-07-30T10:00:00.000Z'), salaireBase:'850.00', brut:'975.00', net:'905.00', etat:'PUBLIE' }}) : await prisma.paie.create({ data:{ agentId:agentsByMat['RTNC-KIN-0004'].id, periode:'2026-07', datePaiement:d('2026-07-30T10:00:00.000Z'), salaireBase:'850.00', brut:'975.00', net:'905.00', etat:'PUBLIE' }});
  const prime = await prisma.prime.findFirst({ where:{ paieId:pay.id, type:'Prime antenne', tag:'ANTENNE' } }); if (prime) await prisma.prime.update({ where:{ id:prime.id }, data:{ montant:'75.00' } }); else await prisma.prime.create({ data:{ paieId:pay.id, type:'Prime antenne', montant:'75.00', tag:'ANTENNE' } });

  const evalType = await prisma.typePlanification.findUnique({ where:{ code:'EVALUATION' } });
  const planFound = await prisma.planification.findFirst({ where:{ titre:'[DEMO RTNC] Revue RH nationale de la rentree antenne' } });
  const plan = planFound ? await prisma.planification.update({ where:{ id:planFound.id }, data:{ titre:'[DEMO RTNC] Revue RH nationale de la rentree antenne', description:'Revue transversale des effectifs et horaires avant la reprise complete des grilles.', typePlanificationId:evalType.id, dateDebut:d('2026-08-18T08:30:00.000Z'), dateFin:d('2026-08-18T11:30:00.000Z'), statut:'PLANIFIE', priorite:'ELEVEE', cible:'TOUTE_ORGANISATION', creeParId:usersByLogin['rh.central.rtnc.demo'].id, assigneParId:usersByLogin['rh.central.rtnc.demo'].id, valideParId:usersByLogin['rh.central.rtnc.demo'].id, dateValidation:d('2026-08-12T09:00:00.000Z') }}) : await prisma.planification.create({ data:{ titre:'[DEMO RTNC] Revue RH nationale de la rentree antenne', description:'Revue transversale des effectifs et horaires avant la reprise complete des grilles.', typePlanificationId:evalType.id, dateDebut:d('2026-08-18T08:30:00.000Z'), dateFin:d('2026-08-18T11:30:00.000Z'), statut:'PLANIFIE', priorite:'ELEVEE', cible:'TOUTE_ORGANISATION', creeParId:usersByLogin['rh.central.rtnc.demo'].id, assigneParId:usersByLogin['rh.central.rtnc.demo'].id, valideParId:usersByLogin['rh.central.rtnc.demo'].id, dateValidation:d('2026-08-12T09:00:00.000Z') }});
  await prisma.planificationParticipant.upsert({ where:{ planificationId_agentId:{ planificationId:plan.id, agentId:agentsByMat['RTNC-RH-0001'].id } }, update:{ roleDansPlan:'BENEFICIAIRE', obligatoire:true }, create:{ planificationId:plan.id, agentId:agentsByMat['RTNC-RH-0001'].id, roleDansPlan:'BENEFICIAIRE', obligatoire:true } });

  const notifFound = await prisma.notification.findFirst({ where:{ titre:'[DEMO RTNC] Revue nationale RH planifiee', compteId:accountsByLogin['rh.central.rtnc.demo'].id } });
  if (notifFound) await prisma.notification.update({ where:{ id:notifFound.id }, data:{ message:'La revue RH nationale de demonstration est planifiee pour le 18 aout 2026.', type:'INFO', statut:'NON_LU', icon:'calendar', expedider:'NON', roleId:null, url:'/dashboard' } }); else await prisma.notification.create({ data:{ compteId:accountsByLogin['rh.central.rtnc.demo'].id, titre:'[DEMO RTNC] Revue nationale RH planifiee', message:'La revue RH nationale de demonstration est planifiee pour le 18 aout 2026.', type:'INFO', statut:'NON_LU', icon:'calendar', expedider:'NON', roleId:null, url:'/dashboard' } });
  const reportFound = await prisma.rapport.findFirst({ where:{ compteId:accountsByLogin['rh.central.rtnc.demo'].id, type:'RAPPORT_RH', Libelle:'[DEMO RTNC] Rapport effectifs nationaux' } });
  if (reportFound) await prisma.rapport.update({ where:{ id:reportFound.id }, data:{ periodeDebut:d('2026-08-01T00:00:00.000Z'), periodeFin:d('2026-08-31T23:59:59.000Z'), fichierPath:'/demo/rtnc/rapport-effectifs-aout-2026.pdf' } }); else await prisma.rapport.create({ data:{ compteId:accountsByLogin['rh.central.rtnc.demo'].id, type:'RAPPORT_RH', Libelle:'[DEMO RTNC] Rapport effectifs nationaux', periodeDebut:d('2026-08-01T00:00:00.000Z'), periodeFin:d('2026-08-31T23:59:59.000Z'), fichierPath:'/demo/rtnc/rapport-effectifs-aout-2026.pdf' } });

  console.log(JSON.stringify({ status:'ok', password:PASSWORD, accounts:users.map(u=>u.login), provinces:provinces.length, note:'RTNC demo seed added on top of base seeds only.' }, null, 2));
}

main().catch((error)=>{ console.error('seed-rtnc-demo failed:', error); process.exit(1); }).finally(async()=>{ await prisma.$disconnect(); });
