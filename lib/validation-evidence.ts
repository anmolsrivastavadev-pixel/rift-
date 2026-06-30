/* Pure deterministic helpers for the M12 Validation Evidence Log.
 *
 * No Gemini, no DB, no side effects. Evidence Signal and Suggested Next Step
 * are UI helper labels only — NOT a new AI score, NOT proof of anything.
 */

export type StrongestSignal =
  | "None yet"
  | "Repeated pain"
  | "Messy workaround"
  | "Clear buyer"
  | "Willingness to try"
  | "Willingness to pay"
  | "Urgent deadline"
  | "Existing budget";

export type BiggestConcern =
  | "None yet"
  | "Not enough interviews"
  | "Pain is too weak"
  | "Pain is too rare"
  | "Buyer is unclear"
  | "Workaround is good enough"
  | "Low willingness to pay"
  | "Too hard to reach users"
  | "Solution may be too complex";

export const STRONGEST_SIGNALS: StrongestSignal[] = [
  "None yet",
  "Repeated pain",
  "Messy workaround",
  "Clear buyer",
  "Willingness to try",
  "Willingness to pay",
  "Urgent deadline",
  "Existing budget",
];

export const BIGGEST_CONCERNS: BiggestConcern[] = [
  "None yet",
  "Not enough interviews",
  "Pain is too weak",
  "Pain is too rare",
  "Buyer is unclear",
  "Workaround is good enough",
  "Low willingness to pay",
  "Too hard to reach users",
  "Solution may be too complex",
];

export const EVIDENCE_SUMMARY_MAX = 500;

export interface EvidenceState {
  interviewsCompleted: number;
  peopleReportingSamePain: number;
  peopleUsingWorkaround: number;
  peopleWillingToTry: number;
  peopleWillingToPay: number;
  strongestSignal: StrongestSignal;
  biggestConcern: BiggestConcern;
  evidenceSummary: string;
}

export const DEFAULT_EVIDENCE: EvidenceState = {
  interviewsCompleted: 0,
  peopleReportingSamePain: 0,
  peopleUsingWorkaround: 0,
  peopleWillingToTry: 0,
  peopleWillingToPay: 0,
  strongestSignal: "None yet",
  biggestConcern: "None yet",
  evidenceSummary: "",
};

export function evidenceStorageKey(opportunityId: string): string {
  return `rift-validation-evidence-${opportunityId}`;
}

/* Clamp a number to 0–20. Handles NaN, undefined, empty string, etc. */
export function clampCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(20, Math.round(n));
}

/* When interviewsCompleted is lowered, dependent counts must not exceed it. */
export function clampDependentCounts(state: EvidenceState): EvidenceState {
  const max = state.interviewsCompleted;
  return {
    ...state,
    peopleReportingSamePain: Math.min(state.peopleReportingSamePain, max),
    peopleUsingWorkaround: Math.min(state.peopleUsingWorkaround, max),
    peopleWillingToTry: Math.min(state.peopleWillingToTry, max),
    peopleWillingToPay: Math.min(state.peopleWillingToPay, max),
  };
}

/* Safely parse a localStorage blob into EvidenceState, falling back to
 * DEFAULT_EVIDENCE for any missing/invalid field. Unknown select values
 * fall back to "None yet".
 */
export function parseEvidenceState(raw: string | null): EvidenceState {
  if (!raw) return { ...DEFAULT_EVIDENCE };
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const strongestSignal = STRONGEST_SIGNALS.includes(obj.strongestSignal as StrongestSignal)
      ? (obj.strongestSignal as StrongestSignal)
      : "None yet";
    const biggestConcern = BIGGEST_CONCERNS.includes(obj.biggestConcern as BiggestConcern)
      ? (obj.biggestConcern as BiggestConcern)
      : "None yet";
    const summary = typeof obj.evidenceSummary === "string"
      ? obj.evidenceSummary.slice(0, EVIDENCE_SUMMARY_MAX)
      : "";
    return clampDependentCounts({
      interviewsCompleted: clampCount(obj.interviewsCompleted),
      peopleReportingSamePain: clampCount(obj.peopleReportingSamePain),
      peopleUsingWorkaround: clampCount(obj.peopleUsingWorkaround),
      peopleWillingToTry: clampCount(obj.peopleWillingToTry),
      peopleWillingToPay: clampCount(obj.peopleWillingToPay),
      strongestSignal,
      biggestConcern,
      evidenceSummary: summary,
    });
  } catch {
    return { ...DEFAULT_EVIDENCE };
  }
}

/* --- Evidence Signal --- */

export type EvidenceSignal =
  | "no-evidence"
  | "needs-more-evidence"
  | "weak-signal"
  | "promising-signal"
  | "mixed-signal"
  | "early-signal";

export const EVIDENCE_SIGNAL_LABELS: Record<EvidenceSignal, string> = {
  "no-evidence": "No evidence yet",
  "needs-more-evidence": "Needs more evidence",
  "weak-signal": "Weak signal",
  "promising-signal": "Promising signal",
  "mixed-signal": "Mixed signal",
  "early-signal": "Early signal",
};

export const EVIDENCE_SIGNAL_HELPER =
  "Evidence Signal is a local helper based on the validation evidence you enter. It is not an AI score or proof that the opportunity will work.";

/* Deterministic Evidence Signal label. First match wins in this order:
 *   1. No evidence yet
 *   2. Needs more evidence
 *   3. Weak signal
 *   4. Promising signal
 *   5. Mixed signal
 *   6. Early signal (fallback)
 */
export function computeEvidenceSignal(s: EvidenceState): EvidenceSignal {
  const {
    interviewsCompleted,
    peopleReportingSamePain,
    peopleUsingWorkaround,
    peopleWillingToTry,
    peopleWillingToPay,
    strongestSignal,
    biggestConcern,
  } = s;

  if (interviewsCompleted === 0) return "no-evidence";
  if (interviewsCompleted < 3) return "needs-more-evidence";

  const isWeak =
    interviewsCompleted >= 3 &&
    peopleReportingSamePain <= 1 &&
    peopleWillingToTry <= 1 &&
    peopleWillingToPay === 0;

  if (isWeak) return "weak-signal";

  const isPromising =
    interviewsCompleted >= 5 &&
    peopleReportingSamePain >= 3 &&
    peopleUsingWorkaround >= 2 &&
    (peopleWillingToTry >= 2 || peopleWillingToPay >= 1);

  if (isPromising) return "promising-signal";

  const isMixed =
    interviewsCompleted >= 3 &&
    strongestSignal !== "None yet" &&
    biggestConcern !== "None yet";

  if (isMixed) return "mixed-signal";

  return "early-signal";
}

/* --- Suggested Next Step --- */

export function computeSuggestedNextStep(s: EvidenceState): string {
  const signal = computeEvidenceSignal(s);
  switch (signal) {
    case "no-evidence":
      return "Next step: start interviews.";
    case "needs-more-evidence":
      return "Next step: run more interviews before deciding.";
    case "weak-signal":
      return "Next step: consider Park or Reject after another review.";
    case "promising-signal":
      return "Next step: consider marking this Pursue after reviewing risks.";
    case "mixed-signal":
      return "Next step: review the strongest concern before deciding.";
    case "early-signal":
      return "Next step: continue validation.";
  }
}
