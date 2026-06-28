import Link from "next/link";
import { Briefcase, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/* Small related-opportunity card. Shows:
 *   title, industry, opportunity score, shared keyword count (if any), link.
 * Hover: hover:shadow-md (per spec, allowed, optional).
 */
export function RelatedOpportunityCard({
  op,
  shared,
}: {
  op: {
    id: string;
    title: string;
    industry: string;
    opportunityScore: number;
  };
  shared: number;
}) {
  return (
    <Link
      href={`/dashboard/opportunities/${op.id}`}
      className="group block rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-shadow duration-150 ease-out hover:shadow-md focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]"
      aria-label={`Open related opportunity: ${op.title}, score ${op.opportunityScore}${shared > 0 ? `, ${shared} shared keyword${shared === 1 ? "" : "s"}` : ""}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
        <Briefcase className="h-3 w-3" />
        {op.industry}
      </div>
      <h3 className="mt-1 truncate text-sm font-semibold group-hover:text-[var(--color-primary)]">
        {op.title}
      </h3>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
          <Target className="h-3 w-3" />
          <span className="font-medium text-[var(--color-foreground)]">{op.opportunityScore}</span>
          <span className="text-[10px]">/ 100</span>
        </span>
        {shared > 0 && (
          <Badge variant="primary">{shared} shared keyword{shared === 1 ? "" : "s"}</Badge>
        )}
      </div>
    </Link>
  );
}