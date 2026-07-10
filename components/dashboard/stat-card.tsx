import Link from "next/link";

import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: IconType;
  /** When set, the whole card becomes a link and gains hover affordance. */
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        {Icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-foreground)]">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {hint}
        </p>
      )}
    </>
  );

  const baseClasses =
    "panel-highlight block rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)] transition-all duration-150 ease-out";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          baseClasses,
          "hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:shadow-[var(--shadow-card-hover)]",
          className
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn(baseClasses, className)}>{body}</div>;
}
