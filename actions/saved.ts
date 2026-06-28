"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";

/* -------------------------------------------------------------------------
 * Saved opportunity actions.
 * Uses the existing SavedOpportunity model with @@unique([opportunityId])
 * so one global save per opportunity (no auth in MVP per spec).
 * ------------------------------------------------------------------------- */

export async function saveOpportunity(
  _prev: { saved: boolean; error?: string } | null,
  formData: FormData
): Promise<{ saved: boolean; error?: string }> {
  const id = String(formData.get("opportunityId") ?? "");
  if (!id) return { saved: false, error: "Missing opportunity id" };
  try {
    await prisma.savedOpportunity.upsert({
      where: { opportunityId: id },
      create: { opportunityId: id },
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
  const id = String(formData.get("opportunityId") ?? "");
  if (!id) return { saved: false, error: "Missing opportunity id" };
  try {
    await prisma.savedOpportunity.deleteMany({
      where: { opportunityId: id },
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