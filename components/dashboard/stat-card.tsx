import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: IconType;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)] transition-all duration-150 ease-out hover:shadow-[0_4px_12px_0_rgb(0_0_0_/_0.06),0_2px_4px_-2px_rgb(0_0_0_/_0.04)]",
        className
      )}
    >
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
        <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-foreground)]">{value}</p>
      {hint && (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      )}
    </div>
  );
}