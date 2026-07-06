"use client";

import * as React from "react";
import { useActionState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";

import { saveAction, unsaveAction } from "@/actions/saved";

type State = { saved: boolean; error?: string } | null;

export function SaveButton({
  opportunityId,
  projectId,
  saved,
  size = "md",
  showLabel = false,
}: {
  opportunityId: string;
  projectId: string;
  saved: boolean;
  size?: "sm" | "md";
  /** Render a visible "Save"/"Saved" label (M24 feedback: the bare bookmark
   * icon was cryptic next to the fully-labeled compare button). */
  showLabel?: boolean;
}) {
  const initial: State = { saved };
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      // dispatch to the right server action based on current saved state.
      // reading `saved` at call-time so the toggle reflects latest.
      const isCurrentlySaved = _prev?.saved ?? saved;
      const res = isCurrentlySaved
        ? await unsaveAction(formData)
        : await saveAction(formData);
      return res;
    },
    initial
  );

  const isSaved = state?.saved ?? saved;
  const Icon = isSaved ? BookmarkCheck : Bookmark;
  // Labeled variant matches the compare chip; icon-only keeps the square.
  const dim = showLabel
    ? "gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium"
    : size === "sm"
      ? "h-7 w-7 rounded-[10px]"
      : "h-8 w-8 rounded-[10px]";
  const iconCls = showLabel ? "h-3 w-3" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <form action={formAction}>
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        disabled={pending}
        aria-pressed={isSaved}
        aria-label={isSaved ? "Remove from saved" : "Save opportunity"}
        title={isSaved ? "Remove from saved" : "Save opportunity"}
        className={`inline-flex ${dim} items-center justify-center border transition-colors disabled:opacity-50 ${
          isSaved
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/60 hover:text-[var(--color-primary)]"
        }`}
      >
        {pending ? (
          <Loader2 className={`${iconCls} animate-spin`} />
        ) : (
          <Icon className={iconCls} />
        )}
        {showLabel && (isSaved ? "Saved" : "Save")}
      </button>
    </form>
  );
}
