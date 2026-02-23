// components/FichePresencePDF.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 10.5, fontFamily: "Helvetica", color: "#111" },

  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  headerLeft: { width: "45%" },
  headerRight: { width: "55%", alignItems: "flex-end" },
  title: { fontSize: 22, fontWeight: "bold", letterSpacing: 1, color: "#777", marginTop: 10 },

  logoBox: {
    width: 78, height: 78, borderWidth: 1, borderColor: "#000",
    justifyContent: "center", alignItems: "center", marginBottom: 8
  },
  orgText: { lineHeight: 1.35 },

  infoGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  infoCol: { width: "48%" },
  row: { flexDirection: "row", alignItems: "baseline", marginBottom: 6 },
  label: { width: 92, fontWeight: "bold" },
  value: { flex: 1, borderBottomWidth: 1, borderBottomColor: "#000", height: 14, paddingLeft: 4 },

  table: { borderWidth: 1, borderColor: "#000", marginTop: 6 },
  tr: { flexDirection: "row" },

  th: {
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    fontSize: 10,
  },
  td: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    fontSize: 10,
  },

  c1: { width: "16%" }, // Date
  c2: { width: "17%" }, // Heure de début
  c3: { width: "17%" }, // Heure de fin
  c4: { width: "17%" }, // Heures normales
  c5: { width: "17%" }, // Heures supp
  c6: { width: "16%" }, // Statut

  totalRow: { flexDirection: "row" },
  totalLabelCell: {
    width: "50%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  totalLabel: { fontWeight: "bold", textAlign: "center" },
  totalCell: {
    width: "16.66%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  totalCellLast: { width: "16.68%", paddingVertical: 10, paddingHorizontal: 4 },

  footer: { marginTop: 22, flexDirection: "row", justifyContent: "space-between" },
  signCol: { width: "48%" },
  signRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 18 },
  signLabel: { width: 150 },
  signLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: "#000", height: 14 },

  dateRight: { width: "48%", alignItems: "flex-end" },
  dateRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 18 },
  dateLabel: { width: 40 },
  dateLine: { width: 160, borderBottomWidth: 1, borderBottomColor: "#000", height: 14 },
});

function formatDate(d) {
  try {
    return d ? new Date(d).toLocaleDateString("fr-FR") : "";
  } catch {
    return "";
  }
}

function formatTime(d) {
  try {
    return d
      ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : "";
  } catch {
    return "";
  }
}

/**
 * Récupère la dernière affectation (la plus récente) si ton tableau est trié ou non.
 * Si tu as "createdAt" dans l'affectation, tu peux trier dessus.
 */
function getLastAffectation(agent) {
  const arr = agent?.affectations || [];
  if (!arr.length) return null;

  // Si tu as createdAt :
  // return [...arr].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))[0];

  // Sinon on prend la dernière entrée
  return arr[arr.length - 1];
}

function safeTxt(v) {
  return v === null || v === undefined ? "" : String(v);
}

/**
 * ficheData = { orgName, orgAddress, periodeLabel, responsable, agents: [{...structure agent...}] }
 */
