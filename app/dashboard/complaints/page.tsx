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

// The complaint-finder action invoked from this page (via the "find" tab) can
// chain Tavily search + Gemini extraction + a Reddit/HN/StackExchange/App
// Store pass — well past Vercel's default Server Action time limit. Give the
// page segment explicit headroom so the finder action isn't killed early.
export const maxDuration = 120;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | string[] | undefined): number {
  const raw = Number(firstParam(value));
  if (!Number.isFinite(raw)) return 1;
  return Math.max(1, Math.floor(raw));
}

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[]; projectId?: string | string[] }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const project = await getProjectOrDefault(firstParam(sp.projectId), user);
  const query = firstParam(sp.q) ?? "";
  const page = parsePage(sp.page);

  // M31c — this project's niche watches + the user's active-watch usage.
  const [watchRows, activeWatchCount, { plan, limits }, complaintCount] =
    await Promise.all([
      prisma.nicheWatch.findMany({
        where: { userId: user.id, projectId: project.id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.nicheWatch.count({ where: { userId: user.id, pausedAt: null } }),
      getEffectivePlan(user),
      prisma.complaint.count({
        where: { userId: user.id, projectId: project.id },
      }),
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
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Complaints</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {complaintCount.toLocaleString()} complaint
          {complaintCount === 1 ? "" : "s"} in{" "}
          <span className="font-medium text-[var(--color-foreground)]">
            {project.name}
          </span>
          . Add real complaints, reviews, or support messages — Rift looks for
          repeated problems.
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
        <details className="group mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <summary className="flex cursor-pointer select-none list-none items-center justify-between text-sm font-semibold text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
            What should I paste?
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 ease-out group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-3 text-sm text-[var(--color-muted-foreground)]">
            <p>Paste real frustrations: reviews, support tickets, forum posts, sales notes, or interview notes.</p>
            <p>Look for repeated problems, not random opinions. Do not include private personal information.</p>
          </div>
        </details>
      </section>

      {/* The user's own data comes right after the input — not below a stack
          of help accordions. */}
      <section>
        <h2 className="text-base font-semibold">
          All complaints
          {complaintCount > 0 && (
            <span className="ml-2 font-normal text-[var(--color-muted-foreground)]">
              ({complaintCount.toLocaleString()})
            </span>
          )}
        </h2>
        <div className="mt-3">
          <Suspense fallback={<ComplaintsSkeleton />}>
            <ComplaintsList query={query} page={page} projectId={project.id} />
          </Suspense>
        </div>
      </section>

      <details className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <summary className="flex cursor-pointer select-none list-none items-center justify-between text-sm font-semibold text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
          <span>
            Watch a niche weekly
            <span className="ml-2 font-normal text-[var(--color-muted-foreground)]">
              · Rift keeps collecting new complaints for you
              {watches.length > 0 &&
                ` (${watches.length} watch${watches.length === 1 ? "" : "es"})`}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 ease-out group-open:rotate-180" />
        </summary>
        <div className="mt-4">
          <NicheWatchPanel
            projectId={project.id}
            watches={watches}
            usageLine={watchUsageLine}
            emailEnabled={isEmailEnabled()}
          />
        </div>
      </details>

      <details className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <summary className="flex cursor-pointer select-none list-none items-center justify-between text-sm font-semibold text-[var(--color-foreground)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
          Need examples?
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 ease-out group-open:rotate-180" />
        </summary>
        <div className="mt-4">
          <StarterMarkets projectId={project.id} />
        </div>
      </details>

      <details className="group rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5">
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
    </div>
  );
}

function ComplaintsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full max-w-sm animate-shimmer rounded-xl border border-[var(--color-border)]" />
      <div className="h-64 w-full animate-shimmer rounded-xl border border-[var(--color-border)]" />
    </div>
  );
}
