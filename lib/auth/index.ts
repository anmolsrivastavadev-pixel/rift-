import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { rateLimitStorage } from "@/lib/auth/rate-limit-storage";
import { getStripe } from "@/lib/stripe";
import { buildResetPasswordEmail, isEmailEnabled, sendEmail } from "@/lib/email";

const appBaseUrl = process.env.BETTER_AUTH_URL;

const configuredAppOrigin = appBaseUrl ? new URL(appBaseUrl).origin : undefined;

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
  trustedOrigins: [
    configuredAppOrigin,
    "http://localhost:3000",
    "https://rift-*.vercel.app",
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
