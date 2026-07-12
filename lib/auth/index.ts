import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { rateLimitStorage } from "@/lib/auth/rate-limit-storage";
import { getStripe } from "@/lib/stripe";
import { buildResetPasswordEmail, isEmailEnabled, sendEmail } from "@/lib/email";

const appBaseUrl = process.env.BETTER_AUTH_URL;

const configuredAppOrigin = appBaseUrl ? new URL(appBaseUrl).origin : undefined;

/** Vercel's system vars carry a bare host (no scheme); trusted origins need one. */
function vercelOrigin(host: string | undefined): string | undefined {
  return host ? `https://${host}` : undefined;
}

/* Account deletion must never leave a paying subscription behind: cancel it
 * at Stripe first, and refuse the deletion if that fails (a deleted account
 * that keeps being charged is worse than asking the user to email support).
 * Dormant while FREE_BETA is on — no subscriptions exist to cancel.
 */
async function cancelSubscriptionBeforeDelete(userId: string): Promise<void> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true },
  });
  if (!dbUser?.stripeSubscriptionId || !process.env.STRIPE_SECRET_KEY) return;
  try {
    await getStripe().subscriptions.cancel(dbUser.stripeSubscriptionId);
  } catch (error) {
    // A subscription that's already gone at Stripe is fine to ignore.
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code?: string }).code
        : undefined;
    if (code === "resource_missing") return;
    throw new APIError("BAD_REQUEST", {
      message:
        "We couldn't cancel your subscription automatically. Please contact support and we'll delete your account for you.",
    });
  }
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // M27 — password reset, key-gated: only registered when RESEND_API_KEY is
    // set, so without it Better Auth keeps reporting reset as disabled and the
    // UI hides the "Forgot password?" link (founder-authorized auth change).
    ...(isEmailEnabled()
      ? {
          sendResetPassword: async ({
            user,
            url,
          }: {
            user: { email: string };
            url: string;
          }) => {
            const email = buildResetPasswordEmail(url);
            await sendEmail({ to: user.email, ...email });
          },
        }
      : {}),
  },
  baseURL: appBaseUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  /* Exact origins only — never a wildcard. A pattern like
   * "https://rift-*.vercel.app" is matched by Better Auth as a real wildcard,
   * and *.vercel.app subdomains are first-come-first-served across all Vercel
   * accounts: anyone could deploy "rift-<anything>" and become a trusted
   * origin. Trusted origins gate the CSRF check AND the reset-password
   * `redirectTo`, which carries the reset token in the URL — so a claimable
   * wildcard is an account-takeover path.
   *
   * The Vercel vars below are set BY Vercel for this deployment, so they are
   * ours by construction and nobody else can claim them. All three are needed
   * because they are different URLs: PROJECT_PRODUCTION_URL is the stable
   * production domain, BRANCH_URL is the preview alias a human actually opens
   * (rift-git-<branch>-<team>.vercel.app), and VERCEL_URL is the immutable
   * per-deployment URL. Listing only VERCEL_URL would leave preview sign-in
   * failing CSRF, because that is not the origin the browser is on.
   */
  trustedOrigins: [
    configuredAppOrigin,
    vercelOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    vercelOrigin(process.env.VERCEL_BRANCH_URL),
    vercelOrigin(process.env.VERCEL_URL),
    "http://localhost:3000",
  ].filter((origin): origin is string => Boolean(origin)),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  // Audit response (founder-authorized): per-IP rate limiting on auth
  // endpoints. Better Auth's default rules already tighten sign-in/sign-up
  // (3 per 10s) and password reset (3 per 60s); what was missing on Vercel
  // is storage that survives across serverless instances, so the counters
  // live in Postgres via an atomic upsert (lib/auth/rate-limit-storage.ts).
  // enabled: true (not just production) so the behavior is testable locally.
  rateLimit: {
    enabled: true,
    customStorage: rateLimitStorage,
  },
  // Audit response (founder-authorized): self-serve account deletion. The
  // client sends the user's password (sensitive-session middleware), Stripe
  // is cleaned up first, and Postgres cascades remove projects, complaints,
  // ideas, shares, sessions, and events with the user row.
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await cancelSubscriptionBeforeDelete(user.id);
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
