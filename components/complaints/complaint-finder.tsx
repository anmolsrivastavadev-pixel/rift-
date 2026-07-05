"use client";

import * as React from "react";
import { useActionState } from "react";
import { Globe, Loader2, Search, CheckCircle2, AlertTriangle } from "lucide-react";

import {
  findComplaintsAction,
  type FindComplaintsResult,
} from "@/actions/complaint-finder";
import { Button } from "@/components/ui/button";
import { ImportNextStepLink } from "@/components/complaints/import-summary";

/* Keyword complaint finder — the "1-click" path for beginners who have no
 * CSV. Type a niche (e.g. "fitness apps") and Rift pulls real complaints from
 * Reddit, App Store reviews, and Hacker News into the current project.
 */
export function ComplaintFinder({ projectId }: { projectId: string }) {
  const [result, action, pending] = useActionState<
    FindComplaintsResult | null,
    FormData
  >(findComplaintsAction, null);

  return (
    <div className="space-y-4">
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="relative min-w-0 flex-1">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            name="keyword"
            required
            minLength={2}
            maxLength={80}
            placeholder="Type a niche, e.g. fitness apps"
            aria-label="Niche keyword"
            disabled={pending}
            className="h-10 w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-background)] pl-9 pr-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Find complaints
            </>
          )}
        </Button>
      </form>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Rift searches Reddit, App Store reviews, and Hacker News for real
        frustrations about your niche. No spreadsheet needed.
      </p>

      {result && !pending && <FinderSummary result={result} projectId={projectId} />}
    </div>
  );
}

function FinderSummary({
  result,
  projectId,
}: {
  result: FindComplaintsResult;
  projectId: string;
}) {
  const found =
    result.redditFound + result.appStoreFound + result.hackerNewsFound;

  if (result.inserted === 0) {
    return (
      <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-4 text-sm text-[var(--color-warning)]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">
            {found > 0
              ? "These complaints are already loaded."
              : `No new complaints found for “${result.keyword}”.`}
          </p>
          {result.errors.map((e, i) => (
            <p key={i} className="text-xs">
              {e}
            </p>
          ))}
          {found > 0 && <ImportNextStepLink projectId={projectId} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">
          Imported {result.inserted} complaint{result.inserted === 1 ? "" : "s"} about
          “{result.keyword}”. Now find ideas.
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {result.redditFound} from Reddit, {result.appStoreFound} from App Store
          reviews, {result.hackerNewsFound} from Hacker News
          {result.skipped > 0 ? `, ${result.skipped} skipped (duplicates)` : ""}.
        </p>
        {result.errors.map((e, i) => (
          <p key={i} className="text-xs text-[var(--color-muted-foreground)]">
            {e}
          </p>
        ))}
        <ImportNextStepLink projectId={projectId} />
      </div>
    </div>
  );
}
