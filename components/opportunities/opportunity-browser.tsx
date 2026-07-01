"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";

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
import { Button } from "@/components/ui/button";

type CardData = React.ComponentProps<typeof OpportunityCard>["op"];

const MAX_COMPARE = 3;

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
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [maxReached, setMaxReached] = React.useState(false);

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
          o.targetCustomer ?? "",
          o.productAngle ?? "",
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

  const compareParam = Array.from(selectedIds).join(",");

  return (
    <div className="space-y-4">
      <OpportunityFilters
        state={filters}
        setState={setState}
        industries={industries}
        onReset={onReset}
      />

      <p className="text-xs text-[var(--color-muted-foreground)]" aria-live="polite">
        Showing {filtered.length} of {opportunities.length} idea
        {filtered.length === 1 ? "" : "s"}
      </p>

      {/* Beginner guide — what to do next */}
      <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="text-sm font-semibold">What to do next</h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Start with the highest-scoring idea, then check whether the evidence
          makes sense. A good business idea should have a clear person, a
          repeated problem, and a simple solution you could test.
        </p>

        <ol className="mt-3 grid gap-2 text-xs text-[var(--color-muted-foreground)] sm:grid-cols-2">
          <li className="flex gap-2">
            <span className="font-medium text-[var(--color-foreground)]">1.</span>
            <span>
              <strong className="font-medium text-[var(--color-foreground)]">
                Open an idea
              </strong>{" "}
              — start with a high score, but do not trust the score alone.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-[var(--color-foreground)]">2.</span>
            <span>
              <strong className="font-medium text-[var(--color-foreground)]">
                Read the evidence
              </strong>{" "}
              — check the real complaints that created the idea.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-[var(--color-foreground)]">3.</span>
            <span>
              <strong className="font-medium text-[var(--color-foreground)]">
                Turn it into a business idea
              </strong>{" "}
              — ask: who has this problem, what are they struggling with, and
              what could I build to help?
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-[var(--color-foreground)]">4.</span>
            <span>
              <strong className="font-medium text-[var(--color-foreground)]">
                Decide what to do next
              </strong>{" "}
              — save it, compare it with other ideas, or talk to real people
              before building.
            </span>
          </li>
        </ol>

        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
          <strong className="font-medium text-[var(--color-foreground)]">
            Business idea
          </strong>{" "}
          = a specific person + repeated problem + possible solution.
        </p>
        <p className="mt-1 text-[11px] italic text-[var(--color-muted-foreground)]">
          Example: Students who feel overwhelmed by revision need a simple app
          that tells them what to study next.
        </p>
        <p className="mt-2 text-[10px] text-[var(--color-muted-foreground)]">
          Scores help you choose what to inspect first. They do not prove an
          idea will work.
        </p>
        <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
          Not sure which idea to choose? Select 2–3 ideas and compare them side
          by side.
        </p>
      </div>

      {maxReached && (
        <p className="rounded-[8px] bg-[var(--color-warning)]/10 px-3 py-2 text-xs text-[var(--color-warning)]" role="alert">
          Compare up to 3 ideas at a time.
        </p>
      )}

      {filtered.length === 0 ? (
        <NoSearchResultsEmpty onReset={onReset} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((op) => (
            <OpportunityCard
              key={op.id}
              op={op}
              selected={selectedIds.has(op.id)}
              onToggleCompare={toggleCompare}
            />
          ))}
        </div>
      )}

      {/* Sticky compare tray */}
      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-card)] shadow-lg">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {selectedIds.size} idea{selectedIds.size === 1 ? "" : "s"} selected
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Compare 2–3 ideas to choose which one to test first.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
              <Button asChild disabled={selectedIds.size < 2}>
                <Link
                  href={`/dashboard/opportunities/decision-board?compare=${compareParam}`}
                >
                  <LayoutGrid className="h-4 w-4" /> Compare selected ideas
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
