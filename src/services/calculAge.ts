export function calculerAge(dateNaissance : any) {
  const today = new Date()
  const birth = new Date(dateNaissance)

  let age = today.getFullYear() - birth.getFullYear()
  const month = today.getMonth() - birth.getMonth()

  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}
export function calculDateRetraite(dateNaissance : any) {
  const retraite = new Date(dateNaissance)
  retraite.setFullYear(retraite.getFullYear() + 60)
  return retraite
}
