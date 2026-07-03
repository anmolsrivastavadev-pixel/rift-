import { Container } from "@/components/container";

export function WhyComplaints() {
  return (
    <section id="why-trust" className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Why trust it
          </h2>
          <p className="mt-4 text-[var(--color-muted-foreground)] leading-relaxed">
            Rift is for early brainstorming, not proof of demand.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 text-left shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_12px_0_rgb(0_0_0_/_0.06),0_2px_4px_-2px_rgb(0_0_0_/_0.04)]">
            <h3 className="text-sm font-semibold">Starter examples</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)] leading-relaxed">
              Help you explore quickly and understand how Rift works.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 text-left shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_12px_0_rgb(0_0_0_/_0.06),0_2px_4px_-2px_rgb(0_0_0_/_0.04)]">
            <h3 className="text-sm font-semibold">Real complaints</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)] leading-relaxed">
              Real complaints and reviews give stronger evidence.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-5 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Talk to real people before building. Scores are sorting guides, not
            proof that an idea will work.
          </p>
        </div>
      </Container>
    </section>
  );
}
