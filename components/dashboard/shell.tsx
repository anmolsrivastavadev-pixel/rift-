import Link from "next/link";
import { LayoutDashboard, Upload, Target, Bookmark } from "lucide-react";
import { Container } from "@/components/container";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/complaints", label: "Complaints", icon: Upload },
  { href: "/dashboard/opportunities", label: "Opportunities", icon: Target },
  { href: "/dashboard/saved", label: "Saved", icon: Bookmark },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-background)] py-6 md:block">
        <Container className="flex h-full flex-col gap-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-2 text-base font-semibold"
          >
            Rift
          </Link>
          <nav className="mt-8 flex flex-col gap-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-foreground)]"
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

      <div className="flex-1">
        <main className="px-6 py-10">{children}</main>
      </div>
    </div>
  );
}