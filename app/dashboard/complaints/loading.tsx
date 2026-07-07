export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8" aria-busy="true">
      <div className="h-8 w-48 animate-shimmer rounded-lg border border-[var(--color-border)]" />
      <div className="h-40 w-full animate-shimmer rounded-2xl border border-[var(--color-border)]" />
      <div className="h-64 w-full animate-shimmer rounded-2xl border border-[var(--color-border)]" />
    </div>
  );
}
