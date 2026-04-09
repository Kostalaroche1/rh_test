"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function formatRatio(current: number, total?: number) {
  const safeCurrent = Number.isFinite(current) ? Math.max(0, current) : 0;
  const safeTotal = Number.isFinite(total) ? Math.max(0, Number(total)) : safeCurrent;
  return `${safeCurrent}/${safeTotal || safeCurrent || 0}`;
}

export default function HierarchyListSection({
  title,
  current,
  total,
  helperText,
  defaultOpen = true,
  children,
}: {
  title: string;
  current: number;
  total?: number;
  helperText?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group/hierarchy rounded-xl border border-border/70 bg-card/40">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
        >
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{title}</p>
            <Badge variant="outline" className="text-xs">
              {formatRatio(current, total)}
            </Badge>
          </div>
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/hierarchy:rotate-180" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-t border-border/60 px-4 py-3">
        {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
