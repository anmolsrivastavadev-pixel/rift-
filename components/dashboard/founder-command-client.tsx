"use client";

import * as React from "react";
import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";

import {
  decisionStorageKey,
  isValidDecisionStatus,
  type DecisionStatus,
} from "@/lib/decision-board";
import {
  evidenceStorageKey,
  parseEvidenceState,
  computeEvidenceSignal,
  type EvidenceState,
} from "@/lib/validation-evidence";
import {
  computeNextAction,
  type DashboardStats,
  type LocalSummary,
} from "@/lib/dashboard-plan";
import { Button } from "@/components/ui/button";
import { projectHref } from "@/lib/project-href";

/* Read-only client component for the Founder Command Center.
 * Reads decision statuses + evidence from localStorage (never writes).
 * Passes the local summary + server stats into the pure helpers to compute
 * workflow steps and the recommended next action.
 */
export function FounderCommandClient({
  stats,
  opportunityIds,
  projectId,
}: {
  stats: DashboardStats;
  opportunityIds: string[];
  projectId: string;
}) {
  const [local, setLocal] = React.useState<LocalSummary>({
    hasEvidence: false,
    hasNonUndecidedDecision: false,
    hasPursue: false,
  });
  const [hydrated, setHydrated] = React.useState(false);
  const [decisionCounts, setDecisionCounts] = React.useState({
    pursue: 0,
    park: 0,
    reject: 0,
    undecided: 0,
  });
  const [evidenceCounts, setEvidenceCounts] = React.useState({
    withEvidence: 0,
    noEvidence: 0,
    promising: 0,
    needsMore: 0,
  });

  const readAll = React.useCallback(() => {
    let hasEvidence = false;
    let hasNonUndecided = false;
    let hasPursue = false;
    const dc = { pursue: 0, park: 0, reject: 0, undecided: 0 };
    const ec = { withEvidence: 0, noEvidence: 0, promising: 0, needsMore: 0 };

    try {
      for (const id of opportunityIds) {
        // Decision
        const dRaw = window.localStorage.getItem(decisionStorageKey(id));
        const status: DecisionStatus = isValidDecisionStatus(dRaw)
          ? dRaw
          : "undecided";
        dc[status]++;
        if (status !== "undecided") hasNonUndecided = true;
        if (status === "pursue") hasPursue = true;

        // Evidence
        const eRaw = window.localStorage.getItem(evidenceStorageKey(id));
        const ev: EvidenceState = parseEvidenceState(eRaw);
        if (ev.interviewsCompleted > 0) {
          hasEvidence = true;
          ec.withEvidence++;
          const signal = computeEvidenceSignal(ev);
          if (signal === "promising-signal") ec.promising++;
          if (signal === "needs-more-evidence") ec.needsMore++;
        } else {
          ec.noEvidence++;
        }
      }
    } catch {
      // localStorage unavailable
    }
    return { hasEvidence, hasNonUndecided, hasPursue, dc, ec };
  }, [opportunityIds]);

  React.useEffect(() => {
    const result = readAll();
    setLocal({ // eslint-disable-line react-hooks/set-state-in-effect
      hasEvidence: result.hasEvidence,
      hasNonUndecidedDecision: result.hasNonUndecided,
      hasPursue: result.hasPursue,
    });
    setDecisionCounts(result.dc);
    setEvidenceCounts(result.ec);
    setHydrated(true);
  }, [readAll]);

  // Refresh on window focus.
  React.useEffect(() => {
    if (!hydrated) return;
    const onFocus = () => {
      const result = readAll();
      setLocal({
        hasEvidence: result.hasEvidence,
        hasNonUndecidedDecision: result.hasNonUndecided,
        hasPursue: result.hasPursue,
      });
      setDecisionCounts(result.dc);
      setEvidenceCounts(result.ec);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [hydrated, readAll]);

  const nextAction = computeNextAction(stats, local);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-primary)]">
              Next step
            </p>
            <h2 className="mt-1 text-base font-semibold">{nextAction.title}</h2>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {nextAction.description}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={projectHref(nextAction.href, projectId)}>
              {nextAction.cta} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      {stats.opportunityCount > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
            <h3 className="text-sm font-semibold">Decision status</h3>
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {hydrated
                ? "Your local choices for this project."
                : "Loading…"}
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <SnapshotCount label="Pursue" value={hydrated ? decisionCounts.pursue : "—"} accent="success" />
              <SnapshotCount label="Park" value={hydrated ? decisionCounts.park : "—"} accent="warning" />
              <SnapshotCount label="Reject" value={hydrated ? decisionCounts.reject : "—"} accent="danger" />
              <SnapshotCount label="Undecided" value={hydrated ? decisionCounts.undecided : "—"} accent="muted" />
            </div>
            <Link
              href={projectHref("/dashboard/opportunities/decision-board", projectId)}
              className="mt-3 inline-block text-xs text-[var(--color-primary)] hover:underline"
            >
              Open Compare Ideas →
            </Link>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
            <h3 className="text-sm font-semibold">Testing notes</h3>
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {hydrated
                ? "Notes you saved in this browser."
                : "Loading…"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <SnapshotCount label="With evidence" value={hydrated ? evidenceCounts.withEvidence : "—"} />
              <SnapshotCount label="No evidence" value={hydrated ? evidenceCounts.noEvidence : "—"} accent="muted" />
              <SnapshotCount label="Promising" value={hydrated ? evidenceCounts.promising : "—"} accent="success" />
              <SnapshotCount label="Needs more" value={hydrated ? evidenceCounts.needsMore : "—"} accent="warning" />
            </div>
            <Link
              href={projectHref("/dashboard/opportunities", projectId)}
              className="mt-3 inline-block text-xs text-[var(--color-primary)] hover:underline"
            >
              Review ideas →
            </Link>
          </div>
        </div>
      )}

      <p className="flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
        <Info className="h-3 w-3" /> Decisions and testing notes are saved only in this browser.
      </p>
    </div>
  );
}

function SnapshotCount({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
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
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2">
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
      <p className="text-[10px] text-[var(--color-muted-foreground)]">{label}</p>
    </div>
  );
}
