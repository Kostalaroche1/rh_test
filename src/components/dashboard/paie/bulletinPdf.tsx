// components/BulletinPDF.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet /*, Image*/ } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10.8,
    fontFamily: "Helvetica",
    color: "#111",
  },

  // Header
  header: {
    borderWidth: 1,
    borderColor: "#111",
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandLeft: { width: "62%" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: { fontSize: 9, fontWeight: "bold" },

  companyName: { fontSize: 12, fontWeight: "bold" },
  companySub: { marginTop: 2, color: "#333", lineHeight: 1.3 },

  headerRight: { width: "38%", alignItems: "flex-end" },
  docTitle: { fontSize: 14, fontWeight: "bold" },
  docMeta: { marginTop: 4, color: "#333", lineHeight: 1.3 },
  badge: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#111",
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 9,
  },

  // Sections
  section: {
    borderWidth: 1,
    borderColor: "#111",
    padding: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: "bold",
    marginBottom: 8,
  },

  // label/value rows
  grid2: { flexDirection: "row", gap: 14 },
  col: { width: "50%" },

  row: { flexDirection: "row", marginBottom: 6 },
  label: { width: 120, fontWeight: "bold" },
  value: { flex: 1 },

  // Tables
  table: { borderWidth: 1, borderColor: "#111", marginTop: 6 },
  tr: { flexDirection: "row" },
  th: {
    fontWeight: "bold",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    borderRightWidth: 1,
    borderRightColor: "#111",
    fontSize: 9.8,
  },
  td: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    borderRightWidth: 1,
    borderRightColor: "#111",
    fontSize: 10.2,
  },
  cLabel: { width: "70%" },
  cAmount: { width: "30%", textAlign: "right" },

  totalsBox: {
    borderWidth: 1,
    borderColor: "#111",
    padding: 12,
    marginTop: 6,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalLabel: { fontWeight: "bold" },

  // Footer
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#111",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signCol: { width: "48%" },
  signRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 14 },
  signLabel: { width: 120 },
  signLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: "#111", height: 14 },
});

function safeTxt(v) {
  return v === null || v === undefined || v === "" ? "-" : String(v);
}

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function money(v, devise = "FC") {
  const val = n(v);
  return `${val.toLocaleString("fr-FR")} ${devise}`;
}

function sumBy(items, key = "montant") {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, it) => acc + n(it?.[key]), 0);
}

/**
 * Props possibles:
 * - <BulletinPDF paie={...} />
 * - <BulletinPDF paies={[...]} />
 *
 * Options:
 * - entreprise: { nom, adresse, ville, telephone, rccm, idNat, logoUrl }
 * - devise: "FC" | "$"
 */
