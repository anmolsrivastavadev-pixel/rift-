import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { logger } from "@/lib/logger";
import {
  clusterSchema,
  clustersResponseSchema,
  normalizeCluster,
  type CleanedComplaint,
  type Cluster,
} from "@/lib/ai-schema";

/* ---------------------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------------------- */

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const BATCH_SIZE = 100; // complaints per Gemini call
export const MAX_COMPLAINTS = 1500; // hard cap to bound cost/latency

/* ---------------------------------------------------------------------------
 * Public API
 * ------------------------------------------------------------------------- */

/**
 * Cluster + summarise cleaned complaints into business opportunities.
 * Returns clusters referencing the original complaint indices.
 * Falls back to a deterministic local heuristic when no API key is present.
 */
export async function clusterComplaints(
  complaints: CleanedComplaint[]
): Promise<Cluster[]> {
  if (complaints.length === 0) return [];

  const capped = complaints.slice(0, MAX_COMPLAINTS);
  if (capped.length < complaints.length) {
    logger.warn("ai.capped_complaints", {
      kept: capped.length,
      total: complaints.length,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("ai.no_key_using_mock", {});
    return mockCluster(capped);
  }

  const ai = new GoogleGenAI({ apiKey });

  // Process in batches, then merge cross-batch duplicates.
  const batchResults: Cluster[][] = [];
  for (let i = 0; i < capped.length; i += BATCH_SIZE) {
    const batch = capped.slice(i, i + BATCH_SIZE);
    const localClusters = await clusterBatch(ai, batch, i);
    batchResults.push(localClusters);
  }

  const flat = batchResults.flat();
  const merged = mergeClusters(flat);
  logger.info("ai.clusters_ready", {
    batches: batchResults.length,
    raw: flat.length,
    merged: merged.length,
  });
  return merged;
}

/* ---------------------------------------------------------------------------
 * Gemini call (one batch)
 * ------------------------------------------------------------------------- */

async function clusterBatch(
  ai: GoogleGenAI,
  batch: CleanedComplaint[],
  offset: number
): Promise<Cluster[]> {
  const numbered = batch
    .map((c, i) => `#${i}: ${c.text}`)
    .join("\n");

  const prompt = `You are a startup analyst who writes opportunity briefs for NON-TECHNICAL FOUNDERS — people who want to build a company, not fix their backend. Your job is to translate customer complaints into startup opportunities that a founder would read and think "that's a problem worth solving."

Group the following complaints into clusters of the SAME underlying problem based on SEMANTIC similarity (not just keyword matching).

Complaints:
${numbered}

For each cluster, produce these fields:

- title: a PLAIN-ENGLISH title (max 120 chars) that names the CUSTOMER or BUSINESS PAIN. NOT the technical cause.
- summary: 1-3 sentences in plain English about the problem.
- keywords: 3-8 relevant tags.
- industry: best-fit industry.
- severity: 1-10 (how painful, based on complaint tone).
- confidence: 0-100 (how confident this is a real, distinct cluster).
- suggestedSoftware: the BROAD product someone could build — what it does for the CUSTOMER, not how it's engineered.
- reason: 1-3 sentences grounded ONLY in the complaints.
- complaintIndices: array of # numbers (0-based) in this cluster.
- marketGap: 1-2 sentence HYPOTHESIS about the unmet need in PLAIN ENGLISH.
- targetCustomer: who seems most affected (max 120 chars).
- likelyCurrentWorkarounds: 1-2 sentences on generic workarounds.
- whyWorkaroundsFallShort: 1-2 sentences on why they fall short, grounded in complaints.
- productAngle: 1-2 sentences describing the NARROW WEDGE — first target user, specific workflow, why this entry point is sharp. MUST be different from suggestedSoftware.
- differentiationAngle: 1-2 sentences on how it could be different (hypothesis, not competitive claim).
- validationQuestions: 3-5 specific questions about frequency, urgency, workaround, buyer, willingness to pay.
- riskFlags: 2-4 honest, actionable reasons this might fail.

======================
BANNED PHRASES (never use these unless you are directly quoting a complaint):
======================
- "state management"
- "data reconciliation layer"
- "data states"
- "synchronization architecture"
- "proper persistence"
- "operational metrics"
- "complex data architectures"
- "backend infrastructure"
- "data integrity engine"
- "real-time sync engine"
- "data consistency"
- "real-time synchronization"
- "persistence"
- "robust" (when describing architecture)
- "infrastructure layer"
- "data validation layer"
- "state synchronization"
- "data pipeline"
- "system architecture"

If you find yourself writing ANY of these, STOP and rewrite using plain English.

======================
PLAIN-ENGLISH REPLACEMENTS (use these instead):
======================
- "wrong information" instead of "data inconsistency"
- "outdated information" instead of "stale data"
- "conflicting app data" instead of "data synchronization issues"
- "cart/order mismatches" instead of "state management failures"
- "dashboard errors" instead of "data persistence issues"
- "notification mistakes" instead of "sync errors"
- "customers lose trust" instead of "data integrity compromised"
- "support tickets" instead of "operational metrics"
- "lost orders" instead of "data loss"
- "manual checking" instead of "data validation"
- "teams finding issues too late" instead of "monitoring gaps"

======================
EXAMPLES — BAD vs GOOD for each key field:
======================

TITLE:
  BAD:  "Persistent Data Inconsistency & State Management Failures"
  GOOD: "Customers Lose Trust When App Information Does Not Match"
  GOOD: "Cart, Order, and Dashboard Mismatches Create Support Problems"
  GOOD: "Apps Lose Revenue When Customer-Facing Information Falls Out of Sync"

suggestedSoftware (BROAD product):
  BAD:  "A robust data reconciliation layer that monitors and validates data states across the application."
  GOOD: "A tool that catches customer-facing app mismatches before they create support tickets, lost orders, or customer trust issues."
  GOOD: "A monitoring product for marketplaces that alerts teams when carts, orders, notifications, or dashboards show conflicting information."

productAngle (NARROW WEDGE — must be different from suggestedSoftware):
  BAD:  "A robust data reconciliation layer that monitors and validates data states."  (same as suggestedSoftware — WRONG)
  GOOD: "Start with marketplaces and e-commerce apps where carts, pickup times, vendor profiles, order statuses, and notifications must stay consistent across buyers and sellers."
  GOOD: "Target small marketplace teams first — they feel every mismatch as a support ticket but can't afford enterprise monitoring tools."

marketGap:
  BAD:  "There is a critical need for systems that ensure data consistency and real-time synchronization across all user interfaces."
  GOOD: "Users lose trust when different parts of an app show conflicting information, such as carts resetting, notifications being wrong, pickup times changing, or vendor profiles not matching what was configured."

validationQuestions:
  BAD:  "Would you pay for a system that guaranteed all your app data was always correct?"
  GOOD: "How often do customers report seeing conflicting carts, orders, notifications, or dashboard data?"
  GOOD: "Which mismatch causes the most support tickets, refunds, or lost orders?"
  GOOD: "How do teams currently detect these issues before customers complain?"
  GOOD: "Would teams pay for alerts that catch customer-facing mismatches before they affect orders?"

======================
FIELD RELATIONSHIP RULES:
======================
- suggestedSoftware = the BROAD product (what it does for the customer).
- productAngle = the NARROW WEDGE (who to target first + what workflow + why this entry point is sharp).
- These MUST be clearly different. Before returning JSON, compare them word-by-word — if they overlap significantly, rewrite productAngle to be narrower.

======================
GROUNDING RULES:
======================
- Base every conclusion ONLY on the complaints provided.
- Only infer from the complaint text. Do not use outside knowledge as factual evidence.
- NEVER invent market size, revenue, statistics, user counts, or industry data.
- Do not name competitors unless explicitly mentioned in the complaint text.
- Use cautious language: "The complaints suggest…", "This may indicate…", "A possible product angle is…", "One risk is…".
- AVOID: "The market needs…", "This proves…", "Guaranteed…", "Clearly a blue ocean…".
- Distinguish between evidence (complaints) and hypothesis (market gap, workarounds, differentiation).
- Do not estimate opportunity score.
- Cluster by meaning, not wording.
- Every complaint must belong to exactly one cluster.
- Keep each field concise and within length limits.

======================
VALIDATION QUESTION RULES:
======================
- No guarantees or unrealistic promises (never use "guaranteed", "ensure", "always correct").
- No vague questions like "Is this a good idea?"
- Ask about frequency, urgency, current workaround, buyer, and willingness to pay.
- Make them specific to this opportunity.

======================
RISK FLAG RULES:
======================
- Admit uncertainty honestly.
- Explain WHY the opportunity might fail (not just that it might).
- Avoid generic warnings.
- Avoid overconfident language.

======================
FINAL SELF-CHECK — do this before returning JSON. If ANY answer is "no", rewrite that field:
======================
1. Does the title sound like a founder opportunity, not an engineering ticket?
2. Did I remove ALL jargon — no "state management", "data reconciliation", "data states", "persistence", "sync engine"?
3. Is suggestedSoftware broad and customer-facing (not infrastructure)?
4. Is productAngle a narrow wedge that is DIFFERENT from suggestedSoftware?
5. Is marketGap plain English about user trust/pain, not architecture?
6. Are validation questions specific (no "guaranteed", no vague ideas)?
7. Are risk flags honest and actionable?
8. Did I avoid fake market-size claims?
9. Did I avoid naming competitors not in the complaints?

return ONLY JSON matching the schema`;

  logger.info("ai.gemini_request", { offset, batch: batch.length });

  let responseText: string | undefined;
  try {
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    responseText = res.text ?? undefined;
  } catch (err) {
    logger.error("ai.gemini_failed", {
      offset,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new Error(
      `Gemini request failed (offset ${offset}): ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!responseText) {
    throw new Error(`Gemini returned no text (offset ${offset})`);
  }

  logger.info("ai.gemini_response", {
    offset,
    chars: responseText.length,
  });

  // Strip markdown code fences if present.
  const cleaned = stripCodeFences(responseText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned invalid JSON (offset ${offset})`);
  }

  // Tolerant shape handling: Gemini sometimes returns a bare array of
  // clusters instead of `{ clusters: [...] }`. Normalize before Zod so the
  // per-cluster validation error (the real cause) surfaces instead of a
  // misleading "expected object, received array" from the object schema.
  const normalized = Array.isArray(parsed) ? { clusters: parsed } : parsed;

  const result = parseClusters(normalized);
  if (!result.success) {
    // Build a path-aware error message so future debugging shows which field
    // failed, e.g. "clusters[0].targetCustomer: Too big …".
    const firstIssue = result.error.issues[0];
    const path = firstIssue?.path?.length
      ? firstIssue.path.join(".")
      : "(root)";
    logger.error("ai.gemini_schema_mismatch", {
      offset,
      issues: result.error.issues.slice(0, 3),
    });
    throw new Error(
      `Gemini JSON did not match expected schema (offset ${offset}): ${path}: ${firstIssue?.message ?? "Invalid input"}`
    );
  }

  // Clamp/truncate all text fields + list items to M9 length caps so a
  // slightly long Gemini string never crashes the pipeline. Required fields
  // that would become empty fall back to a short placeholder.
  const normalizedClusters = result.data.clusters.map((c) => normalizeCluster(c));

  // Remap local batch indices to global indices.
  return normalizedClusters.map((c) => ({
    ...c,
    complaintIndices: c.complaintIndices
      .filter((i) => i >= 0 && i < batch.length)
      .map((i) => offset + i),
  }));
}

/* ---------------------------------------------------------------------------
 * Cross-batch merge (deterministic, keyword Jaccard)
 * ------------------------------------------------------------------------- */

function mergeClusters(clusters: Cluster[]): Cluster[] {
  if (clusters.length <= 1) return clusters;
  const merged: Cluster[] = [];
  for (const c of clusters) {
    const match = merged.find((m) => jaccard(m.keywords, c.keywords) >= 0.5);
    if (!match) {
      merged.push({ ...c });
      continue;
    }
    // merge into match
    const aCount = match.complaintIndices.length;
    const bCount = c.complaintIndices.length;
    const total = aCount + bCount;
    match.complaintIndices = Array.from(
      new Set([...match.complaintIndices, ...c.complaintIndices])
    );
    match.severity = round1(
      (match.severity * aCount + c.severity * bCount) / total
    );
    match.confidence = Math.round(
      (match.confidence * aCount + c.confidence * bCount) / total
    );
    match.keywords = dedupe([...match.keywords, ...c.keywords]).slice(0, 10);
    if (c.complaintIndices.length > aCount) {
      match.title = c.title;
      match.summary = c.summary;
      match.suggestedSoftware = c.suggestedSoftware;
      match.reason = c.reason;
      match.industry = c.industry;
      // Adopt the dominant cluster's M9 hypothesis fields so the merged
      // cluster reflects the largest contributor. Lists are unioned so we
      // don't drop signal from the smaller contributor.
      match.marketGap = c.marketGap ?? match.marketGap;
      match.targetCustomer = c.targetCustomer ?? match.targetCustomer;
      match.likelyCurrentWorkarounds =
        c.likelyCurrentWorkarounds ?? match.likelyCurrentWorkarounds;
      match.whyWorkaroundsFallShort =
        c.whyWorkaroundsFallShort ?? match.whyWorkaroundsFallShort;
      match.productAngle = c.productAngle ?? match.productAngle;
      match.differentiationAngle =
        c.differentiationAngle ?? match.differentiationAngle;
      match.validationQuestions = dedupe([
        ...match.validationQuestions,
        ...c.validationQuestions,
      ]).slice(0, 8);
      match.riskFlags = dedupe([...match.riskFlags, ...c.riskFlags]).slice(0, 8);
    }
  }
  return merged;
}

/* ---------------------------------------------------------------------------
 * Mock fallback (no API key) — deterministic grouping
 * ------------------------------------------------------------------------- */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be",
  "to", "of", "in", "on", "at", "for", "with", "i", "my", "it", "this",
  "that", "they", "you", "your", "no", "not", "so", "very", "just", "do",
  "does", "have", "has", "had", "please", "fix", "app",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function mockCluster(complaints: CleanedComplaint[]): Cluster[] {
  const groups = new Map<string, number[]>(); // signature -> indices
  complaints.forEach((c, i) => {
    const toks = tokens(c.text);
    if (toks.length === 0) return;
    const sig = toks.slice(0, 2).sort().join("|");
    const arr = groups.get(sig) ?? [];
    arr.push(i);
    groups.set(sig, arr);
  });

  const clusters: Cluster[] = [];
  for (const [, indices] of groups) {
    const sample = indices.map((i) => complaints[i].text).join(" ");
    const kws = dedupe(tokens(sample)).slice(0, 6);
    const broadProduct = `A tool that helps users solve ${kws.slice(0, 2).join(" and ")} problems`;
    const wedge = `Mock wedge: start with small teams who hit this pain daily and currently use spreadsheets or manual tracking for ${kws.slice(0, 1)}.`;
    clusters.push({
      title: `${cap(kws.slice(0, 3).join(" "))} frustrates users`,
      summary: `${kws.slice(0, 3).join(", ")} reported by ${indices.length} complaint${indices.length === 1 ? "" : "s"} — users seem to lose time or trust over this repeatedly.`,
      keywords: kws,
      industry: guessIndustry(kws),
      severity: 6,
      confidence: 50,
      suggestedSoftware: broadProduct,
      reason: "Mock cluster (no Gemini key). Grouped by shared keywords.",
      complaintIndices: indices,
      // Dev-safe mock M9 hypothesis fields — clearly fake, never shown as real.
      // suggestedSoftware = broad product; productAngle = narrow wedge (different).
      marketGap: `Mock hypothesis: users appear to lose time or trust when ${kws.slice(0, 2).join(" and ")} go wrong, and current tools may not address it directly.`,
      targetCustomer: "Mock target customer (no Gemini key).",
      likelyCurrentWorkarounds:
        "Mock workaround: manual tracking, spreadsheets, and follow-up messages.",
      whyWorkaroundsFallShort:
        "Mock: existing generic tools may not address this specific pain directly.",
      productAngle: wedge,
      differentiationAngle:
        "Mock: focus on this specific pain rather than general-purpose tools.",
      validationQuestions: [
        `How often do users hit ${kws.slice(0, 1)} in a typical week?`,
        "What do they currently use to handle it?",
        "Would they pay for a dedicated tool that catches it before it affects them?",
      ],
      riskFlags: [
        "Mock risk: sample size may be too small to prove broad demand.",
        "Mock risk: this may be a feature request rather than a business-critical pain.",
      ],
    });
  }
  return clusters;
}

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/* Tolerant parser: accepts either a bare array of clusters or
 * `{ clusters: [...] }`. The caller normalizes bare arrays into the object
 * shape before calling, but this function stays defensive so any caller is
 * safe. Returns the per-cluster Zod issues on failure (not a misleading
 * "expected object" error) so the real cause is surfaced.
 */
function parseClusters(
  parsed: unknown
):
  | { success: true; data: { clusters: Cluster[] } }
  | { success: false; error: { issues: z.ZodIssue[] } } {
  // Bare array → wrap, then validate via the object schema so per-cluster
  // errors surface instead of an "expected object" error.
  const candidate = Array.isArray(parsed) ? { clusters: parsed } : parsed;

  const objParse = clustersResponseSchema.safeParse(candidate);
  if (objParse.success) {
    return { success: true, data: objParse.data };
  }
  // Fallback: try as a bare array directly (in case the object schema has an
  // issue but the array alone is valid). Surface whichever error is more
  // useful — prefer the array parse error if the object parse failed only
  // because of shape (not per-cluster content).
  const arrayParse = z.array(clusterSchema).safeParse(parsed);
  if (arrayParse.success) {
    return { success: true, data: { clusters: arrayParse.data } };
  }
  return { success: false, error: { issues: objParse.error.issues } };
}

function stripCodeFences(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : s.trim();
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a.map((x) => x.toLowerCase()));
  const B = new Set(b.map((x) => x.toLowerCase()));
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function guessIndustry(kws: string[]): string {
  const text = kws.join(" ");
  if (/pay|invoice|bill|price/.test(text)) return "Fintech";
  if (/login|security|password|auth/.test(text)) return "Security";
  if (/mobile|app|crash|bug/.test(text)) return "Software";
  if (/ship|deliver|order/.test(text)) return "E-commerce";
  if (/search|load|slow/.test(text)) return "Software";
  return "General";
}