"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useActionState } from "react";
import { MessageSquare, Loader2, Check, AlertCircle } from "lucide-react";

import { submitBetaFeedback, type FeedbackResult } from "@/actions/beta";

/* M20 — compact in-app feedback form for beta users. Lives in the dashboard
 * shell (sidebar footer + mobile selector row). Collapsed to a single quiet
 * button until opened. Saves first-party only; no emails, no screenshots.
 */

const TYPES = [
  { value: "bug", label: "Bug" },
  { value: "confusing", label: "Confusing" },
  { value: "idea", label: "Idea" },
  { value: "praise", label: "Praise" },
  { value: "other", label: "Other" },
];

export function FeedbackWidget({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState<FeedbackResult | null, FormData>(
    submitBetaFeedback,
    null
  );

  // Collapse the form after a successful submit.
  const closedAfterRef = React.useRef<FeedbackResult | null>(null);
  React.useEffect(() => {
    if (state && state.ok && closedAfterRef.current !== state) {
      closedAfterRef.current = state;
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-muted-foreground)] transition-all duration-150 ease-out hover:bg-[var(--color-card)]/60 hover:text-[var(--color-foreground)]"
        >
          <MessageSquare className="h-4 w-4" />
          Feedback
        </button>
        {state && state.ok && (
          <p className="flex items-center gap-1 px-3 text-[11px] text-[var(--color-success)]">
            <Check className="h-3 w-3" /> Thanks — feedback saved.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3"
    >
      <p className="text-xs font-semibold">Send feedback</p>
      <input type="hidden" name="pagePath" value={pathname} />
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex gap-2">
        <select
          name="type"
          defaultValue="other"
          aria-label="Feedback type"
          className="h-8 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-xs text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          name="rating"
          defaultValue=""
          aria-label="Rating (optional)"
          className="h-8 w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-xs text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Rate</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}/5
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="message"
        required
        maxLength={2000}
        rows={3}
        placeholder="What happened, or what would help?"
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none focus:border-[var(--color-primary)]"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-2.5 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
          Send
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          Cancel
        </button>
      </div>
      {state && !state.ok && (
        <p className="flex items-start gap-1 text-[11px] text-[var(--color-danger)]">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {state.error}
        </p>
      )}
    </form>
  );
}
