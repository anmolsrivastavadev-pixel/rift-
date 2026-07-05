import Link from "next/link";
import { LayoutGrid } from "lucide-react";

import { prisma } from "@/lib/db";
import { RunOpportunitiesButton } from "@/components/opportunities/run-button";
import { OpportunityBrowser } from "@/components/opportunities/opportunity-browser";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/current-user";
import { getProjectOrDefault, projectHref } from "@/lib/projects";
import { getUsageSummary } from "@/lib/quotas";

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
  const [ops, savedRows, complaintCount, usage] = await Promise.all([
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
  ]);

  const savedSet = new Set(savedRows.map((s) => s.opportunityId));

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
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Business Ideas</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Review ideas found from this project’s complaints.
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Project: <span className="font-medium text-[var(--color-foreground)]">{project.name}</span>
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={projectHref("/dashboard/opportunities/decision-board", project.id)}>
            <LayoutGrid className="h-4 w-4" /> Compare Ideas
          </Link>
        </Button>
      </div>

      {/* M17 — one clear next step per state: no complaints → add them first;
          no ideas yet → prominent Find ideas; ideas exist → quiet rerun. */}
      {complaintCount === 0 ? (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
          <h2 className="text-base font-semibold">Add complaints first</h2>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Add complaints to find business ideas.
          </p>
          <Button asChild className="mt-4">
            <Link href={projectHref("/dashboard/complaints", project.id)}>
              Add complaints
            </Link>
          </Button>
        </section>
      ) : ops.length === 0 ? (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
          <h2 className="text-base font-semibold">Find ideas</h2>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Rift will use {complaintCount} complaint{complaintCount === 1 ? "" : "s"} from
            this project.
          </p>
          <div className="mt-4">
            <RunOpportunitiesButton projectId={project.id} />
            {usageLine}
          </div>
        </section>
      ) : (
        <details className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/60 p-5">
          <summary className="cursor-pointer text-sm font-semibold">Run again</summary>
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            Replaces the current ideas. Rift will use {complaintCount} complaint
            {complaintCount === 1 ? "" : "s"} from this project.
          </p>
          <div className="mt-4">
            <RunOpportunitiesButton projectId={project.id} />
            {usageLine}
          </div>
        </details>
      )}

      <OpportunityBrowser opportunities={cards} projectId={project.id} />
    </div>
  );
}
