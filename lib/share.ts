/* M29 — absolute URL for a share token. */

export function shareUrlForToken(token: string): string {
  const base = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  return `${base}/share/${token}`;
}
