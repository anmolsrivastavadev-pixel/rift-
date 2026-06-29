import Link from "next/link";
import { Target, Users, AlertTriangle, Briefcase } from "lucide-react";

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
  createdAt: Date;
  saved: boolean;
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-[var(--color-success)]";
  if (score >= 40) return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}

export function OpportunityCard({ op }: { op: OpportunityCardData }) {
  const sc = scoreColor(op.opportunityScore);
  const scoreLabel = `Score ${op.opportunityScore} out of 100`;
  return (
    <div
      className={
        "group relative flex flex-col rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 " +
        "transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[var(--color-primary)]/60 hover:shadow-md"
      }
    >
      <div className="absolute right-4 top-4">
        <SaveButton opportunityId={op.id} saved={op.saved} size="sm" />
      </div>

      <Link
        href={`/dashboard/opportunities/${op.id}`}
        className="flex flex-1 flex-col"
        aria-label={`Open opportunity: ${op.title}, score ${op.opportunityScore}`}
      >
        <div className="flex items-start gap-2 pr-8">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
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
          <div className="ml-3 flex flex-col items-center shrink-0">
            <div className={`text-2xl font-bold leading-none ${sc}`} aria-label={scoreLabel}>
              {op.opportunityScore}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Score
            </div>
          </div>
        </div>

        <p className="mt-3 text-[10px] leading-snug text-[var(--color-muted-foreground)]">
          Score combines frequency, severity, and confidence.
        </p>
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