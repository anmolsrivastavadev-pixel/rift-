/* M31b — Pure deterministic helpers for the pain trend signal.
 * No Gemini, no DB, no side effects.
 *
 * Display-only: NOT a score input — lib/scoring.ts and the clustering prompt
 * are untouched. Also separate from the write-only Opportunity.growth/trend
 * columns, which are createdAt-based and rendered nowhere.
 *
 * The signal uses ONLY Complaint.sourceDate (when the complaint was originally
 * posted), never createdAt (when it was imported into Rift) — import dates
 * would read "growing" after every import. Complaints without a source date
 * are not counted, so CSV/paste-heavy projects honestly show "Not enough
 * data" instead of a made-up trend.
 */

export type PainTrend = "growing" | "steady" | "fading" | "insufficient";

export type PainTrendResult = {
  trend: PainTrend;
  /** Dated complaints inside the 12-month comparison window. */
  datedCount: number;
  /** Last 180 days. */
  recentCount: number;
  /** 180–360 days ago. */
  priorCount: number;
};

export const PAIN_TREND_LABELS: Record<PainTrend, string> = {
  growing: "Growing",
  steady: "Steady",
  fading: "Fading",
  insufficient: "Not enough data",
};

export const PAIN_TREND_HELPER =
  "Compares dated complaints from the last 6 months with the 6 months before. Complaints without a source date are not counted.";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 180;
const MIN_DATED_FOR_SIGNAL = 5;

export function computePainTrend(
  sourceDates: (Date | null)[],
  now: Date = new Date()
): PainTrendResult {
  const nowMs = now.getTime();
  const recentStart = nowMs - WINDOW_DAYS * DAY_MS;
  const priorStart = nowMs - 2 * WINDOW_DAYS * DAY_MS;

  let recentCount = 0;
  let priorCount = 0;
  for (const d of sourceDates) {
    if (!d) continue;
    const t = d.getTime();
    if (Number.isNaN(t) || t > nowMs) continue;
    if (t > recentStart) recentCount += 1;
    else if (t > priorStart) priorCount += 1;
  }

  const datedCount = recentCount + priorCount;
  let trend: PainTrend;
  if (datedCount < MIN_DATED_FOR_SIGNAL) {
    trend = "insufficient";
  } else if (
    recentCount > priorCount &&
    recentCount >= Math.ceil(priorCount * 1.5)
  ) {
    trend = "growing";
  } else if (
    priorCount > recentCount &&
    priorCount >= Math.ceil(recentCount * 1.5)
  ) {
    trend = "fading";
  } else {
    trend = "steady";
  }

  return { trend, datedCount, recentCount, priorCount };
}

/** "Based on 12 dated complaints (8 in the last 6 months vs 4 earlier)." */
export function buildPainTrendCaption(r: PainTrendResult): string {
  if (r.trend === "insufficient") {
    return "Not enough dated complaints in the last 12 months to read a trend.";
  }
  return `Based on ${r.datedCount} dated complaint${r.datedCount === 1 ? "" : "s"} (${r.recentCount} in the last 6 months vs ${r.priorCount} earlier).`;
}
