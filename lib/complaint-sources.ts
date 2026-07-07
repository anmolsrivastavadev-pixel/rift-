/* Pure deterministic helpers for complaint source receipts (M31a).
 * No Gemini, no DB, no side effects.
 *
 * A "receipt" is the original public post/page a finder-sourced complaint came
 * from. Complaint.sourceKind stores the machine key; the display labels live
 * here so copy changes never need a migration. CSV/paste/demo complaints have
 * no receipt (both fields null) and simply render no link.
 */

export type ComplaintSourceKind = "reddit" | "appstore" | "hackernews" | "web";

export const COMPLAINT_SOURCE_LABELS: Record<ComplaintSourceKind, string> = {
  reddit: "View on Reddit",
  appstore: "View reviews on the App Store",
  hackernews: "View on Hacker News",
  web: "View source",
};

export function isComplaintSourceKind(
  v: string | null | undefined
): v is ComplaintSourceKind {
  return (
    v === "reddit" || v === "appstore" || v === "hackernews" || v === "web"
  );
}

const MAX_RECEIPT_URL_LENGTH = 2048;

/** Only http/https URLs of sane length survive; anything else becomes null so
 * a malformed source URL can never render as a broken or unsafe link. */
export function sanitiseReceiptUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_RECEIPT_URL_LENGTH) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}

/** Label for a receipt link, or null when there is nothing safe to link to.
 * Unknown kinds (future sources) fall back to the generic label. */
export function buildReceiptLabel(
  kind: string | null | undefined,
  url: string | null | undefined
): string | null {
  if (!sanitiseReceiptUrl(url)) return null;
  if (isComplaintSourceKind(kind)) return COMPLAINT_SOURCE_LABELS[kind];
  return COMPLAINT_SOURCE_LABELS.web;
}

/** Apple provides no per-review deep links, so an App Store receipt can only
 * land on the reviews LIST. This hint tells the reader which review to look
 * for (the complaint title is the review's own headline). Null for every
 * other source — those links land exactly on the original post. */
export function buildReceiptHint(
  kind: string | null | undefined,
  title: string | null | undefined
): string | null {
  if (kind !== "appstore") return null;
  const t = title?.trim();
  if (!t) return null;
  return `Apple doesn't link to single reviews — look for the one titled “${t.slice(0, 80)}”. The quote above is that review, word for word.`;
}

/** The href a receipt should actually open. App Store receipts land on the
 * app's REVIEWS section (`?see-all=reviews`), not its marketing page —
 * applied at render time so complaints stored before this fix benefit too. */
export function buildReceiptHref(
  kind: string | null | undefined,
  url: string | null | undefined
): string | null {
  const clean = sanitiseReceiptUrl(url);
  if (!clean) return null;
  if (kind === "appstore" && !clean.includes("see-all=reviews")) {
    return clean.includes("?")
      ? `${clean}&see-all=reviews`
      : `${clean}?see-all=reviews`;
  }
  return clean;
}
