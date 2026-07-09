"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { BETA_BLOCKED_MESSAGE, BetaAccessError, requireActor } from "@/lib/action-auth";
import { requireOwnedProject } from "@/lib/projects";
import { trackProductEvent } from "@/lib/product-events";
import { checkWatchQuota } from "@/lib/quotas";

/* M31c — Weekly niche watch management. Create/pause/resume/delete watches on
 * the Complaints page. The actual weekly runs happen in the cron route
 * (app/api/cron/niche-watch) via the shared import core (lib/finder-import).
 * Ownership is verified server-side on every action, so a forged watch or
 * project id from another user just returns a friendly error.
 */

export type NicheWatchActionResult = { ok: true } | { ok: false; error: string };

const MIN_KEYWORD = 2;
const MAX_KEYWORD = 80;

export async function createNicheWatchAction(
  _prev: NicheWatchActionResult | null,
  formData: FormData
): Promise<NicheWatchActionResult> {
  let user;
  try {
    user = await requireActor();
  } catch (err) {
    if (err instanceof BetaAccessError) return { ok: false, error: BETA_BLOCKED_MESSAGE };
    throw err;
  }
  const project = await requireOwnedProject(
    String(formData.get("projectId") ?? ""),
    user
  );
  const keyword = String(formData.get("keyword") ?? "").trim();

  if (keyword.length < MIN_KEYWORD || keyword.length > MAX_KEYWORD) {
    return {
      ok: false,
      error: `Type a keyword between ${MIN_KEYWORD} and ${MAX_KEYWORD} characters (e.g. “fitness apps”).`,
    };
  }

  const quota = await checkWatchQuota(user);
  if (!quota.ok) {
    return { ok: false, error: quota.message };
  }

  try {
    await prisma.nicheWatch.create({
      data: { userId: user.id, projectId: project.id, keyword },
    });
  } catch (err) {
    // P2002 = the (user, project, keyword) unique constraint.
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return {
        ok: false,
        error: "You already watch this niche in this project.",
      };
    }
    throw err;
  }

  await trackProductEvent({
    userId: user.id,
    projectId: project.id,
    type: "watch_created",
    metadata: { keyword },
  });
  revalidatePath("/dashboard/complaints");
  return { ok: true };
}

export async function toggleNicheWatchAction(
  _prev: NicheWatchActionResult | null,
  formData: FormData
): Promise<NicheWatchActionResult> {
  let user;
  try {
    user = await requireActor();
  } catch (err) {
    if (err instanceof BetaAccessError) return { ok: false, error: BETA_BLOCKED_MESSAGE };
    throw err;
  }
  const watchId = String(formData.get("watchId") ?? "").trim();

  const watch = await prisma.nicheWatch.findFirst({
    where: { id: watchId, userId: user.id, project: { is: { archivedAt: null } } },
    select: { id: true, projectId: true, pausedAt: true },
  });
  if (!watch) {
    return { ok: false, error: "Watch not found." };
  }

  const resuming = watch.pausedAt !== null;
  if (resuming) {
    // Resuming re-occupies an active slot, so the cap applies again.
    const quota = await checkWatchQuota(user);
    if (!quota.ok) {
      return { ok: false, error: quota.message };
    }
  }

  await prisma.nicheWatch.update({
    where: { id: watch.id },
    data: { pausedAt: resuming ? null : new Date() },
  });
  await trackProductEvent({
    userId: user.id,
    projectId: watch.projectId,
    type: resuming ? "watch_resumed" : "watch_paused",
  });
  revalidatePath("/dashboard/complaints");
  return { ok: true };
}

export async function deleteNicheWatchAction(
  _prev: NicheWatchActionResult | null,
  formData: FormData
): Promise<NicheWatchActionResult> {
  let user;
  try {
    user = await requireActor();
  } catch (err) {
    if (err instanceof BetaAccessError) return { ok: false, error: BETA_BLOCKED_MESSAGE };
    throw err;
  }
  const watchId = String(formData.get("watchId") ?? "").trim();

  const watch = await prisma.nicheWatch.findFirst({
    where: { id: watchId, userId: user.id, project: { is: { archivedAt: null } } },
    select: { id: true, projectId: true },
  });
  if (!watch) {
    return { ok: false, error: "Watch not found." };
  }

  await prisma.nicheWatch.delete({ where: { id: watch.id } });
  await trackProductEvent({
    userId: user.id,
    projectId: watch.projectId,
    type: "watch_deleted",
  });
  revalidatePath("/dashboard/complaints");
  return { ok: true };
}
