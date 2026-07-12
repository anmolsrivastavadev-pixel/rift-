import type { LucideIcon } from "lucide-react";

/* Section header pattern shared across the landing page: a short
 * sentence-case kicker in Signal Blue (the Plain Words Rule: no uppercase
 * tracking, no pill chrome), then a bold headline on the left and a muted
 * lead paragraph on the right (stacks on mobile). The headline accepts JSX
 * so one phrase can be highlighted in the primary blue.
 */
export function SectionHeader({
  icon: Icon,
  badge,
  heading,
  lead,
}: {
  icon: LucideIcon;
  badge: string;
  heading: React.ReactNode;
  lead: string;
}) {
  return (
    <div>
      <p className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
        <Icon className="h-4 w-4" aria-hidden />
        {badge}
      </p>
      <div className="mt-6 grid items-end gap-4 md:grid-cols-2 md:gap-10">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
          {heading}
        </h2>
        <p className="text-[var(--color-muted-foreground)] leading-relaxed md:max-w-md md:justify-self-end">
          {lead}
        </p>
      </div>
    </div>
  );
}
