import { z } from "zod";

/* Length caps for AI-generated text fields. These are NOT enforced as Zod
 * `.max()` (which would fail the whole response when Gemini writes a slightly
 * long sentence). Instead the schema accepts any string, and a post-parse
 * normalizer (see normalizeCluster below) clamps to these limits with an
 * ellipsis. Required fields still use `.min(1)` so genuinely empty/garbage
 * output is rejected.
 */
export const FIELD_LIMITS = {
  title: 120,
  summary: 600,
  industry: 80,
  suggestedSoftware: 160,
  reason: 1200,
  marketGap: 400,
  targetCustomer: 120,
  likelyCurrentWorkarounds: 400,
  whyWorkaroundsFallShort: 400,
  productAngle: 400,
  differentiationAngle: 400,
  keyword: 40,
  validationQuestion: 300,
  riskFlag: 300,
} as const;

export const ARRAY_LIMITS = {
  keywords: 8,
  validationQuestions: 5,
  riskFlags: 4,
} as const;

/* Schema for a single cluster returned by Gemini.
 *
 * Design note: text fields use `.min(1)` (required) or `.optional()` but NOT
 * `.max()`. A too-long string from Gemini should be clamped, not crashed the
 * whole pipeline. The normalizer (normalizeCluster) enforces length after
 * parsing. Numbers and indices keep their range validation because those
 * genuinely indicate a bad response.
 */
export const clusterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  keywords: z.array(z.string()).min(1),
  industry: z.string().min(1),
  severity: z.number().min(1).max(10),
  confidence: z.number().min(0).max(100),
  suggestedSoftware: z.string().min(1),
  reason: z.string().min(1),
  complaintIndices: z.array(z.number().int().min(0)).min(1),

  // M9 — complaint-grounded market-gap hypothesis. Optional/defaulted so a
  // missing field from Gemini never fails the whole pipeline; the action
  // stores null for nullable strings and [] for the list fields.
  marketGap: z.string().optional(),
  targetCustomer: z.string().optional(),
  likelyCurrentWorkarounds: z.string().optional(),
  whyWorkaroundsFallShort: z.string().optional(),
  productAngle: z.string().optional(),
  differentiationAngle: z.string().optional(),
  validationQuestions: z.array(z.string()).default([]),
  riskFlags: z.array(z.string()).default([]),
});

/* Full Gemini response: a list of clusters. */
export const clustersResponseSchema = z.object({
  clusters: z.array(clusterSchema),
});

export type Cluster = z.infer<typeof clusterSchema>;
export type ClustersResponse = z.infer<typeof clustersResponseSchema>;

/* Cleaned complaint passed to the AI pipeline. */
export const cleanedComplaintSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(2000),
});
export type CleanedComplaint = z.infer<typeof cleanedComplaintSchema>;

/* ---------------------------------------------------------------------------
 * Post-parse normalizer
 * ------------------------------------------------------------------------- */

/** Trim + collapse internal whitespace; clamp to `max` chars with an ellipsis. */
export function clampText(value: string | null | undefined, max: number): string {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  if (text.length <= max) return text;
  return text.slice(0, Math.max(1, max - 1)).trimEnd() + "…";
}

/** Trim + clamp each item, drop empties, cap the array length. */
function clampStringArray(
  items: string[] | null | undefined,
  itemMax: number,
  arrayMax: number
): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => clampText(it, itemMax))
    .filter((s) => s.length > 0)
    .slice(0, arrayMax);
}

/** Normalize a parsed cluster: clamp every text field and list item to the
 *  M9 length caps. Called AFTER successful Zod validation so type safety is
 *  preserved. Required fields that became empty after clamping fall back to
 *  a short placeholder so the pipeline never stores an empty string in a
 *  non-null DB column.
 */
export function normalizeCluster(c: Cluster): Cluster {
  const title = clampText(c.title, FIELD_LIMITS.title) || "Untitled opportunity";
  const summary = clampText(c.summary, FIELD_LIMITS.summary) || "No summary.";
  const industry = clampText(c.industry, FIELD_LIMITS.industry) || "General";
  const suggestedSoftware =
    clampText(c.suggestedSoftware, FIELD_LIMITS.suggestedSoftware) || "TBD";
  const reason = clampText(c.reason, FIELD_LIMITS.reason) || "No reasoning provided.";

  return {
    ...c,
    title,
    summary,
    industry,
    suggestedSoftware,
    reason,
    keywords: clampStringArray(c.keywords, FIELD_LIMITS.keyword, ARRAY_LIMITS.keywords),
    marketGap: c.marketGap ? clampText(c.marketGap, FIELD_LIMITS.marketGap) : c.marketGap,
    targetCustomer: c.targetCustomer
      ? clampText(c.targetCustomer, FIELD_LIMITS.targetCustomer)
      : c.targetCustomer,
    likelyCurrentWorkarounds: c.likelyCurrentWorkarounds
      ? clampText(c.likelyCurrentWorkarounds, FIELD_LIMITS.likelyCurrentWorkarounds)
      : c.likelyCurrentWorkarounds,
    whyWorkaroundsFallShort: c.whyWorkaroundsFallShort
      ? clampText(c.whyWorkaroundsFallShort, FIELD_LIMITS.whyWorkaroundsFallShort)
      : c.whyWorkaroundsFallShort,
    productAngle: c.productAngle
      ? clampText(c.productAngle, FIELD_LIMITS.productAngle)
      : c.productAngle,
    differentiationAngle: c.differentiationAngle
      ? clampText(c.differentiationAngle, FIELD_LIMITS.differentiationAngle)
      : c.differentiationAngle,
    validationQuestions: clampStringArray(
      c.validationQuestions,
      FIELD_LIMITS.validationQuestion,
      ARRAY_LIMITS.validationQuestions
    ),
    riskFlags: clampStringArray(
      c.riskFlags,
      FIELD_LIMITS.riskFlag,
      ARRAY_LIMITS.riskFlags
    ),
  };
}