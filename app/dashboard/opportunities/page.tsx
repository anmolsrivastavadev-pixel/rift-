import { prisma } from "@/lib/db";
import { RunOpportunitiesButton } from "@/components/opportunities/run-button";
import { OpportunityBrowser } from "@/components/opportunities/opportunity-browser";

export default async function OpportunitiesPage() {
  const [ops, complaintCount, savedRows] = await Promise.all([
    prisma.opportunity.findMany({
      orderBy: { opportunityScore: "desc" },
      take: 100,
    }),
    prisma.complaint.count(),
    prisma.savedOpportunity.findMany({ select: { opportunityId: true } }),
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
    createdAt: o.createdAt,
    saved: savedSet.has(o.id),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {complaintCount} complaint{complaintCount === 1 ? "" : "s"} in this
            workspace analysed into {ops.length} opportunit
            {ops.length === 1 ? "y" : "ies"}.
          </p>
        </div>
      </div>

      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="text-base font-semibold">AI engine</h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Run Gemini to cluster the {complaintCount} complaint
          {complaintCount === 1 ? "" : "s"} in this workspace into scored
          startup opportunities. Each run replaces the existing opportunities.
        </p>
        <div className="mt-4">
          <RunOpportunitiesButton />
        </div>
      </section>

      <OpportunityBrowser opportunities={cards} />
    </div>
  );
}