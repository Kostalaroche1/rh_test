"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Network } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collectTypeDescendants, getTypeRoots } from "./helpers";
import type { DirectionTreeNode, OrganisationType } from "./types";
import HierarchyListSection from "./HierarchyListSection";

type FlattenedDirectionRow = {
  node: DirectionTreeNode;
  depth: number;
};

function sumForNodeAndDescendants(
  node: DirectionTreeNode,
  counts: Map<number, number> | undefined
): number {
  const own = counts?.get(node.id) ?? 0;
  return node.children.reduce<number>(
    (sum, child) => sum + sumForNodeAndDescendants(child, counts),
    own,
  );
}

function flattenDirectionRows(nodes: DirectionTreeNode[], depth = 0): FlattenedDirectionRow[] {
  const rows: FlattenedDirectionRow[] = [];
  for (const node of nodes) {
    rows.push({ node, depth });
    rows.push(...flattenDirectionRows(node.children, depth + 1));
  }
  return rows;
}

function flattenTypeRows(
  parentId: number,
  childrenByParent: Map<number, OrganisationType[]>,
  depth = 0
): Array<{ type: OrganisationType; depth: number }> {
  const children = childrenByParent.get(parentId) ?? [];
  const rows: Array<{ type: OrganisationType; depth: number }> = [];
  for (const child of children) {
    rows.push({ type: child, depth });
    rows.push(...flattenTypeRows(child.id, childrenByParent, depth + 1));
  }
  return rows;
}

