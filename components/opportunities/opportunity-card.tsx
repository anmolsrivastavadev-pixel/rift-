"use client";

import * as React from "react";
import Link from "next/link";
import { Target, Users, AlertTriangle, Briefcase, Plus, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/opportunities/save-button";

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
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-[var(--color-success)]";
  if (score >= 40) return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

export function OpportunityCard({
  op,
  selected = false,
  onToggleCompare,
}: {
  op: OpportunityCardData;
  selected?: boolean;
  onToggleCompare?: (id: string) => void;
}) {
  const sc = scoreColor(op.opportunityScore);
  const bgScore =
    op.opportunityScore >= 70
      ? "bg-[var(--color-success-soft)]"
      : op.opportunityScore >= 40
        ? "bg-[var(--color-warning-soft)]"
        : "bg-[var(--color-danger-soft)]";
  const scoreLabel = `Score ${op.opportunityScore} out of 100`;
  return (
    <div
      className={
        "group relative flex flex-col rounded-2xl border bg-white p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)] " +
        "transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_12px_0_rgb(0_0_0_/_0.06),0_2px_4px_-2px_rgb(0_0_0_/_0.04)] " +
        (selected
          ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40")
      }
    >
      <div className="absolute right-4 top-4 flex items-center gap-1.5">
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
                : "border-[var(--color-border)] bg-white text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
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
        <SaveButton opportunityId={op.id} saved={op.saved} size="sm" />
      </div>

      <Link
        href={`/dashboard/opportunities/${op.id}`}
        className="flex flex-1 flex-col"
        aria-label={`Open opportunity: ${op.title}, score ${op.opportunityScore}`}
      >
        <div className="flex items-start gap-2 pr-28">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
              <Briefcase className="h-3 w-3" />
              {op.industry}
            </div>
            <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-balance group-hover:text-[var(--color-primary)]">
              {op.title}
            </h3>
          </div>
        </div>

        <p className="mt-1 line-clamp-1 text-xs text-[var(--color-muted-foreground)]">
          Product opportunity:{" "}
          <span className="text-[var(--color-foreground)]/80">{op.suggestedSoftware}</span>
        </p>

        {(op.targetCustomer || op.productAngle) && (
          <div className="mt-2 space-y-0.5 text-[11px] text-[var(--color-muted-foreground)]">
            {op.targetCustomer && (
              <p className="line-clamp-1">
                For: <span className="text-[var(--color-foreground)]/80">{op.targetCustomer}</span>
              </p>
            )}
            {op.productAngle && (
              <p className="line-clamp-2">
                Angle: <span className="text-[var(--color-foreground)]/80">{op.productAngle}</span>
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {op.keywords.slice(0, 4).map((k) => (
            <Badge key={k} variant="primary">
              {k}
            </Badge>
          ))}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-[var(--color-border)] pt-3">
          <div className="grid flex-1 grid-cols-3 gap-2 text-xs">
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
          </div>
          <div className={`ml-3 flex flex-col items-center shrink-0 rounded-xl ${bgScore} px-3 py-2`}>
            <div className={`text-xl font-bold leading-none ${sc}`} aria-label={scoreLabel}>
              {op.opportunityScore}
            </div>
            <div className="mt-0.5 text-[9px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Score
            </div>
          </div>
        </div>

        <p className="mt-3 text-[10px] leading-snug text-[var(--color-muted-foreground)]">
          The score is a rough sorting signal, not proof an idea will work.
        </p>

        <span
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] transition-all duration-150 ease-out group-hover:border-[var(--color-primary)]/30 group-hover:bg-[var(--color-primary-soft)] group-hover:text-[var(--color-primary)]"
          aria-hidden="true"
        >
          Open idea
        </span>
      </Link>
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
