export function ChartPaieDate(paiesFiltrees: any[]) {

  const moisLabels = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
    "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"
  ]

  // Objet final : { 2025: [0,0,3000,...], 2026: [...] }
  const yearlyTotals: any = {}

  paiesFiltrees.forEach((p: any) => {
    if (!p.datePaiement) return

    const date = new Date(p.datePaiement)
    const year = date.getFullYear().toString()
    const monthIndex = date.getMonth()

    if (!yearlyTotals[year]) {
      yearlyTotals[year] = Array(12).fill(0)
    }

    yearlyTotals[year][monthIndex] += Number(p.net)
  })

  console.log(yearlyTotals, "totaux groupés")

  // Transformation pour Recharts
  const chart = moisLabels.map((label, index) => {
    const row: any = { mois: label }

    Object.keys(yearlyTotals).forEach((year) => {
      row[year] = yearlyTotals[year][index]
    })

    return row
  })

  console.log(chart, "chart multi-année")

  return chart
}
