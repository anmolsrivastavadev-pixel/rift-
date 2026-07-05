import Link from "next/link";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { RiftMark } from "@/components/logo";

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
          <RiftMark size={30} id="nav-mark" />
          Rift
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/pricing">Pricing</Link>
          </Button>
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
