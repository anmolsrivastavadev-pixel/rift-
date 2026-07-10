"use client";

import * as React from "react";
import { Zap, Loader2, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { useActionState } from "react";

import {
  loadStarterComplaints,
  createCustomStarterComplaints,
  loadDemoComplaints,
  type StarterResult,
} from "@/actions/complaints";
import type { UploadResult } from "@/lib/schemas";
import { MARKET_KEYS, MARKET_LABELS } from "@/lib/starter-complaints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DemoSummary,
  ImportNextStepLink,
} from "@/components/complaints/import-summary";

export function StarterMarkets({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<StarterResult | null, FormData>(
    loadStarterComplaints,
    null
  );
  const [customState, customAction, customPending] = useActionState<StarterResult | null, FormData>(
    createCustomStarterComplaints,
    null
  );
  const [demoState, demoAction, demoPending] = useActionState<
    UploadResult | null,
    FormData
  >(loadDemoComplaints, null);
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
        <form action={demoAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={demoPending}
          >
            {demoPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            General demo
          </Button>
        </form>
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
          <div className="min-w-0 flex-1">
            <Input
              name="market"
              value={customMarket}
              onChange={(e) => setCustomMarket(e.target.value)}
              placeholder="e.g. pet grooming, electric bikes, coworking spaces"
              aria-label="Market or niche for example complaints"
              required
              minLength={2}
              maxLength={80}
            />
          </div>
          <Button type="submit" size="sm" disabled={customPending || customMarket.trim().length < 2}>
            {customPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            Generate
          </Button>
        </form>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
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
      {demoPending && (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          Loading demo complaints...
        </p>
      )}

      {demoState && (
        <div className="mt-4">
          <DemoSummary result={demoState} projectId={projectId} />
        </div>
      )}
      {state && <StarterSummary result={state} projectId={projectId} />}
      {customState && <StarterSummary result={customState} projectId={projectId} />}

      <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
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
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-4 text-sm text-[var(--color-primary)]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">
            {result.market} starter complaints are already loaded.
          </p>
          <ImportNextStepLink projectId={projectId} />
        </div>
      </div>
    );
  }

  if (result.inserted === 0 && result.errors.length > 0) {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
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
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">
          Loaded {result.inserted} example complaints for {result.market}. Next:
          turn them into ideas.
          {result.skipped > 0 && ` ${result.skipped} already existed.`}
        </p>
        <ImportNextStepLink projectId={projectId} />
      </div>
    </div>
  );
}
