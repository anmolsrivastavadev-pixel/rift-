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
}: {
  opportunityId: string;
  projectId: string;
  saved: boolean;
  size?: "sm" | "md";
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
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconCls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

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
        className={`group/inline-flex ${dim} items-center justify-center rounded-[10px] border transition-colors disabled:opacity-50 ${
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
      </button>
    </form>
  );
}
