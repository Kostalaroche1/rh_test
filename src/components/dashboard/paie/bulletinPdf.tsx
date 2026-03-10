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
  successSoft: "#EAF7EF",
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: colors.bg,
    fontFamily: "Helvetica",
    fontSize: 10.5,
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
  headerWrap: {
    backgroundColor: colors.primarySoft,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    width: "66%",
    flexDirection: "row",
  },
  logoWrap: {
    width: 58,
    height: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  logo: {
    width: 52,
    height: 52,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 12.5,
    fontWeight: "bold",
    color: colors.title,
  },
  companyMeta: {
    marginTop: 3,
    color: colors.muted,
    lineHeight: 1.3,
  },
  headerRight: {
    width: "34%",
    alignItems: "flex-end",
  },
  docTitle: {
    fontSize: 13.5,
    fontWeight: "bold",
    color: colors.title,
  },
  docRef: {
    marginTop: 4,
    color: colors.muted,
    textAlign: "right",
    lineHeight: 1.3,
  },
  stateBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#9FC0EA",
    borderRadius: 999,
    color: colors.primary,
    backgroundColor: "#E6F0FD",
    fontSize: 9,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.title,
    marginBottom: 8,
  },
  grid2: {
    flexDirection: "row",
  },
  colLeft: {
    width: "50%",
    paddingRight: 6,
  },
  colRight: {
    width: "50%",
    paddingLeft: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 118,
    color: colors.muted,
    fontWeight: "bold",
  },
  value: {
    flex: 1,
    color: colors.text,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  tr: {
    flexDirection: "row",
  },
  th: {
    backgroundColor: colors.primary,
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 9.5,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: "#2C66AF",
  },
  td: {
    fontSize: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  amount: {
    textAlign: "right",
  },
  cLabel: {
    width: "70%",
  },
  cAmount: {
    width: "30%",
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalCard: {
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: "#C4E7CF",
    borderRadius: 6,
    padding: 10,
  },
  totalTitle: {
    fontWeight: "bold",
    color: "#1F5E36",
  },
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signCol: {
    width: "48%",
  },
  signRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  signLabel: {
    width: 120,
    color: colors.muted,
  },
  signLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 14,
  },
  legal: {
    marginTop: 6,
    fontSize: 9,
    color: colors.muted,
  },
});

function safeTxt(v: unknown) {
  return v === null || v === undefined || v === "" ? "-" : String(v);
}

function n(v: unknown) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function money(v: unknown, devise = "FC") {
  return `${n(v)
    //. toLocaleString("fr-FR")
    } 
    ${devise}`;
}

function sumBy(items: any[], key = "montant") {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc: number, it: any) => acc + n(it?.[key]), 0);
}

