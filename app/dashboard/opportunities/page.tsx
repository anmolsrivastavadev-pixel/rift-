import Link from "next/link";
import { LayoutGrid, Target, Upload } from "lucide-react";

import { prisma } from "@/lib/db";
import { RunOpportunitiesButton } from "@/components/opportunities/run-button";
import { OpportunityWorkspace } from "@/components/opportunities/opportunity-browser";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/current-user";
import { computePainTrend, PAIN_TREND_LABELS } from "@/lib/pain-trend";
import { getProjectOrDefault, projectHref } from "@/lib/projects";
import { getUsageSummary } from "@/lib/quotas";
import { MAX_COMPLAINTS } from "@/lib/ai";

const DAY_MS = 24 * 60 * 60 * 1000;
const PAIN_TREND_QUERY_DAYS = 365;

// Long idea runs (clustering 1,500 complaints across ~15 Gemini batches) can
// exceed Vercel's default Server Action time limit. The page-level
// `maxDuration` propagates to every Server Action invoked from this segment,
// so `runPipeline` is allowed to run for up to 300s here.
export const maxDuration = 300;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const user = await requireUser();
  const project = await getProjectOrDefault(
    firstParam((await searchParams).projectId),
    user
  );
  const painTrendStart = new Date(new Date().getTime() - PAIN_TREND_QUERY_DAYS * DAY_MS);
  const [ops, savedRows, complaintCount, usage, datedComplaints, runningRun] = await Promise.all([
    prisma.opportunity.findMany({
      where: { userId: user.id, projectId: project.id },
      orderBy: { opportunityScore: "desc" },
      take: 100,
    }),
    prisma.savedOpportunity.findMany({
      where: { userId: user.id, projectId: project.id },
      select: { opportunityId: true },
    }),
    prisma.complaint.count({
      where: { userId: user.id, projectId: project.id },
    }),
    getUsageSummary(user),
    // M31b — dated linked complaints only, one query for every card's pain
    // trend badge (undated rows can't affect the signal, so skip them).
    prisma.complaint.findMany({
      where: {
        userId: user.id,
        projectId: project.id,
        opportunityId: { not: null },
        sourceDate: { not: null, gte: painTrendStart },
      },
      select: { opportunityId: true, sourceDate: true },
    }),
    // An idea run that's still in flight (e.g. the user navigated away
    // mid-run) — the run button reattaches its progress poll to this jobId.
    prisma.aIRun.findFirst({
      where: { userId: user.id, projectId: project.id, status: "running" },
      orderBy: { createdAt: "desc" },
      select: { jobId: true },
    }),
  ]);

  // Display flag only — runPipeline re-checks the quota server-side.
  const quotaExhausted =
    usage.plan === "free" &&
    usage.ideaRunsThisMonth >= usage.limits.ideaRunsPerMonth;
  const resumeJobId = runningRun?.jobId ?? null;

  const savedSet = new Set(savedRows.map((s) => s.opportunityId));

  // M31b — group source dates by idea, compute the display-only trend once
  // per idea, and only pass a label when there is enough dated evidence.
  const datesByOpportunity = new Map<string, Date[]>();
  for (const c of datedComplaints) {
    if (!c.opportunityId || !c.sourceDate) continue;
    const list = datesByOpportunity.get(c.opportunityId) ?? [];
    list.push(c.sourceDate);
    datesByOpportunity.set(c.opportunityId, list);
  }
  const painTrendLabelFor = (opportunityId: string): string | null => {
    const result = computePainTrend(datesByOpportunity.get(opportunityId) ?? []);
    return result.trend === "insufficient" ? null : PAIN_TREND_LABELS[result.trend];
  };

  // M26 — free-plan usage line under the run button. Hidden for pro/admin.
  const usageLine =
    usage.plan === "free" ? (
      <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
        {usage.ideaRunsThisMonth} of {usage.limits.ideaRunsPerMonth} free idea
        runs used this month.{" "}
        <Link href="/pricing" className="underline hover:text-[var(--color-foreground)]">
          See plans
        </Link>
      </p>
    ) : null;

  // Visible cap notice — the clustering pipeline cuts at MAX_COMPLAINTS,
  // quietly preferring the most recent complaints. Surfacing this prevents
  // the surprise of seeing fewer complaints analyzed than the project holds.
  const capNotice =
    complaintCount > MAX_COMPLAINTS ? (
      <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
        Rift analyzes your {MAX_COMPLAINTS.toLocaleString()} most recent
        complaints per run.
      </p>
    ) : null;

  const cards = ops.map((o) => ({
    id: o.id,
    title: o.title,
    summary: o.summary,
    industry: o.industry,
    opportunityScore: o.opportunityScore,
    mentions: o.mentions,
    severity: o.severity,
    confidence: o.confidence,
    keywords: o.keywords,
    suggestedSoftware: o.suggestedSoftware,
    targetCustomer: o.targetCustomer,
    productAngle: o.productAngle,
    createdAt: o.createdAt,
    saved: savedSet.has(o.id),
    painTrendLabel: painTrendLabelFor(o.id),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Business ideas</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            From {complaintCount.toLocaleString()} complaint
            {complaintCount === 1 ? "" : "s"} in{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              {project.name}
            </span>
          </p>
          {ops.length > 0 && usageLine}
        </div>
        {ops.length > 0 && (
          <Button asChild variant="outline">
            <Link href={projectHref("/dashboard/opportunities/decision-board", project.id)}>
              <LayoutGrid className="h-4 w-4" /> Compare ideas
            </Link>
          </Button>
        )}
      </div>

      {/* M17 — one clear next step per state: no complaints → add them first;
          no ideas yet → prominent Find ideas; ideas exist → quiet rerun. */}
      {complaintCount === 0 ? (
        <section className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-12 text-center shadow-[var(--shadow-card)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)]">
            <Upload className="h-6 w-6 text-[var(--color-primary)]" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            Add complaints first
          </h2>
          <p className="mt-1 max-w-md text-sm text-[var(--color-muted-foreground)]">
            Ideas come from real complaints. Add some, then come back to turn
            them into ranked ideas.
          </p>
          <Button asChild className="mt-5">
            <Link href={projectHref("/dashboard/complaints", project.id)}>
              Add complaints
            </Link>
          </Button>
        </section>
      ) : ops.length === 0 ? (
        <section className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-12 text-center shadow-[var(--shadow-card)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)]">
            <Target className="h-6 w-6 text-[var(--color-primary)]" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            Turn {complaintCount.toLocaleString()} complaint
            {complaintCount === 1 ? "" : "s"} into ranked ideas
          </h2>
          <p className="mt-1 max-w-md text-sm text-[var(--color-muted-foreground)]">
            Rift groups the repeated problems in this project and scores each
            idea 0–100.
          </p>
          {capNotice}
          <div className="mt-5 flex flex-col items-center">
            <RunOpportunitiesButton
              projectId={project.id}
              quotaExhausted={quotaExhausted}
              freeRunLimit={usage.limits.ideaRunsPerMonth}
              resumeJobId={resumeJobId}
            />
            {usageLine}
          </div>
        </section>
      ) : (
        <OpportunityWorkspace
          opportunities={cards}
          projectId={project.id}
          complaintCount={complaintCount}
          capNotice={capNotice}
          quotaExhausted={quotaExhausted}
          freeRunLimit={usage.limits.ideaRunsPerMonth}
          resumeJobId={resumeJobId}
        />
      )}
    </div>
  );
}
