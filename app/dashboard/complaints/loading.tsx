export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-card)]" />
      <div className="h-40 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
      <div className="h-64 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
    </div>
  );
}