import { Layers } from "lucide-react";

/* Empty state for the related-opportunities section. Lucide icon only. */
export function NoRelatedEmpty() {
  return (
    <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--color-muted-foreground)]/10 text-[var(--color-muted-foreground)]">
        <Layers className="h-4 w-4" />
      </div>
      <h3 className="mt-2 text-sm font-semibold">No related opportunities</h3>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        No other opportunities share keywords or industry with this one yet.
      </p>
    </div>
  );
}