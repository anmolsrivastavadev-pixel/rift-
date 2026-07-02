"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";

/* -------------------------------------------------------------------------
 * Saved opportunity actions.
 * Uses the existing SavedOpportunity model with @@unique([userId, opportunityId])
 * so one save per user per opportunity.
 * ------------------------------------------------------------------------- */

export async function saveOpportunity(
  _prev: { saved: boolean; error?: string } | null,
  formData: FormData
): Promise<{ saved: boolean; error?: string }> {
  const user = await requireUser();
  const id = String(formData.get("opportunityId") ?? "");
  if (!id) return { saved: false, error: "Missing opportunity id" };
  
  // Verify the opportunity belongs to the current user
  const opportunity = await prisma.opportunity.findFirst({
    where: { id, userId: user.id },
  });
  if (!opportunity) {
    return { saved: false, error: "Opportunity not found" };
  }

  try {
    await prisma.savedOpportunity.upsert({
      where: { userId_opportunityId: { userId: user.id, opportunityId: id } },
      create: { opportunityId: id, userId: user.id },
      update: {},
    });
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
  const user = await requireUser();
  const id = String(formData.get("opportunityId") ?? "");
  if (!id) return { saved: false, error: "Missing opportunity id" };
  try {
    await prisma.savedOpportunity.deleteMany({
      where: { opportunityId: id, userId: user.id },
    });
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
