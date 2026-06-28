import type { CleanedComplaint } from "@/lib/ai-schema";

/* Stage 1 — Complaint Cleaning.
 * Normalise text, drop empty/whitespace-only, dedupe by normalised body.
 * Returns cleaned complaints (with their DB ids preserved).
 */
export function cleanComplaints(
  raw: { id: string; body: string }[]
): CleanedComplaint[] {
  const seen = new Set<string>();
  const out: CleanedComplaint[] = [];

  for (const r of raw) {
    const text = normalise(r.body);
    if (text.length < 3) continue; // no meaningful text
    const key = text.toLowerCase();
    if (seen.has(key)) continue; // drop duplicates
    seen.add(key);
    out.push({ id: r.id, text });
  }
  return out;
}

function normalise(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim()
    .slice(0, 2000);
}