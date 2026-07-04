import { DashboardShell } from "@/components/dashboard/shell";
import { requireUser } from "@/lib/auth/current-user";
import {
  getProjectOrDefault,
  listProjectsForUser,
} from "@/lib/projects";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const project = await getProjectOrDefault(null, user);
  const projects = await listProjectsForUser(user);

  return (
    <DashboardShell user={user} projects={projects} currentProjectId={project.id}>
      {children}
    </DashboardShell>
  );
}
