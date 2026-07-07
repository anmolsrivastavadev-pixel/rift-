"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertTriangle, Eye, Loader2, Pause, Play, Trash2 } from "lucide-react";

import {
  createNicheWatchAction,
  toggleNicheWatchAction,
  deleteNicheWatchAction,
  type NicheWatchActionResult,
} from "@/actions/niche-watch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* M31c — Weekly niche watch panel on the Complaints page. Create a watch and
 * Rift re-runs the complaint finder for that niche roughly weekly (cron),
 * imports anything new, and emails a digest. All state lives in the DB; this
 * panel only creates/pauses/resumes/deletes rows.
 */

export type NicheWatchItem = {
  id: string;
  keyword: string;
  paused: boolean;
  lastRunAt: Date | null;
  lastRunStatus: string | null;
  lastRunInserted: number;
};

function lastRunLine(w: NicheWatchItem): string {
  if (!w.lastRunAt) return "Hasn't run yet — first run within a week.";
  const date = w.lastRunAt.toLocaleDateString();
  switch (w.lastRunStatus) {
    case "ok":
      return `Last run ${date} · ${w.lastRunInserted} new complaint${w.lastRunInserted === 1 ? "" : "s"}`;
    case "ok_no_new":
      return `Last run ${date} · nothing new`;
    case "quota_full":
      return `Last run ${date} · project is full, nothing added`;
    case "failed":
      return `Last run ${date} · failed, will retry next week`;
    default:
      return `Last run ${date}`;
  }
}

export function NicheWatchPanel({
  projectId,
  watches,
  usageLine,
  emailEnabled,
}: {
  projectId: string;
  watches: NicheWatchItem[];
  usageLine: string | null;
  emailEnabled: boolean;
}) {
  const [createResult, createAction, creating] = useActionState<
    NicheWatchActionResult | null,
    FormData
  >(createNicheWatchAction, null);

  return (
    <div className="space-y-4">
      <form action={createAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="relative min-w-0 flex-1">
          <Eye className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            name="keyword"
            required
            minLength={2}
            maxLength={80}
            placeholder="Niche to watch, e.g. fitness apps"
            aria-label="Niche keyword to watch weekly"
            disabled={creating}
            className="h-10 w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-background)] pl-9 pr-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]"
          />
        </div>
        <Button type="submit" disabled={creating} variant="secondary">
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" /> Watch weekly
            </>
          )}
        </Button>
      </form>

      {createResult && !createResult.ok && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[12px] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-xs text-[var(--color-warning)]"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {createResult.error}
        </div>
      )}

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Rift re-runs the complaint search for this niche about once a week and
        adds anything new to this project.{" "}
        {emailEnabled
          ? "You'll get a short email when new complaints arrive."
          : "Email isn't configured, so you won't get the digest — new complaints still appear here weekly."}
      </p>
      {usageLine && (
        <p className="text-xs text-[var(--color-muted-foreground)]">{usageLine}</p>
      )}

      {watches.length > 0 && (
        <ul className="space-y-2">
          {watches.map((w) => (
            <WatchRow key={w.id} watch={w} />
          ))}
        </ul>
      )}
    </div>
  );
}

function WatchRow({ watch }: { watch: NicheWatchItem }) {
  const [toggleResult, toggleAction, toggling] = useActionState<
    NicheWatchActionResult | null,
    FormData
  >(toggleNicheWatchAction, null);
  const [deleteResult, deleteAction, deleting] = useActionState<
    NicheWatchActionResult | null,
    FormData
  >(deleteNicheWatchAction, null);
  const busy = toggling || deleting;
  const error =
    (toggleResult && !toggleResult.ok && toggleResult.error) ||
    (deleteResult && !deleteResult.ok && deleteResult.error) ||
    null;

  return (
    <li className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {watch.keyword}
        </span>
        <Badge variant={watch.paused ? "default" : "success"}>
          {watch.paused ? "Paused" : "Active"}
        </Badge>
        <form action={toggleAction}>
          <input type="hidden" name="watchId" value={watch.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={busy}
            aria-label={watch.paused ? `Resume watching ${watch.keyword}` : `Pause watching ${watch.keyword}`}
          >
            {watch.paused ? (
              <>
                <Play className="h-3.5 w-3.5" /> Resume
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause
              </>
            )}
          </Button>
        </form>
        <form action={deleteAction}>
          <input type="hidden" name="watchId" value={watch.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={busy}
            aria-label={`Delete the watch for ${watch.keyword}`}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </form>
      </div>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        {lastRunLine(watch)}
      </p>
      {error && (
        <p role="alert" className="mt-1 text-xs text-[var(--color-warning)]">
          {error}
        </p>
      )}
    </li>
  );
}
