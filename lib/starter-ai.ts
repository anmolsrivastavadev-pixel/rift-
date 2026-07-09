import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { generateJsonWithModelFallback } from "@/lib/gemini-request";

/* ---------------------------------------------------------------------------
 * Gemini helper for generating custom starter complaint examples.
 *
 * This is COMPLETELY ISOLATED from the opportunity clustering pipeline in
 * lib/ai.ts. It has its own prompt, its own schema, and its own error
 * handling. It does NOT touch the opportunity AI prompt, opportunity schema,
 * or scoring formula.
 * ------------------------------------------------------------------------- */

// Model selection + retirement/overload fallback lives in lib/gemini-request.ts.

/* --- Zod schema for the AI response --- */

const starterComplaintsSchema = z.object({
  complaints: z.array(z.string().min(10).max(500)).min(15).max(35),
});

export type StarterComplaintsResult = z.infer<typeof starterComplaintsSchema>;

/* --- Blocklist for dangerous / unsafe market inputs --- */

const BLOCKED_PATTERNS = [
  /\b(weapon|bomb|explosive|gun|firearm|ammunition|drug\s*deal|meth|heroin|fentanyl|cocaine)\b/i,
  /\b(child\s*abus|sexual\s*abus|human\s*traffick|slavery)\b/i,
  /\b(hack|exploit|phish|malware|ransomware|ddos)\b/i,
  /\b(gambl|casino|sports\s*bet)\b/i,
  /\b(porn|xxx|nudity|adult\s*content|escort)\b/i,
  /\b(suicide|self[\s-]*harm)\b/i,
  /\b(counterfeit|forg|fraud|scam|money\s*launder)\b/i,
];

/**
 * Generate synthetic starter complaint examples for a given market using
 * Gemini. Returns an array of complaint body strings.
 *
 * Falls back to a simple local heuristic if no API key is present.
 */
export async function generateStarterComplaints(
  market: string
): Promise<StarterComplaintsResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("starter_ai.no_key_using_mock", { market });
    return mockGenerate(market);
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a brainstorming assistant. Your job is to generate synthetic but realistic customer complaint examples for a specific market or niche. These are for EXPLORATION ONLY — they help a founder quickly see what kinds of problems exist in a market.

Market: ${market}

Generate exactly 25 complaint examples for this market. Each complaint should:
- Be a single sentence or short paragraph (1-3 sentences)
- Describe a specific frustration, unmet need, confusion, delay, cost issue, reliability problem, access problem, quality issue, trust problem, or workflow problem
- Sound like something a real customer would say or write
- Be specific to the "${market}" market
- Use plain English
- NOT include any real names, usernames, phone numbers, emails, addresses, or private personal information
- NOT claim that the data is real or from real sources

Focus on common pain points like:
- Long wait times
- Poor quality or inconsistency
- Confusing booking or ordering
- Hidden fees or pricing confusion
- Unreliable service
- Bad communication
- Lack of online options
- Difficulty finding the right provider
- Poor follow-up or support
- Inconvenient hours or location

Return ONLY a JSON object matching this exact structure:
{ "complaints": ["complaint 1", "complaint 2", ...] }

Do NOT include any other text, explanations, or markdown formatting. Just the raw JSON.`;

  logger.info("starter_ai.gemini_request", { market, promptLength: prompt.length });

  let responseText: string | undefined;
  try {
    responseText = await generateJsonWithModelFallback(ai, prompt, "starter_ai", { market });
  } catch (err) {
    throw new Error(
      `Gemini request failed for starter complaints: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!responseText) {
    throw new Error("Gemini returned no text for starter complaints");
  }

  logger.info("starter_ai.gemini_response", {
    market,
    chars: responseText.length,
  });

  // Strip markdown code fences if present.
  const cleaned = stripCodeFences(responseText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned invalid JSON for starter complaints");
  }

  const result = starterComplaintsSchema.safeParse(parsed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue?.path?.length
      ? firstIssue.path.join(".")
      : "(root)";
    logger.error("starter_ai.schema_mismatch", {
      market,
      issues: result.error.issues.slice(0, 3),
    });
    throw new Error(
      `Gemini response did not match expected schema: ${path}: ${firstIssue?.message ?? "Invalid input"}`
    );
  }

  return result.data;
}

/* ---------------------------------------------------------------------------
 * Mock fallback (no API key) — deterministic local generation
 * ------------------------------------------------------------------------- */

function mockGenerate(market: string): StarterComplaintsResult {
  const topics = [
    `Long wait times when trying to book an appointment at ${market}`,
    `Inconsistent quality of service from different providers in ${market}`,
    `Difficult to find reliable ${market} options in my area`,
    `Hidden fees and unclear pricing at ${market} businesses`,
    `Poor communication about scheduling changes at ${market}`,
    `No online booking option for ${market} services`,
    `Hard to compare different ${market} providers`,
    `Staff at ${market} locations often seem rushed and unhelpful`,
    `Lack of transparency about what is included in ${market} services`,
    `Difficult to get a refund or complaint resolved at ${market}`,
    `No loyalty program or repeat customer benefits at ${market}`,
    `Confusing website or app for ${market} booking`,
    `Long drive to the nearest ${market} location`,
    `Inconvenient operating hours for working people at ${market}`,
    `Poor quality of products at ${market} stores`,
    `Difficulty understanding the range of ${market} services offered`,
    `No follow-up after visiting a ${market} provider`,
    `Unclear cancellation policy at ${market} businesses`,
    `Hard to find ${market} options that accept my payment method`,
    `Staff at ${market} locations not knowledgeable about their services`,
    `Long lead times for ${market} appointments`,
    `No way to track my ${market} order or appointment status`,
    `Difficult to provide feedback to ${market} management`,
    `Lack of parking near popular ${market} locations`,
    `No weekend availability at ${market} providers`,
  ];

  return { complaints: topics };
}

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

function stripCodeFences(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : s.trim();
}

/**
 * Check if a market input is safe to process.
 * Returns null if safe, or an error message if blocked.
 */
export function validateMarketInput(market: string): string | null {
  const trimmed = market.trim();
  if (trimmed.length < 2) {
    return "Market name must be at least 2 characters.";
  }
  if (trimmed.length > 80) {
    return "Market name must be 80 characters or fewer.";
  }
  if (/[\n\r\t]/.test(trimmed)) {
    return "Market name must be a single line.";
  }
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return "This market cannot be processed. Please try a different market name.";
    }
  }
  return null;
}
