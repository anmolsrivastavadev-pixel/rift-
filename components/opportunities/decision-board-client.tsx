"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Users,
  AlertTriangle,
  LayoutGrid,
  ShieldAlert,
  Target,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { NoDecisionStatusEmpty } from "@/components/opportunities/empty-states";
import {
  computeTestingPriority,
  TESTING_PRIORITY_LABELS,
  TESTING_PRIORITY_HELPER,
  type DecisionStatus,
} from "@/lib/decision-board";
import {
  DecisionStatusSelect,
  useDecisionStatuses,
} from "@/components/opportunities/decision-status-select";
import { projectHref } from "@/lib/project-href";

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

/* Section order for the grouped default view: decided work first, the
 * undecided backlog next, rejected history last. Empty sections are omitted. */
const STATUS_SECTIONS: { status: DecisionStatus; heading: string }[] = [
  { status: "pursue", heading: "Pursue" },
  { status: "park", heading: "Park" },
  { status: "undecided", heading: "Undecided" },
  { status: "reject", heading: "Rejected" },
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

function evidenceStrength(
  mentions: number,
  confidence: number | null
): { label: string; color: string } {
  const conf = confidence ?? 0;
  if (mentions >= 8 && conf >= 80) {
    return { label: "Strong", color: "text-[var(--color-success)]" };
  }
  if (mentions >= 4 || conf >= 65) {
    return { label: "Medium", color: "text-[var(--color-primary)]" };
  }
  return { label: "Early", color: "text-[var(--color-warning)]" };
}

function difficultyToTest(
  riskFlags: string[],
  hasTarget: boolean,
  hasAngle: boolean
): string {
  const riskCount = riskFlags.length;
  if (riskCount <= 1 && hasTarget && hasAngle) return "Easy to test";
  if (riskCount <= 2 && (hasTarget || hasAngle)) return "Moderate to test";
  return "Harder to test";
}

export function DecisionBoardClient({
  opportunities,
  isCompareMode = false,
  projectId,
  initialStatuses,
  backHref,
  backLabel,
}: {
  opportunities: DecisionBoardOpportunity[];
  isCompareMode?: boolean;
  projectId: string;
  initialStatuses: Record<string, DecisionStatus>;
  /** Override the back link (e.g. "/dashboard/saved" when arriving from the
   * Saved page). projectId is appended via projectHref either way. */
  backHref?: string;
  backLabel?: string;
}) {
  const { statuses, hydrated, setStatus } = useDecisionStatuses(initialStatuses);
  const [filter, setFilter] = React.useState<FilterValue>("all");

  const resolveStatus = (id: string): DecisionStatus =>
    hydrated ? statuses[id] ?? "undecided" : "undecided";

  const counts = React.useMemo(() => {
    const c = { total: opportunities.length, pursue: 0, park: 0, reject: 0, undecided: 0 };
    for (const o of opportunities) {
      const s = resolveStatus(o.id);
      c[s]++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunities, statuses, hydrated]);

  const filtered = React.useMemo(() => {
    if (filter === "all") return opportunities;
    return opportunities.filter((o) => resolveStatus(o.id) === filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, opportunities, statuses, hydrated]);

  if (opportunities.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <DecisionBoardHeader
          isCompareMode={isCompareMode}
          projectId={projectId}
          backHref={backHref}
          backLabel={backLabel}
        />
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
          <Target className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)]" />
          <h2 className="mt-4 text-base font-semibold">No ideas to compare yet</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {isCompareMode
              ? "The ideas you selected could not be found. Try selecting ideas again from the Ideas page."
              : "Add data, then find ideas before using Compare ideas."}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href={projectHref("/dashboard/complaints", projectId)}>
                Go to Complaints
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={projectHref("/dashboard/opportunities", projectId)}>
                Go to Ideas
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompareMode) {
    // Pure display comparison of already-rendered scores: mark the leading
    // column so the eye lands on the current winner first.
    const topScore = Math.max(...filtered.map((o) => o.opportunityScore));
    const topScoreId =
      filtered.length > 1
        ? (filtered.find((o) => o.opportunityScore === topScore)?.id ?? null)
        : null;
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <DecisionBoardHeader
          isCompareMode={isCompareMode}
          projectId={projectId}
          backHref={backHref}
          backLabel={backLabel}
        />

        {/* Side-by-side comparison table: fixed layout keeps the columns
            equal, and the sticky label column stays visible while scrolling
            horizontally on smaller screens. */}
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]">
          <table className="w-full min-w-[560px] table-fixed text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="sticky left-0 z-10 w-32 bg-[var(--color-card)] py-3 pl-4 pr-4 text-left font-medium text-[var(--color-muted-foreground)]">
                  <span className="sr-only">Comparison category</span>
                </th>
                {filtered.map((op) => (
                  <th
                    key={op.id}
                    scope="col"
                    className="px-4 py-3 text-left font-medium text-[var(--color-foreground)]"
                  >
                    <Link
                      href={projectHref(`/dashboard/opportunities/${op.id}`, projectId)}
                      className="hover:text-[var(--color-primary)] hover:underline"
                    >
                      {op.title}
                    </Link>
                    {topScoreId === op.id && (
                      <div className="mt-1.5">
                        <Badge variant="success">Top score</Badge>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow
                label="Score"
                values={filtered.map((op) => (
                  <span key={op.id} className={`text-lg font-bold ${scoreColor(op.opportunityScore)}`}>
                    {op.opportunityScore}
                  </span>
                ))}
              />
              <CompareRow
                label="Evidence strength"
                values={filtered.map((op) => {
                  const str = evidenceStrength(op.mentions, op.confidence);
                  return (
                    <React.Fragment key={op.id}>
                      <span className={`font-medium ${str.color}`}>{str.label}</span>
                      <span className="ml-1 text-[var(--color-muted-foreground)]">
                        ({op.mentions} complaints, {op.confidence ?? "—"}% confidence)
                      </span>
                    </React.Fragment>
                  );
                })}
              />
              <CompareRow
                label="Who it is for"
                values={filtered.map((op) => (
                  <span key={op.id} className="text-[var(--color-foreground)]/90">{op.targetCustomer || "—"}</span>
                ))}
              />
              <CompareRow
                label="Problem"
                values={filtered.map((op) => (
                  <span key={op.id} className="text-[var(--color-foreground)]/90">{op.summary}</span>
                ))}
              />
              <CompareRow
                label="Possible solution"
                values={filtered.map((op) => (
                  <span key={op.id} className="text-[var(--color-foreground)]/90">{op.productAngle || op.suggestedSoftware}</span>
                ))}
              />
              <CompareRow
                label="Difficulty to test"
                values={filtered.map((op) => (
                  <span key={op.id} className="text-[var(--color-foreground)]/90">
                    {difficultyToTest(op.riskFlags, !!op.targetCustomer, !!op.productAngle)}
                  </span>
                ))}
              />
              <CompareRow
                label="Biggest risk"
                values={filtered.map((op) =>
                  op.riskFlags.length > 0 ? (
                    <ul key={op.id} className="list-disc pl-4 text-[var(--color-foreground)]/90">
                      {op.riskFlags.slice(0, 2).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <span key={op.id} className="text-[var(--color-muted-foreground)]">—</span>
                  )
                )}
              />
              <CompareRow
                label="Decision"
                values={filtered.map((op) => {
                  const status = resolveStatus(op.id);
                  return (
                    <DecisionStatusSelect
                      key={op.id}
                      opportunityId={op.id}
                      value={status}
                      onChange={(s) => setStatus(op.id, s)}
                      title={op.title}
                    />
                  );
                })}
              />
            </tbody>
          </table>
        </div>

        <p className="flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
          <Info className="h-3 w-3" /> Decisions are saved to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
        <DecisionBoardHeader
          isCompareMode={false}
          projectId={projectId}
          backHref={backHref}
          backLabel={backLabel}
        />

      {/* Summary tiles double as the status filter — one section instead of
          tiles + a duplicate chip row saying the same thing. */}
      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {FILTERS.map((f) => {
            const value =
              f.value === "all" ? counts.total : counts[f.value];
            const active = filter === f.value;
            return (
              <SummaryCard
                key={f.value}
                label={f.value === "all" ? "Total" : f.label}
                value={value}
                disabled={f.value !== "all" && value === 0}
                accent={
                  f.value === "pursue"
                    ? "success"
                    : f.value === "park"
                      ? "warning"
                      : f.value === "reject"
                        ? "danger"
                        : f.value === "undecided"
                          ? "muted"
                          : undefined
                }
                active={active}
                onClick={() => setFilter(f.value)}
              />
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--color-muted-foreground)]">
          <span className="flex items-center gap-1">
            <Info className="h-3 w-3" /> {TESTING_PRIORITY_HELPER}
          </span>
          <span aria-live="polite">
            Showing {filtered.length} of {opportunities.length}
          </span>
        </div>
      </div>

      {/* Decision cards: grouped by status in the base view, a flat grid
          when a status tile filters the board. Card markup is shared. */}
      {filter === "all" ? (
        <div className="space-y-8">
          {STATUS_SECTIONS.map(({ status, heading }) => {
            const group = opportunities.filter(
              (o) => resolveStatus(o.id) === status
            );
            if (group.length === 0) return null;
            return (
              <section key={status} className="space-y-3">
                <h2 className="flex items-baseline gap-2 text-sm font-semibold tracking-tight">
                  {heading}
                  <span className="text-xs font-normal text-[var(--color-muted-foreground)]">
                    {group.length}
                  </span>
                </h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {group.map(renderCard)}
                </div>
              </section>
            );
          })}
        </div>
      ) : filtered.length === 0 ? (
        <NoDecisionStatusEmpty
          label={FILTERS.find((f) => f.value === filter)?.label ?? filter}
          onShowAll={() => setFilter("all")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">{filtered.map(renderCard)}</div>
      )}

      <p className="flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
        <Info className="h-3 w-3" /> Decisions are saved to your account.
      </p>
    </div>
  );

  function renderCard(op: DecisionBoardOpportunity) {
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
              className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    <Briefcase className="h-3 w-3" />
                    {op.industry}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
                    <Link
                      href={projectHref(`/dashboard/opportunities/${op.id}`, projectId)}
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

              {/* Mini stats — grid so values line up across adjacent cards */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--color-muted-foreground)] sm:grid-cols-5">
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
                <Stat icon={ShieldAlert} label="Risks" value={op.riskFlags.length} />
                <Stat
                  icon={Info}
                  label="Questions"
                  value={op.validationQuestions.length}
                />
              </div>

              {/* Decision status selector */}
              <div className="mt-4 flex items-center justify-end border-t border-[var(--color-border)] pt-3">
                <DecisionStatusSelect
                  opportunityId={op.id}
                  value={status}
                  onChange={(s) => setStatus(op.id, s)}
                  title={op.title}
                />
              </div>
            </div>
          );
  }
}

function DecisionBoardHeader({
  isCompareMode,
  projectId,
  backHref,
  backLabel,
}: {
  isCompareMode: boolean;
  projectId: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div>
      <Button asChild variant="ghost" size="sm">
        <Link href={projectHref(backHref ?? "/dashboard/opportunities", projectId)}>
          <ArrowLeft className="h-4 w-4" /> {backLabel ?? "Back to ideas"}
        </Link>
      </Button>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isCompareMode ? "Compare selected ideas" : "Your decisions"}
          </h1>
          {isCompareMode ? (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Compare these ideas side by side and pick one to test.
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Mark each idea Pursue, Park, or Reject — or pick 2–3 ideas to
              compare side by side.
            </p>
          )}
        </div>
        {!isCompareMode && (
          <Button asChild variant="outline" size="sm">
            <Link href={projectHref("/dashboard/opportunities", projectId)}>
              <LayoutGrid className="h-4 w-4" /> Select ideas to compare
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  active = false,
  onClick,
  disabled = false,
}: {
  label: string;
  value: number;
  accent?: "success" | "warning" | "danger" | "muted";
  active?: boolean;
  onClick?: () => void;
  /** Zero-count tiles: muted, non-clickable, announced as disabled. */
  disabled?: boolean;
}) {
  // Zero counts stay muted regardless of accent — a green "0" is false signal.
  const colorClass =
    value === 0 || accent === "muted"
      ? "text-[var(--color-muted-foreground)]"
      : accent === "success"
        ? "text-[var(--color-success)]"
        : accent === "warning"
          ? "text-[var(--color-warning)]"
          : accent === "danger"
            ? "text-[var(--color-danger)]"
            : "text-[var(--color-foreground)]";
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-pressed={active}
      aria-disabled={disabled || undefined}
      className={`rounded-xl border p-4 text-center transition-all duration-150 ease-out ${
        disabled
          ? "cursor-default border-[var(--color-border)] bg-[var(--color-card)] opacity-60"
          : active
            ? "border-[var(--color-primary)] bg-[var(--color-card)] ring-1 ring-[var(--color-primary)]/30"
            : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/40"
      }`}
    >
      <span className={`block text-2xl font-bold ${colorClass}`}>{value}</span>
      <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </span>
    </button>
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

function CompareRow({
  label,
  values,
}: {
  label: string;
  values: React.ReactNode[];
}) {
  return (
    <tr className="border-b border-[var(--color-border)]">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-[var(--color-card)] py-3 pl-4 pr-4 text-left align-top font-medium text-[var(--color-muted-foreground)] whitespace-nowrap"
      >
        {label}
      </th>
      {values.map((value, i) => (
        <td key={i} className="py-3 px-4 align-top text-sm text-[var(--color-foreground)]">
          {value}
        </td>
      ))}
    </tr>
  );
}

