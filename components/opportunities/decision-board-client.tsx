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
import {
  evidenceStorageKey,
  parseEvidenceState,
  computeEvidenceSignal,
  computeSuggestedNextStep,
  EVIDENCE_SIGNAL_LABELS,
  type EvidenceState,
} from "@/lib/validation-evidence";

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

function evidenceSignalColor(signal: string): string {
  switch (signal) {
    case "promising-signal":
      return "text-[var(--color-success)]";
    case "early-signal":
      return "text-[var(--color-primary)]";
    case "weak-signal":
      return "text-[var(--color-danger)]";
    case "mixed-signal":
      return "text-[var(--color-warning)]";
    case "needs-more-evidence":
      return "text-[var(--color-warning)]";
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

function useEvidenceSnapshots(opportunityIds: string[]): {
  snapshots: Record<string, EvidenceState>;
  hydrated: boolean;
} {
  const [snapshots, setSnapshots] = React.useState<Record<string, EvidenceState>>({});
  const [hydrated, setHydrated] = React.useState(false);

  const readAll = React.useCallback(() => {
    const map: Record<string, EvidenceState> = {};
    try {
      for (const id of opportunityIds) {
        const raw = window.localStorage.getItem(evidenceStorageKey(id));
        map[id] = parseEvidenceState(raw);
      }
    } catch {
      // localStorage unavailable
    }
    return map;
  }, [opportunityIds]);

  React.useEffect(() => {
    setSnapshots(readAll()); // eslint-disable-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, [readAll]);

  React.useEffect(() => {
    if (!hydrated) return;
    const onFocus = () => setSnapshots(readAll());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [hydrated, readAll]);

  return { snapshots, hydrated };
}

export function DecisionBoardClient({
  opportunities,
  isCompareMode = false,
}: {
  opportunities: DecisionBoardOpportunity[];
  isCompareMode?: boolean;
}) {
  const ids = React.useMemo(() => opportunities.map((o) => o.id), [opportunities]);
  const { statuses, hydrated, setStatus } = useDecisionStatuses(ids);
  const { snapshots: evidenceSnapshots, hydrated: evidenceHydrated } =
    useEvidenceSnapshots(ids);
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
        <DecisionBoardHeader isCompareMode={isCompareMode} />
        <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
          <Target className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)]" />
          <h2 className="mt-4 text-base font-semibold">No ideas to compare yet</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {isCompareMode
              ? "The ideas you selected could not be found. Try selecting ideas again from the Ideas page."
              : "Add complaints, then run AI clustering to generate business ideas before using the Compare Ideas board."}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard/complaints">Go to Complaints</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/opportunities">Go to Ideas</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompareMode) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <DecisionBoardHeader isCompareMode={isCompareMode} />

        <p className="text-xs text-[var(--color-muted-foreground)]">
          Compare these ideas side by side. Pick the one with the clearest
          person, repeated problem, simple solution, and evidence you understand.
        </p>

        {/* Side-by-side comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="py-3 pr-4 text-left font-medium text-[var(--color-muted-foreground)]">
                  Field
                </th>
                {filtered.map((op) => (
                  <th
                    key={op.id}
                    className="py-3 px-4 text-left font-medium text-[var(--color-foreground)]"
                  >
                    <Link
                      href={`/dashboard/opportunities/${op.id}`}
                      className="hover:text-[var(--color-primary)] hover:underline"
                    >
                      {op.title}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Idea">
                {filtered.map((op) => (
                  <td key={op.id} className="py-3 px-4">
                    <span className={`font-semibold ${scoreColor(op.opportunityScore)}`}>
                      {op.opportunityScore}
                    </span>
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Who it is for">
                {filtered.map((op) => (
                  <td key={op.id} className="py-3 px-4 text-[var(--color-muted-foreground)]">
                    {op.targetCustomer || "—"}
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Problem">
                {filtered.map((op) => (
                  <td key={op.id} className="py-3 px-4 text-[var(--color-muted-foreground)] line-clamp-3">
                    {op.summary}
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Possible solution">
                {filtered.map((op) => (
                  <td key={op.id} className="py-3 px-4 text-[var(--color-muted-foreground)]">
                    {op.productAngle || op.suggestedSoftware}
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Evidence strength">
                {filtered.map((op) => {
                  const str = evidenceStrength(op.mentions, op.confidence);
                  return (
                    <td key={op.id} className="py-3 px-4">
                      <span className={`font-medium ${str.color}`}>{str.label}</span>
                      <span className="ml-1 text-[var(--color-muted-foreground)]">
                        ({op.mentions} complaints, {op.confidence ?? "—"}% confidence)
                      </span>
                    </td>
                  );
                })}
              </CompareRow>
              <CompareRow label="Score">
                {filtered.map((op) => (
                  <td key={op.id} className="py-3 px-4">
                    <span className={`text-lg font-bold ${scoreColor(op.opportunityScore)}`}>
                      {op.opportunityScore}
                    </span>
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Difficulty to test">
                {filtered.map((op) => (
                  <td key={op.id} className="py-3 px-4 text-[var(--color-muted-foreground)]">
                    {difficultyToTest(
                      op.riskFlags,
                      !!op.targetCustomer,
                      !!op.productAngle
                    )}
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Biggest risk">
                {filtered.map((op) => (
                  <td key={op.id} className="py-3 px-4">
                    {op.riskFlags.length > 0 ? (
                      <ul className="list-disc pl-4 text-[var(--color-muted-foreground)]">
                        {op.riskFlags.slice(0, 2).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[var(--color-muted-foreground)]">—</span>
                    )}
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Suggested next step">
                {filtered.map((op) => {
                  const ev = evidenceHydrated ? evidenceSnapshots[op.id] : undefined;
                  return (
                    <td key={op.id} className="py-3 px-4 text-[var(--color-muted-foreground)]">
                      {ev && ev.interviewsCompleted > 0
                        ? computeSuggestedNextStep(ev)
                        : "Start interviews to learn more"}
                    </td>
                  );
                })}
              </CompareRow>
              <CompareRow label="Decision">
                {filtered.map((op) => {
                  const status = resolveStatus(op.id);
                  return (
                    <td key={op.id} className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[var(--color-muted-foreground)]">
                          {hydrated ? DECISION_LABELS[status] : "—"}
                        </span>
                        <DecisionStatusSelect
                          opportunityId={op.id}
                          value={status}
                          onChange={(s) => setStatus(op.id, s)}
                        />
                      </div>
                    </td>
                  );
                })}
              </CompareRow>
            </tbody>
          </table>
        </div>

        <p className="flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
          <Info className="h-3 w-3" /> This helps you choose what to inspect
          first. It does not prove which idea will work.
        </p>
        <p className="flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
          <Info className="h-3 w-3" /> Saved only in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DecisionBoardHeader isCompareMode={false} />

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
      <p className="text-[11px] text-[var(--color-muted-foreground)]">
        Testing Priority is based on opportunity score, complaint count,
        confidence, and risk flags. Evidence Signal is based only on validation
        evidence saved in this browser.
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

              {/* Evidence snapshot */}
              <EvidenceSnapshot
                opportunityId={op.id}
                evidence={evidenceHydrated ? evidenceSnapshots[op.id] : undefined}
                hydrated={evidenceHydrated}
              />

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

function DecisionBoardHeader({ isCompareMode }: { isCompareMode: boolean }) {
  return (
    <div>
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/opportunities">
          <ArrowLeft className="h-4 w-4" /> Back to ideas
        </Link>
      </Button>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {isCompareMode ? "Compare selected ideas" : "Compare Ideas"}
      </h1>
      {isCompareMode ? (
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Compare these ideas side by side. Pick the one with the clearest
          person, repeated problem, simple solution, and evidence you understand.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Choose whether to pursue, park, reject, or keep reviewing each idea based on the evidence so far.
          </p>
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            Pursue = test this idea next. Park = save it for later. Reject = stop spending time on it for now. Undecided = not enough evidence yet.
          </p>
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            These decisions are for your own thinking. They do not prove whether an idea is good or bad.
          </p>
        </>
      )}
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

function CompareRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const childArray = React.Children.toArray(children);
  return (
    <tr className="border-b border-[var(--color-border)]">
      <td className="py-3 pr-4 font-medium text-[var(--color-muted-foreground)] whitespace-nowrap">
        {label}
      </td>
      {childArray.map((child, i) => (
        <td key={i}>{child}</td>
      ))}
    </tr>
  );
}

function EvidenceSnapshot({
  opportunityId,
  evidence,
  hydrated,
}: {
  opportunityId: string;
  evidence?: EvidenceState;
  hydrated: boolean;
}) {
  const hasEvidence = hydrated && evidence && evidence.interviewsCompleted > 0;

  return (
    <div className="mt-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
        Evidence so far
      </p>
      {hydrated && hasEvidence && evidence ? (
        <>
          <p className={`mt-0.5 text-xs font-medium ${evidenceSignalColor(computeEvidenceSignal(evidence))}`}>
            {EVIDENCE_SIGNAL_LABELS[computeEvidenceSignal(evidence)]}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-muted-foreground)]">
            {evidence.interviewsCompleted} interviews ·{" "}
            {evidence.peopleReportingSamePain} same pain ·{" "}
            {evidence.peopleWillingToTry} willing to try ·{" "}
            {evidence.peopleWillingToPay} willing to pay
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-muted-foreground)]">
            {computeSuggestedNextStep(evidence)}
          </p>
        </>
      ) : (
        <p className="mt-0.5 text-[11px] text-[var(--color-muted-foreground)]">
          {hydrated ? "No evidence yet" : "—"}
        </p>
      )}
      <Link
        href={`/dashboard/opportunities/${opportunityId}#validation-evidence-log`}
        className="mt-1.5 inline-block text-[11px] text-[var(--color-primary)] hover:underline"
      >
        Open evidence log
      </Link>
    </div>
  );
}
