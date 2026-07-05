import { FileText, Sparkles } from "lucide-react";

/* M16D — compact, read-only history panel for the dashboard home. Shows what
 * data was added to the current project and when ideas were generated from
 * it. Server-rendered; queries live in the page (filtered by userId +
 * projectId). Renders nothing when the project has no history yet.
 */

export type ImportHistoryItem = {
  id: string;
  sourceType: string;
  label: string;
  complaintCount: number;
  createdAt: Date;
};

export type RunHistoryItem = {
  id: string;
  status: string;
  inputComplaintCount: number;
  outputOpportunityCount: number;
  errorMessage: string | null;
  createdAt: Date;
};

const SOURCE_LABELS: Record<string, string> = {
  csv: "CSV upload",
  paste: "Pasted text",
  demo: "Demo data",
  starter_market: "Starter pack",
  finder: "Complaint finder",
};

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProjectHistory({
  imports,
  runs,
}: {
  imports: ImportHistoryItem[];
  runs: RunHistoryItem[];
}) {
  if (imports.length === 0 && runs.length === 0) return null;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {imports.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-[var(--color-primary)]" />
            Recent data
          </h3>
          <ul className="mt-3 space-y-2.5">
            {imports.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--color-foreground)]">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-[var(--color-muted-foreground)]">
                    Added {item.complaintCount} complaint{item.complaintCount === 1 ? "" : "s"}
                    {" · "}
                    {SOURCE_LABELS[item.sourceType] ?? item.sourceType}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-[var(--color-muted-foreground)]">
                  {formatDate(item.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {runs.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
            Recent idea runs
          </h3>
          <ul className="mt-3 space-y-2.5">
            {runs.map((run) => (
              <li key={run.id} className="flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-medium">
                    {run.status === "completed" ? (
                      <span className="text-[var(--color-foreground)]">
                        Found {run.outputOpportunityCount} idea{run.outputOpportunityCount === 1 ? "" : "s"}
                      </span>
                    ) : run.status === "failed" ? (
                      <span className="text-[var(--color-danger)]">Failed — try again</span>
                    ) : (
                      <span className="text-[var(--color-muted-foreground)]">Running…</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[var(--color-muted-foreground)]">
                    From {run.inputComplaintCount} complaint{run.inputComplaintCount === 1 ? "" : "s"}
                    {run.status === "failed" && run.errorMessage ? ` · ${run.errorMessage}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-[var(--color-muted-foreground)]">
                  {formatDate(run.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
