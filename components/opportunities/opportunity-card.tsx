"use client";

import * as React from "react";
import Link from "next/link";
import {
  Target,
  Users,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Plus,
  Check,
  Minus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/opportunities/save-button";
import { PAIN_TREND_HELPER } from "@/lib/pain-trend";
import { projectHref } from "@/lib/project-href";
import type { DecisionStatus } from "@/lib/decision-board";

const DECISION_BADGES: Partial<
  Record<DecisionStatus, { label: string; variant: "success" | "warning" | "danger" }>
> = {
  pursue: { label: "Pursuing", variant: "success" },
  park: { label: "Parked", variant: "warning" },
  reject: { label: "Rejected", variant: "danger" },
};

export type OpportunityCardData = {
  id: string;
  title: string;
  summary: string;
  industry: string;
  opportunityScore: number;
  mentions: number;
  severity: number | null;
  confidence: number | null;
  keywords: string[];
  suggestedSoftware: string;
  targetCustomer?: string | null;
  productAngle?: string | null;
  createdAt: Date;
  saved: boolean;
  // M31b — precomputed display-only trend label ("Growing" | "Steady" |
  // "Fading"); null when there aren't enough dated complaints to show one.
  painTrendLabel?: string | null;
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-[var(--color-success)]";
  if (score >= 40) return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

export function OpportunityCard({
  op,
  projectId,
  selected = false,
  onToggleCompare,
  decisionStatus,
  refreshOnUnsave,
}: {
  op: OpportunityCardData;
  projectId: string;
  selected?: boolean;
  onToggleCompare?: (id: string) => void;
  /** Optional decision status badge (Saved page). Nothing renders when
   * absent or "undecided" — the Ideas page stays unchanged. */
  decisionStatus?: DecisionStatus | null;
  /** Forwarded to SaveButton — refresh the route after a successful unsave
   * so server-rendered lists (Saved page) stay honest. */
  refreshOnUnsave?: boolean;
}) {
  const decisionBadge = decisionStatus ? DECISION_BADGES[decisionStatus] : undefined;
  const sc = scoreColor(op.opportunityScore);
  const bgScore =
    op.opportunityScore >= 70
      ? "bg-[var(--color-success-soft)]"
      : op.opportunityScore >= 40
        ? "bg-[var(--color-warning-soft)]"
        : "bg-[var(--color-danger-soft)]";
  const href = projectHref(`/dashboard/opportunities/${op.id}`, projectId);
  const TrendIcon =
    op.painTrendLabel === "Growing"
      ? TrendingUp
      : op.painTrendLabel === "Fading"
        ? TrendingDown
        : Minus;
  const cardAriaLabel =
    `Open idea: ${op.title}, score ${op.opportunityScore} out of 100, ` +
    `${op.mentions} complaint${op.mentions === 1 ? "" : "s"}` +
    (op.painTrendLabel ? `, pain trend ${op.painTrendLabel.toLowerCase()}` : "");
  return (
    <div
      className={
        "group relative flex flex-col rounded-2xl border bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)] " +
        "transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] " +
        (selected
          ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40")
      }
    >
      <Link
        href={href}
        className="flex flex-1 flex-col"
        aria-label={cardAriaLabel}
      >
        {/* Header: title owns the left, score owns the top-right so a
            vertical scan down the grid compares scores instantly. */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
              <Briefcase className="h-3 w-3" />
              {op.industry}
              {op.painTrendLabel && (
                <Badge
                  variant={
                    op.painTrendLabel === "Growing"
                      ? "success"
                      : op.painTrendLabel === "Fading"
                        ? "warning"
                        : "default"
                  }
                  title={PAIN_TREND_HELPER}
                >
                  <TrendIcon className="mr-1 h-3 w-3" />
                  {op.painTrendLabel}
                </Badge>
              )}
              {decisionBadge && (
                <Badge variant={decisionBadge.variant}>{decisionBadge.label}</Badge>
              )}
            </div>
            <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-balance group-hover:text-[var(--color-primary)]">
              {op.title}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-xs text-[var(--color-muted-foreground)]">
              {op.summary}
            </p>
          </div>
          <div
            className={`flex shrink-0 flex-col items-center rounded-xl ${bgScore} px-3 py-2`}
            aria-hidden="true"
          >
            <div className={`text-xl font-bold leading-none ${sc}`}>
              {op.opportunityScore}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Score
            </div>
          </div>
        </div>

        <p className="mt-2 line-clamp-1 text-sm text-[var(--color-foreground)]/80">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Build
          </span>{" "}
          {op.suggestedSoftware}
        </p>

        {(op.targetCustomer || op.productAngle) && (
          <p className="mt-1.5 line-clamp-1 text-[11px] text-[var(--color-muted-foreground)]">
            {[op.targetCustomer && `For ${op.targetCustomer}`, op.productAngle]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {op.keywords.slice(0, 2).map((k) => (
            <Badge key={k} variant="default">
              {k}
            </Badge>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--color-border)] pt-3 text-xs">
          <Stat icon={Users} label="Complaints" value={op.mentions} />
          <Stat
            icon={AlertTriangle}
            label="Severity"
            value={op.severity !== null ? `${op.severity.toFixed(1)}/10` : "—"}
          />
          <Stat
            icon={Target}
            label="Confidence"
            value={op.confidence !== null ? `${op.confidence}%` : "—"}
          />
        </div>
      </Link>

      {/* Footer actions live OUTSIDE the main link so the whole card stays
          clickable without nested-control surprises. */}
      <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-[var(--color-border)] pt-3">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-muted-foreground)] transition-colors duration-150 ease-out group-hover:text-[var(--color-primary)]"
        >
          Open idea <ArrowRight className="h-3 w-3" />
        </Link>
        <div className="flex items-center gap-1.5">
          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleCompare(op.id);
              }}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ease-out active:scale-[0.95] ${
                selected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
              }`}
              aria-pressed={selected}
              aria-label={selected ? "Remove from compare" : "Add to compare"}
            >
              {selected ? (
                <>
                  <Check className="h-3 w-3" /> Added
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" /> Add to compare
                </>
              )}
            </button>
          )}
          <SaveButton
            opportunityId={op.id}
            projectId={projectId}
            saved={op.saved}
            size="sm"
            showLabel
            refreshOnUnsave={refreshOnUnsave}
          />
        </div>
      </div>
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
    <div className="flex flex-col items-center text-center">
      <Icon className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
      <span className="mt-1 font-medium text-[var(--color-foreground)]">{value}</span>
      <span className="text-[10px] text-[var(--color-muted-foreground)]">{label}</span>
    </div>
  );
}
