import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { logger } from "@/lib/logger";

/* ---------------------------------------------------------------------------
 * Gemini helper that EXTRACTS complaint passages from web page text fetched
 * by the whole-web complaint finder source (Tavily).
 *
 * COMPLETELY ISOLATED from the opportunity clustering pipeline in lib/ai.ts —
 * own prompt, own schema, own error handling. Extraction only: the prompt
 * forbids inventing complaints; everything returned must be present in the
 * supplied page text. No key / any failure → the caller shows a source error
 * (fail-soft), never a crash.
 * ------------------------------------------------------------------------- */

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const MAX_COMPLAINTS = 30;

const extractedSchema = z.object({
  complaints: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().min(30).max(2000),
        // M31a — 1-based page number the passage came from, so the caller can
        // attach the page's URL as a receipt. Optional: a missing or
        // out-of-range value degrades to "no receipt", never a failure.
        pageIndex: z.number().int().min(1).optional(),
      })
    )
    .max(MAX_COMPLAINTS),
});

export type ExtractedComplaints = z.infer<typeof extractedSchema>;

export type WebPageText = {
  url: string;
  title: string;
  text: string;
  // M31a — the page's published date (ISO string) when the search provider
  // supplied one; used as the complaint's sourceDate for that page only.
  publishedDate: string | null;
};

/**
 * Extract verbatim complaint/frustration passages about `keyword` from the
 * given page texts. Throws on failure — the finder source catches and turns
 * it into a per-source error message.
 */
export async function extractComplaintsFromPages(
  keyword: string,
  pages: WebPageText[]
): Promise<ExtractedComplaints> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  if (pages.length === 0) {
    return { complaints: [] };
  }

  const ai = new GoogleGenAI({ apiKey });

  const pageBlocks = pages
    .map(
      (p, i) =>
        `--- PAGE ${i + 1}: ${p.title || "(untitled)"} ---\n${p.text}`
    )
    .join("\n\n");

  const prompt = `You extract customer complaints from web page text. The pages below were found by searching the web for complaints about: "${keyword}".

STRICT RULES:
- Extract ONLY complaint/frustration passages that actually appear in the page text below. Rephrase minimally for readability (fix truncation, drop navigation junk), but NEVER invent, exaggerate, or add complaints that are not in the text.
- Each complaint must express a real problem, frustration, unmet need, or pain point related to "${keyword}". Skip praise, news, marketing copy, navigation text, and generic filler.
- Skip anything containing personal information (real full names, emails, phone numbers, addresses, usernames).
- Return at most ${MAX_COMPLAINTS} complaints. Fewer is fine. Zero is fine if the pages contain no real complaints.
- "title": a short 3-10 word summary of the complaint. "body": the complaint passage itself (1-4 sentences, minimum 30 characters).
- "pageIndex": the PAGE number the passage was found on (1 for PAGE 1, 2 for PAGE 2, ...). Always include it.

PAGES:
${pageBlocks}

Return ONLY a JSON object matching exactly:
{ "complaints": [ { "title": "...", "body": "...", "pageIndex": 1 } ] }

No other text, no markdown fences. Just the raw JSON.`;

  logger.info("web_extract.gemini_request", {
    keyword,
    pages: pages.length,
    promptChars: prompt.length,
  });

  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  const responseText = res.text;
  if (!responseText) {
    throw new Error("Gemini returned no text for web extraction");
  }

  const cleaned = stripCodeFences(responseText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned invalid JSON for web extraction");
  }

  const result = extractedSchema.safeParse(parsed);
  if (!result.success) {
    logger.error("web_extract.schema_mismatch", {
      keyword,
      issues: result.error.issues.slice(0, 3),
    });
    throw new Error("Gemini response did not match the extraction schema");
  }

  logger.info("web_extract.done", {
    keyword,
    extracted: result.data.complaints.length,
  });
  return result.data;
}

function stripCodeFences(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : s.trim();
}
