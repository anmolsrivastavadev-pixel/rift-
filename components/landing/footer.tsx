import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { RiftMark } from "@/components/logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#features", label: "Features" },
      { href: "/#faq", label: "FAQ" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Create account" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_2fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <RiftMark size={32} id="footer-mark" />
              <span className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-foreground)]">
                Rift
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              Business ideas from real customer pain. Grouped by AI, scored
              transparently, validated by you.
            </p>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]/70">
              Find your first idea today
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-full px-4">
                <Link href="/dashboard">Start free</Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="rounded-full px-4">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>

          {/* Link columns */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]/70">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--color-muted-foreground)] transition-colors duration-150 ease-out hover:text-[var(--color-foreground)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <p className="mt-12 border-t border-[var(--color-border)] pt-6 text-center text-xs text-[var(--color-muted-foreground)]">
          © 2026 Rift. Business ideas from real customer pain.
        </p>
      </Container>
    </footer>
  );
}
