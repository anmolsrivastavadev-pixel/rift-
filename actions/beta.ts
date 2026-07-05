"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { normalizeEmail, isAdminEmail } from "@/lib/admin";
import { hasBetaAccess } from "@/lib/beta-access";
import { trackProductEvent } from "@/lib/product-events";

/* M20 — Beta tester management (admin-only) + in-app beta feedback.
 *
 * Admin actions verify the SESSION user's email against RIFT_ADMIN_EMAILS —
 * never anything from the client. Admins are not BetaAccess rows, so revoking
 * testers can never lock an admin out. No emails are sent by any of this.
 */

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const MAX_FEEDBACK = 2000;
const FEEDBACK_TYPES = ["bug", "confusing", "idea", "praise", "other"];

async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) return null;
  return user;
}

/** Add (or re-invite) a tester email. Invalid input is silently ignored. */
export async function addBetaTester(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!EMAIL_RE.test(email) || email.length > 254) return;

  await prisma.betaAccess.upsert({
    where: { email },
    update: { status: "invited", revokedAt: null },
    create: { email, status: "invited", invitedByUserId: admin.id },
  });
  await trackProductEvent({ userId: admin.id, type: "beta_access_granted" });
  revalidatePath("/dashboard/beta-insights");
}

export async function revokeBetaTester(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;

  const id = String(formData.get("accessId") ?? "");
  if (!id) return;
  await prisma.betaAccess
    .update({
      where: { id },
      data: { status: "revoked", revokedAt: new Date() },
    })
    .catch(() => {});
  await trackProductEvent({ userId: admin.id, type: "beta_access_revoked" });
  revalidatePath("/dashboard/beta-insights");
}

export async function reactivateBetaTester(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;

  const id = String(formData.get("accessId") ?? "");
  if (!id) return;
  await prisma.betaAccess
    .update({
      where: { id },
      data: { status: "active", revokedAt: null },
    })
    .catch(() => {});
  await trackProductEvent({ userId: admin.id, type: "beta_access_granted" });
  revalidatePath("/dashboard/beta-insights");
}

/* ------------------------------- Feedback -------------------------------- */

export type FeedbackResult = { ok: true } | { ok: false; error: string };

export async function submitBetaFeedback(
  _prev: FeedbackResult | null,
  formData: FormData
): Promise<FeedbackResult> {
  const user = await requireUser();
  if (!(await hasBetaAccess(user))) {
    return { ok: false, error: "Feedback is only open to beta users." };
  }

  const message = String(formData.get("message") ?? "").trim();
  if (!message) {
    return { ok: false, error: "Write a short message first." };
  }
  if (message.length > MAX_FEEDBACK) {
    return { ok: false, error: `Keep feedback under ${MAX_FEEDBACK} characters.` };
  }

  const rawType = String(formData.get("type") ?? "other");
  const type = FEEDBACK_TYPES.includes(rawType) ? rawType : "other";

  const rawRating = String(formData.get("rating") ?? "");
  const parsedRating = Number.parseInt(rawRating, 10);
  const rating =
    Number.isInteger(parsedRating) && parsedRating >= 1 && parsedRating <= 5
      ? parsedRating
      : null;

  const pagePath = String(formData.get("pagePath") ?? "").slice(0, 200) || null;

  // Only attach the project if the current user actually owns it.
  const rawProjectId = String(formData.get("projectId") ?? "");
  const ownedProject = rawProjectId
    ? await prisma.project.findFirst({
        where: { id: rawProjectId, userId: user.id },
        select: { id: true },
      })
    : null;

  await prisma.betaFeedback.create({
    data: {
      userId: user.id,
      projectId: ownedProject?.id ?? null,
      type,
      rating,
      message,
      pagePath,
    },
  });
  // Metadata only — the feedback text lives in BetaFeedback, never in events.
  await trackProductEvent({
    userId: user.id,
    projectId: ownedProject?.id ?? null,
    type: "beta_feedback_submitted",
    metadata: { feedbackType: type },
  });

  return { ok: true };
}
