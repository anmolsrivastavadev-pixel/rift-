"use client";

import * as React from "react";

import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { CompareTray } from "@/components/opportunities/opportunity-browser";
import { projectHref } from "@/lib/project-href";
import type { DecisionStatus } from "@/lib/decision-board";

type CardData = React.ComponentProps<typeof OpportunityCard>["op"];

export type SavedCard = CardData & {
  decisionStatus?: DecisionStatus | null;
};

const MAX_COMPARE = 3;

/**
 * Thin client wrapper for the Saved page grid: the same select-to-compare
 * mechanic as the Ideas browser (2–3 ideas, sticky CompareTray), linking to
 * the Decisions board with `from=saved` so its back link returns here.
 * Unsaves refresh the route so removed cards disappear immediately.
 */
export function SavedBrowser({
  cards,
  projectId,
}: {
  cards: SavedCard[];
  projectId: string;
}) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [maxReached, setMaxReached] = React.useState(false);

  const toggleCompare = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setMaxReached(false);
      } else {
        if (next.size >= MAX_COMPARE) {
          setMaxReached(true);
          return prev;
        }
        next.add(id);
        setMaxReached(false);
      }
      return next;
    });
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
    setMaxReached(false);
  }, []);

  // Auto-dismiss max-reached message after 3 seconds.
  React.useEffect(() => {
    if (!maxReached) return;
    const t = setTimeout(() => setMaxReached(false), 3000);
    return () => clearTimeout(t);
  }, [maxReached]);

  const compareParam = Array.from(selectedIds).join(",");

  return (
    // pb-24 while the fixed compare tray is up, so it never covers the last
    // row of cards mid-selection.
    <div className={`space-y-4 ${selectedIds.size > 0 ? "pb-24" : ""}`}>
      {maxReached && (
        <p
          className="rounded-lg bg-[var(--color-warning)]/10 px-3 py-2 text-xs text-[var(--color-warning)]"
          role="alert"
        >
          Compare up to 3 ideas at a time.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((op) => (
          <OpportunityCard
            key={op.id}
            op={op}
            projectId={projectId}
            selected={selectedIds.has(op.id)}
            onToggleCompare={toggleCompare}
            decisionStatus={op.decisionStatus}
            refreshOnUnsave
          />
        ))}
      </div>

      <CompareTray
        count={selectedIds.size}
        onClear={clearSelection}
        href={projectHref(
          `/dashboard/opportunities/decision-board?compare=${compareParam}&from=saved`,
          projectId
        )}
      />
    </div>
  );
}