export function FichePresencePDF({ ficheData } : any) {
  const orgName = ficheData?.orgName || "Association loi 1901";
  const orgAddress = ficheData?.orgAddress || "Maison des associations\n02100 SAINT QUENTIN";
  const periodeLabel = ficheData?.periodeLabel || "";
  const responsable = ficheData?.responsable || "";

  const agents = ficheData?.agents || [];

  return (
    <Document>
      {agents.map((agent, agentIdx) => {
        const lastAff = getLastAffectation(agent);

        // Ex: adapte selon la forme de ton affectation (direction/departement/fonction etc.)
        const service =
          safeTxt(lastAff?.departement?.nom) ||
          safeTxt(lastAff?.service?.nom) ||
          safeTxt(lastAff?.direction?.libelle) ||
          "";

        const fonction =
          safeTxt(lastAff?.fonction?.libelle) ||
          safeTxt(lastAff?.poste?.libelle) ||
          safeTxt(lastAff?.grade?.libelle) ||
          "";

        const presences = agent?.presences || [];
        const rows = presences.slice(0, 7);

        return (
          <Page key={agentIdx} size="A4" style={styles.page}>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.logoBox}>
                  <Text style={{ fontSize: 10, fontWeight: "bold" }}>LOGO</Text>
                </View>
                <Text style={styles.orgText}>
                  {orgName + "\n"}
                  {orgAddress}
                </Text>
              </View>

              <View style={styles.headerRight}>
                <Text style={styles.title}>FICHE DE PRÉSENCE</Text>
                {periodeLabel ? <Text style={{ marginTop: 6, color: "#444" }}>{periodeLabel}</Text> : null}
              </View>
            </View>

            {/* INFOS */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <View style={styles.row}>
                  <Text style={styles.label}>Nom Prénom :</Text>
                  <Text style={styles.value}>
                    {safeTxt(agent?.nom)} {safeTxt(agent?.prenom)}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Matricule :</Text>
                  <Text style={styles.value}>{safeTxt(agent?.matricule)}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Service :</Text>
                  <Text style={styles.value}>{service}</Text>
                </View>
              </View>

              <View style={styles.infoCol}>
                <View style={styles.row}>
                  <Text style={[styles.label, { width: 80 }]}>fonction :</Text>
                  <Text style={styles.value}>{fonction}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={[styles.label, { width: 80 }]}>Genre :</Text>
                  <Text style={styles.value}>{safeTxt(agent?.genre)}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={[styles.label, { width: 80 }]}>Responsable :</Text>
                  <Text style={styles.value}>{responsable}</Text>
                </View>
              </View>
            </View>

            {/* TABLE */}
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.th, styles.c1]}>Date</Text>
                <Text style={[styles.th, styles.c2]}>Heure de{"\n"}d'arrivée</Text>
                <Text style={[styles.th, styles.c3]}>Heure de{"\n"}départ</Text>
                <Text style={[styles.th, styles.c4]}>Remarque</Text>
                <Text style={[styles.th, styles.c5]}>Observations</Text>
                <Text style={[styles.th, styles.c6, { borderRightWidth: 0 }]}>Statut</Text>
              </View>

              {Array.from({ length: 7 }).map((_, i) => {
                const p = rows[i];
                return (
                  <View key={i} style={styles.tr}>
                    <Text style={[styles.td, styles.c1]}>{p ? formatDate(p.date) : ""}</Text>
                    <Text style={[styles.td, styles.c2]}>{p ? formatTime(p.heureArrivee) : ""}</Text>
                    <Text style={[styles.td, styles.c3]}>{p ? formatTime(p.heureDepart) : ""}</Text>
                    <Text style={[styles.td, styles.c4]} />
                    <Text style={[styles.td, styles.c5]} />
                    <Text style={[styles.td, styles.c6, { borderRightWidth: 0 }]}>{safeTxt(p?.statut)}</Text>
                  </View>
                );
              })}

              {/* TOTAL */}
              <View style={styles.totalRow}>
                <View style={styles.totalLabelCell}>
                  <Text style={styles.totalLabel}>TOTAL DE LA{"\n"}SEMAINE :</Text>
                </View>
                <View style={styles.totalCell} />
                <View style={styles.totalCell} />
                <View style={styles.totalCellLast} />
              </View>
            </View>

            {/* SIGNATURES */}
            <View style={styles.footer}>
              <View style={styles.signCol}>
                <View style={styles.signRow}>
                  <Text style={styles.signLabel}>Signature de l'employé :</Text>
                  <View style={styles.signLine} />
                </View>
                <View style={styles.signRow}>
                  <Text style={styles.signLabel}>Signature du responsable :</Text>
                  <View style={styles.signLine} />
                </View>
              </View>

              <View style={styles.dateRight}>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Date :</Text>
                  <View style={styles.dateLine} />
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Date :</Text>
                  <View style={styles.dateLine} />
                </View>
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
