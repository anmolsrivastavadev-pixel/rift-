/* M19 — Admin allowlist for the private beta insights page.
 *
 * RIFT_ADMIN_EMAILS is a comma-separated list of emails (case-insensitive).
 * No emails are hardcoded in source. Server-side only.
 */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getAdminEmails(): string[] {
  return (process.env.RIFT_ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter((e) => e.length > 0);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(normalizeEmail(email));
}
