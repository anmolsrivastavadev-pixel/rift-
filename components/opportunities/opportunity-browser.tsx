"use client";

import * as React from "react";

import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import {
  OpportunityFilters,
  DEFAULT_FILTERS,
  type FilterState,
} from "@/components/opportunities/filters";
import {
  NoOpportunitiesEmpty,
  NoSearchResultsEmpty,
} from "@/components/opportunities/empty-states";

type CardData = React.ComponentProps<typeof OpportunityCard>["op"];

/**
 * Client-side browser for opportunities.
 * All search / filter / sort operate on the already-loaded dataset.
 * No database requests happen while interacting.
 */
export function OpportunityBrowser({
  opportunities,
}: {
  opportunities: CardData[];
}) {
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);

  const setState = React.useCallback(
    (patch: Partial<FilterState> | ((prev: FilterState) => Partial<FilterState>)) =>
      setFilters((prev) => ({
        ...prev,
        ...(typeof patch === "function" ? patch(prev) : patch),
      })),
    []
  );

  const onReset = React.useCallback(
    () => setFilters(DEFAULT_FILTERS),
    []
  );

  const industries = React.useMemo(
    () => Array.from(new Set(opportunities.map((o) => o.industry))).sort(),
    [opportunities]
  );

  const filtered = React.useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    let list = opportunities;

    if (q) {
      list = list.filter((o) => {
        const hay = [
          o.title,
          o.summary,
          o.industry,
          o.suggestedSoftware,
          ...o.keywords,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (filters.industry !== "All") {
      list = list.filter((o) => o.industry === filters.industry);
    }
    if (filters.minScore > 0) {
      list = list.filter((o) => o.opportunityScore >= filters.minScore);
    }
    if (filters.minSeverity > 0) {
      list = list.filter((o) => (o.severity ?? 0) >= filters.minSeverity);
    }
    if (filters.minComplaints > 0) {
      list = list.filter((o) => o.mentions >= filters.minComplaints);
    }

    const sorted = [...list];
    switch (filters.sort) {
      case "score-desc":
        sorted.sort((a, b) => b.opportunityScore - a.opportunityScore);
        break;
      case "score-asc":
        sorted.sort((a, b) => a.opportunityScore - b.opportunityScore);
        break;
      case "severity-desc":
        sorted.sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0));
        break;
      case "mentions-desc":
        sorted.sort((a, b) => b.mentions - a.mentions);
        break;
      case "newest":
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }
    return sorted;
  }, [filters, opportunities]);

  if (opportunities.length === 0) {
    return <NoOpportunitiesEmpty />;
  }

  return (
    <div className="space-y-4">
      <OpportunityFilters
        state={filters}
        setState={setState}
        industries={industries}
        onReset={onReset}
      />

      <p className="text-xs text-[var(--color-muted-foreground)]" aria-live="polite">
        Showing {filtered.length} of {opportunities.length} opportunit
        {filtered.length === 1 ? "y" : "ies"}
      </p>

      {filtered.length === 0 ? (
        <NoSearchResultsEmpty onReset={onReset} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((op) => (
            <OpportunityCard key={op.id} op={op} />
          ))}
        </div>
      )}
    </div>
  );
}