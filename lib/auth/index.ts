import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
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
});

export type Session = typeof auth.$Infer.Session;
