import { z } from "zod";

/* ───────────────────────────────────────────
 * Type utilities
 * ─────────────────────────────────────────── */

/** Response envelope for every prompt call. */
export interface AiResponse<T> {
  data: T;
  raw: string;
  model: string;
}

/* ───────────────────────────────────────────
 * 1. Complaint Clustering
 * ─────────────────────────────────────────── */

export const clusterSchema = z.object({
  clusterId: z.number(),
  label: z.string().max(100),
  complaintIndices: z.array(z.number()),
  rootCause: z.string().max(500),
});

export const clusteringResponseSchema = z.object({
  clusters: z.array(clusterSchema).min(1),
});

export type Cluster = z.infer<typeof clusterSchema>;
export type ClusteringResponse = z.infer<typeof clusteringResponseSchema>;

export const CLUSTERING_SYSTEM_PROMPT = `You are a complaint clustering engine for a dental SaaS analytics platform.

Your task is to group dental practice complaints by shared root cause, not by surface-level wording. You will receive a numbered list of complaints (each with an id, title, and body).

Rules:
- Each complaint must belong to exactly one cluster.
- A cluster must contain at least 2 complaints.
- The label must be a concise noun phrase describing the systemic problem (e.g., "Insurance claim denials" not "Problems with insurance").
- The rootCause must identify the underlying operational or business-process failure, not restate the complaints.
- Do not create a miscellaneous or "Other" cluster. Every complaint must fit into a meaningful group.
- Output only valid JSON matching the schema below. No explanation, no markdown.`;

export function buildClusteringUserPrompt(
  complaints: { id: number; title: string; body: string }[],
): string {
  return `Cluster the following ${complaints.length} dental complaints by shared root cause.

${complaints.map((c) => `[${c.id}] ${c.title}\n${c.body}`).join("\n\n")}

Respond with JSON:
{
  "clusters": [
    {
      "clusterId": 1,
      "label": "...",
      "complaintIndices": [1, 5, 12],
      "rootCause": "..."
    }
  ]
}`;
}

/* ───────────────────────────────────────────
 * 2. Problem Summarisation
 * ─────────────────────────────────────────── */

export const problemSummarySchema = z.object({
  title: z.string().max(200),
  summary: z.string().max(1000),
  painPoints: z.array(z.string().max(200)).min(1).max(10),
  affectedStakeholders: z.array(z.string().max(100)),
});

export type ProblemSummary = z.infer<typeof problemSummarySchema>;

export const SUMMARY_SYSTEM_PROMPT = `You are a problem analyst for a dental SaaS platform.

You will receive a cluster of related dental complaints (their titles, bodies, and root cause). Distil them into a single concise problem statement.

Rules:
- Title must be a clear, benefit-driven problem statement (e.g., "Dental practices lose 15% of revenue to no-show appointments").
- Summary must describe the problem in 2-4 sentences, including quantifiable impact if the data supports it.
- Pain points: list distinct operational frustrations, each as a short phrase.
- Affected stakeholders: who feels this pain (e.g., "front desk staff", "dentists", "patients").
- Output only valid JSON. No explanation.`;

export function buildSummaryUserPrompt(
  label: string,
  rootCause: string,
  complaints: { title: string; body: string }[],
): string {
  return `Cluster label: ${label}
Root cause: ${rootCause}

Complaints in this cluster:
${complaints.map((c, i) => `[${i + 1}] ${c.title}\n${c.body}`).join("\n\n")}

Respond with JSON:
{
  "title": "...",
  "summary": "...",
  "painPoints": ["..."],
  "affectedStakeholders": ["..."]
}`;
}

/* ───────────────────────────────────────────
 * 3. Opportunity Scoring
 * ─────────────────────────────────────────── */

