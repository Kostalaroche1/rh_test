"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PlanificationSummary = {
  id: number;
  titre?: string | null;
  statut?: string | null;
  dateDebut?: string | Date | null;
  dateFin?: string | Date | null;
};

function formatDate(value?: string | Date | null) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString("fr-FR");
}

function getPlanificationBadgeVariant(statut?: string) {
  switch (statut) {
    case "TERMINE":
      return "default";
    case "ANNULE":
      return "destructive";
    case "EN_COURS":
      return "secondary";
    default:
      return "outline";
  }
}

export default function ApercuPlanificationLiee({
  planification,
}: {
  planification: PlanificationSummary;
}) {
  const [open, setOpen] = useState(false);

  const periode = useMemo(() => {
    return `${formatDate(planification.dateDebut)} - ${formatDate(
      planification.dateFin ?? planification.dateDebut
    )}`;
  }, [planification.dateDebut, planification.dateFin]);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-0"
        onClick={() => setOpen(true)}
      >
        Voir planification
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apercu de la planification</DialogTitle>
            <DialogDescription>
              Consultation rapide depuis la demande de conge.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border px-4 py-3">
              <div className="text-sm text-muted-foreground">Titre</div>
              <div className="font-medium">
                {planification.titre || `Planification #${planification.id}`}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-md border px-4 py-3">
                <div className="text-sm text-muted-foreground">Statut</div>
                <div className="mt-1">
                  <Badge variant={getPlanificationBadgeVariant(planification.statut ?? undefined)}>
                    {planification.statut || "PLANIFIE"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-md border px-4 py-3">
                <div className="text-sm text-muted-foreground">Periode</div>
                <div className="font-medium">{periode}</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Fermer
            </Button>
            <Button asChild type="button">
              <Link
                href={`/dashboard/planification?tab=planifications&openPlanificationId=${planification.id}`}
              >
                Voir plus
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
