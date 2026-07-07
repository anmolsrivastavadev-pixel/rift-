/* Route-level skeleton for Compare Ideas: header, summary tiles, cards. */
export default function CompareIdeasLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8" aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-shimmer rounded-lg border border-[var(--color-border)]" />
        <div className="h-4 w-80 animate-shimmer rounded-lg border border-[var(--color-border)]" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-shimmer rounded-xl border border-[var(--color-border)]"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-56 animate-shimmer rounded-2xl border border-[var(--color-border)]"
          />
        ))}
      </div>
    </div>
  );
}
