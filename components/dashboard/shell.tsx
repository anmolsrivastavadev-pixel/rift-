"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  MessagesSquare,
  MessageSquare,
  Target,
  Bookmark,
  CreditCard,
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
import { cn } from "@/lib/utils";
import { RiftMark } from "@/components/logo";
import { ProjectSelector, type ProjectOption } from "@/components/dashboard/project-selector";
import { FeedbackWidget } from "@/components/dashboard/feedback-widget";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Research",
    items: [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard },
      { href: "/dashboard/complaints", label: "Complaints", icon: MessagesSquare },
    ],
  },
  {
    label: "Ideas",
    items: [
      // M34: the standalone "Decisions" board was folded into the Ideas page
      // (decision filter + compare-from-selection), so it left the nav.
      { href: "/dashboard/opportunities", label: "All ideas", icon: Target },
      { href: "/dashboard/saved", label: "Saved ideas", icon: Bookmark },
    ],
  },
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
  plan = "free",
}: {
  children: React.ReactNode;
  user: User;
  projects: ProjectOption[];
  archivedProjects: ProjectOption[];
  currentProjectId: string;
  isAdmin?: boolean;
  plan?: "free" | "pro" | "beta";
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);

  // Mobile drawer: close on Escape, lock scroll while open, focus the Close
  // button on open, wrap Tab focus inside the panel, and return focus to the
  // hamburger when it closes.
  useEffect(() => {
    if (!drawerOpen) return;
    const menuButton = menuButtonRef.current;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawerPanelRef.current) return;
      const focusables = drawerPanelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      menuButton?.focus();
    };
  }, [drawerOpen]);

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

  // M19 — admin-only Beta insights link; hidden for everyone else. It rides
  // at the end of the second ("Ideas") group.
  const groups = isAdmin
    ? [
        navGroups[0],
        { ...navGroups[1], items: [...navGroups[1].items, { href: "/dashboard/beta-insights", label: "Beta insights", icon: BarChart3 }] },
      ]
    : navGroups;
  const navItems: NavItem[] = groups.flatMap((g) => g.items);

  // Carry project context through internal links, but don't propagate unknown
  // project ids from manually edited URLs.
  const queryProjectId = search.get("projectId");
  const projectId = queryProjectId && projects.some((project) => project.id === queryProjectId)
    ? queryProjectId
    : currentProjectId;
  const currentProjectName =
    projects.find((project) => project.id === projectId)?.name ?? "";

  // Exactly ONE nav item lights up: the longest href that prefixes the
  // current path wins, so "All ideas" no longer stays lit on Decisions.
  const activeHref = navItems
    .filter(({ href }) => pathname === href || pathname.startsWith(href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const renderNav = (onNavigate?: () => void) =>
    groups.map((group) => (
      <div key={group.label} className="flex flex-col gap-0.5">
        {(!collapsed || onNavigate) && (
          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
            {group.label}
          </p>
        )}
        {group.items.map(({ href, label, icon: Icon }) => {
          const isActive = href === activeHref;
          return (
            <Link
              key={href}
              href={projectHref(href, projectId)}
              onClick={onNavigate}
              title={collapsed && !onNavigate ? label : undefined}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-all duration-150 ease-out ${
                collapsed && !onNavigate ? "justify-center px-2" : ""
              } ${
                isActive
                  ? "border-blue-400/15 bg-[var(--color-primary-soft)] text-[var(--color-foreground)] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  : "border-transparent text-[var(--color-muted-foreground)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
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
        })}
      </div>
    ));

  return (
    <div className="app-canvas flex min-h-screen w-full bg-[var(--color-background)]">
      {/* Desktop sidebar — M24: collapsible to an icon rail */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-[var(--color-border)] bg-[#080b11]/95 py-6 shadow-[12px_0_40px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-[width] duration-150 ease-out md:block ${
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
              className="flex items-center gap-2 text-base font-bold tracking-tight"
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

          {/* Collapsed rail keeps a touch of project context: the first
              letter of the current project, clicking it expands the rail. */}
          {collapsed && currentProjectName && (
            <button
              type="button"
              onClick={toggleCollapsed}
              title={currentProjectName}
              aria-label={`Switch project — ${currentProjectName}`}
              className="mt-2 flex h-7 w-7 items-center justify-center self-center rounded-lg bg-[var(--color-primary-soft)] text-xs font-semibold text-[var(--color-primary)] transition-all duration-150 ease-out hover:brightness-110 active:scale-[0.97]"
            >
              {currentProjectName.charAt(0).toUpperCase()}
            </button>
          )}

          {!collapsed && (
            <div className="mt-6 border-b border-[var(--color-border)] pb-4">
              <ProjectSelector
                projects={projects}
                archivedProjects={archivedProjects}
                currentProjectId={currentProjectId}
              />
            </div>
          )}

          <nav className="mt-4 flex flex-col" aria-label="Dashboard navigation">
            {renderNav()}
          </nav>

          {collapsed ? (
            <div className="mt-auto flex flex-col items-center gap-1 pt-4">
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Send feedback"
                aria-label="Send feedback"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-muted-foreground)] transition-all duration-150 ease-out hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
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
            <div className="mt-auto">
              <ShellFooter
                user={user}
                projectId={projectId}
                plan={plan}
                className="px-3"
              />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile top bar — M24: single row + hamburger drawer, no horizontal
          scrolling pill strip. */}
      <div className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-border)] bg-[#080b11]/90 shadow-lg backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight"
            aria-label="Rift home"
          >
            <RiftMark size={24} id="dash-mark-m" />
            Rift
          </Link>
          <span className="min-w-0 flex-1 truncate text-xs text-[var(--color-muted-foreground)]">
            {navItems.find((item) => item.href === activeHref)?.label ?? ""}
            {currentProjectName ? ` · ${currentProjectName}` : ""}
          </span>
          <button
            type="button"
            ref={menuButtonRef}
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
          <div
            ref={drawerPanelRef}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto border-r border-[var(--color-border)] bg-[#080b11] p-4 shadow-[var(--shadow-elevated)]"
          >
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
                ref={closeButtonRef}
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
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>

            <nav className="flex flex-col" aria-label="Mobile dashboard navigation">
              {renderNav(() => setDrawerOpen(false))}
            </nav>

            <div className="mt-auto">
              <ShellFooter
                user={user}
                projectId={projectId}
                plan={plan}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="relative min-w-0 flex-1 pt-14 md:pt-0">
        <main id="main-content" className="px-4 py-8 sm:px-8 sm:py-10 lg:px-10 xl:px-12">{children}</main>
      </div>
    </div>
  );
}

/** Shared sidebar/drawer footer: plan link + badge, feedback, account card,
 *  sign out. `onNavigate` is wired to the links so the mobile drawer can close
 *  itself when one is tapped. */
function ShellFooter({
  user,
  projectId,
  plan,
  onNavigate,
  className,
}: {
  user: User;
  projectId: string;
  plan: "free" | "pro" | "beta";
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5 pt-4", className)}>
      <Link
        href="/pricing"
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-muted-foreground)] transition-all duration-150 ease-out hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
      >
        <CreditCard className="h-4 w-4" />
        Plan &amp; pricing
        <span className="ml-auto rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {plan}
        </span>
      </Link>
      {/* M20 — compact beta feedback entry point */}
      <FeedbackWidget projectId={projectId} />
      <Link
        href="/dashboard/account"
        onClick={onNavigate}
        title="Account settings"
        className="flex items-center gap-2.5 rounded-xl bg-[var(--color-card)] px-3 py-2.5 transition-all duration-150 ease-out hover:bg-[var(--color-surface)]"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <User className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-[var(--color-foreground)]">
            {user.name || user.email}
          </p>
          {user.name && (
            <p className="truncate text-xs text-[var(--color-muted-foreground)]">
              {user.email}
            </p>
          )}
        </div>
      </Link>
      <button
        onClick={handleSignOut}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-muted-foreground)] transition-all duration-150 ease-out hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] active:scale-[0.97]"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
