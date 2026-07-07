export default function LoadingOpportunityDetail() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy="true">
      <div className="h-8 w-40 animate-shimmer rounded-lg border border-[var(--color-border)]" />
      <div className="h-28 w-full animate-shimmer rounded-2xl border border-[var(--color-border)]" />
      <div className="h-12 w-full animate-shimmer rounded-xl border border-[var(--color-border)]" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <div className="h-24 w-full animate-shimmer rounded-2xl border border-[var(--color-border)]" />
          <div className="h-32 w-full animate-shimmer rounded-2xl border border-[var(--color-border)]" />
          <div className="h-40 w-full animate-shimmer rounded-2xl border border-[var(--color-border)]" />
        </div>
        <div className="space-y-4">
          <div className="h-28 w-full animate-shimmer rounded-2xl border border-[var(--color-border)]" />
          <div className="h-20 w-full animate-shimmer rounded-2xl border border-[var(--color-border)]" />
          <div className="h-20 w-full animate-shimmer rounded-2xl border border-[var(--color-border)]" />
        </div>
      </div>
    </div>
  );
}
