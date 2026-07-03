import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <Container className="py-16 sm:py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to find your first idea?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-[var(--color-muted-foreground)]">
          Start with a market you know, or paste complaints you have collected.
          Rift does the pattern-finding for you.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard/complaints">
              Start with a market <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard/complaints">
              Paste complaints
            </Link>
          </Button>
        </div>
        <div className="mt-10 flex items-center justify-center gap-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[11px] font-bold text-white">
            R
          </span>
          <span className="text-sm font-semibold tracking-tight">Rift</span>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Business ideas from real customer pain.
          </span>
        </div>
      </Container>
    </footer>
  );
}
