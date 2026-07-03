import Link from "next/link";
import { LayoutGrid } from "lucide-react";

import { prisma } from "@/lib/db";
import { RunOpportunitiesButton } from "@/components/opportunities/run-button";
import { OpportunityBrowser } from "@/components/opportunities/opportunity-browser";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/current-user";

export default async function OpportunitiesPage() {
  const user = await requireUser();
  const [ops, savedRows] = await Promise.all([
    prisma.opportunity.findMany({
      where: { userId: user.id },
      orderBy: { opportunityScore: "desc" },
      take: 100,
    }),
    prisma.savedOpportunity.findMany({ where: { userId: user.id }, select: { opportunityId: true } }),
  ]);

  const savedSet = new Set(savedRows.map((s) => s.opportunityId));

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
            These ideas are generated from patterns in the complaints you added. Scores help sort ideas. A higher score means Rift saw stronger signals in the complaints, but it does not mean the idea is proven.
          </p>
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            Ideas are generated from the complaints currently in this workspace.
            If you used a preset starter pack or typed a custom market name,
            treat the results as inspiration — not proof of demand.
            If you pasted real complaints, treat them as stronger evidence.
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Start by opening one idea with a high score, then check whether the evidence actually makes sense.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/opportunities/decision-board">
            <LayoutGrid className="h-4 w-4" /> Compare Ideas
          </Link>
        </Button>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Not sure which idea to choose? Select 2–3 ideas below and compare them
        side by side.
      </p>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
        <h2 className="text-base font-semibold">Generate business ideas</h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Group the complaints in this workspace into business idea hypotheses based on repeated pain, severity, and confidence.
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Rift generates ideas from all complaints currently in this workspace.
          For a clean test, start fresh on the Complaints page before adding a
          new niche.
        </p>
        <div className="mt-4">
          <RunOpportunitiesButton />
        </div>
      </section>

      <OpportunityBrowser opportunities={cards} />
    </div>
  );
}