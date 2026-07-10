"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Target, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { type DecisionStatus } from "@/lib/decision-board";
import {
  DecisionStatusSelect,
  useDecisionStatuses,
} from "@/components/opportunities/decision-status-select";
import { projectHref } from "@/lib/project-href";

/* M34 — compare-only view. Ideas are selected on the Ideas (or Saved) page
 * via "Add to compare" and arrive here through `?compare=id,id`. Decisions
 * are set here, on the idea detail header, or reviewed with the Ideas page's
 * decision filter — the old standalone "Your decisions" board is gone. */

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

function scoreColor(score: number): string {
  if (score >= 70) return "text-[var(--color-success)]";
  if (score >= 40) return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
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
  projectId,
  initialStatuses,
  backHref,
  backLabel,
}: {
  opportunities: DecisionBoardOpportunity[];
  projectId: string;
  initialStatuses: Record<string, DecisionStatus>;
  /** Override the back link (e.g. "/dashboard/saved" when arriving from the
   * Saved page). projectId is appended via projectHref either way. */
  backHref?: string;
  backLabel?: string;
}) {
  const { statuses, hydrated, setStatus } = useDecisionStatuses(initialStatuses);

  const resolveStatus = (id: string): DecisionStatus =>
    hydrated ? statuses[id] ?? "undecided" : "undecided";

  if (opportunities.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <DecisionBoardHeader
          projectId={projectId}
          backHref={backHref}
          backLabel={backLabel}
        />
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
          <Target className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)]" />
          <h2 className="mt-4 text-base font-semibold">No ideas to compare yet</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            The ideas you selected could not be found. Try selecting ideas
            again from the Ideas page.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href={projectHref("/dashboard/opportunities", projectId)}>
                Go to Ideas
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pure display comparison of already-rendered scores: mark the leading
  // column so the eye lands on the current winner first.
  const topScore = Math.max(...opportunities.map((o) => o.opportunityScore));
  const topScoreId =
    opportunities.length > 1
      ? (opportunities.find((o) => o.opportunityScore === topScore)?.id ?? null)
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DecisionBoardHeader
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
              {opportunities.map((op) => (
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
              values={opportunities.map((op) => (
                <span key={op.id} className={`text-lg font-bold ${scoreColor(op.opportunityScore)}`}>
                  {op.opportunityScore}
                </span>
              ))}
            />
            <CompareRow
              label="Evidence strength"
              values={opportunities.map((op) => {
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
              values={opportunities.map((op) => (
                <span key={op.id} className="text-[var(--color-foreground)]/90">{op.targetCustomer || "—"}</span>
              ))}
            />
            <CompareRow
              label="Problem"
              values={opportunities.map((op) => (
                <span key={op.id} className="text-[var(--color-foreground)]/90">{op.summary}</span>
              ))}
            />
            <CompareRow
              label="Possible solution"
              values={opportunities.map((op) => (
                <span key={op.id} className="text-[var(--color-foreground)]/90">{op.productAngle || op.suggestedSoftware}</span>
              ))}
            />
            <CompareRow
              label="Difficulty to test"
              values={opportunities.map((op) => (
                <span key={op.id} className="text-[var(--color-foreground)]/90">
                  {difficultyToTest(op.riskFlags, !!op.targetCustomer, !!op.productAngle)}
                </span>
              ))}
            />
            <CompareRow
              label="Biggest risk"
              values={opportunities.map((op) =>
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
              values={opportunities.map((op) => {
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

      <p className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
        <Info className="h-3 w-3" /> Decisions are saved to your account.
      </p>
    </div>
  );
}

function DecisionBoardHeader({
  projectId,
  backHref,
  backLabel,
}: {
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
      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Compare selected ideas
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Compare these ideas side by side and pick one to test.
        </p>
      </div>
    </div>
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
