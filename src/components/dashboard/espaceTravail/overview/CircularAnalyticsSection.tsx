"use client";

import type { ReactNode } from "react";

import PieChartCard from "./PieChartCard";
import GenderSplitPieCard from "./GenderSplitPieCard";
import type { OverviewAnalytics } from "./types";

type Visibility = {
  canReadAgents: boolean;
  canReadOrganisation: boolean;
  canReadProvince: boolean;
  canReadType: boolean;
  canReadAffectation: boolean;
};

export default function CircularAnalyticsSection({
  analytics,
  visibility,
}: {
  analytics: OverviewAnalytics;
  visibility: Visibility;
}) {
  const cards: ReactNode[] = [];

  if (visibility.canReadAgents && visibility.canReadOrganisation) {
    cards.push(
      <PieChartCard
        key="agents-by-direction"
        title="Agents par direction"
        description="Repartition des agents selon leur direction principale."
        data={analytics.agentsByDirection}
      />
    );
  }

  if (visibility.canReadAgents && visibility.canReadType) {
    cards.push(
      <PieChartCard
        key="agents-by-station"
        title="Agents par station"
        description="Repartition des agents selon le type d'unite (station)."
        data={analytics.agentsByStation}
      />
    );
  }

  if (visibility.canReadAgents && visibility.canReadProvince) {
    cards.push(
      <PieChartCard
        key="agents-by-province"
        title="Agents par province"
        description="Repartition des agents selon la province de rattachement."
        data={analytics.agentsByProvince}
      />
    );
  }

  if (visibility.canReadAgents && visibility.canReadOrganisation) {
    cards.push(
      <GenderSplitPieCard
        key="gender-by-direction"
        title="Femmes/Hommes par direction"
        description="Selectionnez une direction pour voir la repartition par sexe."
        groups={analytics.sexByDirection}
        selectLabel="Choisir une direction"
      />
    );
  }

  if (visibility.canReadAgents && visibility.canReadType) {
    cards.push(
      <GenderSplitPieCard
        key="gender-by-station"
        title="Femmes/Hommes par station"
        description="Selectionnez une station pour voir la repartition par sexe."
        groups={analytics.sexByStation}
        selectLabel="Choisir une station"
      />
    );
  }

  if (visibility.canReadAgents && visibility.canReadType && visibility.canReadProvince) {
    cards.push(
      <GenderSplitPieCard
        key="gender-by-province-station"
        title="Femmes/Hommes par province et station"
        description="Selectionnez un couple province/station pour comparer les sexes."
        groups={analytics.sexByProvinceAndStation}
        selectLabel="Choisir province/station"
      />
    );
  }

  if (visibility.canReadAffectation && visibility.canReadOrganisation) {
    cards.push(
      <PieChartCard
        key="affectations-by-direction"
        title="Affectations par direction"
        description="Volume des affectations actives par direction."
        data={analytics.affectationsByDirection}
      />
    );
  }

  if (visibility.canReadAffectation && visibility.canReadProvince) {
    cards.push(
      <PieChartCard
        key="affectations-by-province"
        title="Affectations par province"
        description="Volume des affectations actives par province."
        data={analytics.affectationsByProvince}
      />
    );
  }

  if (visibility.canReadAffectation && visibility.canReadType) {
    cards.push(
      <PieChartCard
        key="affectations-by-station"
        title="Affectations par station"
        description="Volume des affectations actives par type d'unite."
        data={analytics.affectationsByStation}
      />
    );
  }

  if (visibility.canReadAffectation && visibility.canReadAgents) {
    cards.push(
      <PieChartCard
        key="affectations-by-sex"
        title="Affectations par sexe"
        description="Comparaison des affectations actives Hommes/Femmes/Autre."
        data={analytics.affectationsBySex}
      />
    );
  }

  if (!cards.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Analyses circulaires</h2>
      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">{cards}</div>
    </section>
  );
}
