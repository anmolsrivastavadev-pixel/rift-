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
  const [rows, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.complaint.count({ where }),
  ]);

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextPage > 1) params.set("page", String(nextPage));
    const suffix = params.toString();
    return projectHref(`/dashboard/complaints${suffix ? `?${suffix}` : ""}`, projectId);
  };

  return (
    <div className="space-y-4">
      <ComplaintSearch initial={query} />
      <PaginationSummary
        start={start}
        end={end}
        total={total}
        page={page}
        hasNext={page * PAGE_SIZE < total}
        prevHref={pageHref(page - 1)}
        nextHref={pageHref(page + 1)}
      />
      <ComplaintsTable rows={rows} hasQuery={Boolean(query)} />
      <PaginationSummary
        start={start}
        end={end}
        total={total}
        page={page}
        hasNext={page * PAGE_SIZE < total}
        prevHref={pageHref(page - 1)}
        nextHref={pageHref(page + 1)}
      />
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
    "rounded-[12px] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]";
  const disabledClass =
    "rounded-[12px] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] opacity-50";

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
