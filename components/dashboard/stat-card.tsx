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
        "rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {Icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {hint}
        </p>
      )}
    </div>
  );
}