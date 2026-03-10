import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const DEFAULT_LOGO_SRC = "/images/logo_auth/logo_rtnc1.png";

const colors = {
  bg: "#F3F6FB",
  panel: "#FFFFFF",
  border: "#D7E2F2",
  title: "#0B2452",
  text: "#1E293B",
  muted: "#5B6B86",
  primary: "#0F4A97",
  primarySoft: "#E9F1FC",
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: colors.bg,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
  },
  section: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  headerBox: {
    backgroundColor: colors.primarySoft,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    width: "62%",
    flexDirection: "row",
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  logo: {
    width: 50,
    height: 50,
    objectFit: "contain",
  },
  orgName: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.title,
  },
  orgMeta: {
    marginTop: 3,
    color: colors.muted,
    lineHeight: 1.3,
  },
  headerRight: {
    width: "38%",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.title,
  },
  period: {
    marginTop: 4,
    color: colors.muted,
    textAlign: "right",
  },
  infoGrid: {
    flexDirection: "row",
  },
  infoColLeft: {
    width: "50%",
    paddingRight: 6,
  },
  infoColRight: {
    width: "50%",
    paddingLeft: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 96,
    fontWeight: "bold",
    color: colors.muted,
  },
  value: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 14,
    color: colors.text,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 4,
  },
  tr: {
    flexDirection: "row",
  },
  th: {
    backgroundColor: colors.primary,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: "#2C66AF",
    fontSize: 9,
  },
  td: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    fontSize: 9.5,
  },
  c1: { width: "16%" },
  c2: { width: "17%" },
  c3: { width: "17%" },
  c4: { width: "17%" },
  c5: { width: "17%" },
  c6: { width: "16%" },
  totalRow: {
    flexDirection: "row",
    backgroundColor: colors.primarySoft,
  },
  totalLabelCell: {
    width: "50%",
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  totalLabel: {
    fontWeight: "bold",
    textAlign: "center",
    color: colors.title,
  },
  totalCell: {
    width: "16.66%",
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  totalCellLast: {
    width: "16.68%",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  signCol: { width: "48%" },
  signRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 12 },
  signLabel: { width: 150, color: colors.muted },
  signLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: colors.border, height: 14 },
  dateRight: { width: "48%", alignItems: "flex-end" },
  dateRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 12 },
  dateLabel: { width: 42, color: colors.muted },
  dateLine: { width: 160, borderBottomWidth: 1, borderBottomColor: colors.border, height: 14 },
  legal: {
    marginTop: 6,
    fontSize: 9,
    color: colors.muted,
  },
});

function formatDate(d: unknown) {
  try {
    const value =
      typeof d === "string" || typeof d === "number" || d instanceof Date
        ? d
        : null;
    return value ? new Date(value).toLocaleDateString("fr-FR") : "";
  } catch {
    return "";
  }
}

function formatTime(d: unknown) {
  try {
    const value =
      typeof d === "string" || typeof d === "number" || d instanceof Date
        ? d
        : null;
    return value
      ? new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : "";
  } catch {
    return "";
  }
}

function getLastAffectation(agent: any) {
  const arr = agent?.affectations || [];
  if (!arr.length) return null;
  return arr[arr.length - 1];
}

function safeTxt(v: unknown) {
  return v === null || v === undefined ? "" : String(v);
}

export function FichePresencePDF({ ficheData }: any) {
  const orgName = ficheData?.orgName || "RTNC";
  const orgAddress = ficheData?.orgAddress || "Avenue des Huileries, Kinshasa";
  const periodeLabel = ficheData?.periodeLabel || "";
  const responsable = ficheData?.responsable || "";
  const logoUrl = ficheData?.logoUrl || DEFAULT_LOGO_SRC;

  const agents = Array.isArray(ficheData?.agents) ? ficheData.agents : [];

  return (
    <Document>
      {agents.map((agent: any, agentIdx: number) => {
        const lastAff = getLastAffectation(agent);

        const service =
          safeTxt(lastAff?.departement?.nom) ||
          safeTxt(lastAff?.service?.nom) ||
          safeTxt(lastAff?.direction?.libelle) ||
          "-";

        const fonction =
          safeTxt(lastAff?.fonction?.libelle) ||
          safeTxt(lastAff?.poste?.libelle) ||
          safeTxt(lastAff?.grade?.libelle) ||
          "-";

        const presences = Array.isArray(agent?.presences) ? agent.presences : [];
        const rows = presences.slice(0, 7);

        return (
          <Page key={agentIdx} size="A4" style={styles.page}>
            <View style={[styles.section, styles.headerBox]}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.logoWrap}>
                    <Image src={logoUrl} style={styles.logo} />
                  </View>
                  <View>
                    <Text style={styles.orgName}>{orgName}</Text>
                    <Text style={styles.orgMeta}>{orgAddress}</Text>
                  </View>
                </View>

                <View style={styles.headerRight}>
                  <Text style={styles.title}>FICHE DE PRESENCE</Text>
                  {periodeLabel ? <Text style={styles.period}>{periodeLabel}</Text> : null}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.infoGrid}>
                <View style={styles.infoColLeft}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Nom Prenom :</Text>
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

                <View style={styles.infoColRight}>
                  <View style={styles.row}>
                    <Text style={[styles.label, { width: 86 }]}>Fonction :</Text>
                    <Text style={styles.value}>{fonction}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.label, { width: 86 }]}>Genre :</Text>
                    <Text style={styles.value}>{safeTxt(agent?.genre)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.label, { width: 86 }]}>Responsable :</Text>
                    <Text style={styles.value}>{safeTxt(responsable)}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <Text style={[styles.th, styles.c1]}>Date</Text>
                  <Text style={[styles.th, styles.c2]}>Arrivee</Text>
                  <Text style={[styles.th, styles.c3]}>Depart</Text>
                  <Text style={[styles.th, styles.c4]}>Remarque</Text>
                  <Text style={[styles.th, styles.c5]}>Observation</Text>
                  <Text style={[styles.th, styles.c6, { borderRightWidth: 0 }]}>Statut</Text>
                </View>

                {Array.from({ length: 7 }).map((_: unknown, i: number) => {
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

                <View style={styles.totalRow}>
                  <View style={styles.totalLabelCell}>
                    <Text style={styles.totalLabel}>TOTAL DE LA SEMAINE</Text>
                  </View>
                  <View style={styles.totalCell} />
                  <View style={styles.totalCell} />
                  <View style={styles.totalCellLast} />
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.signCol}>
                <View style={styles.signRow}>
                  <Text style={styles.signLabel}>Signature de l employe :</Text>
                  <View style={styles.signLine} />
                </View>
                <View style={styles.signRow}>
                  <Text style={styles.signLabel}>Signature du responsable :</Text>
                  <View style={styles.signLine} />
                </View>
              </View>

              <View style={styles.dateRight}>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Date:</Text>
                  <View style={styles.dateLine} />
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Date:</Text>
                  <View style={styles.dateLine} />
                </View>
              </View>
            </View>

            <Text style={styles.legal}>
              Document genere automatiquement par RTNC RH.
            </Text>
          </Page>
        );
      })}
    </Document>
  );
}
