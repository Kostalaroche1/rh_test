"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ModuleCard } from "./types";

export default function QuickModulesSection({
  modules,
  searchValue,
  onSearchChange,
}: {
  modules: ModuleCard[];
  searchValue: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">Acces rapide modules</h2>
        <div className="relative w-full md:w-[360px]">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-8"
            placeholder="Rechercher un module..."
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Card key={module.href} className="border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted p-2">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1">
                  {module.permissions.slice(0, 3).map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-[11px]">
                      {permission}
                    </Badge>
                  ))}
                  {module.permissions.length > 3 && (
                    <Badge variant="secondary" className="text-[11px]">
                      +{module.permissions.length - 3}
                    </Badge>
                  )}
                </div>
                <Button asChild size="sm">
                  <Link href={module.href}>Ouvrir</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {!modules.length && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Aucun module ne correspond a votre recherche.
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
