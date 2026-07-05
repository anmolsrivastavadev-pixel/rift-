import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { normalizeEmail, isAdminEmail } from "@/lib/admin";

export { normalizeEmail, getAdminEmails, isAdminEmail } from "@/lib/admin";

/* M20 — Private beta access control.
 *
 * Sign-in itself is never blocked and Better Auth config is untouched: the
 * gate sits in the dashboard layout AFTER requireUser(). When
 * RIFT_BETA_MODE=invite_only, only admins (RIFT_ADMIN_EMAILS) and emails with
 * an "invited" or "active" BetaAccess row may enter the dashboard; everyone
 * else is redirected to /beta-access. Any other RIFT_BETA_MODE value (or none)
 * disables the gate entirely, so existing users are unaffected by default.
 */

type SessionUser = { id: string; email: string };

export function isBetaModeEnabled(): boolean {
  return (process.env.RIFT_BETA_MODE ?? "off").trim().toLowerCase() === "invite_only";
}

export async function getBetaAccessForEmail(email: string) {
  return prisma.betaAccess.findUnique({
    where: { email: normalizeEmail(email) },
  });
}

/**
 * Non-redirecting check — used by the feedback action and the /beta-access
 * page. Admins always pass; invited/active rows pass; everything else fails.
 */
export async function hasBetaAccess(user: SessionUser): Promise<boolean> {
  if (!isBetaModeEnabled()) return true;
  if (isAdminEmail(user.email)) return true;
  const access = await getBetaAccessForEmail(user.email);
  return access?.status === "active" || access?.status === "invited";
}

/**
 * Layout guard. Allows or redirects to /beta-access. On an invited user's
 * first successful entry, marks their row "active" and stamps acceptedAt
 * (one-time write; failures are ignored so the gate never crashes the app).
 */
export async function requireBetaAccess(user: SessionUser): Promise<void> {
  if (!isBetaModeEnabled()) return;
  if (isAdminEmail(user.email)) return;

  const access = await getBetaAccessForEmail(user.email);
  if (access?.status === "active") return;
  if (access?.status === "invited") {
    await prisma.betaAccess
      .update({
        where: { id: access.id },
        data: { status: "active", acceptedAt: new Date() },
      })
      .catch(() => {});
    return;
  }
  redirect("/beta-access");
}
