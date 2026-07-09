import { DashboardShell } from "@/components/dashboard/shell";
import { ValidationStateMigrator } from "@/components/dashboard/validation-state-migrator";
import { requireUser } from "@/lib/auth/current-user";
import { isAdminEmail } from "@/lib/admin";
import { requireBetaAccess } from "@/lib/beta-access";
import { getEffectivePlan } from "@/lib/quotas";
import {
  getProjectOrDefault,
  listProjectsForUser,
  listArchivedProjectsForUser,
} from "@/lib/projects";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  // M20 — invite-only beta gate (no-op unless RIFT_BETA_MODE=invite_only;
  // admins always pass). Redirects blocked users to /beta-access.
  await requireBetaAccess(user);
  const project = await getProjectOrDefault(null, user);
  const projects = await listProjectsForUser(user);
  const archivedProjects = await listArchivedProjectsForUser(user);
  // Read-only effective plan (admins always resolve to "pro"). Passed to the
  // shell only to badge the Plan & pricing link — never written here.
  const { plan } = await getEffectivePlan(user);

  return (
    <DashboardShell
      user={user}
      projects={projects}
      archivedProjects={archivedProjects}
      currentProjectId={project.id}
      isAdmin={isAdminEmail(user.email)}
      plan={plan}
    >
      <ValidationStateMigrator userId={user.id} />
      {children}
    </DashboardShell>
  );
}
