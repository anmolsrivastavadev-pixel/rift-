/* The app's absolute base URL, in one place.
 *
 * Lived in lib/stripe.ts, which imports the Stripe SDK at module scope — so
 * anything needing a URL (the cron digest email, share links) dragged the
 * whole SDK into its lambda. Split out so a link is just a link.
 *
 * Order matters: BETTER_AUTH_URL is the explicit setting and wins.
 * VERCEL_PROJECT_PRODUCTION_URL is Vercel's automatic production domain — the
 * safety net that keeps emailed links absolute if the explicit var is missing
 * in an environment (the cron job used to fall back to "", shipping digest
 * emails with dead relative hrefs). localhost is the dev fallback.
 */
export function getAppBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
