"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Globe, Loader2, Search, Shuffle } from "lucide-react";

import {
  findComplaintsAction,
  type FindComplaintsResult,
} from "@/actions/complaint-finder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
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
export function ComplaintFinder({
  projectId,
  usageLine,
}: {
  projectId: string;
  usageLine?: string;
}) {
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
        <div className="min-w-0 flex-1">
          <Input
            ref={inputRef}
            icon={Globe}
            type="text"
            name="keyword"
            required
            minLength={2}
            maxLength={80}
            placeholder="Type a niche, e.g. fitness apps"
            aria-label="Niche keyword"
            disabled={pending}
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

      {pending ? (
        <SearchingStatus />
      ) : (
        /* M30 — one-click niche suggestions so nobody faces a blank box */
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
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface)] disabled:opacity-50"
          >
            <Shuffle className="h-3 w-3" /> more
          </button>
        </div>
      )}

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Rift searches Reddit, App Store reviews, Hacker News, YouTube comments,
        Stack Exchange, GitHub, and the wider web for real frustrations about
        your niche. No spreadsheet needed.
      </p>
      {usageLine && (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {usageLine}
        </p>
      )}

      {result && !pending && <FinderSummary result={result} projectId={projectId} />}
    </div>
  );
}

const FINDER_STATUS_SOURCES = [
  "Reddit",
  "App Store reviews",
  "Hacker News",
  "YouTube",
  "Stack Exchange",
  "GitHub",
  "the web",
];

/* Pending status card — replaces the niche-chip row while a search runs so
 * the 30–60s wait reads as progress, not a hang. */
function SearchingStatus() {
  const [sourceIndex, setSourceIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSourceIndex((i) => (i + 1) % FINDER_STATUS_SOURCES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm"
    >
      <p className="flex items-center gap-2 font-medium text-[var(--color-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
        Searching 7 sources…
      </p>
      <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
        Checking {FINDER_STATUS_SOURCES[sourceIndex]}…
      </p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        This usually takes 30–60 seconds — stay on this page.
      </p>
    </div>
  );
}

function mentionsUpgrade(text: string): boolean {
  return text.includes("Upgrade") || text.includes("Pricing");
}

function SeePlansButton() {
  return (
    <div className="mt-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/pricing">See plans</Link>
      </Button>
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
    // Blocked/error runs lead with the real reason (e.g. a quota message),
    // not a misleading "no complaints found" headline.
    if (found === 0 && result.errors.length > 0) {
      return (
        <Notice variant="warning" title={result.errors[0]}>
          {result.errors.slice(1).map((e, i) => (
            <p key={i} className="text-xs">
              {e}
            </p>
          ))}
          {mentionsUpgrade(result.errors[0]) && <SeePlansButton />}
        </Notice>
      );
    }

    return (
      <Notice
        variant="warning"
        title={
          found > 0
            ? "These complaints are already loaded."
            : `No new complaints found for “${result.keyword}”.`
        }
      >
        {result.errors.map((e, i) => (
          <p key={i} className="text-xs">
            {e}
          </p>
        ))}
        {found > 0 && <ImportNextStepLink projectId={projectId} />}
      </Notice>
    );
  }

  return (
    <Notice
      variant="success"
      title={`Imported ${result.inserted} complaint${result.inserted === 1 ? "" : "s"} about “${result.keyword}”. Now find ideas.`}
    >
      <p className="text-xs">
        {sourceParts.join(", ")}
        {result.skipped > 0 ? `, ${result.skipped} skipped (duplicates)` : ""}.
      </p>
      {result.errors.map((e, i) => (
        <p key={i} className="text-xs">
          {e}
        </p>
      ))}
      <ImportNextStepLink projectId={projectId} />
    </Notice>
  );
}
