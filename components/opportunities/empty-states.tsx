import Link from "next/link";
import { Target, SearchX, BookmarkX, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { projectHref } from "@/lib/project-href";

/**
 * Empty states for the opportunities workspace.
 * Uses Lucide icons only, per spec. No illustrations.
 * Each state tells the user what to do next.
 */

export function NoOpportunitiesEmpty({ projectId }: { projectId: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <Target className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No business ideas yet</h3>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Add customer pain data, then generate ideas from repeated problems.
      </p>
      <Button asChild className="mt-5">
        <Link href={projectHref("/dashboard/complaints", projectId)}>
          <Upload className="h-4 w-4" /> Add data
        </Link>
      </Button>
    </div>
  );
}

export function NoSearchResultsEmpty({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-muted-foreground)]">
        <SearchX className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No matching ideas</h3>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Try widening your search or resetting the filters.
      </p>
      <Button variant="outline" className="mt-4" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  );
}

/* Decisions board: a status filter is active but nothing carries that
 * status. Rendered from a client component — onShowAll resets the filter. */
export function NoDecisionStatusEmpty({
  label,
  onShowAll,
}: {
  label: string;
  onShowAll: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-muted-foreground)]">
        <SearchX className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">
        Nothing marked {label} yet
      </h3>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Click Pursue, Park, or Reject on any idea to build your decision
        record.
      </p>
      <Button variant="outline" className="mt-4" onClick={onShowAll}>
        Show all ideas
      </Button>
    </div>
  );
}

export function NoSavedEmpty({ projectId }: { projectId: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-muted-foreground)]">
        <BookmarkX className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No saved ideas yet</h3>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Save ideas you want to revisit later.
      </p>
      <Button asChild className="mt-4">
        <Link href={projectHref("/dashboard/opportunities", projectId)}>
          Browse ideas
        </Link>
      </Button>
    </div>
  );
}
