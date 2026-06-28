import { Upload, Sparkles, LineChart, Target } from "lucide-react";
import { Container } from "@/components/container";

const features = [
  {
    icon: Upload,
    title: "Upload real complaints",
    text: "Drop a CSV of customer complaints. Rift parses and cleans each row so analysis starts from real data, not guesses.",
  },
  {
    icon: Sparkles,
    title: "AI clustering",
    text: "Gemini groups similar complaints, summarises the underlying problem per cluster, and tags industry and keywords.",
  },
  {
    icon: LineChart,
    title: "Opportunity scoring",
    text: "Each opportunity is scored 0–100 from complaint frequency, sentiment, severity and growth trend — never invented stats.",
  },
  {
    icon: Target,
    title: "Build what people want",
    text: "Compare opportunities, save the ones worth pursuing, and start from a validated problem before you write code.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            From noise to signal in four steps
          </h2>
          <p className="mt-4 text-[var(--color-muted-foreground)]">
            Everything you need to turn scattered customer frustration into a
            ranked list of software opportunities.
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