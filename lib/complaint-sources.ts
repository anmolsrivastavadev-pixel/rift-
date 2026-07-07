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
  appstore: "View app on the App Store",
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
