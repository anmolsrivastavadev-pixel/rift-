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
  const jobId = React.useId().replace(/[:]/g, "");
  const [status, setStatus] = React.useState<ProcessingStatus | null>(null);
  const [running, setRunning] = React.useState(false);

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

  const [, action, pending] = useActionState<
    { created: number; error?: string } | null,
    FormData
  >(async (_prev, formData) => {
    setRunning(true);
    return await runPipeline(formData);
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

        <form action={resetOpportunitiesAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <Button type="submit" variant="outline" disabled={pending || running}>
            Reset
          </Button>
        </form>
      </div>

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
    <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
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
        <p className="mt-4 flex items-start gap-2 rounded-[12px] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{status.error}</span>
        </p>
      )}
    </div>
  );
}
