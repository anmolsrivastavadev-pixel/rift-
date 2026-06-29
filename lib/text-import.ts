/* Pure helpers for turning raw pasted/uploaded text into complaint rows.
 *
 * This mirrors the parsing rules from Milestone 8:
 *   1. Split text by blank lines first.
 *   2. If only one block results, fall back to splitting by new lines.
 *   3. Strip leading bullet / numbered list prefixes (- * • + 1. 1)).
 *   4. Trim whitespace.
 *   5. Ignore empty entries.
 *   6. Ignore entries shorter than 10 characters.
 *   7. Deduplicate exact duplicate bodies case-insensitively (first wins).
 *   8. Cap each body to the existing schema max length (5000 chars).
 *   9. Build a short title from the first few words.
 *
 * No Gemini, no DB, no side effects — safe to import from client or server.
 */

// Matches lib/schemas.ts complaintRowSchema body max length.
export const MAX_BODY_LENGTH = 5000;

// Per spec: ignore entries shorter than this (after normalisation).
export const MIN_BODY_LENGTH = 10;

// Source type options shown in the paste / text-file UI. UI-only metadata:
// the Complaint model has no source field, so these never reach the DB.
export const SOURCE_TYPES = [
  "Customer complaints",
  "App reviews",
  "Reddit/forum comments",
  "Support tickets",
  "Survey responses",
  "Competitor reviews",
  "Other",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export interface ParsedComplaint {
  body: string;
  title: string;
}

/** Strip a leading bullet / numbered-list prefix and surrounding whitespace. */
export function normaliseComplaintBody(raw: string): string {
  let s = raw.trim();
  // Numbered prefix: "1." "1)" "10. " etc.
  s = s.replace(/^\d+[.)]\s+/, "");
  // Bullet prefix: "-", "*", "•", "+"
  s = s.replace(/^[-*•+]\s+/, "");
  return s.trim();
}

/** Normalised key used for case- and whitespace-insensitive duplicate
 *  comparison (both within a submission and against existing DB rows).
 *  Stored complaint bodies are kept in their original user-submitted form;
 *  only the comparison key is normalised.
 */
export function normaliseBodyForKey(body: string): string {
  return body.trim().toLowerCase().replace(/[ \t]{2,}/g, " ").replace(/\s+/g, " ").trim();
}

/** Build a short title from the first few words of a complaint body. */
export function createTitleFromBody(
  body: string,
  maxWords = 8,
  maxChars = 80
): string {
  const words = body.split(/\s+/).filter(Boolean).slice(0, maxWords);
  let title = words.join(" ").trim();
  if (title.length > maxChars) title = title.slice(0, maxChars).trim();
  return title || body.slice(0, maxChars).trim();
}

/** Collapse internal single newlines to spaces, collapse repeated spaces. */
function collapseInternalNewlines(block: string): string {
  return block
    .replace(/\n/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Parse raw text into a de-duplicated list of complaint rows.
 * Order is preserved; the first occurrence of a duplicate body wins.
 */
export function parseComplaintsFromText(text: string): ParsedComplaint[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!normalized.trim()) return [];

  // 1. Split by blank lines first.
  let blocks = normalized
    .split(/\n[ \t]*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  // 2. If no blank-line separation (single block), fall back to per-line.
  if (blocks.length <= 1) {
    blocks = normalized
      .split(/\n+/)
      .map((b) => b.trim())
      .filter(Boolean);
  }

  const seen = new Set<string>();
  const out: ParsedComplaint[] = [];

  for (const raw of blocks) {
    const body = normaliseComplaintBody(
      // If the block spans multiple lines (blank-line separated paragraph),
      // treat the whole paragraph as one complaint and join its lines.
      raw.includes("\n") ? collapseInternalNewlines(raw) : raw
    );

    if (!body) continue;
    if (body.length < MIN_BODY_LENGTH) continue;

    const key = normaliseBodyForKey(body);
    if (seen.has(key)) continue; // case-/whitespace-insensitive dedupe
    seen.add(key);

    const capped = body.slice(0, MAX_BODY_LENGTH);
    out.push({ body: capped, title: createTitleFromBody(capped) });
  }

  return out;
}