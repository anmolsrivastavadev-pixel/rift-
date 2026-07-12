import { Route } from "lucide-react";
import { Container } from "@/components/container";
import { SectionHeader } from "@/components/landing/section-header";
import { DemoVideo } from "@/components/landing/demo-video";

/* Three plain-language steps (July 2026 landing redesign). The numbered
 * markers are real sequence — this is the order a first-time user actually
 * moves through the product. The demo video sits beside the steps as an
 * optional extra: the text must carry the explanation on its own.
 */

const steps = [
  {
    n: "1",
    title: "Tell Rift an industry",
    text: "Type any market you're curious about — or paste reviews, support messages, and complaints you already have.",
  },
  {
    n: "2",
    title: "See the problems customers repeat",
    text: "Rift reads everything and groups the complaints that keep coming up, with links back to the original posts.",
  },
  {
    n: "3",
    title: "Explore ideas backed by sources",
    text: "Each repeated problem becomes a practical business idea you can explore, with a score that is explained, never a black box.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <SectionHeader
          icon={Route}
          badge="How it works"
          heading={
            <>
              Three steps.{" "}
              <span className="text-[var(--color-primary)]">
                No research skills needed.
              </span>
            </>
          }
          lead="You don't need to know anything about customer research or idea validation. If you can type a market you're curious about, you can use Rift."
        />

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Step list */}
          <ol className="space-y-3">
            {steps.map((s) => (
              <li
                key={s.n}
                className="flex gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-base font-semibold text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-base leading-relaxed text-[var(--color-muted-foreground)]">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Optional demo video — an extra, not the explanation */}
          <div className="lg:sticky lg:top-24">
            <DemoVideo />
            <p className="mt-3 text-center text-sm text-[var(--color-muted-foreground)]">
              Prefer to watch? The whole flow in 90 seconds. The video is
              optional — everything it shows is explained on this page.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
