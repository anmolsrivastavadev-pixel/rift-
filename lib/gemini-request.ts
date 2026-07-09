import type { GoogleGenAI } from "@google/genai";

import { logger } from "@/lib/logger";

/* ---------------------------------------------------------------------------
 * Shared Gemini model selection + fallback (transport level ONLY).
 *
 * July 2026: Google retired gemini-2.5-flash with a hard 404, which broke
 * every Gemini-backed feature at once (idea runs, starter complaints, web
 * extraction). All Gemini callers now go through this helper:
 *   - default to the `-latest` alias, which always tracks Google's newest
 *     stable Flash model, so a model retirement can never 404 us again;
 *   - on a retryable error (retired model 404, overload 503, quota 429) step
 *     down to the lite alias instead of failing the whole feature.
 *
 * Prompts, schemas, and result handling stay in their own modules — this file
 * must never grow prompt or parsing logic.
 * ------------------------------------------------------------------------- */

const DEFAULT_MODEL = "gemini-flash-latest";
const FALLBACK_MODEL = "gemini-flash-lite-latest";

const RETRYABLE_GEMINI_ERROR =
  /NOT_FOUND|UNAVAILABLE|RESOURCE_EXHAUSTED|"code":\s*(404|503|429)/;

/** GEMINI_MODEL env override first, then the always-current aliases. */
export function geminiModelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  return Array.from(new Set([primary, DEFAULT_MODEL, FALLBACK_MODEL]));
}

/**
 * generateContent (JSON mode) with model fallback. Tries each candidate in
 * order; moves on only for retired/overloaded/quota errors — anything else
 * (bad request, auth) would fail on every model and is thrown immediately.
 * Logs `<logKey>.gemini_failed` per failed attempt, throws the last error if
 * every candidate fails.
 */
export async function generateJsonWithModelFallback(
  ai: GoogleGenAI,
  prompt: string,
  logKey: string,
  logFields: Record<string, unknown> = {}
): Promise<string | undefined> {
  let lastError: unknown = null;
  for (const model of geminiModelCandidates()) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      return res.text ?? undefined;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`${logKey}.gemini_failed`, { ...logFields, model, error: message });
      if (!RETRYABLE_GEMINI_ERROR.test(message)) break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
