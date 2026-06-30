"use client";

import * as React from "react";

import {
  decisionStorageKey,
  DECISION_STATUSES,
  DECISION_LABELS,
  isValidDecisionStatus,
  type DecisionStatus,
} from "@/lib/decision-board";

/* Compact native select for choosing a local decision status per opportunity.
 * Reads localStorage after mount; writes after hydration. No
 * useSyncExternalStore, no hydration crash. Keyed per opportunity ID.
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

/* Hook: loads all decision statuses from localStorage for a set of
 * opportunity IDs. Returns a map + a setter that persists to localStorage.
 * SSR-safe (returns all-undecided until hydration).
 */
export function useDecisionStatuses(opportunityIds: string[]): {
  statuses: Record<string, DecisionStatus>;
  hydrated: boolean;
  setStatus: (id: string, status: DecisionStatus) => void;
} {
  const [statuses, setStatuses] = React.useState<Record<string, DecisionStatus>>({});
  const [hydrated, setHydrated] = React.useState(false);

  // Read from localStorage after mount.
  React.useEffect(() => {
    const map: Record<string, DecisionStatus> = {};
    try {
      for (const id of opportunityIds) {
        const raw = window.localStorage.getItem(decisionStorageKey(id));
        if (isValidDecisionStatus(raw)) {
          map[id] = raw;
        }
      }
    } catch {
      // localStorage unavailable — start with all undecided.
    }
    setStatuses(map); // eslint-disable-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, [opportunityIds]);

  function setStatus(id: string, status: DecisionStatus) {
    setStatuses((prev) => ({ ...prev, [id]: status }));
    try {
      window.localStorage.setItem(decisionStorageKey(id), status);
    } catch {
      // private mode / quota — fail silently.
    }
  }

  return { statuses, hydrated, setStatus };
}
