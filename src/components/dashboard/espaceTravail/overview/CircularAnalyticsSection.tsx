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
  canReadPresence: boolean;
  canReadConges: boolean;
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

  if (visibility.canReadPresence && visibility.canReadProvince) {
    cards.push(
      <PieChartCard
        key="presences-by-province"
        title="Presences par province"
        description="Repartition des presences par province."
        data={analytics.presencesByProvince}
      />
    );
  }

  if (visibility.canReadPresence && visibility.canReadType) {
    cards.push(
      <PieChartCard
        key="presences-by-station"
        title="Presences par station"
        description="Repartition des presences par station (type)."
        data={analytics.presencesByStation}
      />
    );
  }

  if (visibility.canReadPresence && visibility.canReadOrganisation) {
    cards.push(
      <PieChartCard
        key="presences-by-direction"
        title="Presences par direction"
        description="Repartition des presences pour les directions generales."
        data={analytics.presencesByDirection}
      />
    );
    cards.push(
      <PieChartCard
        key="presences-by-sous-direction"
        title="Presences par sous-direction"
        description="Repartition des presences pour les sous-directions."
        data={analytics.presencesBySousDirection}
      />
    );
    cards.push(
      <PieChartCard
        key="presences-by-bureau"
        title="Presences par bureau"
        description="Repartition des presences pour les bureaux."
        data={analytics.presencesByBureau}
      />
    );
  }

  if (visibility.canReadConges && visibility.canReadProvince) {
    cards.push(
      <PieChartCard
        key="conges-by-province"
        title="Demandes conge par province"
        description="Repartition des demandes de conge par province."
        data={analytics.congesByProvince}
      />
    );
  }

  if (visibility.canReadConges && visibility.canReadType) {
    cards.push(
      <PieChartCard
        key="conges-by-station"
        title="Demandes conge par station"
        description="Repartition des demandes de conge par station."
        data={analytics.congesByStation}
      />
    );
  }

  if (visibility.canReadConges && visibility.canReadOrganisation) {
    cards.push(
      <PieChartCard
        key="conges-by-direction"
        title="Demandes conge par direction"
        description="Repartition des demandes de conge pour les directions."
        data={analytics.congesByDirection}
      />
    );
    cards.push(
      <PieChartCard
        key="conges-by-sous-direction"
        title="Demandes conge par sous-direction"
        description="Repartition des demandes de conge pour les sous-directions."
        data={analytics.congesBySousDirection}
      />
    );
    cards.push(
      <PieChartCard
        key="conges-by-bureau"
        title="Demandes conge par bureau"
        description="Repartition des demandes de conge pour les bureaux."
        data={analytics.congesByBureau}
      />
    );
  }

  if (visibility.canReadConges && visibility.canReadAgents) {
    cards.push(
      <PieChartCard
        key="conges-by-sex"
        title="Demandes conge par sexe"
        description="Comparaison des demandes de conge Hommes/Femmes/Autre."
        data={analytics.congesBySex}
      />
    );
  }

  if (visibility.canReadAgents && visibility.canReadProvince) {
    cards.push(
      <PieChartCard
        key="retraites-by-province"
        title="Retraites par province"
        description="Agents de 60 ans et plus par province."
        data={analytics.retraitesByProvince}
      />
    );
  }

  if (visibility.canReadAgents && visibility.canReadType) {
    cards.push(
      <PieChartCard
        key="retraites-by-station"
        title="Retraites par station"
        description="Agents de 60 ans et plus par station."
        data={analytics.retraitesByStation}
      />
    );
  }

  if (visibility.canReadAgents && visibility.canReadOrganisation) {
    cards.push(
      <PieChartCard
        key="retraites-by-direction"
        title="Retraites par direction"
        description="Agents de 60 ans et plus par direction."
        data={analytics.retraitesByDirection}
      />
    );
    cards.push(
      <PieChartCard
        key="retraites-by-sous-direction"
        title="Retraites par sous-direction"
        description="Agents de 60 ans et plus par sous-direction."
        data={analytics.retraitesBySousDirection}
      />
    );
    cards.push(
      <PieChartCard
        key="retraites-by-bureau"
        title="Retraites par bureau"
        description="Agents de 60 ans et plus par bureau."
        data={analytics.retraitesByBureau}
      />
    );
  }

  if (visibility.canReadAgents) {
    cards.push(
      <PieChartCard
        key="retraites-by-sex"
        title="Retraites par sexe"
        description="Comparaison Hommes/Femmes/Autre pour les agents de 60 ans et plus."
        data={analytics.retraitesBySex}
      />
    );
  }

  if (!cards.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Analyses circulaires</h2>
      {(visibility.canReadPresence || visibility.canReadConges || visibility.canReadAgents) && (
        <p className="text-sm text-muted-foreground">
          Les diagrammes ci-dessous sont regroupes par province, station, direction, sous-direction, bureau et sexe selon vos permissions.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{cards}</div>
    </section>
  );
}
