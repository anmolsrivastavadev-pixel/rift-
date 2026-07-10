"use client";

import * as React from "react";

import {
  DECISION_STATUSES,
  DECISION_LABELS,
  type DecisionStatus,
} from "@/lib/decision-board";
import { setDecisionStatus as saveDecisionStatus } from "@/actions/validation";

/* Segmented Pursue / Park / Reject control for choosing a decision status.
 * Clicking the active segment clears the decision back to "undecided", so
 * every state is reachable without a dropdown. The chosen state carries its
 * semantic color, which makes a board full of decisions glance-scannable.
 * M16C: statuses are database-backed — the server page loads them and passes
 * them into `useDecisionStatuses`; changes update local state instantly and
 * are persisted here through a server action. If the save fails, the
 * optimistic selection is reverted and an inline alert says so honestly.
 */
export function DecisionStatusSelect({
  opportunityId,
  value,
  onChange,
  title,
}: {
  opportunityId: string;
  value: DecisionStatus;
  onChange: (status: DecisionStatus) => void;
  title?: string;
}) {
  const [saveFailed, setSaveFailed] = React.useState(false);
  const options = DECISION_STATUSES.filter((s) => s !== "undecided");

  async function handleSelect(next: DecisionStatus) {
    const previous = value;
    // Optimistic: the UI updates instantly, then the save runs.
    onChange(next);
    try {
      const result = await saveDecisionStatus(opportunityId, next);
      if (!result.ok) throw new Error("decision save failed");
      setSaveFailed(false);
    } catch {
      onChange(previous);
      setSaveFailed(true);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div
        role="group"
        aria-label={title ? `Decision for ${title}` : "Decision for this idea"}
        className="inline-flex rounded-lg border border-[var(--color-border)]"
      >
        {/* No overflow-hidden on the wrapper — it would clip the global
            keyboard focus outline on the segments. Corners come from
            first/last rounding instead. */}
        {options.map((s, i) => {
          const active = value === s;
          const activeClass =
            s === "pursue"
              ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
              : s === "park"
                ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]";
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => void handleSelect(active ? "undecided" : s)}
              className={`h-8 px-3 text-xs font-medium transition-colors duration-150 ease-out first:rounded-l-lg last:rounded-r-lg focus-visible:relative focus-visible:z-10 ${
                i > 0 ? "border-l border-[var(--color-border)]" : ""
              } ${
                active
                  ? activeClass
                  : "bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {DECISION_LABELS[s]}
            </button>
          );
        })}
      </div>
      {saveFailed && (
        <span role="alert" className="text-xs text-[var(--color-danger)]">
          {"Couldn't save that decision — check your connection and try again."}
        </span>
      )}
    </div>
  );
}

/* Standalone decision control for a single idea (detail page header). Holds
 * the current status locally, seeded from the database by the server page,
 * and persists through the same wiring as the decision board (the select
 * itself calls the setDecisionStatus server action, with revert-on-failure).
 */
export function IdeaDecisionControl({
  opportunityId,
  initialStatus,
  title,
}: {
  opportunityId: string;
  initialStatus: DecisionStatus;
  title?: string;
}) {
  const [status, setStatus] = React.useState<DecisionStatus>(initialStatus);
  return (
    <DecisionStatusSelect
      opportunityId={opportunityId}
      value={status}
      onChange={setStatus}
      title={title}
    />
  );
}

/* Hook: holds the decision statuses for a set of opportunities, seeded from
 * the database via the server page. `setStatus` updates local state
 * immediately (instant UI); persistence happens inside DecisionStatusSelect,
 * which calls the setDecisionStatus server action and reverts via onChange on
 * failure. `hydrated` is kept for API compatibility and is always true — the
 * server-provided state is available on first render.
 */
export function useDecisionStatuses(
  initialStatuses: Record<string, DecisionStatus>
): {
  statuses: Record<string, DecisionStatus>;
  hydrated: boolean;
  setStatus: (id: string, status: DecisionStatus) => void;
} {
  const [statuses, setStatuses] =
    React.useState<Record<string, DecisionStatus>>(initialStatuses);

  function setStatus(id: string, status: DecisionStatus) {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  }

  return { statuses, hydrated: true, setStatus };
}
