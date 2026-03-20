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
      <Label>Type de conge</Label>

      <Select
        value={value ? String(value) : ""}
        onValueChange={(selectedValue) => {
          const selected = typeConges.find((type) => type.id === Number(selectedValue));
          if (selected) {
            onChange(selected);
          }
        }}
      >
        <SelectTrigger className="w-full">
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
      <Label>Type de conge</Label>

      <Select name="typeCongeId">
        <SelectTrigger>
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

