"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";

/* M16A — Minimal project management server actions.
 *
 * Only what M16A needs:
 *   - list the current user's projects (for the sidebar selector)
 *   - create a new project for the current user
 *
 * Renaming, deleting, and archiving a project are M16B (not built here).
 */

const MAX_PROJECTS_PER_USER = 100;
const MAX_NAME = 80;

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

export type CreateProjectResult =
  | { ok: true; project: ProjectSummary }
  | { ok: false; error: string };

export async function getProjectsForCurrentUser(): Promise<ProjectSummary[]> {
  const user = await requireUser();
  return prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
  });
}

/**
 * Form-action compatible. Reads `name` from the FormData. Enforces a soft
 * per-user cap (MAX_PROJECTS_PER_USER) so a single user can't trivially bloat
 * the projects table.
 */
export async function createProject(
  _prev: CreateProjectResult | null,
  formData: FormData
): Promise<CreateProjectResult> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 1) {
    return { ok: false, error: "Project name is required." };
  }
  if (name.length > MAX_NAME) {
    return { ok: false, error: `Project name must be ${MAX_NAME} characters or fewer.` };
  }
  const count = await prisma.project.count({ where: { userId: user.id } });
  if (count >= MAX_PROJECTS_PER_USER) {
    return { ok: false, error: `You already have ${MAX_PROJECTS_PER_USER} projects. This is the M16A soft cap.` };
  }

  const project = await prisma.project.create({
    data: { name, userId: user.id },
    select: { id: true, name: true, description: true, createdAt: true },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");

  return { ok: true, project };
}
