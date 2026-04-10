"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { GetPlanifications, type PlanificationItem } from "@/app/action/planification/action";
import { useGet } from "@/hooks/useApi";
import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function endOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function formatShortPeriod(item: PlanificationItem) {
  const start = new Date(item.dateDebut);
  const end = item.dateFin ? new Date(item.dateFin) : null;

  if (Number.isNaN(start.getTime())) {
    return "--";
  }

  const startLabel = start.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });

  if (!end || Number.isNaN(end.getTime()) || sameDay(start, end)) {
    return startLabel;
  }

  const endLabel = end.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });

  return `${startLabel} -> ${endLabel}`;
}

function getPlanBadgeVariant(item: PlanificationItem) {
  if (item.typePlanification?.code === "JOUR_FERIE") {
    return "destructive" as const;
  }

  if (item.priorite === "CRITIQUE" || item.priorite === "ELEVEE") {
    return "secondary" as const;
  }

  return "outline" as const;
}

function getPriorityLabel(priority: PlanificationItem["priorite"]) {
  switch (priority) {
    case "CRITIQUE":
      return "Critique";
    case "ELEVEE":
      return "Elevee";
    case "FAIBLE":
      return "Faible";
    default:
      return "Normale";
  }
}

function getPriorityOrder(priority: PlanificationItem["priorite"]) {
  switch (priority) {
    case "CRITIQUE":
      return 0;
    case "ELEVEE":
      return 1;
    case "NORMALE":
      return 2;
    default:
      return 3;
  }
}

type CalendarCell = {
  date: Date;
  inCurrentMonth: boolean;
  items: PlanificationItem[];
};

export default function CalendrierPlanifications() {
  const { auth }: any = useAuth();
  const canRead = hasAnyPermission(auth, [
    "planification.read",
    "planification.create",
    "planification.update",
    "planification.delete",
    "planification.assign",
    "planification.validate",
  ]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { data: planificationsRaw = [], isPending } = useGet<PlanificationItem[]>(
    ["planifications-calendar"],
    GetPlanifications
  );

  const planifications = Array.isArray(planificationsRaw) ? planificationsRaw : [];

  const monthCells = useMemo<CalendarCell[]>(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const firstGridDay = new Date(firstDay);
    const firstWeekDay = (firstDay.getDay() + 6) % 7;
    firstGridDay.setDate(firstDay.getDate() - firstWeekDay);

    const lastGridDay = new Date(lastDay);
    const lastWeekDay = (lastDay.getDay() + 6) % 7;
    lastGridDay.setDate(lastDay.getDate() + (6 - lastWeekDay));

    const cells: CalendarCell[] = [];
    const cursor = new Date(firstGridDay);

    while (cursor <= lastGridDay) {
      const dayStart = startOfDay(cursor);
      const dayEnd = endOfDay(cursor);

      const items = planifications.filter((item) => {
        const itemStart = startOfDay(new Date(item.dateDebut));
        const itemEnd = item.dateFin ? endOfDay(new Date(item.dateFin)) : endOfDay(new Date(item.dateDebut));

        if (Number.isNaN(itemStart.getTime()) || Number.isNaN(itemEnd.getTime())) {
          return false;
        }

        return itemStart <= dayEnd && itemEnd >= dayStart;
      });

      cells.push({
        date: new Date(cursor),
        inCurrentMonth: cursor.getMonth() === currentMonth.getMonth(),
        items: items.sort((left, right) => {
          const priorityDelta =
            getPriorityOrder(left.priorite) - getPriorityOrder(right.priorite);
          if (priorityDelta !== 0) {
            return priorityDelta;
          }

          return (
            new Date(left.dateDebut).getTime() - new Date(right.dateDebut).getTime()
          );
        }),
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return cells;
  }, [currentMonth, planifications]);

  if (!canRead) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun acces sur le calendrier des planifications.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-lg">Calendrier des planifications</CardTitle>
          <p className="text-sm text-muted-foreground">
            Vue mensuelle des planifications visibles selon vos permissions et votre portee.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentMonth(
                (value) => new Date(value.getFullYear(), value.getMonth() - 1, 1)
              )
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-40 text-center text-sm font-medium capitalize">
            {formatMonthTitle(currentMonth)}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentMonth(
                (value) => new Date(value.getFullYear(), value.getMonth() + 1, 1)
              )
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
          {WEEK_DAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {isPending ? (
          <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Chargement du calendrier...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
            {monthCells.map((cell) => {
              const isToday = sameDay(cell.date, new Date());

              return (
                <div
                  key={cell.date.toISOString()}
                  className={[
                    "min-h-44 rounded-lg border p-2",
                    cell.inCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground",
                    isToday ? "border-primary" : "border-border",
                  ].join(" ")}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={["text-sm font-semibold", isToday ? "text-primary" : ""].join(" ")}>
                      {cell.date.getDate()}
                    </span>
                    {cell.items.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {cell.items.length}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    {cell.items.slice(0, 3).map((item) => (
                      <div
                        key={`${cell.date.toISOString()}-${item.id}`}
                        className="rounded-md border border-border/70 px-2 py-2"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-1">
                          <Badge variant={getPlanBadgeVariant(item)} className="text-[10px]">
                            {item.typePlanification?.code ?? "PLAN"}
                          </Badge>
                          {(item.priorite === "CRITIQUE" || item.priorite === "ELEVEE") && (
                            <Badge variant="outline" className="text-[10px]">
                              {getPriorityLabel(item.priorite)}
                            </Badge>
                          )}
                        </div>
                        <p className="line-clamp-2 text-xs font-medium">{item.titre}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatShortPeriod(item)}
                        </p>
                      </div>
                    ))}

                    {cell.items.length > 3 && (
                      <div className="text-[11px] text-muted-foreground">
                        +{cell.items.length - 3} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
