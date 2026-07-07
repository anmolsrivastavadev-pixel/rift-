"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ToggleRight,
  ListChecks,
  Database,
} from "lucide-react";

import { runPipeline, getProcessingStatus, resetOpportunitiesAction } from "@/actions/opportunities";
import type { ProcessingStatus, Stage } from "@/lib/progress";
import { Button } from "@/components/ui/button";

const STAGE_META: Record<Stage, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  idle: { label: "Idle", icon: ToggleRight },
  cleaning: { label: "Cleaning complaints", icon: Sparkles },
  clustering: { label: "Finding patterns", icon: ListChecks },
  generating: { label: "Creating ideas", icon: Sparkles },
  saving: { label: "Saving results", icon: Database },
  complete: { label: "Complete", icon: CheckCircle2 },
  error: { label: "Error", icon: AlertTriangle },
};

const ORDER: (keyof typeof STAGE_META)[] = [
  "cleaning",
  "clustering",
  "generating",
  "saving",
  "complete",
];

export function RunOpportunitiesButton({ projectId }: { projectId: string }) {
  // useId is stable across mounts (and users), so it can only seed the
  // hidden input for SSR; every actual run mints a fresh id — the DB-unique
  // AIRun.jobId would otherwise collide on re-runs and strand the poll.
  const reactId = React.useId().replace(/[:]/g, "");
  const [jobId, setJobId] = React.useState(reactId);
  const [status, setStatus] = React.useState<ProcessingStatus | null>(null);
  const [running, setRunning] = React.useState(false);
  // Two-step confirm for the destructive clear action: first click arms it
  // for 3 seconds, second click submits.
  const [confirmClear, setConfirmClear] = React.useState(false);
  React.useEffect(() => {
    if (!confirmClear) return;
    const t = setTimeout(() => setConfirmClear(false), 3000);
    return () => clearTimeout(t);
  }, [confirmClear]);

  // Poll for progress once running.
  React.useEffect(() => {
    if (!running) return;
    let alive = true;
    const id = setInterval(async () => {
      const s = await getProcessingStatus(jobId, projectId);
      if (!alive) return;
      setStatus(s);
      if (s?.stage === "complete" || s?.stage === "error") {
        setRunning(false);
        clearInterval(id);
      }
    }, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [running, jobId, projectId]);

  const [result, action, pending] = useActionState<
    { created: number; error?: string } | null,
    FormData
  >(async (_prev, formData) => {
    const fresh = `${reactId}-${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    setJobId(fresh);
    formData.set("jobId", fresh);
    setRunning(true);
    const res = await runPipeline(formData);
    // Actions can fail before any progress is written (quota reached, beta
    // access revoked). Without this, the poll never sees a terminal stage
    // and the button spins forever.
    if (res?.error) setRunning(false);
    return res;
  }, null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <form action={action}>
          <input type="hidden" name="jobId" value={jobId} />
          <input type="hidden" name="projectId" value={projectId} />
          <Button type="submit" disabled={pending || running}>
            {pending || running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Find ideas
              </>
            )}
          </Button>
        </form>

        <form
          action={resetOpportunitiesAction}
          onSubmit={(e) => {
            if (!confirmClear) {
              e.preventDefault();
              setConfirmClear(true);
            }
          }}
        >
          <input type="hidden" name="projectId" value={projectId} />
          <Button
            type="submit"
            variant={confirmClear ? "danger" : "ghost"}
            disabled={pending || running}
            className={
              confirmClear
                ? undefined
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)]"
            }
          >
            {confirmClear ? "Delete all ideas?" : "Clear all ideas"}
          </Button>
        </form>
      </div>

      {result?.error && !running && !status && (
        <p className="flex items-start gap-2 rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{result.error}</span>
        </p>
      )}

      {(running || status) && (
        <ProgressPanel status={status} />
      )}
    </div>
  );
}

function ProgressPanel({ status }: { status: ProcessingStatus | null }) {
  const current = status?.stage ?? "idle";
  const isComplete = current === "complete";
  const isError = current === "error";

  return (
    <div className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      <ol className="space-y-3">
        {ORDER.map((stage) => {
          const meta = STAGE_META[stage];
          const active = current === stage && !isComplete && !isError;
          const done =
            isComplete ||
            (ORDER.indexOf(current) > ORDER.indexOf(stage) && !isError);
          return (
            <li key={stage} className="flex items-start gap-3">
              <div className="mt-0.5">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
                ) : active ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
                ) : (
                  <meta.icon className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm ${done || active ? "font-medium text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]"}`}
                >
                  {meta.label}
                </p>
                {active && status?.message && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {status.message}
                  </p>
                )}
                {active && status?.total != null && status?.done != null && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                    <div
                      className="h-full bg-[var(--color-primary)] transition-all"
                      style={{
                        width: `${Math.min(100, (status.done / Math.max(1, status.total)) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {isComplete && status?.message && (
        <p className="mt-4 text-sm font-medium text-[var(--color-success)]">
          {status.message}
        </p>
      )}
      {isError && status?.error && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{status.error}</span>
        </p>
      )}

      {/* Idea-shaped skeletons while the AI works, so results have a place
          to land instead of the page swapping abruptly at the end. */}
      {!isComplete && !isError && (
        <div
          aria-hidden="true"
          className="mt-6 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-shimmer rounded-2xl border border-[var(--color-border)]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
