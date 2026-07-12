import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/container";
import { RiftMark } from "@/components/logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#example", label: "Example" },
      { href: "/#why-rift", label: "Why Rift?" },
      { href: "/#faq", label: "FAQ" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Create account" },
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
              <span className="text-base font-bold tracking-tight text-[var(--color-foreground)]">
                Rift
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              Business ideas from real customer problems. Grouped by AI,
              scored transparently, tested by you.
            </p>
            {/* The CTA band directly above already makes the sign-up pitch;
                the footer closes with quiet links, not a second sales beat. */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1 font-medium text-[var(--color-primary)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)]/70"
              >
                Try Rift free <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
              <Link
                href="/pricing"
                className="text-[var(--color-muted-foreground)] transition-colors duration-150 ease-out hover:text-[var(--color-foreground)]"
              >
                View pricing
              </Link>
            </div>
          </div>

          {/* Link columns */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold text-[var(--color-muted-foreground)]">
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
          © 2026 Rift. Business ideas from real customer problems.
        </p>
      </Container>
    </footer>
  );
}
