import Link from "next/link";
import { Target, SearchX, BookmarkX } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Empty states for the opportunities workspace.
 * Uses Lucide icons only, per spec. No illustrations.
 */

export function NoOpportunitiesEmpty() {
  return (
    <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
        <Target className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No opportunities yet</h3>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Run the AI engine to cluster your complaints into scored business opportunities.
      </p>
      <Button asChild className="mt-4">
        <Link href="/dashboard/opportunities">Run AI clustering</Link>
      </Button>
    </div>
  );
}

export function NoSearchResultsEmpty({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--color-muted-foreground)]/10 text-[var(--color-muted-foreground)]">
        <SearchX className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No matching opportunities</h3>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Try widening your search or resetting the filters.
      </p>
      <Button variant="outline" className="mt-4" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  );
}

export function NoSavedEmpty() {
  return (
    <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--color-muted-foreground)]/10 text-[var(--color-muted-foreground)]">
        <BookmarkX className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">Nothing saved yet</h3>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Bookmark opportunities from the workspace to keep them for later.
      </p>
      <Button asChild className="mt-4">
        <Link href="/dashboard/opportunities">Browse opportunities</Link>
      </Button>
    </div>
  );
}