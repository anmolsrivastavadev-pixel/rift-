"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Upload, Target, Bookmark, LayoutGrid, LogOut, User, ChevronRight } from "lucide-react";
import { Container } from "@/components/container";
import { authClient } from "@/lib/auth/client";
import { projectHref } from "@/lib/project-href";
import { ProjectSelector, type ProjectOption } from "@/components/dashboard/project-selector";

const nav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/complaints", label: "Complaints", icon: Upload },
  { href: "/dashboard/opportunities", label: "Ideas", icon: Target },
  { href: "/dashboard/opportunities/decision-board", label: "Compare Ideas", icon: LayoutGrid },
  { href: "/dashboard/saved", label: "Saved", icon: Bookmark },
];

interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

async function handleSignOut() {
  await authClient.signOut();
  window.location.href = "/";
}

export function DashboardShell({
  children,
  user,
  projects,
  archivedProjects,
  currentProjectId,
}: {
  children: React.ReactNode;
  user: User;
  projects: ProjectOption[];
  archivedProjects: ProjectOption[];
  currentProjectId: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  // Carry project context through internal links, but don't propagate unknown
  // project ids from manually edited URLs.
  const queryProjectId = search.get("projectId");
  const projectId = queryProjectId && projects.some((project) => project.id === queryProjectId)
    ? queryProjectId
    : currentProjectId;

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-background)] py-6 md:block">
        <Container className="flex h-full flex-col gap-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-2 text-base font-semibold tracking-tight"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[11px] font-bold text-white">
              R
            </span>
            Rift
          </Link>

          <div className="mt-6 border-b border-[var(--color-border)] pb-4">
            <ProjectSelector
              projects={projects}
              archivedProjects={archivedProjects}
              currentProjectId={currentProjectId}
            />
          </div>

          <nav className="mt-4 flex flex-col gap-0.5" aria-label="Dashboard navigation">
            {nav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={projectHref(href, projectId)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150 ease-out ${
                    isActive
                      ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm font-medium"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-card)]/60 hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-colors duration-150 ease-out ${
                    isActive ? "text-[var(--color-primary)]" : "group-hover:text-[var(--color-primary)]"
                  }`} />
                  {label}
                  {isActive && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-2.5 px-3 pt-4">
            <div className="flex items-center gap-2.5 rounded-xl bg-[var(--color-card)] px-3 py-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[var(--color-foreground)]">
                  {user.name || user.email}
                </p>
                <p className="truncate text-[10px] text-[var(--color-muted-foreground)]">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-muted-foreground)] transition-all duration-150 ease-out hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] active:scale-[0.97]"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </Container>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/85 backdrop-blur-lg md:hidden">
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-2">
          <Link
            href="/"
            className="mr-2 flex shrink-0 items-center gap-1.5 text-sm font-semibold tracking-tight"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-primary)] text-[10px] font-bold text-white">
              R
            </span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Mobile dashboard navigation">
            {nav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={projectHref(href, projectId)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150 ease-out ${
                    isActive
                      ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm font-medium"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-card)]/60 hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[var(--color-primary)]" : ""}`} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={handleSignOut}
            className="ml-auto flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-muted-foreground)] transition-all duration-150 ease-out hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
        {/* Mobile project selector row */}
        <div className="border-t border-[var(--color-border)] px-4 py-2">
          <ProjectSelector
            projects={projects}
            archivedProjects={archivedProjects}
            currentProjectId={currentProjectId}
          />
        </div>
      </div>

      <div className="flex-1 pt-20 md:pt-0">
        <main className="px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
