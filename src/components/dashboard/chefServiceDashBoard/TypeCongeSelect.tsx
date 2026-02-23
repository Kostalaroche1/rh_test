import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TypeConge } from "@/utilities/type"

type TypeCongeSelectProps = {
  typeConges: TypeConge[]
  value?: number
  onChange: (type: TypeConge) => void
}
export function TypeCongeSelect({
  typeConges,
  value,
  onChange,
}: TypeCongeSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Type de congé</Label>

      <Select
        value={value ? String(value) : ""}
        onValueChange={(val) => {
          const selectedId = Number(val)
          const selected = typeConges.find(
            (t) => t.id === selectedId
          )
          if (selected) onChange(selected)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choisir un type de congé" />
        </SelectTrigger>

        <SelectContent>
          {typeConges.map((type) => (
            <SelectItem key={type.id} value={String(type.id)}>
              {type.code + `/ ${type.dureeMax}  ${type.libelle}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function TypeCongeSelectT({
  typeConges,

}: {
  typeConges: TypeConge[],
}) {
  console.log(typeConges, 'types congé inside')
  return (
    <div className="flex flex-col gap-2">
      <Label>Type de congé</Label>

      <Select name="typeCongeId">
        <SelectTrigger>
          <SelectValue placeholder="Choisir un type de congé" />
        </SelectTrigger>

        <SelectContent>
          {typeConges.map((type) => (
            <SelectItem key={type.id} value={String(type.id)}>
              {type.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
export const formaDate = (year?: Date | string | null) => {

  if (!year) {
    return ""
  }
  const dateForma = new Date(year)
  // return dateForma.toLocaleDateString("fr-FR")
  return dateForma.toISOString().split("T")[0]
  // return dateForma.getDate() + "/" + dateForma.getMonth() + "/" + dateForma.getFullYear()
}