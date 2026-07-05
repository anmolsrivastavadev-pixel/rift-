import Link from "next/link";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

/* Slim landing-page header: logo home link on the left, Sign in / Get started
 * on the right. Sticky so the entry points stay reachable while scrolling.
 */
export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/85 backdrop-blur-lg">
      <Container className="flex h-14 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[11px] font-bold text-white">
            R
          </span>
          Rift
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
