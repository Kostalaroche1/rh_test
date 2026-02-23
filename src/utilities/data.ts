import { TasksByType } from "./type"

export const AgentsData = [
  {
    "id": 1,
    "login": "admin@gmail.com",
    "actif": true,
    "roles": [],
    "compteAgent": null
  },
  {
    "id": 2,
    "login": "admin1@gmail.com",
    "actif": true,
    "roles": [],
    "compteAgent": null
  },
  {
    "id": 7,
    "login": "admin2@gmail.com",
    "actif": true,
    "roles": [
      {
        "id": 1,
        "utilisateurId": 7,
        "roleId": 3,
        "dateAttribution": "2026-02-02T15:03:49.032Z",
        "attribuePar": 1
      }
    ],
    "compteAgent": null
  },
  {
    "id": 9,
    "login": "admin3@gmail.com",
    "actif": true,
    "roles": [
      {
        "id": 2,
        "utilisateurId": 9,
        "roleId": 3,
        "dateAttribution": "2026-02-02T15:12:19.024Z",
        "attribuePar": 1
      }
    ],
    "compteAgent": {
      "agent": {
        "id": 11,
        "matricule": "AGT00124",
        "nom": "Dupont1",
        "prenom": "Alice2",
        "statut": "Actif",
        "dateEntree": "2022-01-01T00:00:00.000Z",
        "actif": true
      },
      "agentId": 11,
      "liePar": 1,
      "utilisateurId": 9,
      "id": 1,
      "dateLiaison": "2026-02-02T15:12:19.039Z"
    }
  },
  {
    "id": 19,
    "login": "kosta@gmail.com",
    "actif": true,
    "roles": [],
    "compteAgent": null
  },
  {
    "id": 23,
    "login": "eree@gmail.com",
    "actif": true,
    "roles": [
      {
        "id": 3,
        "utilisateurId": 23,
        "roleId": 3,
        "dateAttribution": "2026-02-03T01:00:24.101Z",
        "attribuePar": 23
      }
    ],
    "compteAgent": {
      "agent": {
        "id": 15,
        "matricule": "AG-7042-S",
        "nom": "sqsqq",
        "prenom": "qsq",
        "statut": "Divorcé",
        "dateEntree": "2026-02-03T01:00:24.087Z",
        "actif": false
      },
      "agentId": 15,
      "liePar": 23,
      "utilisateurId": 23,
      "id": 2,
      "dateLiaison": "2026-02-03T01:00:24.138Z"
    }
  },
  {
    "id": 24,
    "login": "blanchard@gmail.com",
    "actif": true,
    "roles": [
      {
        "id": 4,
        "utilisateurId": 24,
        "roleId": 3,
        "dateAttribution": "2026-02-03T01:03:57.746Z",
        "attribuePar": 24
      }
    ],
    "compteAgent": {
      "agent": {
        "id": 16,
        "matricule": "AG-1668-Q",
        "nom": "kosta ",
        "prenom": "Blanchard",
        "statut": "Célibataire",
        "dateEntree": "2026-02-03T01:03:57.724Z",
        "actif": false
      },
      "agentId": 16,
      "liePar": 24,
      "utilisateurId": 24,
      "id": 3,
      "dateLiaison": "2026-02-03T01:03:57.761Z"
    }
  },
  {
    "id": 25,
    "login": "kasta@gmail.com",
    "actif": true,
    "roles": [
      {
        "id": 5,
        "utilisateurId": 25,
        "roleId": 3,
        "dateAttribution": "2026-02-03T08:08:09.164Z",
        "attribuePar": 25
      }
    ],
    "compteAgent": {
      "agent": {
        "id": 17,
        "matricule": "AG-8998-N",
        "nom": "Kasta",
        "prenom": "Bernard",
        "statut": "Célibataire",
        "dateEntree": "2026-02-03T08:08:09.023Z",
        "actif": false
      },
      "agentId": 17,
      "liePar": 25,
      "utilisateurId": 25,
      "id": 4,
      "dateLiaison": "2026-02-03T08:08:09.174Z"
    }
  }
]

export const DataTables: TasksByType[] = [
  {
    type: "Cover page",
    tasks: [
      {
        id: 1,
        header: "Cover page",
        status: "In Process",
        target: "18",
        limit: "5",
        reviewer: "Eddie Lake"
      }
    ]
  },
  {
    type: "Table of contents",
    tasks: [
      {
        id: 2,
        header: "Table of contents",
        status: "Done",
        target: "29",
        limit: "24",
        reviewer: "Eddie Lake"
      }
    ]
  },
  {
    type: "Narrative",
    tasks: [
      {
        id: 3,
        header: "Executive summary",
        status: "Done",
        target: "10",
        limit: "13",
        reviewer: "Eddie Lake"
      }
      // … autres tâches Narrative
    ]
  }
  // … autres types
];

