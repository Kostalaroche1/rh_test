"use client";

import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { GENDER_COLORS } from "./constants";
import type { GenderSplit } from "./types";
import { formatCount, toGenderPieData } from "./helpers";

export default function GenderSplitPieCard({
  title,
  description,
  groups,
  selectLabel,
}: {
  title: string;
  description: string;
  groups: GenderSplit[];
  selectLabel: string;
}) {
  const [selectedKey, setSelectedKey] = useState("");

  useEffect(() => {
    if (!groups.length) {
      setSelectedKey("");
      return;
    }
    if (!selectedKey || !groups.some((item) => item.key === selectedKey)) {
      setSelectedKey(groups[0].key);
    }
  }, [groups, selectedKey]);

  const selectedGroup = groups.find((item) => item.key === selectedKey) ?? null;
  const data = useMemo(() => toGenderPieData(selectedGroup), [selectedGroup]);

  const chartConfig: ChartConfig = {
    male: { label: "Hommes", color: GENDER_COLORS.HOMME },
    female: { label: "Femmes", color: GENDER_COLORS.FEMME },
    other: { label: "Autre", color: GENDER_COLORS.AUTRE },
  };

  return (
    <Card className="erp-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.length > 0 && (
          <Select value={selectedKey} onValueChange={setSelectedKey}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={selectLabel} />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.key} value={group.key}>
                  {group.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {!selectedGroup || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune donnee disponible.</p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="label" innerRadius={52} outerRadius={84}>
                  {data.map((entry) => {
                    const color =
                      entry.label === "Hommes"
                        ? GENDER_COLORS.HOMME
                        : entry.label === "Femmes"
                        ? GENDER_COLORS.FEMME
                        : GENDER_COLORS.AUTRE;
                    return <Cell key={entry.key} fill={color} />;
                  })}
                </Pie>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel indicator="dot" />} />
              </PieChart>
            </ChartContainer>

            <div className="grid gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hommes</span>
                <span className="font-semibold">{formatCount(selectedGroup.male)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Femmes</span>
                <span className="font-semibold">{formatCount(selectedGroup.female)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Autre</span>
                <span className="font-semibold">{formatCount(selectedGroup.other)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-border/70 pt-1">
                <span className="font-medium">Total</span>
                <span className="font-semibold">{formatCount(selectedGroup.total)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
