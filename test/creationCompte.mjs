// seed.mjs
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  function generateMatricule() {
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4 chiffres
    const randomLetter = String.fromCharCode(
      65 + Math.floor(Math.random() * 26)
    ); // A–Z
    return `AG-${randomNumber}-${randomLetter}`;
  }
  const hashedPassword = await bcrypt.hash('cria@@123', 10)
  const EtatCivil = {
    Marie: "Marié(é)",
    Celibataire: "Celibataire",
    Divorce: "Divorcé",
  }
  const Agents = [
    {
      matricule: generateMatricule(),
      nom: 'Prof Djungu',
      prenom: 'Saint-jean',
      statut: EtatCivil.Marie,
      dateEntree: new Date('2022-01-01'),
      datenais: new Date('1970-01-01'),
      genre: "MASCULIN",
      actif: true,
      compte: {
        login: 'saintJean@gmail.com',
        motDePasse: hashedPassword,
        actif: true,
      },
    },
    {
      matricule: generateMatricule(),
      nom: 'MBIYA jonathan',
      prenom: 'Djota',
      statut: EtatCivil.Celibataire,
      dateEntree: new Date('2022-01-01'),
      datenais: new Date('1970-01-01'),
      genre: "MASCULIN",
      actif: true,
      compte: {
        login: 'jonathanmbiya@gmail.com',
        motDePasse: hashedPassword,
        actif: true,
      },
    },
    {
      matricule: generateMatricule(),
      nom: 'Grace ',
      prenom: 'Mbuyi',
      statut: EtatCivil.Marie,
      dateEntree: new Date('2022-01-01'),
      datenais: new Date('1970-01-01'),
      genre: "FEMININ",
      actif: true,
      compte: {
        login: 'gracembuyi@gmail.com',
        motDePasse: hashedPassword,
        actif: true,
      },
    },
  ]

  const Users = [
    {
      login: 'saintJean@gmail.com',
      motDePasse: hashedPassword,
      actif: true,
    },
    {
      login: 'jonathanmbiya@gmail.com',
      motDePasse: hashedPassword,
      actif: true,
    },
    {
      login: 'gracembuyi@gmail.com',
      motDePasse: hashedPassword,
      actif: true,
    },
    {
      login: 'kostablanchard@gmail.com',
      motDePasse: hashedPassword,
      actif: true,
    },
  ]
  const Role = [
    {
      key: "admin",
      nom: 'Admin Gen',
      description: "Administrateur Generale il voit tout",
      actif: true,
    },
    {
      key: "chefservice",
      nom: 'chef de service',
      description: "chef de service, il voit tout sur son service",
      actif: true,
    },
    {
      key: "rh",
      nom: 'Gestionnaire RH',
      description: "Gestionnaire RH, il s'occupe de la ressources humaines",
      actif: true,
    },
    {
      key: "ag",
      nom: 'Agent',
      description: "Agent , il fait des demandes de congé , rempli les heures d'arrive et est affecté à un service",
      actif: true,
    },
  ]
  const result = []
  try {
    const dataAll = await prisma.$transaction(async (db) => {
      const roles = await db.role.createMany({
        data: Role
      })

      for (const ag of Agents) {
        const agent = await db.agent.create({
          data: {
            matricule: ag.matricule,
            dateEntree: new Date(),
            nom: ag.nom,
            genre: ag.genre,
            datenais: ag.datenais,
            prenom: ag.prenom,
            statut: ag.statut,
            actif: ag.actif,
          },
        })

        if (!agent) {
          console.log("erreur enregistrement utilisateur")
          return;
        }


        const utilisateur = await db.utilisateur.create({
          data: {
            login: ag.compte.login,
            motDePasse: ag.compte.motDePasse,
          },
        })

        if (!utilisateur) {
          console.log("erreur Id utilisateur compte")
          return;
        }
        const roles = await db.role.findFirst({
          where: { key: "ag" }
        })

        if (!roles) {
          console.log("erreur Id roles")
          return;
        }

        const utilisateurRole = await db.utilisateurRole.create({
          data: {
            roleId: roles.id,
            utilisateurId: utilisateur.id,
            attribuePar: utilisateur.id,
          },
        })

        if (!agent) {
          console.log("erreur Id agent")
          return;
        }

        const CreationCompte = await db.compteAgent.create({
          data: {
            agentId: agent.id,
            utilisateurId: utilisateur.id,
            liePar: utilisateur.id,
          },
        })
        result.push({ identification: agent, CreationCompte: utilisateur, attributionRole: utilisateurRole, Activation: CreationCompte })
      }
      return result
    })

    console.log(dataAll, 'all data')

    if (dataAll) {
      console.log('Compte créé avec succès')
    }
    console.log('Compte non créé')
  } catch (error) {
    console.error(error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
