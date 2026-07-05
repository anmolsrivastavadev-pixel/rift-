import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db";
export { projectHref } from "@/lib/project-href";

/**
 * M16A — Multi-Project helpers. M16B2 adds archive awareness.
 *
 * Every project belongs to exactly one user. These helpers make sure a calling
 * page/server-action never resolves another user's project, never crashes when
 * no projectId is present (it falls back to the user's oldest ACTIVE project),
 * and creates a "Default project" the first time a user lands on the dashboard
 * (or when every project is archived).
 *
 * Archive semantics (M16B2):
 *   - Active project   = archivedAt is null
 *   - Archived project = archivedAt is not null
 * Archived projects keep all their complaints/ideas/saved data; they are only
 * hidden from the normal selector and navigation.
 *
 * All other lib/ files (scoring, ai, cleaning, validation, decision-board,
 * evidence) are untouched.
 */

/** Minimal user shape we need from the auth session. */
type AuthUser = { id: string };

/** Project shape returned to pages/actions. */
export type ProjectRef = {
  id: string;
  name: string;
  description: string | null;
  archivedAt: Date | null;
  userId: string;
  createdAt: Date;
};

const DEFAULT_PROJECT_NAME = "Default project";

/**
 * Resolve the project a page/action should operate on.
 *
 * 1. If `projectId` is provided and owned by `user`:
 *    - active → return it.
 *    - archived → redirect to /dashboard, which re-resolves to the user's
 *      oldest active project. Archived projects never render as the current
 *      workspace, so their data cannot mix into normal navigation.
 * 2. If `projectId` is provided but NOT owned by `user`, call notFound().
 * 3. Otherwise, return the user's oldest ACTIVE project.
 * 4. If the user has no active projects at all, create a "Default project" and
 *    return it (first-time-user onboarding, or everything was archived by an
 *    older client).
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
    if (owned) {
      if (owned.archivedAt) redirect("/dashboard");
      return owned;
    }
    notFound();
  }

  const oldestActive = await prisma.project.findFirst({
    where: { userId: user.id, archivedAt: null },
    orderBy: { createdAt: "asc" },
    select: projectSelect,
  });
  if (oldestActive) return oldestActive;

  // First-time user (or no active project left): create the default project so
  // they always have one.
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
 *
 * Archived projects still pass this check on purpose: it guards OWNERSHIP, and
 * actions like unarchiveProject and owned deep links (e.g. an opportunity
 * detail page) must keep working for the user's own archived data.
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

/** Get a user's ACTIVE projects (for the sidebar selector), oldest first. */
export async function listProjectsForUser(user: AuthUser): Promise<ProjectRef[]> {
  return prisma.project.findMany({
    where: { userId: user.id, archivedAt: null },
    orderBy: { createdAt: "asc" },
    select: projectSelect,
  });
}

/** Get a user's ARCHIVED projects (for the restore area), newest-archived first. */
export async function listArchivedProjectsForUser(
  user: AuthUser
): Promise<ProjectRef[]> {
  return prisma.project.findMany({
    where: { userId: user.id, archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
    select: projectSelect,
  });
}

const projectSelect = {
  id: true,
  name: true,
  description: true,
  archivedAt: true,
  userId: true,
  createdAt: true,
} as const;