export default function OrganisationHierarchyCard({
  types,
  directionTreeByTypeId,
  presenceCountByDirectionId,
  congeCountByDirectionId,
}: {
  types: OrganisationType[];
  directionTreeByTypeId: Map<number, DirectionTreeNode[]>;
  presenceCountByDirectionId?: Map<number, number>;
  congeCountByDirectionId?: Map<number, number>;
}) {
  const typeRoots = useMemo(() => getTypeRoots(types), [types]);
  const [selectedRootId, setSelectedRootId] = useState("");

  useEffect(() => {
    if (!typeRoots.length) {
      setSelectedRootId("");
      return;
    }

    if (!selectedRootId || !typeRoots.some((root) => String(root.id) === selectedRootId)) {
      setSelectedRootId(String(typeRoots[0].id));
    }
  }, [selectedRootId, typeRoots]);

  const childrenByParent = useMemo(() => {
    const map = new Map<number, OrganisationType[]>();
    for (const type of types) {
      const parentId = type.parentId ?? 0;
      const list = map.get(parentId) ?? [];
      list.push(type);
      map.set(parentId, list);
    }
    for (const entry of map.values()) {
      entry.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0) || a.nom.localeCompare(b.nom));
    }
    return map;
  }, [types]);

  const typeById = useMemo(() => {
    return new Map(types.map((type) => [type.id, type]));
  }, [types]);

  const selectedRoot = selectedRootId ? typeById.get(Number(selectedRootId)) ?? null : null;
  const descendantTypeIds = useMemo(() => {
    if (!selectedRoot) return [];
    return collectTypeDescendants(selectedRoot.id, types);
  }, [selectedRoot, types]);

  const selectedDirectionTrees = useMemo(() => {
    return descendantTypeIds.map((typeId) => ({
      type: typeById.get(typeId),
      tree: directionTreeByTypeId.get(typeId) ?? [],
    }));
  }, [descendantTypeIds, directionTreeByTypeId, typeById]);

  const stationRows = useMemo(() => {
    if (!selectedRoot) return [];
    return flattenTypeRows(selectedRoot.id, childrenByParent);
  }, [childrenByParent, selectedRoot]);

  const directionGroups = useMemo(() => {
    return selectedDirectionTrees
      .map((item) => ({
        type: item.type,
        rows: flattenDirectionRows(item.tree),
      }))
      .filter(
        (
          item
        ): item is {
          type: OrganisationType;
          rows: FlattenedDirectionRow[];
        } => Boolean(item.type)
      );
  }, [selectedDirectionTrees]);

  const directionRowsCount = useMemo(() => {
    return directionGroups.reduce((sum, group) => sum + group.rows.length, 0);
  }, [directionGroups]);

  return (
    <Card className="erp-panel">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Arborescence organisationnelle</CardTitle>
            <CardDescription>
              Les stations racines sont affichees comme directions generales, puis sous-stations, directions et bureaux.
            </CardDescription>
          </div>
          <Badge variant="outline">
            <Network className="mr-1 h-3.5 w-3.5" />
            {typeRoots.length} direction(s) generale(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!typeRoots.length ? (
          <p className="text-sm text-muted-foreground">Aucune station accessible dans votre portee.</p>
        ) : (
          <>
            <Select value={selectedRootId} onValueChange={setSelectedRootId}>
              <SelectTrigger className="w-full md:w-[360px]">
                <SelectValue placeholder="Choisir une direction generale" />
              </SelectTrigger>
              <SelectContent>
                {typeRoots.map((root) => (
                  <SelectItem key={root.id} value={String(root.id)}>
                    {root.code} - {root.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRoot && (
              <div className="grid gap-4 xl:grid-cols-2">
                <HierarchyListSection
                  title="Stations et sous-stations"
                  current={stationRows.length + 1}
                  total={Math.max(types.length, stationRows.length + 1)}
                  helperText="Direction generale selectionnee, puis ses sous-stations."
                >
                  <div className="space-y-2">
                    <div className="rounded-lg border border-border/60 bg-background/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Direction generale</p>
                      <p className="text-sm font-semibold">
                        {selectedRoot.code} - {selectedRoot.nom}
                      </p>
                    </div>

                    {stationRows.length > 0 ? (
                      stationRows.map((row) => (
                        <div
                          key={`type-${row.type.id}`}
                          className="rounded-lg border border-border/60 bg-background/20 px-3 py-2"
                          style={{ marginLeft: `${Math.min(row.depth * 16, 48)}px` }}
                        >
                          <p className="text-xs text-muted-foreground">Sous-station</p>
                          <p className="text-sm font-medium">
                            {row.type.code} - {row.type.nom}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune sous-station rattachee.</p>
                    )}
                  </div>
                </HierarchyListSection>

                <HierarchyListSection
                  title="Directions, sous-directions et bureaux"
                  current={directionRowsCount}
                  total={directionRowsCount}
                  helperText="Liste hierarchique par station avec compteurs P (presences) et C (conges)."
                >
                  {directionGroups.every((group) => group.rows.length === 0) ? (
                    <p className="text-sm text-muted-foreground">
                      Aucune direction liee a cette direction generale dans la portee visible.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {directionGroups.map((group) => {
                        if (group.rows.length === 0) return null;
                        return (
                          <div key={group.type.id} className="rounded-lg border border-border/60 p-3">
                            <p className="mb-2 flex items-center gap-1 text-sm font-semibold">
                              <Building2 className="h-4 w-4" />
                              {group.type.code} - {group.type.nom}
                            </p>
                            <div className="space-y-1">
                              {group.rows.map((row) => (
                                <div
                                  key={`dir-${group.type.id}-${row.node.id}`}
                                  className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/20"
                                  style={{ marginLeft: `${Math.min(row.depth * 14, 42)}px` }}
                                >
                                  <span className="text-muted-foreground">
                                    {row.depth === 0 ? "Direction" : "Sous-direction / Bureau"}
                                  </span>
                                  <span className="font-medium">
                                    {row.node.code} - {row.node.nom}
                                  </span>
                                  <Badge variant="outline" className="ml-1 text-[10px]">
                                    P {sumForNodeAndDescendants(row.node, presenceCountByDirectionId)}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px]">
                                    C {sumForNodeAndDescendants(row.node, congeCountByDirectionId)}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </HierarchyListSection>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
