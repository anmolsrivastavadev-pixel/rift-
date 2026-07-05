import Link from "next/link";
import { Target, Users, Bookmark, Trophy, Briefcase } from "lucide-react";

import { prisma } from "@/lib/db";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  ComplaintsChart,
  type DayBucket,
} from "@/components/dashboard/complaints-chart";
import {
  FounderCommandClient,
  type DecisionCounts,
} from "@/components/dashboard/founder-command-client";
import { isValidDecisionStatus } from "@/lib/decision-board";
import { ProjectHistory } from "@/components/dashboard/project-history";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { ExportButtons } from "@/components/reports/export-buttons";
import type { DashboardStats } from "@/lib/dashboard-plan";
import { requireUser } from "@/lib/auth/current-user";
import { getProjectOrDefault, projectHref } from "@/lib/projects";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function bucketByDay(rows: { sourceDate: Date | null }[]): DayBucket[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = r.sourceDate ?? new Date();
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const user = await requireUser();
  const project = await getProjectOrDefault(
    firstParam((await searchParams).projectId),
    user
  );
  const [
    complaintCount,
    recent,
    dated,
    opportunityCount,
    savedCount,
    topOpportunity,
    topOpportunities,
    opportunityIds,
  ] = await Promise.all([
    prisma.complaint.count({ where: { userId: user.id, projectId: project.id } }),
    prisma.complaint.findMany({
      where: { userId: user.id, projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, body: true, createdAt: true },
    }),
    prisma.complaint.findMany({
      where: { userId: user.id, projectId: project.id, sourceDate: { not: null } },
      select: { sourceDate: true },
    }),
    prisma.opportunity.count({ where: { userId: user.id, projectId: project.id } }),
    prisma.savedOpportunity.count({ where: { userId: user.id, projectId: project.id } }),
    prisma.opportunity.aggregate({
      _max: { opportunityScore: true },
      where: { userId: user.id, projectId: project.id },
    }),
    prisma.opportunity.findMany({
      where: { userId: user.id, projectId: project.id },
      orderBy: { opportunityScore: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        summary: true,
        industry: true,
        opportunityScore: true,
        mentions: true,
      },
    }),
    prisma.opportunity.findMany({
      where: { userId: user.id, projectId: project.id },
      orderBy: { opportunityScore: "desc" },
      take: 100,
      select: { id: true },
    }),
  ]);

  const highestScore = topOpportunity._max.opportunityScore ?? null;
  const buckets = bucketByDay(dated);

  const stats: DashboardStats = {
    complaintCount,
    opportunityCount,
    savedCount,
    highestScore,
  };

  // M16C — decision counts come from the database (per user, per project), so
  // the Founder Command Center shows the same summary on every device.
  // M16D — recent import + AI run history for this project.
  const ids = opportunityIds.map((o) => o.id);
  const [workspaces, recentImports, recentRuns] = await Promise.all([
    ids.length
      ? prisma.validationWorkspace.findMany({
          where: { userId: user.id, opportunityId: { in: ids } },
          select: { decisionStatus: true, validationChecklist: true },
        })
      : Promise.resolve([]),
    prisma.complaintImport.findMany({
      where: { userId: user.id, projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        sourceType: true,
        label: true,
        complaintCount: true,
        createdAt: true,
      },
    }),
    prisma.aIRun.findMany({
      where: { userId: user.id, projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        inputComplaintCount: true,
        outputOpportunityCount: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
  ]);
  const decisionCounts: DecisionCounts = { pursue: 0, park: 0, reject: 0, undecided: 0 };
  for (const w of workspaces) {
    if (isValidDecisionStatus(w.decisionStatus) && w.decisionStatus !== "undecided") {
      decisionCounts[w.decisionStatus]++;
    }
  }
  decisionCounts.undecided =
    ids.length - decisionCounts.pursue - decisionCounts.park - decisionCounts.reject;

  // M17 — onboarding progress inferred from existing data: any decision,
  // saved idea, or ticked checklist item counts as testing progress.
  const decided = decisionCounts.pursue + decisionCounts.park + decisionCounts.reject;
  const hasChecklistProgress = workspaces.some(
    (w) => Array.isArray(w.validationChecklist) && w.validationChecklist.some(Boolean)
  );
  const hasTestingProgress = decided > 0 || savedCount > 0 || hasChecklistProgress;

  const projectId = project.id;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Home
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Project: <span className="font-medium text-[var(--color-foreground)]">{project.name}</span>
          </p>
        </div>
        {/* M18 — private Markdown export for this project */}
        <ExportButtons
          kind="project"
          targetId={projectId}
          exportLabel="Export report"
          copyLabel="Copy report"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Complaints loaded"
          value={complaintCount.toLocaleString()}
          hint={complaintCount > 0 ? "Ready to use" : "None yet"}
        />
        <StatCard
          icon={Target}
          label="Ideas found"
          value={opportunityCount.toLocaleString()}
          hint={opportunityCount > 0 ? "Ready to review" : "Find ideas →"}
        />
        <StatCard
          icon={Bookmark}
          label="Saved ideas"
          value={savedCount.toLocaleString()}
          hint={savedCount > 0 ? "Bookmarked" : "None saved"}
        />
        <StatCard
          icon={Trophy}
          label="Highest score"
          value={highestScore !== null ? highestScore.toString() : "—"}
          hint="Opportunity score (0–100)"
        />
      </div>

      {/* M17 — first-run onboarding: one card, one clear next action.
          Replaces the old pair of dashed empty-state blocks. Hidden once the
          user has complaints, ideas, and any testing progress. */}
      <OnboardingCard
        state={{ complaintCount, opportunityCount, hasTestingProgress }}
        projectId={projectId}
      />

      {/* Workflow + next action + decision snapshot (DB-backed since M16C) */}
      <FounderCommandClient
        stats={stats}
        decisionCounts={decisionCounts}
        projectId={projectId}
      />

      {/* M16D — what data was added + when ideas were generated */}
      <ProjectHistory imports={recentImports} runs={recentRuns} />

      {/* High-signal opportunities (only when they exist) */}
      {topOpportunities.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">High-signal opportunities</h2>
            <Link
              href={projectHref("/dashboard/opportunities", projectId)}
              className="text-sm text-[var(--color-primary)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)]/70"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topOpportunities.map((o) => (
              <Link
                key={o.id}
                href={projectHref(`/dashboard/opportunities/${o.id}`, projectId)}
                className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),0_1px_2px_-1px_rgb(0_0_0/_0.06)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:shadow-[0_4px_12px_0_rgb(0_0_0/_0.06),0_2px_4px_-2px_rgb(0_0_0/_0.04)]"
              >
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  <Briefcase className="h-3 w-3" />
                  {o.industry}
                </div>
                <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-[var(--color-primary)]">
                  {o.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted-foreground)]">
                  {o.summary}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-2">
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                    <Users className="h-3 w-3" /> {o.mentions} complaints
                  </span>
                  <span className="text-lg font-bold text-[var(--color-primary)]">
                    {o.opportunityScore}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Complaints over time chart (keep existing) */}
      {complaintCount > 0 && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
          <h2 className="text-base font-semibold">Complaints over time</h2>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Bucketed by source date when available; falls back to import date.
          </p>
          <div className="mt-4">
            <ComplaintsChart data={buckets} />
          </div>
        </section>
      )}

      {/* Recent complaints (keep existing, only when complaints exist) */}
      {complaintCount > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent complaints</h2>
            <Link
              href={projectHref("/dashboard/complaints", projectId)}
              className="text-sm text-[var(--color-primary)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)]/70"
            >
              View all &rarr;
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
              No complaints found.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {recent.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)] transition-all duration-150 ease-out hover:shadow-[0_4px_12px_0_rgb(0_0_0_/_0.06),0_2px_4px_-2px_rgb(0_0_0_/_0.04)]"
                >
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-muted-foreground)]">
                    {c.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