export const opportunityScoreSchema = z.object({
  opportunityScore: z.number().int().min(0).max(100),
  scoreBreakdown: z.object({
    painIntensity: z.number().int().min(0).max(100),
    marketSize: z.number().int().min(0).max(100),
    willingnessToPay: z.number().int().min(0).max(100),
    urgency: z.number().int().min(0).max(100),
    frequency: z.number().int().min(0).max(100),
  }),
  competition: z.enum(["Low", "Medium", "High"]),
  suggestedSoftware: z.string().max(200),
  revenuePotential: z.enum(["Low", "Medium", "High"]),
});

export type OpportunityScore = z.infer<typeof opportunityScoreSchema>;

export const SCORING_SYSTEM_PROMPT = `You are a SaaS opportunity analyst evaluating problem statements from dental practices.

Given a summarised problem (title, summary, pain points, and the number of complaints expressing it), score the viability of building a SaaS solution.

Scoring dimensions (each 0-100):
- painIntensity: How severe is this problem for those who experience it?
- marketSize: How many dental practices does this affect?
- willingnessToPay: Would practices pay a monthly subscription for a solution?
- urgency: How quickly do they need a fix?
- frequency: How often does this problem occur (daily > weekly > monthly)?

The overall opportunityScore is a weighted average of the five dimensions (not a simple mean — pain intensity and willingness to pay carry more weight).

Competition labels:
- Low: No or very few direct competitors in the dental SaaS space.
- Medium: Some existing solutions but none dominate or none are purpose-built.
- High: Crowded space with established players.

Revenue potential:
- Low: Small TAM, unlikely to sustain a SaaS business alone.
- Medium: Moderate TAM, viable as a feature within a larger platform.
- High: Large TAM, standalone product opportunity.

Output only valid JSON. No explanation.`;

export function buildScoringUserPrompt(
  title: string,
  summary: string,
  painPoints: string[],
  mentionCount: number,
): string {
  return `Problem: ${title}
Summary: ${summary}
Pain points: ${painPoints.join("; ")}
Mentions in dataset: ${mentionCount}

Respond with JSON:
{
  "opportunityScore": 85,
  "scoreBreakdown": {
    "painIntensity": 90,
    "marketSize": 80,
    "willingnessToPay": 85,
    "urgency": 75,
    "frequency": 95
  },
  "competition": "Medium",
  "suggestedSoftware": "...",
  "revenuePotential": "High"
}`;
}

/* ───────────────────────────────────────────
 * 4. Keyword Extraction
 * ─────────────────────────────────────────── */

export const keywordsSchema = z.object({
  keywords: z.array(z.string().max(50)).min(1).max(20),
  categories: z.array(
    z.object({
      name: z.string().max(50),
      keyterms: z.array(z.string().max(50)),
    }),
  ),
});

export type KeywordsResult = z.infer<typeof keywordsSchema>;

export const KEYWORD_SYSTEM_PROMPT = `You are a keyword extraction engine for dental practice complaints.

Given one or more complaint texts, extract the most relevant keywords and group them into categories.

Rules:
- Keywords must be single words or short phrases (2-4 words max) that appear or are strongly implied in the text.
- Exclude stopwords, generic terms ("problem", "issue", "need"), and practice names.
- Categories should be domain-specific (e.g., "Insurance", "Scheduling", "Billing", "Patient communication", "Clinical", "Operations").
- Each category must have at least 2 associated keyterms.
- Output only valid JSON. No explanation.`;

export function buildKeywordUserPrompt(texts: string[]): string {
  return `Extract keywords from the following complaint texts:

${texts.map((t, i) => `--- Text ${i + 1} ---\n${t}`).join("\n\n")}

Respond with JSON:
{
  "keywords": ["no-show", "revenue loss", "confirmation"],
  "categories": [
    { "name": "Scheduling", "keyterms": ["no-show", "cancellation", "double-booking"] }
  ]
}`;
}

/* ───────────────────────────────────────────
 * 5. Trend Analysis
 * ─────────────────────────────────────────── */

export const trendPointSchema = z.object({
  date: z.string(),
  count: z.number().int().min(0),
  label: z.string().optional(),
});

