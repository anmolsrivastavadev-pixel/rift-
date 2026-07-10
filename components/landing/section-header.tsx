import type { LucideIcon } from "lucide-react";

/* Section header pattern shared across the landing page: a centered pill
 * badge, then a bold headline on the left and a muted lead paragraph on the
 * right (stacks on mobile). The headline accepts JSX so one phrase can be
 * highlighted in the primary blue.
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
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {badge}
        </span>
      </div>
      <div className="mt-8 grid items-end gap-4 md:grid-cols-2 md:gap-10">
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
