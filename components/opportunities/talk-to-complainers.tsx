import { MessagesSquare } from "lucide-react";

import { CopyOutreachButton } from "@/components/opportunities/copy-outreach-button";
import { ExternalLink } from "@/components/ui/external-link";
import { isComplaintSourceKind } from "@/lib/complaint-sources";
import {
  OUTREACH_ETIQUETTE,
  THREAD_SOURCE_LABELS,
} from "@/lib/complainer-outreach";

/* "Talk to the people behind the complaints" (idea detail page). Lists the
 * real threads (M31a receipts) behind this idea so validation becomes a
 * concrete task: open these posts, reply politely. Renders nothing when no
 * linked complaint carries a source URL (CSV/paste-only ideas) — no nagging.
 */

export type ComplainerThread = {
  id: string;
  title: string;
  sourceUrl: string;
  sourceKind: string | null;
  sourceDate: Date | null;
};

export function TalkToComplainers({
  threads,
  outreachMessage,
}: {
  threads: ComplainerThread[];
  outreachMessage: string;
}) {
  if (threads.length === 0) return null;

  return (
    <section>
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <MessagesSquare className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        Talk to the people behind the complaints
      </h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        {OUTREACH_ETIQUETTE}
      </p>
      <ul className="mt-3 space-y-2">
        {threads.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-3"
          >
            <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
            <span className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {t.sourceDate ? t.sourceDate.toLocaleDateString() : ""}
            </span>
            <span className="text-xs">
              <ExternalLink href={t.sourceUrl}>
                {isComplaintSourceKind(t.sourceKind)
                  ? THREAD_SOURCE_LABELS[t.sourceKind]
                  : "Source"}
              </ExternalLink>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <CopyOutreachButton message={outreachMessage} />
      </div>
    </section>
  );
}
