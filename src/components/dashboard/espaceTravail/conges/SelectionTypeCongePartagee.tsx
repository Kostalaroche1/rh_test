"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TypeConge } from "@/utilities/type";
import { formatInputDate } from "@/components/dashboard/espaceTravail/utilitaires/dates";

type SelectionTypeCongeProps = {
  typeConges: TypeConge[];
  value?: number;
  onChange: (type: TypeConge) => void;
};

export function SelectionTypeConge({
  typeConges,
  value,
  onChange,
}: SelectionTypeCongeProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="workspace-type-conge-select">Type de conge</Label>

      <Select
        value={value ? String(value) : ""}
        onValueChange={(selectedValue) => {
          const selected = typeConges.find((type) => type.id === Number(selectedValue));
          if (selected) {
            onChange(selected);
          }
        }}
      >
        <SelectTrigger id="workspace-type-conge-select" className="w-full">
          <SelectValue placeholder="Choisir un type de conge" />
        </SelectTrigger>
        <SelectContent>
          {typeConges.map((type) => (
            <SelectItem key={type.id} value={String(type.id)}>
              {type.code} / {type.dureeMax} {type.libelle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ChampSelectionTypeConge({ typeConges }: { typeConges: TypeConge[] }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="workspace-type-conge-field">Type de conge</Label>

      <Select name="typeCongeId">
        <SelectTrigger id="workspace-type-conge-field">
          <SelectValue placeholder="Choisir un type de conge" />
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
  );
}

export { formatInputDate };



