"use client";

import * as React from "react";
import Link from "next/link";
import { Zap, Loader2, CheckCircle2 } from "lucide-react";
import { useActionState } from "react";

import { loadStarterComplaints, createCustomStarterComplaints, type StarterResult } from "@/actions/complaints";
import { MARKET_KEYS, MARKET_LABELS } from "@/lib/starter-complaints";
import { Button } from "@/components/ui/button";
import { projectHref } from "@/lib/project-href";

export function StarterMarkets({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<StarterResult | null, FormData>(
    loadStarterComplaints,
    null
  );
  const [customState, customAction, customPending] = useActionState<StarterResult | null, FormData>(
    createCustomStarterComplaints,
    null
  );
  const [customMarket, setCustomMarket] = React.useState("");

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Start from a market</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Pick a market to load example complaints.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {MARKET_KEYS.map((key) => (
          <form key={key} action={action}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="market" value={key} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              {MARKET_LABELS[key]}
            </Button>
          </form>
        ))}
      </div>

      {/* Custom market input */}
      <div className="mt-4 border-t border-[var(--color-border)] pt-4">
        <p className="text-sm text-[var(--color-muted-foreground)] mb-2">
          Type any market or niche:
        </p>
        <form action={customAction} className="flex gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <input
            name="market"
            value={customMarket}
            onChange={(e) => setCustomMarket(e.target.value)}
            placeholder="e.g. pet grooming, electric bikes, coworking spaces"
            required
            minLength={2}
            maxLength={80}
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
          />
          <Button type="submit" size="sm" disabled={customPending || customMarket.trim().length < 2}>
            {customPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            Generate
          </Button>
        </form>
        <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
          Examples are for exploring. Real complaints are stronger.
        </p>
      </div>

      {pending && (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          Loading complaints...
        </p>
      )}
      {customPending && (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          Generating starter complaints for your market...
        </p>
      )}

      {state && <StarterSummary result={state} projectId={projectId} />}
      {customState && <StarterSummary result={customState} projectId={projectId} />}

      <p className="mt-3 text-[11px] text-[var(--color-muted-foreground)]">
        Examples are not proof of demand.
      </p>
    </section>
  );
}

function StarterSummary({
  result,
  projectId,
}: {
  result: StarterResult;
  projectId: string;
}) {
  if (result.inserted === 0 && result.errors.length === 0) {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-[12px] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-4 text-sm text-[var(--color-primary)]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">
            {result.market} starter complaints are already loaded.
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Head to{" "}
            <Link
              href={projectHref("/dashboard/opportunities", projectId)}
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Ideas → Find ideas
            </Link>{" "}
            to see what Rift finds.
          </p>
        </div>
      </div>
    );
  }

  if (result.inserted === 0 && result.errors.length > 0) {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-[12px] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Could not load starter complaints.</p>
          {result.errors.slice(0, 3).map((e, i) => (
            <p key={i} className="text-xs">
              {e.reason}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-start gap-2 rounded-[12px] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">
          {result.market} starter complaints loaded ({result.inserted}).
          {result.skipped > 0 && ` ${result.skipped} already existed.`}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Now go to{" "}
          <Link
            href={projectHref("/dashboard/opportunities", projectId)}
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Ideas → Find ideas
          </Link>{" "}
          to find ideas.
        </p>
      </div>
    </div>
  );
}
