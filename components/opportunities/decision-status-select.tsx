"use client";

import * as React from "react";

import {
  DECISION_STATUSES,
  DECISION_LABELS,
  type DecisionStatus,
} from "@/lib/decision-board";
import { setDecisionStatus as saveDecisionStatus } from "@/actions/validation";

/* Compact native select for choosing a decision status per opportunity.
 * M16C: statuses are database-backed — the server page loads them and passes
 * them into `useDecisionStatuses`; changes update local state instantly and
 * are persisted through a server action.
 */
export function DecisionStatusSelect({
  opportunityId,
  value,
  onChange,
}: {
  opportunityId: string;
  value: DecisionStatus;
  onChange: (status: DecisionStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DecisionStatus)}
      aria-label={`Decision status for opportunity ${opportunityId}`}
      className="h-8 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-xs text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]"
    >
      {DECISION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {DECISION_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

/* Hook: holds the decision statuses for a set of opportunities, seeded from
 * the database via the server page. `setStatus` updates local state
 * immediately (instant UI) and persists through the setDecisionStatus server
 * action. `hydrated` is kept for API compatibility and is always true — the
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
    void saveDecisionStatus(id, status).catch(() => {
      // Offline / transient failure — the selection stays visible locally and
      // the next change retries the save.
    });
  }

  return { statuses, hydrated: true, setStatus };
}
