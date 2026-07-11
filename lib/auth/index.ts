import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { rateLimitStorage } from "@/lib/auth/rate-limit-storage";
import { buildResetPasswordEmail, isEmailEnabled, sendEmail } from "@/lib/email";

const appBaseUrl = process.env.BETTER_AUTH_URL;

const configuredAppOrigin = appBaseUrl ? new URL(appBaseUrl).origin : undefined;

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
});

export type Session = typeof auth.$Infer.Session;