export function BulletinPDF({
  paie,
  paies,
  entreprise,
  devise = "FC",
} : any) {
  const list = Array.isArray(paies) ? paies : paie ? [paie] : [];

  const ent = {
    nom: entreprise?.nom || "Votre Entreprise",
    adresse: entreprise?.adresse || "Adresse de l'entreprise",
    ville: entreprise?.ville || "Ville, Pays",
    telephone: entreprise?.telephone || "",
    rccm: entreprise?.rccm || "",
    idNat: entreprise?.idNat || "",
    // logoUrl: entreprise?.logoUrl || "",
  };

  return (
    <Document>
      {list.map((p, idx) => {
        const agentNom = p?.agent ? `${p.agent.nom ?? ""} ${p.agent.prenom ?? ""}`.trim() : "-";
        const matricule = p?.agent?.matricule || p?.agent?.code || "";
        const periode = safeTxt(new Date(p?.periode || p?.datePaiement).toLocaleDateString());

        const primes = Array.isArray(p?.primes) ? p.primes : [];
        const deductions = Array.isArray(p?.deductions) ? p.deductions : []; // optionnel

        const salaireBase = n(p?.salaireBase);
        const totalPrimes = sumBy(primes, "montant");
        const totalDed = sumBy(deductions, "montant");

        // brut/net auto si manquants
        const brutAuto = salaireBase + totalPrimes;
        const brut = p?.brut !== undefined ? n(p?.brut) : brutAuto;

        const netAuto = brut - totalDed;
        const net = p?.net !== undefined ? n(p?.net) : netAuto;

        return (
          <Page key={idx} size="A4" style={styles.page}>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.brandLeft}>
                <View style={styles.brandRow}>
                  {/* Si tu as un logo base64/URL :
                  <Image src={ent.logoUrl} style={{ width: 44, height: 44 }} />
                  */}
                  <View style={styles.logoBox}>
                    <Text style={styles.logoText}>LOGO</Text>
                  </View>

                  <View>
                    <Text style={styles.companyName}>{ent.nom}</Text>
                    <Text style={styles.companySub}>
                      {ent.adresse}
                      {"\n"}
                      {ent.ville}
                      {ent.telephone ? `\nTél: ${ent.telephone}` : ""}
                    </Text>
                  </View>
                </View>

                {(ent.rccm || ent.idNat) && (
                  <Text style={{ marginTop: 6, color: "#333" }}>
                    {ent.rccm ? `RCCM: ${ent.rccm}   ` : ""}
                    {ent.idNat ? `ID NAT: ${ent.idNat}` : ""}
                  </Text>
                )}
              </View>

              <View style={styles.headerRight}>
                <Text style={styles.docTitle}>Bulletin de paie</Text>
                <Text style={styles.docMeta}>
                  Période : {periode}
                  {"\n"}
                  Réf : {safeTxt(p?.reference || p?.id)}
                </Text>
                <Text style={styles.badge}>DOCUMENT OFFICIEL</Text>
              </View>
            </View>

            {/* INFOS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations agent</Text>

              <View style={styles.grid2}>
                <View style={styles.col}>
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

                <View style={styles.col}>
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
                    <Text style={styles.value}>{safeTxt(new Date(p?.datePaiement).toLocaleDateString())}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* PRIMES */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Primes</Text>

              <View style={styles.table}>
                <View style={styles.tr}>
                  <Text style={[styles.th, styles.cLabel]}>Libellé</Text>
                  <Text style={[styles.th, styles.cAmount, { borderRightWidth: 0 }]}>Montant</Text>
                </View>

                {primes.length === 0 ? (
                  <View style={styles.tr}>
                    <Text style={[styles.td, styles.cLabel]}>Aucune prime</Text>
                    <Text style={[styles.td, styles.cAmount, { borderRightWidth: 0 }]}>0 {devise}</Text>
                  </View>
                ) : (
                  primes.map((it, i) => (
                    <View key={i} style={styles.tr}>
                      <Text style={[styles.td, styles.cLabel]}>{safeTxt(it?.type || it?.libelle)}</Text>
                      <Text style={[styles.td, styles.cAmount, { borderRightWidth: 0 }]}>
                        {money(it?.montant, devise)}
                      </Text>
                    </View>
                  ))
                )}

                <View style={styles.tr}>
                  <Text style={[styles.td, styles.cLabel, { fontWeight: "bold" }]}>Total primes</Text>
                  <Text style={[styles.td, styles.cAmount, { borderRightWidth: 0, fontWeight: "bold" }]}>
                    {money(totalPrimes, devise)}
                  </Text>
                </View>
              </View>
            </View>

            {/* DEDUCTIONS (optionnel) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Déductions</Text>

              <View style={styles.table}>
                <View style={styles.tr}>
                  <Text style={[styles.th, styles.cLabel]}>Libellé</Text>
                  <Text style={[styles.th, styles.cAmount, { borderRightWidth: 0 }]}>Montant</Text>
                </View>

                {deductions.length === 0 ? (
                  <View style={styles.tr}>
                    <Text style={[styles.td, styles.cLabel]}>Aucune déduction</Text>
                    <Text style={[styles.td, styles.cAmount, { borderRightWidth: 0 }]}>0 {devise}</Text>
                  </View>
                ) : (
                  deductions.map((it, i) => (
                    <View key={i} style={styles.tr}>
                      <Text style={[styles.td, styles.cLabel]}>{safeTxt(it?.type || it?.libelle)}</Text>
                      <Text style={[styles.td, styles.cAmount, { borderRightWidth: 0 }]}>
                        {money(it?.montant, devise)}
                      </Text>
                    </View>
                  ))
                )}

                <View style={styles.tr}>
                  <Text style={[styles.td, styles.cLabel, { fontWeight: "bold" }]}>Total déductions</Text>
                  <Text style={[styles.td, styles.cAmount, { borderRightWidth: 0, fontWeight: "bold" }]}>
                    {money(totalDed, devise)}
                  </Text>
                </View>
              </View>
            </View>

            {/* TOTALS */}
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Brut</Text>
                <Text>{money(brut, devise)}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Net à payer</Text>
                <Text>{money(net, devise)}</Text>
              </View>
            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
              <View style={styles.signCol}>
                <View style={styles.signRow}>
                  <Text style={styles.signLabel}>Signature agent :</Text>
                  <View style={styles.signLine} />
                </View>
              </View>

              <View style={styles.signCol}>
                <View style={styles.signRow}>
                  <Text style={styles.signLabel}>Signature RH :</Text>
                  <View style={styles.signLine} />
                </View>
              </View>
            </View>

            <Text style={{ marginTop: 6, color: "#444", fontSize: 9 }}>
              Document généré automatiquement — toute falsification est interdite.
            </Text>
          </Page>
        );
      })}
    </Document>
  );
}
