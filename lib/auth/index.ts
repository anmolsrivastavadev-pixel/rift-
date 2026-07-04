import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

const appBaseUrl = process.env.BETTER_AUTH_URL;

const configuredAppOrigin = appBaseUrl ? new URL(appBaseUrl).origin : undefined;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
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
