import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <Container className="flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">Rift</span>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Opportunity intelligence for founders
          </span>
        </div>

        <Button asChild size="md">
          <Link href="/dashboard">
            Open dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </Container>
    </footer>
  );
}