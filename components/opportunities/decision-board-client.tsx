"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Users,
  AlertTriangle,
  Target,
  Sparkles,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  computeTestingPriority,
  TESTING_PRIORITY_LABELS,
  TESTING_PRIORITY_HELPER,
  DECISION_LABELS,
  type DecisionStatus,
} from "@/lib/decision-board";
import {
  DecisionStatusSelect,
  useDecisionStatuses,
} from "@/components/opportunities/decision-status-select";

export type DecisionBoardOpportunity = {
  id: string;
  title: string;
  summary: string;
  industry: string;
  opportunityScore: number;
  mentions: number;
  severity: number | null;
  confidence: number | null;
  suggestedSoftware: string;
  targetCustomer?: string | null;
  productAngle?: string | null;
  validationQuestions: string[];
  riskFlags: string[];
  createdAt: Date;
};

type FilterValue = "all" | DecisionStatus;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pursue", label: "Pursue" },
  { value: "park", label: "Park" },
  { value: "reject", label: "Reject" },
  { value: "undecided", label: "Undecided" },
];

function scoreColor(score: number): string {
  if (score >= 70) return "text-[var(--color-success)]";
  if (score >= 40) return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

function priorityColor(priority: string): string {
  switch (priority) {
    case "strong-signal":
      return "text-[var(--color-success)]";
    case "worth-testing":
      return "text-[var(--color-primary)]";
    case "needs-more-evidence":
      return "text-[var(--color-warning)]";
    case "high-risk":
      return "text-[var(--color-danger)]";
    default:
      return "text-[var(--color-muted-foreground)]";
  }
}

export function DecisionBoardClient({
  opportunities,
}: {
  opportunities: DecisionBoardOpportunity[];
}) {
  const ids = React.useMemo(() => opportunities.map((o) => o.id), [opportunities]);
  const { statuses, hydrated, setStatus } = useDecisionStatuses(ids);
  const [filter, setFilter] = React.useState<FilterValue>("all");

  // Resolve the effective status for each opportunity (default undecided).
  const resolveStatus = (id: string): DecisionStatus =>
    hydrated ? statuses[id] ?? "undecided" : "undecided";

  // Summary counts.
  const counts = React.useMemo(() => {
    const c = { total: opportunities.length, pursue: 0, park: 0, reject: 0, undecided: 0 };
    for (const o of opportunities) {
      const s = resolveStatus(o.id);
      c[s]++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunities, statuses, hydrated]);

  // Filter.
  const filtered = React.useMemo(() => {
    if (filter === "all") return opportunities;
    return opportunities.filter((o) => resolveStatus(o.id) === filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, opportunities, statuses, hydrated]);

  if (opportunities.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <DecisionBoardHeader />
        <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
          <Target className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)]" />
          <h2 className="mt-4 text-base font-semibold">No opportunities to compare yet</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Add complaints, then run AI clustering to generate opportunities
            before using the Decision Board.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard/complaints">Go to Complaints</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/opportunities">Go to Opportunities</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DecisionBoardHeader />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryCard label="Total" value={counts.total} />
        <SummaryCard label="Pursue" value={counts.pursue} accent="success" />
        <SummaryCard label="Park" value={counts.park} accent="warning" />
        <SummaryCard label="Reject" value={counts.reject} accent="danger" />
        <SummaryCard label="Undecided" value={counts.undecided} accent="muted" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`rounded-[8px] px-3 py-1.5 text-xs transition-colors duration-150 ease-out focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)] ${
              filter === f.value
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
          {filtered.length} of {opportunities.length}
        </span>
      </div>

      {/* Testing Priority helper */}
      <p className="flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
        <Info className="h-3 w-3" /> {TESTING_PRIORITY_HELPER}
      </p>

      {/* Opportunity comparison cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((op) => {
          const status = resolveStatus(op.id);
          const priority = computeTestingPriority({
            opportunityScore: op.opportunityScore,
            mentions: op.mentions,
            confidence: op.confidence,
            riskFlags: op.riskFlags,
          });
          return (
            <div
              key={op.id}
              className="flex flex-col rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    <Briefcase className="h-3 w-3" />
                    {op.industry}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
                    <Link
                      href={`/dashboard/opportunities/${op.id}`}
                      className="hover:text-[var(--color-primary)] hover:underline"
                    >
                      {op.title}
                    </Link>
                  </h3>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`text-xl font-bold leading-none ${scoreColor(op.opportunityScore)}`}>
                    {op.opportunityScore}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    Score
                  </span>
                </div>
              </div>

              {/* Testing Priority */}
              <div className="mt-2">
                <span className={`text-xs font-medium ${priorityColor(priority)}`}>
                  {TESTING_PRIORITY_LABELS[priority]}
                </span>
              </div>

              {/* Product opportunity + target customer */}
              <p className="mt-2 line-clamp-2 text-xs text-[var(--color-muted-foreground)]">
                <span className="font-medium text-[var(--color-foreground)]/80">
                  Product:
                </span>{" "}
                {op.suggestedSoftware}
              </p>
              {op.targetCustomer && (
                <p className="mt-1 line-clamp-1 text-xs text-[var(--color-muted-foreground)]">
                  <span className="font-medium text-[var(--color-foreground)]/80">
                    For:
                  </span>{" "}
                  {op.targetCustomer}
                </p>
              )}

              {/* Mini stats */}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--color-muted-foreground)]">
                <Stat icon={Users} label="Complaints" value={op.mentions} />
                <Stat
                  icon={AlertTriangle}
                  label="Severity"
                  value={op.severity !== null ? op.severity.toFixed(1) : "—"}
                />
                <Stat
                  icon={Target}
                  label="Confidence"
                  value={op.confidence !== null ? `${op.confidence}%` : "—"}
                />
                <Stat icon={Sparkles} label="Risks" value={op.riskFlags.length} />
                <Stat
                  icon={Info}
                  label="Questions"
                  value={op.validationQuestions.length}
                />
              </div>

              {/* Decision status selector */}
              <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                <span className="text-[11px] text-[var(--color-muted-foreground)]">
                  {hydrated ? DECISION_LABELS[status] : "—"}
                </span>
                <DecisionStatusSelect
                  opportunityId={op.id}
                  value={status}
                  onChange={(s) => setStatus(op.id, s)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-[var(--color-muted-foreground)]">
          No opportunities match this filter.
        </p>
      )}

      <p className="flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
        <Info className="h-3 w-3" /> Saved only in this browser.
      </p>
    </div>
  );
}

function DecisionBoardHeader() {
  return (
    <div>
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/opportunities">
          <ArrowLeft className="h-4 w-4" /> Back to opportunities
        </Link>
      </Button>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Opportunity Decision Board
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Compare opportunities by evidence, risk, and testing readiness before
        deciding what to validate next.
      </p>
      <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
        Saved opportunities are bookmarks. Decision status is your local
        next-step choice for each opportunity.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "success" | "warning" | "danger" | "muted";
}) {
  const colorClass =
    accent === "success"
      ? "text-[var(--color-success)]"
      : accent === "warning"
        ? "text-[var(--color-warning)]"
        : accent === "danger"
          ? "text-[var(--color-danger)]"
          : accent === "muted"
            ? "text-[var(--color-muted-foreground)]"
            : "text-[var(--color-foreground)]";
  return (
    <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center">
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3 w-3" />
      <span className="font-medium text-[var(--color-foreground)]">{value}</span>
      <span className="text-[10px]">{label}</span>
    </span>
  );
}
