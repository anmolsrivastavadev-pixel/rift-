import { Suspense } from "react";
import { ChevronDown } from "lucide-react";

import { ComplaintsInput } from "@/components/complaints/complaints-input";
import { ComplaintsList } from "@/components/complaints/complaints-list";
import {
  NicheWatchPanel,
  type NicheWatchItem,
} from "@/components/complaints/niche-watch-panel";
import { StartFreshButton } from "@/components/complaints/start-fresh-button";
import { StarterMarkets } from "@/components/complaints/starter-markets";
import { prisma } from "@/lib/db";
import { isEmailEnabled } from "@/lib/email";
import { requireUser } from "@/lib/auth/current-user";
import { getProjectOrDefault } from "@/lib/projects";
import { getEffectivePlan } from "@/lib/quotas";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; projectId?: string | string[] }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const project = await getProjectOrDefault(firstParam(sp.projectId), user);
  const query = firstParam(sp.q) ?? "";

  // M31c — this project's niche watches + the user's active-watch usage.
  const [watchRows, activeWatchCount, { plan, limits }] = await Promise.all([
    prisma.nicheWatch.findMany({
      where: { userId: user.id, projectId: project.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.nicheWatch.count({ where: { userId: user.id, pausedAt: null } }),
    getEffectivePlan(user),
  ]);
  const watches: NicheWatchItem[] = watchRows.map((w) => ({
    id: w.id,
    keyword: w.keyword,
    paused: w.pausedAt !== null,
    lastRunAt: w.lastRunAt,
    lastRunStatus: w.lastRunStatus,
    lastRunInserted: w.lastRunInserted,
  }));
  const watchUsageLine =
    plan === "free"
      ? `${activeWatchCount} of ${limits.maxActiveWatches} free niche watch${limits.maxActiveWatches === 1 ? "" : "es"} used.`
      : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Complaints</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Add real complaints, reviews, or support messages. Rift will look for
          repeated problems.
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Project: <span className="font-medium text-[var(--color-foreground)]">{project.name}</span>
        </p>
      </div>

      <section>
        <h2 className="text-base font-semibold">Add data</h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Type a niche to find complaints online, or paste your own.
        </p>
        <div className="mt-3">
          <ComplaintsInput projectId={project.id} />
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">Watch a niche weekly</h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Rift keeps looking for new complaints while you do other things.
        </p>
        <div className="mt-3">
          <NicheWatchPanel
            projectId={project.id}
            watches={watches}
            usageLine={watchUsageLine}
            emailEnabled={isEmailEnabled()}
          />
        </div>
      </section>

      <details className="group rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <summary className="flex cursor-pointer select-none list-none items-center justify-between text-sm font-semibold text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
          Need examples?
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 ease-out group-open:rotate-180" />
        </summary>
        <div className="mt-4">
          <StarterMarkets projectId={project.id} />
        </div>
      </details>

      <details className="group rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <summary className="flex cursor-pointer select-none list-none items-center justify-between text-sm font-semibold text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
          What should I paste?
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 ease-out group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-3 text-sm text-[var(--color-muted-foreground)]">
          <p>Paste real frustrations: reviews, support tickets, forum posts, sales notes, or interview notes.</p>
          <p>Look for repeated problems, not random opinions. Do not include private personal information.</p>
        </div>
      </details>

      <details className="group rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <summary className="flex cursor-pointer select-none list-none items-center justify-between text-sm font-semibold text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
          Start fresh
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 ease-out group-open:rotate-180" />
        </summary>
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          Clear this project before testing a different market.
        </p>
        <div className="mt-3">
          <StartFreshButton projectId={project.id} />
        </div>
      </details>

      <section>
        <h2 className="text-base font-semibold">All complaints</h2>
        <div className="mt-3">
          <Suspense fallback={<ComplaintsSkeleton />}>
            <ComplaintsList query={query} projectId={project.id} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

function ComplaintsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full max-w-sm animate-pulse rounded-[12px] bg-[var(--color-card)]" />
      <div className="h-64 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
    </div>
  );
}
