import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { logger } from "@/lib/logger";
import {
  clusterSchema,
  clustersResponseSchema,
  type CleanedComplaint,
  type Cluster,
} from "@/lib/ai-schema";

/* ---------------------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------------------- */

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const BATCH_SIZE = 100; // complaints per Gemini call
const MAX_COMPLAINTS = 1500; // hard cap to bound cost/latency

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

  const prompt = `You are an expert product analyst. Group the following customer complaints into clusters of the SAME underlying problem based on SEMANTIC similarity (not just keyword matching).

Complaints:
${numbered}

For each cluster, produce:
- title: short problem title (max 120 chars)
- summary: 1-3 sentence summary of the underlying problem
- keywords: 3-8 relevant tags
- industry: best-fit industry
- severity: 1-10 (how painful the problem is, based on complaint tone)
- confidence: 0-100 (how confident you are this is a real, distinct cluster)
- suggestedSoftware: a software product that could solve this
- reason: 1-3 sentences explaining your reasoning, grounded ONLY in the complaints
- complaintIndices: array of the # numbers (0-based) belonging to this cluster

Rules:
- base every conclusion ONLY on the complaints provided
- NEVER invent market size or statistics
- do not estimate opportunity score
- cluster by meaning, not wording
- every complaint must belong to exactly one cluster
- return ONLY JSON matching the schema`;

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

  const result = parseClusters(parsed);
  if (!result.success) {
    logger.error("ai.gemini_schema_mismatch", {
      offset,
      issues: result.error.issues.slice(0, 3),
    });
    throw new Error(
      `Gemini JSON did not match expected schema (offset ${offset}): ${result.error.issues[0]?.message}`
    );
  }

  // Remap local batch indices to global indices.
  return result.data.clusters.map((c) => ({
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
    clusters.push({
      title: titleFromKeywords(kws),
      summary: `${kws.slice(0, 3).join(", ")} reported by ${indices.length} complaint${indices.length === 1 ? "" : "s"}.`,
      keywords: kws,
      industry: guessIndustry(kws),
      severity: 6,
      confidence: 50,
      suggestedSoftware: `${cap(titleFromKeywords(kws))} automation tool`,
      reason: "Mock cluster (no Gemini key). Grouped by shared keywords.",
      complaintIndices: indices,
    });
  }
  return clusters;
}

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/* Tolerant parser: Gemini sometimes returns a bare array of clusters
 * instead of `{ clusters: [...] }`. Accept either shape.
 */
function parseClusters(
  parsed: unknown
):
  | { success: true; data: { clusters: Cluster[] } }
  | { success: false; error: { issues: { message: string }[] } } {
  const arrayParse = z.array(clusterSchema).safeParse(parsed);
  if (arrayParse.success) {
    return { success: true, data: { clusters: arrayParse.data } };
  }
  const objParse = clustersResponseSchema.safeParse(parsed);
  if (objParse.success) {
    return { success: true, data: objParse.data };
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

function titleFromKeywords(kws: string[]): string {
  return cap(kws.slice(0, 3).join(" "));
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