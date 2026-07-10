/* Pure deterministic decision-status helpers (M11, slimmed in M34 when the
 * standalone decisions board was folded into the Ideas page).
 *
 * No Gemini, no DB, no side effects.
 */

export type DecisionStatus = "undecided" | "pursue" | "park" | "reject";

export const DECISION_STATUSES: DecisionStatus[] = [
  "undecided",
  "pursue",
  "park",
  "reject",
];

export const DECISION_LABELS: Record<DecisionStatus, string> = {
  undecided: "Undecided",
  pursue: "Pursue",
  park: "Park",
  reject: "Reject",
};

/* The old `rift-opportunity-decision-<id>` localStorage keys are read ONLY by
 * the one-time M16C migration (components/dashboard/validation-state-migrator.tsx).
 * Decision state is database-backed now (ValidationWorkspace). */

export function isValidDecisionStatus(value: string | null | undefined): value is DecisionStatus {
  return value != null && (DECISION_STATUSES as string[]).includes(value);
}

/* The M11 "Testing Priority" helper (computeTestingPriority + labels) was
 * removed in M34 with the standalone decisions board that displayed it. */
