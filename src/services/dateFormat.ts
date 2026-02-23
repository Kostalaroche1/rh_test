export function DateFormatFr(dates : any)
{
    const date = new Date(dates);
const year = date.getFullYear();
const day = String(date.getDate()).padStart(2, "0");
const month = String(date.getMonth() + 1).padStart(2, "0");

const formatted = `${year}-${day}-${month}`;
return formatted;
console.log(formatted); // 2026-11-02

}