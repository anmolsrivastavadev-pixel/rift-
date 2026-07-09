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
import { NoSearchResultsEmpty } from "@/components/opportunities/empty-states";
import { RunOpportunitiesButton } from "@/components/opportunities/run-button";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { projectHref } from "@/lib/project-href";

type CardData = React.ComponentProps<typeof OpportunityCard>["op"];

const MAX_COMPARE = 3;

/**
 * Client-side browser for opportunities.
 * All search / filter / sort operate on the already-loaded dataset.
 * No database requests happen while interacting.
 */
export function OpportunityBrowser({
  opportunities,
  projectId,
  dimmed = false,
}: {
  opportunities: CardData[];
  projectId: string;
  /** True while a rerun is replacing these ideas — dims the grid. */
  dimmed?: boolean;
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

  const compareParam = Array.from(selectedIds).join(",");

  return (
    // pb-24 while the fixed compare tray is up, so it never covers the last
    // row of cards mid-selection.
    <div className={`space-y-4 ${selectedIds.size > 0 ? "pb-24" : ""}`}>
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

      {maxReached && (
        <p className="rounded-[8px] bg-[var(--color-warning)]/10 px-3 py-2 text-xs text-[var(--color-warning)]" role="alert">
          Compare up to 3 ideas at a time.
        </p>
      )}

      {filtered.length === 0 ? (
        <NoSearchResultsEmpty onReset={onReset} />
      ) : (
        <>
          {dimmed && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Replacing these ideas…
            </p>
          )}
          <div
            className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
              dimmed ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {filtered.map((op) => (
              <OpportunityCard
                key={op.id}
                op={op}
                projectId={projectId}
                selected={selectedIds.has(op.id)}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>
        </>
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
                {selectedIds.size < 2
                  ? "Select at least one more idea to compare."
                  : "Compare them and pick one to test."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
              {/* An anchor can't be :disabled, so render a real disabled
                  button until 2+ ideas are selected. */}
              {selectedIds.size < 2 ? (
                <Button disabled>
                  <LayoutGrid className="h-4 w-4" /> Compare selected ideas
                </Button>
              ) : (
                <Button asChild>
                  <Link
                    href={projectHref(
                      `/dashboard/opportunities/decision-board?compare=${compareParam}`,
                      projectId
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" /> Compare selected ideas
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Client wrapper for the "ideas exist" state: owns the rerun-running flag so
 * the card grid can dim while a rerun replaces it. Renders the rerun
 * Disclosure (with the run button) above the browser. The server page passes
 * `capNotice` as a prerendered node so quota/cap logic stays server-side.
 */
export function OpportunityWorkspace({
  opportunities,
  projectId,
  complaintCount,
  capNotice,
  quotaExhausted,
  freeRunLimit,
  resumeJobId,
}: {
  opportunities: CardData[];
  projectId: string;
  complaintCount: number;
  capNotice?: React.ReactNode;
  quotaExhausted: boolean;
  freeRunLimit?: number;
  resumeJobId: string | null;
}) {
  const [running, setRunning] = React.useState(false);

  return (
    <div className="space-y-8">
      <Disclosure
        title="Run analysis again"
        suffix="· replaces current ideas"
      >
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Rift will use {complaintCount} complaint
          {complaintCount === 1 ? "" : "s"} from this project.
        </p>
        {capNotice}
        <div className="mt-4">
          <RunOpportunitiesButton
            projectId={projectId}
            hasIdeas
            showSkeletons={false}
            quotaExhausted={quotaExhausted}
            freeRunLimit={freeRunLimit}
            resumeJobId={resumeJobId}
            onRunningChange={setRunning}
          />
        </div>
      </Disclosure>

      <OpportunityBrowser
        opportunities={opportunities}
        projectId={projectId}
        dimmed={running}
      />
    </div>
  );
}
