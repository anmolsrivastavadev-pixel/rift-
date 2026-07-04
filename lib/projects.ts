import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
export { projectHref } from "@/lib/project-href";

/**
 * M16A — Multi-Project helpers.
 *
 * Every project belongs to exactly one user. These helpers make sure a calling
 * page/server-action never resolves another user's project, never crashes when
 * no projectId is present (it falls back to the user's oldest project), and
 * creates a "Default project" the first time a user lands on the dashboard.
 *
 * All other lib/ files (scoring, ai, cleaning, validation, decision-board,
 * evidence) are untouched by M16A.
 */

/** Minimal user shape we need from the auth session. */
type AuthUser = { id: string };

/** Project shape returned to pages/actions. */
export type ProjectRef = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: Date;
};

const DEFAULT_PROJECT_NAME = "Default project";

/**
 * Resolve the project a page/action should operate on.
 *
 * 1. If `projectId` is provided and owned by `user`, return it.
 * 2. If `projectId` is provided but NOT owned by `user`, call notFound().
 * 3. Otherwise, return the user's oldest project (so existing deep links and
 *    signing in without a projectId still work).
 * 4. If the user has no projects at all, create a "Default project" and return
 *    it (first-time-user onboarding).
 */
export async function getProjectOrDefault(
  projectId: string | null | undefined,
  user: AuthUser
): Promise<ProjectRef> {
  if (projectId) {
    const owned = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
      select: projectSelect,
    });
    if (owned) return owned;
    notFound();
  }

  const oldest = await prisma.project.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: projectSelect,
  });
  if (oldest) return oldest;

  // First-time user: create the default project so they always have one.
  const created = await prisma.project.create({
    data: { name: DEFAULT_PROJECT_NAME, userId: user.id },
    select: projectSelect,
  });
  return created;
}

/**
 * Strict ownership check used by server actions and detail pages.
 * If `projectId` is missing or not owned by `user`, calls `notFound()` so a bad
 * deep link never returns another user's data — even when the underlying rows'
 * `userId` filter would have hidden them anyway (defense in depth).
 */
export async function requireOwnedProject(
  projectId: string | null | undefined,
  user: AuthUser
): Promise<ProjectRef> {
  if (!projectId) notFound();
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    select: projectSelect,
  });
  if (!project) notFound();
  return project;
}

/** Get every project for a user (for the sidebar selector), oldest first. */
export async function listProjectsForUser(user: AuthUser): Promise<ProjectRef[]> {
  return prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: projectSelect,
  });
}

const projectSelect = {
  id: true,
  name: true,
  description: true,
  userId: true,
  createdAt: true,
} as const;