export const trendAnalysisSchema = z.object({
  trend: z.array(trendPointSchema),
  direction: z.enum(["increasing", "stable", "decreasing"]),
  growth: z.number(),
  insight: z.string().max(500),
  emergingTopics: z.array(z.string().max(100)).optional(),
  seasonalPattern: z.boolean(),
});

export type TrendAnalysis = z.infer<typeof trendAnalysisSchema>;

export const TREND_SYSTEM_PROMPT = `You are a trend analyst for dental industry complaints.

Given a set of complaints grouped by time period (e.g., month), identify whether the volume is increasing, stable, or decreasing, and surface any emerging sub-topics.

Rules:
- The trend array must have one entry per time period, sorted chronologically.
- direction must be "increasing" (growth > 5%), "stable" (growth between -5% and 5%), or "decreasing" (growth < -5%).
- growth is the percentage change from the first period to the last (can be negative).
- insight: a concise 1-2 sentence explanation of what the trend means.
- emergingTopics: topics that appear more frequently in recent periods vs earlier ones (optional, max 5).
- seasonalPattern: true if volume consistently peaks in certain periods (e.g., end of year, tax season).
- Output only valid JSON. No explanation.`;

export function buildTrendUserPrompt(
  periods: { label: string; complaints: { title: string; body: string }[] }[],
): string {
  return `Analyse complaint volume trends across the following time periods:

${periods.map((p) => `=== ${p.label} (${p.complaints.length} complaints) ===\n${p.complaints.map((c) => `- ${c.title}`).join("\n")}`).join("\n\n")}

Respond with JSON:
{
  "trend": [
    { "date": "2026-01", "count": 45 },
    { "date": "2026-02", "count": 52 }
  ],
  "direction": "increasing",
  "growth": 15.5,
  "insight": "...",
  "emergingTopics": ["...", "..."],
  "seasonalPattern": false
}`;
}

/* ───────────────────────────────────────────
 * 6. Industry Classification
 * ─────────────────────────────────────────── */

export const industryClassificationSchema = z.object({
  industry: z.string().max(100),
  subCategory: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
});

export type IndustryClassification = z.infer<typeof industryClassificationSchema>;

export const INDUSTRY_SYSTEM_PROMPT = `You are an industry classifier for a dental SaaS analytics platform.

Given a complaint text, classify it into the most specific dental industry segment.

Rules:
- industry must be one of:
  "General Dentistry", "Orthodontics", "Oral Surgery", "Periodontics",
  "Endodontics", "Pediatric Dentistry", "Prosthodontics", "Dental Lab",
  "Dental Insurance", "Dental Practice Management", "Dental Marketing",
  "Dental Staffing", "Dental Supplies", "Dental Education"
- subCategory (optional): further refine the segment (e.g., under "Dental Insurance" → "Claims processing").
- department (optional): the practice department most relevant to the complaint
  ("Front desk", "Billing", "Clinical", "Operations", "Marketing").
- If the text doesn't clearly map to a single industry value, choose the closest match.
- Output only valid JSON. No explanation.`;

export function buildIndustryUserPrompt(complaint: {
  title: string;
  body: string;
}): string {
  return `Title: ${complaint.title}
Body: ${complaint.body}

Respond with JSON:
{
  "industry": "Dental Practice Management",
  "subCategory": "Scheduling",
  "department": "Front desk"
}`;
}

/* ───────────────────────────────────────────
 * Aggregated types for batch processing
 * ─────────────────────────────────────────── */

export interface ProcessedComplaint {
  id: string;
  title: string;
  body: string;
  sourceDate: Date | null;
  sentiment: number | null;
  severity: number | null;
}

export interface AiClusterResult {
  clusterId: number;
  label: string;
  complaints: ProcessedComplaint[];
  rootCause: string;
  summary: ProblemSummary | null;
  scoring: OpportunityScore | null;
  keywords: KeywordsResult | null;
  trend: TrendAnalysis | null;
  industry: IndustryClassification | null;
}
