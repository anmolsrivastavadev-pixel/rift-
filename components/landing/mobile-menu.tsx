"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

/* Mobile disclosure menu for the landing nav pill. The desktop link row is
 * hidden below md; this hamburger keeps How it works / Features / Pricing /
 * FAQ (and Sign in) reachable on phones. Panel is anchored to the pill, so
 * the header wrapper must stay `relative`.
 */

type NavLink = { href: string; label: string };

export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="rounded-lg p-2 text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:bg-[var(--color-surface)] active:scale-[0.95]"
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Menu className="h-5 w-5" aria-hidden />
        )}
      </button>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="absolute inset-x-0 top-[calc(100%+8px)] rounded-2xl border border-[var(--color-border)] bg-[#0a0a0a]/95 p-2 shadow-[var(--shadow-elevated)] backdrop-blur-xl"
        >
          <ul>
            {[...links, { href: "/sign-in", label: "Sign in" }].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:bg-[var(--color-surface)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
