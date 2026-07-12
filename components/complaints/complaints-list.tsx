import Link from "next/link";
import type { Prisma } from "@/lib/generated/prisma/client";

import { prisma } from "@/lib/db";
import { ComplaintsTable } from "@/components/complaints/complaints-table";
import { ComplaintSearch } from "@/components/complaints/complaint-search";
import { requireUser } from "@/lib/auth/current-user";
import { projectHref } from "@/lib/projects";

const PAGE_SIZE = 100;

export async function ComplaintsList({
  query,
  page,
  projectId,
}: {
  query: string;
  page: number;
  projectId: string;
}) {
  const user = await requireUser();
  const where = {
    userId: user.id,
    projectId,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { body: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  } satisfies Prisma.ComplaintWhereInput;
  const [initialRows, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      // id is the tiebreaker, not decoration: a CSV chunk is one transaction,
      // so up to 500 rows share an identical createdAt. Sorting on the
      // timestamp alone leaves their relative order undefined per query, and
      // the page-1 and page-2 queries could each pick a different order —
      // showing the same complaint twice and hiding another entirely.
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.complaint.count({ where }),
  ]);

  // A stale bookmark or hand-edited ?page= beyond the last page would show
  // "Showing 9,801-150 of 150" over an empty table — clamp to the last page
  // and refetch (rare path) instead.
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const effectivePage = Math.min(page, lastPage);
  const rows =
    effectivePage === page
      ? initialRows
      : await prisma.complaint.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (effectivePage - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        });

  const start = total === 0 ? 0 : (effectivePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(effectivePage * PAGE_SIZE, total);
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextPage > 1) params.set("page", String(nextPage));
    const suffix = params.toString();
    return projectHref(`/dashboard/complaints${suffix ? `?${suffix}` : ""}`, projectId);
  };

  // A brand-new project has nothing to search or paginate — show only the
  // empty-state card instead of chrome around an empty table.
  if (total === 0 && !query) {
    return <ComplaintsTable rows={rows} hasQuery={false} />;
  }

  return (
    <div className="space-y-4">
      <ComplaintSearch initial={query} />
      <PaginationSummary
        start={start}
        end={end}
        total={total}
        page={effectivePage}
        hasNext={effectivePage * PAGE_SIZE < total}
        prevHref={pageHref(effectivePage - 1)}
        nextHref={pageHref(effectivePage + 1)}
      />
      <ComplaintsTable rows={rows} hasQuery={Boolean(query)} />
      {total > PAGE_SIZE && (
        <PaginationSummary
          start={start}
          end={end}
          total={total}
          page={effectivePage}
          hasNext={effectivePage * PAGE_SIZE < total}
          prevHref={pageHref(effectivePage - 1)}
          nextHref={pageHref(effectivePage + 1)}
        />
      )}
    </div>
  );
}

function PaginationSummary({
  start,
  end,
  total,
  page,
  hasNext,
  prevHref,
  nextHref,
}: {
  start: number;
  end: number;
  total: number;
  page: number;
  hasNext: boolean;
  prevHref: string;
  nextHref: string;
}) {
  const linkClass =
    "rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]";
  const disabledClass =
    "rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] opacity-50";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted-foreground)]">
      <p>
        Showing {start.toLocaleString()}-{end.toLocaleString()} of {total.toLocaleString()} complaints
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={prevHref} className={linkClass}>Previous</Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">Previous</span>
        )}
        {hasNext ? (
          <Link href={nextHref} className={linkClass}>Next</Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">Next</span>
        )}
      </div>
    </div>
  );
}
