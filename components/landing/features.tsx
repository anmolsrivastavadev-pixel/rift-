import { Upload, Sparkles, LineChart, Target } from "lucide-react";
import { Container } from "@/components/container";

const features = [
  {
    icon: Upload,
    title: "Turn pain into ideas",
    text: "Paste complaints, upload a file, or start with demo data.",
  },
  {
    icon: Sparkles,
    title: "AI groups the pain",
    text: "Gemini groups similar complaints and summarizes the problem for each cluster.",
  },
  {
    icon: LineChart,
    title: "Score and inspect",
    text: "Get a rough 0–100 score based on frequency, severity, and confidence.",
  },
  {
    icon: Target,
    title: "Compare and decide",
    text: "Review evidence, risks, and next steps before deciding what to test.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            From scattered frustrations to ranked ideas
          </h2>
          <p className="mt-4 text-[var(--color-muted-foreground)]">
            Rift is built around four jobs: gather real pain, cluster it,
            score it, and decide where to start.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}