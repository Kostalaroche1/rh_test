"use client";

import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PIE_COLORS } from "./constants";
import type { PieDatum } from "./types";
import { formatCount } from "./helpers";

export default function PieChartCard({
  title,
  description,
  data,
  emptyLabel = "Aucune donnee disponible.",
}: {
  title: string;
  description: string;
  data: PieDatum[];
  emptyLabel?: string;
}) {
  const sanitized = data.filter((item) => item.value > 0);

  const chartConfig: ChartConfig = sanitized.reduce((config, item, index) => {
    config[item.key] = {
      label: item.label,
      color: PIE_COLORS[index % PIE_COLORS.length],
    };
    return config;
  }, {} as ChartConfig);

  return (
    <Card className="erp-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sanitized.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-60 w-full">
              <PieChart>
                <Pie data={sanitized} dataKey="value" nameKey="label" outerRadius={88} innerRadius={52} paddingAngle={1}>
                  {sanitized.map((item, index) => (
                    <Cell key={item.key} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel indicator="dot" />} />
              </PieChart>
            </ChartContainer>
            <div className="grid gap-1">
              {sanitized.slice(0, 6).map((item, index) => (
                <div key={item.key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-semibold">{formatCount(item.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
