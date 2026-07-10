/* Route-level skeleton for the Decisions board. Layout-neutral: the real page
 * renders very different layouts (grouped board vs. compare table), so the
 * skeleton only promises a header and one content block. */
export default function DecisionBoardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8" aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-shimmer rounded-lg border border-[var(--color-border)]" />
        <div className="h-4 w-80 animate-shimmer rounded-lg border border-[var(--color-border)]" />
      </div>
      <div className="h-96 animate-shimmer rounded-2xl border border-[var(--color-border)]" />
    </div>
  );
}
