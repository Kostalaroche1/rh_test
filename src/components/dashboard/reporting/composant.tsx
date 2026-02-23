"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ReportingDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const kpiData = [
    { title: "Total Agents", value: 128, tone: "dashboard-stat-tone-blue" },
    { title: "Conges Restants", value: 45, tone: "dashboard-stat-tone-soft" },
    { title: "Absenteisme", value: "8%", tone: "dashboard-stat-tone-red" },
    { title: "Turnover", value: "3%", tone: "dashboard-stat-tone-sky" },
  ];

  const absenceData = [
    { agent: "Karoles Ovono", date: "2026-02-10", type: "Maladie", status: "Approuve" },
    { agent: "Emily Whalen", date: "2026-02-12", type: "Conge annuel", status: "En attente" },
  ];

  return (
    <div className="erp-page">
      <div>
        <h1 className="text-3xl font-bold">Reporting & Analytique</h1>
        <p className="text-muted-foreground">Visualisez et analysez les performances et activites des agents</p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {kpiData.map((kpi, idx) => (
          <Card key={idx} className={`dashboard-stat-card py-4 ${kpi.tone}`}>
            <CardHeader className="gap-1 px-4 pb-2">
              <p className="dashboard-stat-title">{kpi.title}</p>
              <CardTitle className="dashboard-stat-value text-3xl">{kpi.value}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pt-0">
              <p className="text-xs text-muted-foreground">Vue consolidee en temps reel</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Vue ensemble</TabsTrigger>
          <TabsTrigger value="conges">Conges</TabsTrigger>
          <TabsTrigger value="absences">Absences</TabsTrigger>
          <TabsTrigger value="paie">Paie & Avantages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Performance Generale</CardTitle>
              <CardDescription>Graphiques de synthese des agents</CardDescription>
            </CardHeader>
            <CardContent className="flex h-64 items-center justify-center rounded bg-muted/20 text-muted-foreground">
              Graphiques (a remplacer par Recharts)
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conges">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Conges</CardTitle>
              <CardDescription>Statistiques et suivi des conges</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Date debut</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absenceData.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.agent}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "Approuve" ? "default" : "outline"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="absences">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Absences</CardTitle>
            </CardHeader>
            <CardContent className="flex h-64 items-center justify-center rounded bg-rose-500/10">
              Graphiques absences (bar / pie)
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paie">
          <Card className="flex w-full flex-col gap-4">
            <CardHeader>
              <CardTitle>Paie et Avantages</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex justify-between">
                <div>Salaires totaux verses ce mois:</div>
                <div className="font-bold text-emerald-500">$120,000</div>
              </div>
              <div className="flex justify-between">
                <div>Primes / Avantages:</div>
                <div className="font-bold text-blue-500">$15,500</div>
              </div>
              <div className="flex justify-between">
                <div>Retenues:</div>
                <div className="font-bold text-rose-500">$2,400</div>
              </div>

              <Button className="mt-4 w-full md:w-1/3" variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
