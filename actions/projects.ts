"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { projectHref } from "@/lib/project-href";

/* M16A/M16B1/M16B2 — Minimal project management server actions.
 *
 * - list the current user's projects (for the sidebar selector)
 * - create a new project for the current user (M16A)
 * - rename an owned project (M16B1)
 * - archive / unarchive an owned project (M16B2) — archiving only sets
 *   Project.archivedAt; every complaint/idea/saved row is preserved.
 *
 * Duplicate project names per user are blocked at the app level (M16B1) —
 * no DB unique constraint, so existing duplicate rows keep working.
 * Permanent project deletion is still future work.
 */

const MAX_PROJECTS_PER_USER = 100;
const MAX_NAME = 60;

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

export type CreateProjectResult =
  | { ok: true; project: ProjectSummary }
  | { ok: false; error: string };

export type RenameProjectResult =
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

/** Case-insensitive "does this user already use this name" check. */
async function nameTakenByUser(
  userId: string,
  name: string,
  excludeProjectId?: string
): Promise<boolean> {
  const existing = await prisma.project.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
      ...(excludeProjectId ? { id: { not: excludeProjectId } } : {}),
    },
    select: { id: true },
  });
  return existing !== null;
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
  if (await nameTakenByUser(user.id, name)) {
    return { ok: false, error: "You already have a project with this name." };
  }

  const project = await prisma.project.create({
    data: { name, userId: user.id },
    select: { id: true, name: true, description: true, createdAt: true },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");

  return { ok: true, project };
}

/**
 * M16B1 — Rename an owned project. Form-action compatible: reads `projectId`
 * and `name` from the FormData. Ownership is verified server-side, so a forged
 * projectId from another user's project just returns an error. The project id
 * never changes, so existing `?projectId=...` URLs and scoped data stay valid.
 */
export async function renameProject(
  _prev: RenameProjectResult | null,
  formData: FormData
): Promise<RenameProjectResult> {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!projectId) {
    return { ok: false, error: "Project not found." };
  }
  if (name.length < 1) {
    return { ok: false, error: "Project name is required." };
  }
  if (name.length > MAX_NAME) {
    return { ok: false, error: `Project name must be ${MAX_NAME} characters or fewer.` };
  }

  const owned = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    select: { id: true, name: true },
  });
  if (!owned) {
    return { ok: false, error: "Project not found." };
  }

  // Excluding the project itself lets a user change only the casing,
  // e.g. "fitness" -> "Fitness".
  if (await nameTakenByUser(user.id, name, owned.id)) {
    return { ok: false, error: "You already have a project with this name." };
  }

  const project = await prisma.project.update({
    where: { id: owned.id },
    data: { name },
    select: { id: true, name: true, description: true, createdAt: true },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");

  return { ok: true, project };
}

/* M16B2 — archive/unarchive. Both actions only ever return on error; on
 * success they redirect to an active project, which also refreshes the
 * sidebar. Ownership is verified server-side, so a forged projectId from
 * another user's project just returns "Project not found." */

export type ArchiveActionResult = { ok: false; error: string };

/**
 * Archive an owned project (hide it, keep all its data). Blocked when it is
 * the user's last active project. On success, redirects to the user's oldest
 * remaining active project.
 */
export async function archiveProject(
  _prev: ArchiveActionResult | null,
  formData: FormData
): Promise<ArchiveActionResult> {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "").trim();

  const owned = projectId
    ? await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
        select: { id: true, archivedAt: true },
      })
    : null;
  if (!owned) {
    return { ok: false, error: "Project not found." };
  }

  if (!owned.archivedAt) {
    const activeCount = await prisma.project.count({
      where: { userId: user.id, archivedAt: null },
    });
    if (activeCount <= 1) {
      return { ok: false, error: "You need at least one active project." };
    }

    await prisma.project.update({
      where: { id: owned.id },
      data: { archivedAt: new Date() },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");

  const nextActive = await prisma.project.findFirst({
    where: { userId: user.id, archivedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  redirect(projectHref("/dashboard", nextActive?.id ?? null));
}

/**
 * Restore an owned archived project. On success, redirects to the restored
 * project so the user lands right back in it.
 */
export async function unarchiveProject(
  _prev: ArchiveActionResult | null,
  formData: FormData
): Promise<ArchiveActionResult> {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "").trim();

  const owned = projectId
    ? await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
        select: { id: true, archivedAt: true },
      })
    : null;
  if (!owned) {
    return { ok: false, error: "Project not found." };
  }

  if (owned.archivedAt) {
    await prisma.project.update({
      where: { id: owned.id },
      data: { archivedAt: null },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");

  redirect(projectHref("/dashboard", owned.id));
}
