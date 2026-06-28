export default function LoadingOpportunityDetail() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-[var(--color-card)]" />
      <div className="h-28 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
      <div className="h-12 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="h-24 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
          <div className="h-32 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
          <div className="h-40 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
        </div>
        <div className="space-y-4">
          <div className="h-28 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
          <div className="h-20 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
          <div className="h-20 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
        </div>
      </div>
    </div>
  );
}