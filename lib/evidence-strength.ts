/* Pure deterministic helpers for the "Backed by…" evidence strength line.
 * No Gemini, no DB, no side effects.
 *
 * Display-only, like the pain trend: NOT a score input — lib/scoring.ts is
 * untouched. Summarises how much real ground an idea rests on: how many
 * linked complaints, from how many distinct sources (Reddit / App Store /
 * Hacker News / web, via Complaint.sourceKind), across how long a period
 * (Complaint.sourceDate). Complaints without a sourceKind are the user's own
 * data (CSV/paste) and count as one extra source bucket.
 */

import { isComplaintSourceKind } from "@/lib/complaint-sources";

export type EvidenceStrength = "strong" | "moderate" | "thin";

export type EvidenceStrengthResult = {
  strength: EvidenceStrength;
  total: number;
  /** Distinct source buckets (finder kinds + one "you added" bucket if any). */
  sourceCount: number;
  /** Whole months between oldest and newest dated complaint; 0 when unknown. */
  spanMonths: number;
  /** True when every complaint is the user's own data (no finder sources). */
  ownDataOnly: boolean;
};

export const EVIDENCE_STRENGTH_LABELS: Record<EvidenceStrength, string> = {
  strong: "Strong evidence",
  moderate: "Moderate evidence",
  thin: "Thin evidence",
};

const STRONG_MIN_TOTAL = 15;
const STRONG_MIN_SOURCES = 2;
const MODERATE_MIN_TOTAL = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export function computeEvidenceStrength(
  rows: { sourceKind: string | null; sourceDate: Date | null }[]
): EvidenceStrengthResult {
  const total = rows.length;

  const kinds = new Set<string>();
  let hasOwnData = false;
  let oldest: number | null = null;
  let newest: number | null = null;

  for (const r of rows) {
    if (isComplaintSourceKind(r.sourceKind)) kinds.add(r.sourceKind);
    else hasOwnData = true;
    if (r.sourceDate) {
      const t = r.sourceDate.getTime();
      if (Number.isNaN(t)) continue;
      if (oldest === null || t < oldest) oldest = t;
      if (newest === null || t > newest) newest = t;
    }
  }

  const sourceCount = kinds.size + (hasOwnData ? 1 : 0);
  const spanMonths =
    oldest !== null && newest !== null && newest > oldest
      ? Math.floor((newest - oldest) / (30 * DAY_MS))
      : 0;

  let strength: EvidenceStrength;
  if (total >= STRONG_MIN_TOTAL && sourceCount >= STRONG_MIN_SOURCES) {
    strength = "strong";
  } else if (total >= MODERATE_MIN_TOTAL) {
    strength = "moderate";
  } else {
    strength = "thin";
  }

  return {
    strength,
    total,
    sourceCount,
    spanMonths,
    ownDataOnly: kinds.size === 0,
  };
}

/** "Backed by 43 complaints from 3 sources over 14 months." */
export function buildEvidenceCaption(r: EvidenceStrengthResult): string {
  if (r.total === 0) return "No linked complaints yet.";
  const complaints = `${r.total} complaint${r.total === 1 ? "" : "s"}`;
  const over =
    r.spanMonths >= 1
      ? ` over ${r.spanMonths} month${r.spanMonths === 1 ? "" : "s"}`
      : "";
  if (r.ownDataOnly) {
    return `Backed by ${complaints} you added${over}.`;
  }
  const fromSources = r.sourceCount > 1 ? ` from ${r.sourceCount} sources` : "";
  return `Backed by ${complaints}${fromSources}${over}.`;
}
