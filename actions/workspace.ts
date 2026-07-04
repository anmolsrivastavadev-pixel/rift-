"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/projects";

export type WorkspaceResult = {
  cleared: boolean;
  deleted: { saved: number; opportunities: number; complaints: number };
  projectName?: string;
  error?: string;
};

/**
 * M16A — Clear the current user's CURRENT PROJECT only: saved opportunities,
 * generated opportunities, and complaints scoped to that project. Used by the
 * "Start fresh test" button so a user can test a new niche without mixing old
 * data — but now without deleting every other project's work.
 *
 * Order matters: savedOpportunities → opportunities → complaints because of
 * foreign-key constraints (SavedOpportunity references Opportunity, Complaint
 * references Opportunity). The user's other projects are never touched.
 */
export async function clearWorkspace(projectId: string): Promise<WorkspaceResult> {
  const user = await requireUser();
  const project = await requireOwnedProject(projectId, user);
  try {
    const saved = await prisma.savedOpportunity.deleteMany({
      where: { userId: user.id, projectId: project.id },
    });
    const opportunities = await prisma.opportunity.deleteMany({
      where: { userId: user.id, projectId: project.id },
    });
    const complaints = await prisma.complaint.deleteMany({
      where: { userId: user.id, projectId: project.id },
    });

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
      projectName: project.name,
    };
  } catch (err) {
    return {
      cleared: false,
      deleted: { saved: 0, opportunities: 0, complaints: 0 },
      error: err instanceof Error ? err.message : "Could not clear workspace",
    };
  }
}
