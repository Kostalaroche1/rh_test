"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Building2, Network } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collectTypeDescendants, getTypeRoots } from "./helpers";
import type { DirectionTreeNode, OrganisationType } from "./types";

function renderDirectionTree(nodes: DirectionTreeNode[], depth = 0): ReactNode {
  if (!nodes.length) return null;

  return (
    <ul className={depth === 0 ? "space-y-2" : "space-y-1 pl-4"}>
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{depth === 0 ? "Direction" : "Sous-direction / Bureau"}</span>
            <span className="font-medium">
              {node.code} - {node.nom}
            </span>
          </div>
          {renderDirectionTree(node.children, depth + 1)}
        </li>
      ))}
    </ul>
  );
}

function renderTypeTree(
  typeId: number,
  childrenByParent: Map<number, OrganisationType[]>,
  depth = 0
): ReactNode {
  const children = childrenByParent.get(typeId) ?? [];
  if (!children.length) return null;

  return (
    <ul className={depth === 0 ? "space-y-1" : "space-y-1 pl-4"}>
      {children.map((child) => (
        <li key={child.id}>
          <span className="text-sm">
            {depth === 0 ? "Sous-station" : "Niveau inferieur"}:{" "}
            <span className="font-medium">
              {child.code} - {child.nom}
            </span>
          </span>
          {renderTypeTree(child.id, childrenByParent, depth + 1)}
        </li>
      ))}
    </ul>
  );
}

export default function OrganisationHierarchyCard({
  types,
  directionTreeByTypeId,
}: {
  types: OrganisationType[];
  directionTreeByTypeId: Map<number, DirectionTreeNode[]>;
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
                <Card className="border border-border/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Stations et sous-stations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      Direction generale:{" "}
                      <span className="font-semibold">
                        {selectedRoot.code} - {selectedRoot.nom}
                      </span>
                    </div>
                    {renderTypeTree(selectedRoot.id, childrenByParent)}
                  </CardContent>
                </Card>

                <Card className="border border-border/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Directions, sous-directions et bureaux</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedDirectionTrees.every((item) => item.tree.length === 0) ? (
                      <p className="text-sm text-muted-foreground">
                        Aucune direction liee a cette direction generale dans la portee visible.
                      </p>
                    ) : (
                      selectedDirectionTrees.map((item) => {
                        if (!item.type || item.tree.length === 0) return null;
                        return (
                          <div key={item.type.id} className="rounded-lg border border-border/60 p-3">
                            <p className="mb-2 flex items-center gap-1 text-sm font-semibold">
                              <Building2 className="h-4 w-4" />
                              {item.type.code} - {item.type.nom}
                            </p>
                            {renderDirectionTree(item.tree)}
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
