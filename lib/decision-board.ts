/* Pure deterministic helpers for the M11 Opportunity Decision Board.
 *
 * No Gemini, no DB, no side effects. Testing Priority is a UI helper label
 * only — it is NOT a new AI score, NOT a numeric score, and does NOT replace
 * the Opportunity Score.
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

export function decisionStorageKey(opportunityId: string): string {
  return `rift-opportunity-decision-${opportunityId}`;
}

export function isValidDecisionStatus(value: string | null | undefined): value is DecisionStatus {
  return value != null && (DECISION_STATUSES as string[]).includes(value);
}

/* --- Testing Priority --- */

export type TestingPriority =
  | "needs-more-evidence"
  | "high-risk"
  | "strong-signal"
  | "worth-testing"
  | "needs-review";

export const TESTING_PRIORITY_LABELS: Record<TestingPriority, string> = {
  "needs-more-evidence": "Needs more evidence",
  "high-risk": "High risk / validate carefully",
  "strong-signal": "Strong signal",
  "worth-testing": "Worth testing",
  "needs-review": "Needs review",
};

export interface TestingPriorityInput {
  opportunityScore: number;
  mentions: number;
  confidence: number | null;
  riskFlags: string[];
}

/* Deterministic Testing Priority label. Evaluated in priority order so only
 * one label is chosen. NOT a new score — just a compact UI helper.
 *
 * Order (first match wins):
 *   1. Needs more evidence — mentions < 5 OR confidence < 65
 *   2. High risk / validate carefully — riskFlags >= 3 AND score < 80
 *   3. Strong signal — score >= 80 AND mentions >= 8 AND confidence >= 80
 *   4. Worth testing — score >= 65 AND confidence >= 70
 *   5. Needs review (fallback)
 */
export function computeTestingPriority(input: TestingPriorityInput): TestingPriority {
  const conf = input.confidence ?? 0;
  const riskCount = input.riskFlags.length;

  if (input.mentions < 5 || conf < 65) {
    return "needs-more-evidence";
  }
  if (riskCount >= 3 && input.opportunityScore < 80) {
    return "high-risk";
  }
  if (input.opportunityScore >= 80 && input.mentions >= 8 && conf >= 80) {
    return "strong-signal";
  }
  if (input.opportunityScore >= 65 && conf >= 70) {
    return "worth-testing";
  }
  return "needs-review";
}

export const TESTING_PRIORITY_HELPER =
  "Testing Priority is a lightweight UI helper based on score, complaint count, confidence, and risk flags. It is not a new AI score.";
