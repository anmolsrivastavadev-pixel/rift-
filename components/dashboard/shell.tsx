"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Target,
  Bookmark,
  LayoutGrid,
  LogOut,
  User,
  ChevronRight,
  BarChart3,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { projectHref } from "@/lib/project-href";
import { RiftMark } from "@/components/logo";
import { ProjectSelector, type ProjectOption } from "@/components/dashboard/project-selector";
import { FeedbackWidget } from "@/components/dashboard/feedback-widget";

const nav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/complaints", label: "Complaints", icon: Upload },
  { href: "/dashboard/opportunities", label: "Ideas", icon: Target },
  { href: "/dashboard/opportunities/decision-board", label: "Compare Ideas", icon: LayoutGrid },
  { href: "/dashboard/saved", label: "Saved", icon: Bookmark },
];

// M24 — collapsed-rail preference survives reloads. Read after mount only,
// so the server render and the first client render agree (no hydration
// mismatch); the rail may expand->collapse one frame after load, which is
// acceptable for a preference.
const COLLAPSE_KEY = "rift-sidebar-collapsed";

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
  isAdmin = false,
}: {
  children: React.ReactNode;
  user: User;
  projects: ProjectOption[];
  archivedProjects: ProjectOption[];
  currentProjectId: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Post-mount setState is required here: the preference lives in
    // localStorage, which the server render can't see (hydration safety).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      return !prev;
    });
  }

  // M19 — admin-only Beta insights link; hidden for everyone else.
  const navItems = isAdmin
    ? [...nav, { href: "/dashboard/beta-insights", label: "Beta insights", icon: BarChart3 }]
    : nav;
  // Carry project context through internal links, but don't propagate unknown
  // project ids from manually edited URLs.
  const queryProjectId = search.get("projectId");
  const projectId = queryProjectId && projects.some((project) => project.id === queryProjectId)
    ? queryProjectId
    : currentProjectId;
  const currentProjectName =
    projects.find((project) => project.id === projectId)?.name ?? "";

  const navLinks = (onNavigate?: () => void) =>
    navItems.map(({ href, label, icon: Icon }) => {
      const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
      return (
        <Link
          key={href}
          href={projectHref(href, projectId)}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          aria-label={label}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150 ease-out ${
            collapsed && !onNavigate ? "justify-center px-2" : ""
          } ${
            isActive
              ? "bg-[var(--color-primary-soft)] text-[var(--color-foreground)] font-medium"
              : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
          }`}
        >
          <Icon className={`h-4 w-4 shrink-0 transition-colors duration-150 ease-out ${
            isActive ? "text-[var(--color-primary)]" : "group-hover:text-[var(--color-primary)]"
          }`} />
          {(!collapsed || onNavigate) && label}
          {isActive && (!collapsed || onNavigate) && (
            <ChevronRight className="ml-auto h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
          )}
        </Link>
      );
    });

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar — M24: collapsible to an icon rail */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-[var(--color-border)] bg-[var(--color-background)] py-6 transition-[width] duration-150 ease-out md:block ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className={`flex h-full flex-col gap-1 ${collapsed ? "px-2" : "px-5"}`}>
          <div
            className={`flex items-center ${
              collapsed ? "flex-col gap-3" : "justify-between px-2"
            }`}
          >
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-semibold tracking-tight"
              aria-label="Rift home"
            >
              <RiftMark size={28} id="dash-mark" />
              {!collapsed && "Rift"}
            </Link>
            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-all duration-150 ease-out hover:bg-[var(--color-card)] hover:text-[var(--color-foreground)]"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          {!collapsed && (
            <div className="mt-6 border-b border-[var(--color-border)] pb-4">
              <ProjectSelector
                projects={projects}
                archivedProjects={archivedProjects}
                currentProjectId={currentProjectId}
              />
            </div>
          )}

          <nav className="mt-4 flex flex-col gap-0.5" aria-label="Dashboard navigation">
            {navLinks()}
          </nav>

          {collapsed ? (
            <div className="mt-auto flex flex-col items-center gap-1 pt-4">
              <button
                onClick={handleSignOut}
                title="Sign out"
                aria-label="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-muted-foreground)] transition-all duration-150 ease-out hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] active:scale-[0.97]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-auto space-y-2.5 px-3 pt-4">
              {/* M20 — compact beta feedback entry point */}
              <FeedbackWidget projectId={projectId} />
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
          )}
        </div>
      </aside>

      {/* Mobile top bar — M24: single row + hamburger drawer, no horizontal
          scrolling pill strip. */}
      <div className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/85 backdrop-blur-lg md:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight"
            aria-label="Rift home"
          >
            <RiftMark size={24} id="dash-mark-m" />
            Rift
          </Link>
          {currentProjectName && (
            <span className="min-w-0 flex-1 truncate text-xs text-[var(--color-muted-foreground)]">
              {currentProjectName}
            </span>
          )}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--color-foreground)] transition-all duration-150 ease-out hover:bg-[var(--color-card)]"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 text-base font-semibold tracking-tight"
                onClick={() => setDrawerOpen(false)}
              >
                <RiftMark size={26} id="dash-mark-d" />
                Rift
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-all duration-150 ease-out hover:bg-[var(--color-card)] hover:text-[var(--color-foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-[var(--color-border)] pb-4">
              <ProjectSelector
                projects={projects}
                archivedProjects={archivedProjects}
                currentProjectId={currentProjectId}
              />
            </div>

            <nav className="flex flex-col gap-0.5" aria-label="Mobile dashboard navigation">
              {navLinks(() => setDrawerOpen(false))}
            </nav>

            <div className="mt-auto space-y-2.5 pt-4">
              <FeedbackWidget projectId={projectId} />
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
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 pt-14 md:pt-0">
        <main className="px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
