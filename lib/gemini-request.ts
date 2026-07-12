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
  /NOT_FOUND|UNAVAILABLE|RESOURCE_EXHAUSTED|timed out|timeout|abort|"code":\s*(404|503|429)/i;

/** GEMINI_MODEL env override first, then the always-current aliases. */
export function geminiModelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  return Array.from(new Set([primary, DEFAULT_MODEL, FALLBACK_MODEL]));
}

/* Every other outbound call in the codebase carries a timeout (the source
 * fetchers use AbortSignal.timeout(10s)); the Gemini SDK call did not. A hung
 * request would sit until the whole 300s lambda died, taking the user's entire
 * run with it and leaving the AIRun row stuck on "running".
 *
 * Uses the SDK's own abortSignal rather than a Promise.race, so a timed-out
 * request actually releases its connection instead of running on unobserved.
 * Per the SDK docs the abort is client-side only — Google still bills for the
 * work it already did — so a timeout genuinely costs money, and the budget for
 * one is set generously: it exists to bound a HANG, not to clip a slow batch.
 * A merely-slow call that gets cut here would be retried on the lite model and
 * produce weaker clusters, so this number should stay well above normal
 * latency (a 100-complaint clustering call is seconds, not a minute).
 *
 * "timed out" / "aborted" are matched by RETRYABLE_GEMINI_ERROR so a stalled
 * model falls through to the next candidate rather than failing the whole run.
 */
const GEMINI_TIMEOUT_MS = 90_000;

/**
 * generateContent (JSON mode) with model fallback. Tries each candidate in
 * order; moves on only for retired/overloaded/quota/timeout errors — anything
 * else (bad request, auth) would fail on every model and is thrown
 * immediately. Logs `<logKey>.gemini_failed` per failed attempt, throws the
 * last error if every candidate fails.
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
        config: {
          responseMimeType: "application/json",
          abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        },
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
