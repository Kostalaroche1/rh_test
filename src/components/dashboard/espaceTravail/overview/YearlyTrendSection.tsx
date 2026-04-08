"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { YEAR_COLORS } from "./constants";
import type { TrendPoint } from "./types";

export default function YearlyTrendSection({
  years,
  presenceData,
  congesData,
}: {
  years: number[];
  presenceData: TrendPoint[];
  congesData: TrendPoint[];
}) {
  const config = useMemo(() => {
    const chartConfig: ChartConfig = {};
    years.forEach((year, index) => {
      chartConfig[`y${year}`] = {
        label: String(year),
        color: YEAR_COLORS[index % YEAR_COLORS.length],
      };
    });
    return chartConfig;
  }, [years]);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="erp-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Presences par annee</CardTitle>
          <CardDescription>Lignes de tendance avec une couleur par annee.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ChartContainer config={config} className="h-full w-full">
            <LineChart data={presenceData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              {years.map((year) => (
                <Line
                  key={year}
                  type="monotone"
                  dataKey={`y${year}`}
                  stroke={`var(--color-y${year})`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="erp-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conges par annee</CardTitle>
          <CardDescription>Area chart annuel avec couleurs distinctes.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ChartContainer config={config} className="h-full w-full">
            <AreaChart data={congesData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                {years.map((year) => (
                  <linearGradient key={year} id={`fill-y${year}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-y${year})`} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={`var(--color-y${year})`} stopOpacity={0.08} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              {years.map((year) => (
                <Area
                  key={year}
                  type="monotone"
                  dataKey={`y${year}`}
                  stroke={`var(--color-y${year})`}
                  fill={`url(#fill-y${year})`}
                  strokeWidth={2}
                  fillOpacity={1}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
