"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KpiItem = {
  title: string;
  value: string;
  tone: string;
  description?: string;
};

export default function KpiCardsGrid({ items }: { items: KpiItem[] }) {
  if (!items.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.title} className={`dashboard-stat-card py-4 ${item.tone}`}>
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">{item.title}</p>
            <CardTitle className="dashboard-stat-value text-3xl">{item.value}</CardTitle>
          </CardHeader>
          {item.description && (
            <CardContent className="px-4 pt-0">
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
