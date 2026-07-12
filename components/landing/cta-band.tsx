import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

const assurances = [
  "Free during the beta",
  "Works with just 5–10 pasted comments",
  "No credit card required",
];

/* Full-width blue band above the footer — the final sign-up prompt. */
export function CtaBand() {
  return (
    <section
      className="border-y border-[var(--color-primary)]/30"
      style={{
        background:
          "linear-gradient(120deg, rgba(154,64,18,0.35) 0%, rgba(192,86,33,0.22) 55%, rgba(224,138,94,0.26) 100%)",
      }}
    >
      <Container className="flex flex-col items-start gap-6 py-12 sm:py-14 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-3xl">
            Ready to find your first idea?
          </h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {assurances.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-[var(--color-foreground)]/85"
              >
                <Check className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <Button asChild size="lg" className="shrink-0 rounded-full px-7">
          <Link href="/sign-up">
            Find my first idea <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </Container>
    </section>
  );
}
