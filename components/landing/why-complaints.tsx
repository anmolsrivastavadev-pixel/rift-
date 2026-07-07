import { FlaskConical, MessageSquareText, ShieldCheck } from "lucide-react";
import { Container } from "@/components/container";

const points = [
  {
    icon: MessageSquareText,
    title: "Starter examples",
    text: "Help you explore quickly and understand how Rift works.",
  },
  {
    icon: FlaskConical,
    title: "Ideas with receipts",
    text: "Complaints found by Rift link back to the original post — Reddit, YouTube, Hacker News, Stack Exchange, GitHub, the App Store, or the web.",
  },
  {
    icon: ShieldCheck,
    title: "Honest scores",
    text: "Scores are sorting guides, not proof that an idea will work.",
  },
];

export function WhyComplaints() {
  return (
    <section id="why-trust" className="scroll-mt-24 py-10 sm:py-14">
      <Container>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {points.map((p) => (
              <div key={p.title} className="flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)]">
                  <p.icon className="h-4.5 w-4.5 text-[var(--color-primary)]" aria-hidden />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {p.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
