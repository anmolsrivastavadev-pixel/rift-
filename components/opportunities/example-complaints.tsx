import { MessageSquareOff } from "lucide-react";

import { ComplaintBody } from "@/components/opportunities/complaint-body";
import { ExternalLink } from "@/components/ui/external-link";
import {
  buildReceiptHint,
  buildReceiptHref,
  buildReceiptLabel,
} from "@/lib/complaint-sources";

export type LinkedComplaint = {
  id: string;
  title: string;
  body: string;
  sourceDate: Date | null;
  createdAt: Date;
  // M31a — receipt: original post/page URL for finder-sourced complaints.
  sourceUrl: string | null;
  sourceKind: string | null;
};

/* Example complaints list. Per spec:
 *   - up to 5
 *   - ordered by createdAt ASCENDING (oldest first, deterministic)
 *   - preserve original wording
 *   - truncate only if > 500 chars (handled client-side with Show more / less)
 */
export function ExampleComplaints({ items }: { items: LinkedComplaint[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--color-muted-foreground)]/10 text-[var(--color-muted-foreground)]">
          <MessageSquareOff className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-sm font-semibold">No linked complaints</h3>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          This opportunity was not linked to any specific complaint by the AI.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((c, i) => (
        <li
          key={c.id}
          className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-shadow duration-150 ease-out hover:shadow-sm"
        >
          <p className="truncate text-sm font-medium">
            {c.title.trim() !== "" ? c.title : `Complaint ${i + 1}`}
          </p>
          <ComplaintBody body={c.body} />
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
            <span>
              {c.sourceDate
                ? c.sourceDate.toLocaleDateString()
                : c.createdAt.toLocaleDateString()}
            </span>
            {(() => {
              const label = buildReceiptLabel(c.sourceKind, c.sourceUrl);
              const href = buildReceiptHref(c.sourceKind, c.sourceUrl);
              return label && href ? (
                <>
                  <span aria-hidden="true">·</span>
                  <ExternalLink href={href}>{label}</ExternalLink>
                </>
              ) : null;
            })()}
          </p>
          {buildReceiptHref(c.sourceKind, c.sourceUrl) && (
            (() => {
              const hint = buildReceiptHint(c.sourceKind, c.title);
              return hint ? (
                <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
                  {hint}
                </p>
              ) : null;
            })()
          )}
        </li>
      ))}
    </ul>
  );
}