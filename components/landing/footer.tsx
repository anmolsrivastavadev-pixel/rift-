import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <Container className="py-16 sm:py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl text-[var(--color-foreground)]">
          Ready to find your first idea?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-[var(--color-muted-foreground)]">
          Start with a market you know. Rift finds the repeated complaints.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Start with a market <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <nav
          aria-label="Footer"
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
        >
          <Link
            href="/sign-in"
            className="text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            Create account
          </Link>
          <Link
            href="/#how-it-works"
            className="text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            How it works
          </Link>
        </nav>
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[11px] font-bold text-white">
            R
          </span>
          <span className="text-sm font-semibold tracking-tight text-[var(--color-foreground)]">Rift</span>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Business ideas from real customer pain.
          </span>
        </div>
      </Container>
    </footer>
  );
}
