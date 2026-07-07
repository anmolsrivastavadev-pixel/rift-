"use client";

import * as React from "react";
import { useActionState } from "react";
import { Globe, Loader2, Search, CheckCircle2, AlertTriangle, Shuffle } from "lucide-react";

import {
  findComplaintsAction,
  type FindComplaintsResult,
} from "@/actions/complaint-finder";
import { Button } from "@/components/ui/button";
import { ImportNextStepLink } from "@/components/complaints/import-summary";
import {
  COMPLAINT_SOURCE_NAMES,
  COMPLAINT_SOURCE_ORDER,
} from "@/lib/complaint-sources";
import { pickNiches } from "@/lib/niche-suggestions";

/* Keyword complaint finder — the "1-click" path for beginners who have no
 * CSV. Type a niche (or click a suggested one) and Rift pulls real complaints
 * from Reddit, App Store reviews, Hacker News, and the wider web into the
 * current project.
 */
export function ComplaintFinder({ projectId }: { projectId: string }) {
  const [result, action, pending] = useActionState<
    FindComplaintsResult | null,
    FormData
  >(findComplaintsAction, null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  // M30 — niche chips rotate through the curated list via the "more" button.
  // Starts at 0 (deterministic) so server and client render the same chips.
  const [nicheOffset, setNicheOffset] = React.useState(0);
  const niches = pickNiches(nicheOffset);

  function applyNiche(niche: string) {
    if (pending || !inputRef.current) return;
    inputRef.current.value = niche;
    formRef.current?.requestSubmit();
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} action={action} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="relative min-w-0 flex-1">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            ref={inputRef}
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

      {/* M30 — one-click niche suggestions so nobody faces a blank box */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-[var(--color-muted-foreground)]">
          Not sure? Try one of these:
        </span>
        {niches.map((niche) => (
          <button
            key={niche}
            type="button"
            disabled={pending}
            onClick={() => applyNiche(niche)}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1 text-xs text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)]/60 hover:text-[var(--color-foreground)] disabled:opacity-50"
          >
            {niche}
          </button>
        ))}
        <button
          type="button"
          disabled={pending}
          onClick={() => setNicheOffset((o) => o + 6)}
          aria-label="Show different niche ideas"
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-[var(--color-primary)] transition-colors hover:bg-[var(--color-card)] disabled:opacity-50"
        >
          <Shuffle className="h-3 w-3" /> more
        </button>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Rift searches Reddit, App Store reviews, Hacker News, YouTube comments,
        Stack Exchange, GitHub, and the wider web for real frustrations about
        your niche. No spreadsheet needed.
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
  const found = Object.values(result.foundBySource).reduce((a, b) => a + b, 0);
  // Only name sources that actually returned something.
  const sourceParts = COMPLAINT_SOURCE_ORDER.filter(
    (k) => result.foundBySource[k] > 0
  ).map((k) => `${result.foundBySource[k]} from ${COMPLAINT_SOURCE_NAMES[k]}`);

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
          {sourceParts.join(", ")}
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
