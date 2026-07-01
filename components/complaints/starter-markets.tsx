"use client";

import * as React from "react";
import Link from "next/link";
import { Zap, Loader2, CheckCircle2 } from "lucide-react";
import { useActionState } from "react";

import { loadStarterComplaints, createCustomStarterComplaints, type StarterResult } from "@/actions/complaints";
import { MARKET_KEYS, MARKET_LABELS } from "@/lib/starter-complaints";
import { Button } from "@/components/ui/button";

export function StarterMarkets() {
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
    <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Want business ideas fast?</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Pick a market and Rift will load starter complaint examples so you
            can generate business ideas quickly. This is useful for exploring
            ideas, but real complaints from your own research will give stronger
            results.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {MARKET_KEYS.map((key) => (
          <form key={key} action={action}>
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
          Don&apos;t see your market? Type any market or niche below to generate
          brainstorming examples:
        </p>
        <form action={customAction} className="flex gap-2">
          <input
            name="market"
            value={customMarket}
            onChange={(e) => setCustomMarket(e.target.value)}
            placeholder="e.g. pet grooming, electric bikes, coworking spaces"
            required
            minLength={2}
            maxLength={80}
            className="flex-1 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]"
          />
          <Button type="submit" size="sm" disabled={customPending || customMarket.trim().length < 2}>
            {customPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            Generate
          </Button>
        </form>
        <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
          AI-generated examples — not real data. You can also paste real
          complaints from your own customers.
        </p>
      </div>

      <div className="mt-4 rounded-[8px] bg-[var(--color-muted)]/30 p-3 text-xs text-[var(--color-muted-foreground)]">
        <p>
          <strong className="font-medium text-[var(--color-foreground)]">
            Quick ideas
          </strong>{" "}
          = fast inspiration from starter examples.
        </p>
        <p className="mt-0.5">
          <strong className="font-medium text-[var(--color-foreground)]">
            Real data
          </strong>{" "}
          = stronger ideas grounded in complaints you provide.
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

      {state && <StarterSummary result={state} />}
      {customState && <StarterSummary result={customState} />}

      <p className="mt-3 text-[11px] text-[var(--color-muted-foreground)]">
        Starter examples are for exploring the workflow. They are not proof of
        demand. For stronger results, paste real complaints or reviews from your
        market.
      </p>
    </section>
  );
}

function StarterSummary({ result }: { result: StarterResult }) {
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
              href="/dashboard/opportunities"
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Ideas → Generate business ideas
            </Link>{" "}
            to see what Rift finds in the patterns.
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
          These are synthetic starter examples for exploring the workflow. Now
          go to{" "}
          <Link
            href="/dashboard/opportunities"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Ideas → Generate business ideas
          </Link>{" "}
          to see what Rift finds.
        </p>
      </div>
    </div>
  );
}
