import { ChevronRight, Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type Row = {
  id: string;
  title: string;
  body: string;
  sourceDate: Date | null;
  sentiment: number | null;
  severity: number | null;
  createdAt: Date;
};

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function sentimentLabel(s: number | null): {
  text: string;
  variant: "default" | "success" | "warning" | "danger";
} {
  // Unscored (fresh import) is a quiet neutral dash — amber read as "broken".
  if (s === null) return { text: "—", variant: "default" };
  if (s <= -0.4) return { text: "Negative", variant: "danger" };
  // Neutral is normal data, not a warning state.
  if (s < 0.2) return { text: "Neutral", variant: "default" };
  return { text: "Positive", variant: "success" };
}

export function ComplaintsTable({
  rows,
  hasQuery = false,
}: {
  rows: Row[];
  hasQuery?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Inbox className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-medium text-[var(--color-foreground)]">
          {hasQuery ? "No matching complaints" : "No complaints yet"}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {hasQuery ? "Try a different search term." : "Add data above to get started."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--color-border)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)] text-left text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Source date</th>
              <th className="px-4 py-3 font-medium">Sentiment</th>
              <th
                className="px-4 py-3 font-medium"
                title="How painful the complaint sounds, when scored"
              >
                Severity
              </th>
              <th className="px-4 py-3 font-medium">Added</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = sentimentLabel(r.sentiment);
              return (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-card)]"
                >
                  <td className="max-w-md px-4 py-3">
                    {/* Zero-JS expand: click the row title to read the full
                        complaint instead of a permanently clamped preview. */}
                    <details className="group/row">
                      {/* summary only allows phrasing content — spans, not p */}
                      <summary
                        className="flex cursor-pointer list-none items-start gap-1.5 marker:content-none [&::-webkit-details-marker]:hidden"
                        title="Show full complaint"
                      >
                        <ChevronRight
                          className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 ease-out group-open/row:rotate-90"
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {r.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[var(--color-muted-foreground)] group-open/row:hidden">
                            {r.body}
                          </span>
                        </span>
                      </summary>
                      <p className="mt-1 whitespace-pre-wrap pl-5 text-xs leading-relaxed text-[var(--color-foreground)]/90">
                        {r.body}
                      </p>
                    </details>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted-foreground)]">
                    {fmtDate(r.sourceDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={s.variant}
                      className={s.variant === "default" ? "text-[var(--color-muted-foreground)]" : undefined}
                    >
                      {s.text}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {r.severity !== null ? r.severity.toFixed(0) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted-foreground)]">
                    {fmtDate(r.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
