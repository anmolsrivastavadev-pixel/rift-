import { Container } from "@/components/container";

export function WhyComplaints() {
  return (
    <section id="why-complaints" className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Why start with complaints?
          </h2>
          <p className="mt-4 text-[var(--color-muted-foreground)]">
            Complaints reveal repeated pain. Repeated pain is often where useful business ideas begin.
          </p>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            You can use product reviews, support tickets, Reddit/forum snippets you manually collect, sales call notes, or the built-in demo data.
          </p>
        </div>
      </Container>
    </section>
  );
}