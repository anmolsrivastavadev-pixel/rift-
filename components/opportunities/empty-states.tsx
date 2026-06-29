import Link from "next/link";
import { Target, SearchX, BookmarkX, Download, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Empty states for the opportunities workspace.
 * Uses Lucide icons only, per spec. No illustrations.
 * Each state tells the user what to do next.
 */

export function NoOpportunitiesEmpty() {
  return (
    <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
        <Target className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No opportunities yet</h3>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Opportunities are generated from complaints in this MVP workspace. Add
        some complaints first, then run AI clustering to discover scored
        startup opportunities. Demo data is fake and safe to test with.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard/complaints">
            <Sparkles className="h-4 w-4" /> Use Demo Data
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/sample_complaints.csv" download>
            <Download className="h-4 w-4" /> Download Sample CSV
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/complaints">
            <Upload className="h-4 w-4" /> Upload CSV
          </Link>
        </Button>
      </div>
      <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
        Once you have complaints, go to{" "}
        <Link
          href="/dashboard/opportunities"
          className="font-medium text-[var(--color-primary)] hover:underline"
        >
          Opportunities → Run AI clustering
        </Link>
        .
      </p>
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
        Bookmark opportunities from the workspace to keep them for later. Saves
        live in this MVP workspace only.
      </p>
      <Button asChild className="mt-4">
        <Link href="/dashboard/opportunities">Browse opportunities</Link>
      </Button>
    </div>
  );
}