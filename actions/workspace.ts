"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";

export type WorkspaceResult = {
  cleared: boolean;
  deleted: { saved: number; opportunities: number; complaints: number };
  error?: string;
};

/**
 * Clear the current user's workspace: saved opportunities, generated opportunities,
 * and complaints. Used by the "Start fresh test" button so a user can test a
 * new niche without old data mixing in.
 *
 * Order matters: savedOpportunities → opportunities → complaints because of
 * foreign-key constraints (SavedOpportunity references Opportunity, Complaint
 * references Opportunity).
 */
export async function clearWorkspace(): Promise<WorkspaceResult> {
  const user = await requireUser();
  try {
    const [saved, opportunities, complaints] = await Promise.all([
      prisma.savedOpportunity.deleteMany({ where: { userId: user.id } }),
      prisma.opportunity.deleteMany({ where: { userId: user.id } }),
      prisma.complaint.deleteMany({ where: { userId: user.id } }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/complaints");
    revalidatePath("/dashboard/opportunities");
    revalidatePath("/dashboard/opportunities/decision-board");
    revalidatePath("/dashboard/saved");

    return {
      cleared: true,
      deleted: {
        saved: saved.count,
        opportunities: opportunities.count,
        complaints: complaints.count,
      },
    };
  } catch (err) {
    return {
      cleared: false,
      deleted: { saved: 0, opportunities: 0, complaints: 0 },
      error: err instanceof Error ? err.message : "Could not clear workspace",
    };
  }
}
