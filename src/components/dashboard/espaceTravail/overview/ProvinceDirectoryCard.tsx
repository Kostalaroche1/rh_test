"use client";

import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProvinceSummary } from "./types";

export default function ProvinceDirectoryCard({
  provinces,
  listSearch,
  onSearchChange,
  selectedProvinceId,
  canSelectProvince,
  onSelectProvince,
}: {
  provinces: ProvinceSummary[];
  listSearch: string;
  onSearchChange: (value: string) => void;
  selectedProvinceId: number | null;
  canSelectProvince: boolean;
  onSelectProvince: (provinceId: number) => void;
}) {
  return (
    <Card className="erp-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Liste des provinces</CardTitle>
        <CardDescription>Recherche rapide et synthese par province.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={listSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-8"
            placeholder="Rechercher dans la liste..."
          />
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {provinces.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun resultat pour cette recherche.</p>
          ) : (
            provinces.map((province) => {
              const selected = selectedProvinceId != null && selectedProvinceId === province.id;
              return (
                <button
                  key={province.id}
                  type="button"
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selected ? "border-primary bg-primary/5" : "border-border/70"
                  }`}
                  onClick={() => {
                    if (!canSelectProvince) return;
                    onSelectProvince(province.id);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {province.code} - {province.nom}
                    </p>
                    <Badge variant="outline">{province._count?.unites ?? 0} directions</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {province._count?.affectations ?? 0} affectations
                  </p>
                </button>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
