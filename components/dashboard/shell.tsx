"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, Target, Bookmark, LayoutGrid, LogOut, User, ChevronRight } from "lucide-react";
import { Container } from "@/components/container";
import { authClient } from "@/lib/auth/client";

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
}: {
  children: React.ReactNode;
  user: User;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-[var(--color-border)] bg-[rgb(255_255_255_/_0.7)] py-6 backdrop-blur-xl md:block">
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
          <nav className="mt-8 flex flex-col gap-0.5" aria-label="Dashboard navigation">
            {nav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150 ease-out ${
                    isActive
                      ? "bg-white text-[var(--color-foreground)] shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04)] font-medium"
                      : "text-[var(--color-muted-foreground)] hover:bg-white/60 hover:text-[var(--color-foreground)] hover:shadow-[0_1px_3px_0_rgb(0_0_0_/_0.02)]"
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
            <div className="flex items-center gap-2.5 rounded-xl bg-[var(--color-surface)] px-3 py-2.5">
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
            <div className="text-[11px] text-[var(--color-muted-foreground)]/60 text-center">
              MVP build
            </div>
          </div>
        </Container>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.85)] backdrop-blur-lg md:hidden">
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
                  href={href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150 ease-out ${
                    isActive
                      ? "bg-white text-[var(--color-foreground)] shadow-sm font-medium"
                      : "text-[var(--color-muted-foreground)] hover:bg-white/60 hover:text-[var(--color-foreground)]"
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
      </div>

      <div className="flex-1 pt-12 md:pt-0">
        <main className="px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
