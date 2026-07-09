"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";

/* Mobile disclosure menu for the landing nav pill. The desktop link row is
 * hidden below md; this hamburger keeps How it works / Features / Pricing /
 * FAQ (and Sign in) reachable on phones. Panel is anchored to the pill, so
 * the header wrapper must stay `relative`.
 *
 * Closes on Escape and on any click outside the panel (a transparent
 * fixed-position backdrop). The backdrop is portalled to <body> because the
 * pill's backdrop-blur creates a containing block that would otherwise trap
 * `fixed inset-0` inside the pill. It sits at z-40, under the z-50 header,
 * so the panel and hamburger stay clickable above it.
 */

type NavLink = { href: string; label: string };

export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

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

      {open &&
        createPortal(
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-transparent md:hidden"
          />,
          document.body
        )}

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="absolute inset-x-0 top-[calc(100%+8px)] rounded-2xl border border-[var(--color-border)] bg-[#0a0a0a]/95 p-2 shadow-[var(--shadow-elevated)] backdrop-blur-xl"
        >
          <ul>
            {[...links, { href: "/sign-in", label: "Sign in" }].map(
              (link, i) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    ref={i === 0 ? firstLinkRef : undefined}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:bg-[var(--color-surface)]"
                  >
                    {link.label}
                  </Link>
                </li>
              )
            )}
            <li className="mt-1 border-t border-[var(--color-border)] pt-2 pb-1">
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-[var(--color-primary-fill)] px-4 py-3 text-center text-sm font-medium text-[var(--color-primary-foreground)] shadow-sm transition-all duration-150 ease-out hover:brightness-110 active:scale-[0.97]"
              >
                Start free
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
