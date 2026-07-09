"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { BETA_BLOCKED_MESSAGE, BetaAccessError, requireActor } from "@/lib/action-auth";
import { requireOwnedProject } from "@/lib/projects";
import { trackProductEvent } from "@/lib/product-events";

/* -------------------------------------------------------------------------
 * Saved opportunity actions.
 * Uses the existing SavedOpportunity model with @@unique([userId, opportunityId])
 * so one save per user per opportunity. M16A: every action is project-scoped —
 * the action first verifies the project is owned by the user, then checks the
 * opportunity also belongs to that same project. A user can never save or
 * unsave an opportunity that belongs to another user's project.
 * ------------------------------------------------------------------------- */

export async function saveOpportunity(
  _prev: { saved: boolean; error?: string } | null,
  formData: FormData
): Promise<{ saved: boolean; error?: string }> {
  let user;
  try {
    user = await requireActor();
  } catch (err) {
    if (err instanceof BetaAccessError) return { saved: false, error: BETA_BLOCKED_MESSAGE };
    throw err;
  }
  const project = await requireOwnedProject(String(formData.get("projectId") ?? ""), user);
  const id = String(formData.get("opportunityId") ?? "");
  if (!id) return { saved: false, error: "Missing opportunity id" };

  // Verify the opportunity belongs to the current user AND the current project.
  const opportunity = await prisma.opportunity.findFirst({
    where: { id, userId: user.id, projectId: project.id },
  });
  if (!opportunity) {
    return { saved: false, error: "Opportunity not found" };
  }

  try {
    const existing = await prisma.savedOpportunity.findFirst({
      where: { opportunityId: id, userId: user.id, projectId: project.id },
    });
    if (!existing) {
      await prisma.savedOpportunity.create({
        data: { opportunityId: id, userId: user.id, projectId: project.id },
      });
      await trackProductEvent({
        userId: user.id,
        projectId: project.id,
        opportunityId: id,
        type: "idea_saved",
      });
    }
  } catch (err) {
    return {
      saved: false,
      error: err instanceof Error ? err.message : "Could not save",
    };
  }
  revalidatePath("/dashboard/opportunities");
  revalidatePath("/dashboard/opportunities/" + id);
  revalidatePath("/dashboard/saved");
  revalidatePath("/dashboard");
  return { saved: true };
}

export async function unsaveOpportunity(
  _prev: { saved: boolean; error?: string } | null,
  formData: FormData
): Promise<{ saved: boolean; error?: string }> {
  let user;
  try {
    user = await requireActor();
  } catch (err) {
    if (err instanceof BetaAccessError) return { saved: false, error: BETA_BLOCKED_MESSAGE };
    throw err;
  }
  const project = await requireOwnedProject(String(formData.get("projectId") ?? ""), user);
  const id = String(formData.get("opportunityId") ?? "");
  if (!id) return { saved: false, error: "Missing opportunity id" };
  try {
    const removed = await prisma.savedOpportunity.deleteMany({
      where: { opportunityId: id, userId: user.id, projectId: project.id },
    });
    if (removed.count > 0) {
      await trackProductEvent({
        userId: user.id,
        projectId: project.id,
        opportunityId: id,
        type: "idea_unsaved",
      });
    }
  } catch (err) {
    return {
      saved: false,
      error: err instanceof Error ? err.message : "Could not remove",
    };
  }
  revalidatePath("/dashboard/opportunities");
  revalidatePath("/dashboard/opportunities/" + id);
  revalidatePath("/dashboard/saved");
  revalidatePath("/dashboard");
  return { saved: false };
}

/* Convenience wrappers for client `form action={...}` usage. */
export async function saveAction(formData: FormData) {
  return saveOpportunity(null, formData);
}
export async function unsaveAction(formData: FormData) {
  return unsaveOpportunity(null, formData);
}
