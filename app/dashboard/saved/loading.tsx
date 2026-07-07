/* Route-level skeleton for Saved ideas: header + card grid. */
export default function SavedLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8" aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-shimmer rounded-lg border border-[var(--color-border)]" />
        <div className="h-4 w-72 animate-shimmer rounded-lg border border-[var(--color-border)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-shimmer rounded-2xl border border-[var(--color-border)]"
          />
        ))}
      </div>
    </div>
  );
}
