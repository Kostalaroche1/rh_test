export function generateMatricule() : string{
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4 chiffres
  const randomLetter = String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  ); // A–Z
  return `AG-${randomNumber}-${randomLetter}`;
}
