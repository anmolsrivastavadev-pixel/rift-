/* Route-level skeleton for the dashboard home, so navigation shows an
 * immediate response instead of a frozen screen. Mirrors the page's shape:
 * header, guidance card, stat row, content cards. */
export default function DashboardHomeLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8" aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-shimmer rounded-lg border border-[var(--color-border)]" />
        <div className="h-4 w-40 animate-shimmer rounded-lg border border-[var(--color-border)]" />
      </div>
      <div className="h-36 animate-shimmer rounded-2xl border border-[var(--color-border)]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-shimmer rounded-2xl border border-[var(--color-border)]"
          />
        ))}
      </div>
      <div className="h-64 animate-shimmer rounded-2xl border border-[var(--color-border)]" />
    </div>
  );
}
