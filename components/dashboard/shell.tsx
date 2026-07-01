import Link from "next/link";
import { LayoutDashboard, Upload, Target, Bookmark, LayoutGrid } from "lucide-react";
import { Container } from "@/components/container";

const nav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/complaints", label: "Complaints", icon: Upload },
  { href: "/dashboard/opportunities", label: "Ideas", icon: Target },
  { href: "/dashboard/opportunities/decision-board", label: "Compare Ideas", icon: LayoutGrid },
  { href: "/dashboard/saved", label: "Saved", icon: Bookmark },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-background)] py-6 md:block">
        <Container className="flex h-full flex-col gap-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-2 text-base font-semibold"
          >
            Rift
          </Link>
          <nav className="mt-8 flex flex-col gap-1" aria-label="Dashboard navigation">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-foreground)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-3 text-xs text-[var(--color-muted-foreground)]">
            MVP build
          </div>
        </Container>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)] md:hidden">
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-2">
          <Link
            href="/"
            className="mr-2 shrink-0 text-sm font-semibold"
          >
            Rift
          </Link>
          <nav className="flex items-center gap-1" aria-label="Mobile dashboard navigation">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-foreground)]"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 pt-12 md:pt-0">
        <main className="px-6 py-10">{children}</main>
      </div>
    </div>
  );
}