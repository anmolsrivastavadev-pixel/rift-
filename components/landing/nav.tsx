import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EurekaLink } from "@/components/landing/eureka";
import { RiftMark } from "@/components/logo";
import { MobileMenu } from "@/components/landing/mobile-menu";

const navLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#example", label: "Example" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

/* Landing-page header: a floating pill that stays pinned while scrolling.
 * Shared by /, /pricing, /privacy, and /terms — section links are absolute
 * (/#...) so they work from every page.
 */
export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-3">
      <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[#0a0a0a]/88 px-3 pl-4 shadow-[var(--shadow-elevated)] backdrop-blur-xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-bold tracking-tight"
        >
          <RiftMark size={28} id="nav-mark" />
          Rift
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-[var(--color-muted-foreground)] transition-colors duration-150 ease-out hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <EurekaLink href="/sign-up" size="sm" className="rounded-full px-4">
            Try free <ArrowUpRight className="h-3.5 w-3.5" />
          </EurekaLink>
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </header>
  );
}