export function BulletinPDF({
  paie,
  paies,
  entreprise,
  devise = "FC",
}: any) {
  const list = Array.isArray(paies) ? paies : paie ? [paie] : [];

  const ent = {
    nom: entreprise?.nom || "RTNC",
    adresse: entreprise?.adresse || "Avenue des Huileries",
    ville: entreprise?.ville || "Kinshasa, RDC",
    telephone: entreprise?.telephone || "",
    rccm: entreprise?.rccm || "",
    idNat: entreprise?.idNat || "",
    logoUrl: entreprise?.logoUrl || DEFAULT_LOGO_SRC,
  };

  return (
    <Document>
      {list.map((p: any, idx: number) => {
        const agentNom = p?.agent
          ? `${safeTxt(p.agent.nom)} ${safeTxt(p.agent.prenom)}`.trim()
          : "-";
        const matricule = p?.agent?.matricule || p?.agent?.code || "";
        const periodRaw = p?.periode || p?.datePaiement;
        const periode = periodRaw
          ? safeTxt(new Date(periodRaw).toLocaleDateString("fr-FR"))
          : "-";

        // const primes = Array.isArray(p?.primes) ? p.primes : [];
        // const deductions = Array.isArray(p?.deductions) ? p.deductions : [];

        const primesRaw = Array.isArray(p?.primes) ? p.primes : [];

        const primes = primesRaw.filter((it: any) => it?.tag === "+");
        const deductions = primesRaw.filter((it: any) => it?.tag !== "+");

        const salaireBase = n(p?.salaireBase);
        const totalPrimes = sumBy(primes, "montant");
        const totalDed = sumBy(deductions, "montant");
        const brut = p?.brut !== undefined ? salaireBase + totalPrimes : n(p.brut);
        const net = p?.net !== undefined ? brut - totalDed : n(p.net);
        const datePaiement = p?.datePaiement
          ? new Date(p.datePaiement).toLocaleDateString("fr-FR")
          : "-";

        return (
          <Page key={idx} size="A4" style={styles.page}>
            <View style={[styles.section, styles.headerWrap]}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.logoWrap}>
                    <Image src={ent.logoUrl} style={styles.logo} />
                  </View>
                  <View>
                    <Text style={styles.companyName}>{ent.nom}</Text>
                    <Text style={styles.companyMeta}>
                      {ent.adresse}
                      {"\n"}
                      {ent.ville}
                      {ent.telephone ? `\nTel: ${ent.telephone}` : ""}
                    </Text>
                    {(ent.rccm || ent.idNat) && (
                      <Text style={[styles.companyMeta, { marginTop: 4 }]}>
                        {ent.rccm ? `RCCM: ${ent.rccm}   ` : ""}
                        {ent.idNat ? `ID NAT: ${ent.idNat}` : ""}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.headerRight}>
                  <Text style={styles.docTitle}>BULLETIN DE PAIE</Text>
                  <Text style={styles.docRef}>
                    Periode: {periode}
                    {"\n"}Ref: {safeTxt(p?.reference || p?.id)}
                  </Text>
                  <Text style={styles.stateBadge}>{safeTxt(p?.etat || "PAYE")}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations agent</Text>
              <View style={styles.grid2}>
                <View style={styles.colLeft}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Agent</Text>
                    <Text style={styles.value}>{agentNom}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Matricule</Text>
                    <Text style={styles.value}>{safeTxt(matricule)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Statut</Text>
                    <Text style={styles.value}>{safeTxt(p?.agent?.statut)}</Text>
                  </View>
                </View>

                <View style={styles.colRight}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Salaire de base</Text>
                    <Text style={styles.value}>{money(salaireBase, devise)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Mode paiement</Text>
                    <Text style={styles.value}>{safeTxt(p?.modePaiement)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Date paiement</Text>
                    <Text style={styles.value}>{datePaiement}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Primes</Text>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <Text style={[styles.th, styles.cLabel]}>Libelle</Text>
                  <Text style={[styles.th, styles.cAmount, styles.amount, { borderRightWidth: 0 }]}>Montant</Text>
                </View>
                {primes.length === 0 ? (
                  <View style={styles.tr}>
                    <Text style={[styles.td, styles.cLabel]}>Aucune prime</Text>
                    <Text style={[styles.td, styles.cAmount, styles.amount, { borderRightWidth: 0 }]}>
                      {money(0, devise)}
                    </Text>
                  </View>
                ) : (
                  primes.map((it: any, i: number) => (
                    <View key={i} style={styles.tr}>
                      {/* <Text style={[styles.td, styles.cLabel]}>{safeTxt(it?.type || it?.libelle)}</Text> */}
                      <Text style={[styles.td, styles.cLabel]}>
                        {it?.tag} {safeTxt(it?.type || it?.libelle)}
                      </Text>
                      <Text style={[styles.td, styles.cAmount, styles.amount, { borderRightWidth: 0 }]}>
                        {money(it?.montant, devise)}
                      </Text>
                    </View>
                  ))
                )}
                <View style={styles.tr}>
                  <Text style={[styles.td, styles.cLabel, { fontWeight: "bold" }]}>Total primes</Text>
                  <Text style={[styles.td, styles.cAmount, styles.amount, { borderRightWidth: 0, fontWeight: "bold" }]}>
                    {money(totalPrimes, devise)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Deductions</Text>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <Text style={[styles.th, styles.cLabel]}>Libelle</Text>
                  <Text style={[styles.th, styles.cAmount, styles.amount, { borderRightWidth: 0 }]}>Montant</Text>
                </View>
                {deductions.length === 0 ? (
                  <View style={styles.tr}>
                    <Text style={[styles.td, styles.cLabel]}>Aucune deduction</Text>
                    <Text style={[styles.td, styles.cAmount, styles.amount, { borderRightWidth: 0 }]}>
                      {money(0, devise)}
                    </Text>
                  </View>
                ) : (
                  deductions.map((it: any, i: number) => (
                    <View key={i} style={styles.tr}>
                      <Text style={[styles.td, styles.cLabel]}>{safeTxt(it?.type || it?.libelle)}</Text>
                      <Text style={[styles.td, styles.cAmount, styles.amount, { borderRightWidth: 0 }]}>
                        {money(it?.montant, devise)}
                      </Text>
                    </View>
                  ))
                )}
                <View style={styles.tr}>
                  <Text style={[styles.td, styles.cLabel, { fontWeight: "bold" }]}>Total deductions</Text>
                  <Text style={[styles.td, styles.cAmount, styles.amount, { borderRightWidth: 0, fontWeight: "bold" }]}>
                    {money(totalDed, devise)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.section, styles.totalCard]}>
              <View style={styles.totalLine}>
                <Text style={styles.totalTitle}>Brut</Text>
                <Text style={styles.totalTitle}>{money(brut, devise)}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={styles.totalTitle}>Net a payer</Text>
                <Text style={styles.totalTitle}>{money(net, devise)}</Text>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.signCol}>
                <View style={styles.signRow}>
                  <Text style={styles.signLabel}>Signature agent:</Text>
                  <View style={styles.signLine} />
                </View>
              </View>
              <View style={styles.signCol}>
                <View style={styles.signRow}>
                  <Text style={styles.signLabel}>Signature RH:</Text>
                  <View style={styles.signLine} />
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
