import { Upload, Sparkles, LineChart, Target } from "lucide-react";
import { Container } from "@/components/container";

const features = [
  {
    icon: Upload,
    title: "Bring your own pain data",
    text: "Upload a CSV of complaints, reviews, support tickets, or forum posts. Rift parses and cleans it so analysis starts from real voices, not guesses.",
  },
  {
    icon: Sparkles,
    title: "AI clusters the pain",
    text: "Gemini groups similar complaints, summarises the underlying problem per cluster, and tags industry and keywords from the text itself.",
  },
  {
    icon: LineChart,
    title: "Each opportunity, scored",
    text: "Every opportunity gets a 0–100 score from how often the pain appears, how urgent it sounds, and how clearly the AI identified it. No invented market stats.",
  },
  {
    icon: Target,
    title: "Start from a real problem",
    text: "Browse ranked opportunities, inspect the complaints behind each one, and save the ideas worth pursuing before you write any code.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            From scattered frustrations to ranked opportunities
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