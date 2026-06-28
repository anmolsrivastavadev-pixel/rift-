/* Deterministic Opportunity Score (0-100).
 *
 * Inputs (from Gemini):
 *   - complaintCount (int >= 1)
 *   - severity       (1..10)
 *   - confidence     (0..100)
 *
 * Weighting (per spec):
 *   Complaint Count 40%
 *   Severity        35%
 *   Confidence      25%
 *
 * Each input is normalised to a 0..100 sub-score using fixed functions so the
 * same dataset ALWAYS yields the same score (no dataset-relative scaling).
 */

export interface ScoreInputs {
  complaintCount: number;
  severity: number; // 1..10
  confidence: number; // 0..100
}

export interface ScoreBreakdown {
  weights: { count: number; severity: number; confidence: number };
  inputs: ScoreInputs;
  subscores: {
    count: number; // 0..100
    severity: number; // 0..100
    confidence: number; // 0..100
  };
  final: number; // 0..100
}

export const SCORE_WEIGHTS = {
  count: 0.4,
  severity: 0.35,
  confidence: 0.25,
} as const;

/* count -> 0..100 via log10 scaling so 1 complaint ≈ 15, 10 ≈ 52, 100 ≈ 100.
 * +1 avoids log(0). Capped at 100.
 */
function countScore(count: number): number {
  const raw = 50 * Math.log10((Math.max(0, count) + 1) / 1);
  return clamp(Math.round(raw));
}

/* severity 1..10 -> 0..100 (1 -> 10, 10 -> 100). */
function severityScore(sev: number): number {
  const s = clampSev(sev);
  return clamp(Math.round(((s - 1) / 9) * 100));
}

/* confidence already 0..100. */
function confScore(c: number): number {
  return clamp(Math.round(c));
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
function clampSev(s: number): number {
  return Math.max(1, Math.min(10, s));
}

export function computeOpportunityScore(input: ScoreInputs): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  const cs = countScore(input.complaintCount);
  const ss = severityScore(input.severity);
  const fs = confScore(input.confidence);

  const final = clamp(
    Math.round(
      cs * SCORE_WEIGHTS.count +
        ss * SCORE_WEIGHTS.severity +
        fs * SCORE_WEIGHTS.confidence
    )
  );

  const breakdown: ScoreBreakdown = {
    weights: { ...SCORE_WEIGHTS },
    inputs: {
      complaintCount: input.complaintCount,
      severity: clampSev(input.severity),
      confidence: clamp(input.confidence),
    },
    subscores: { count: cs, severity: ss, confidence: fs },
    final,
  };

  return { score: final, breakdown };
}