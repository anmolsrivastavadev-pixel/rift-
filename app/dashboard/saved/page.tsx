import { prisma } from "@/lib/db";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { NoSavedEmpty } from "@/components/opportunities/empty-states";
import { requireUser } from "@/lib/auth/current-user";
import { getProjectOrDefault } from "@/lib/projects";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const user = await requireUser();
  const project = await getProjectOrDefault(
    firstParam((await searchParams).projectId),
    user
  );
  const saved = await prisma.savedOpportunity.findMany({
    where: {
      userId: user.id,
      projectId: project.id,
      opportunity: { is: { userId: user.id, projectId: project.id } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      opportunity: true,
    },
  });

  const cards = saved
    .filter(
      (s) =>
        s.opportunity != null &&
        s.opportunity.userId === user.id &&
        s.opportunity.projectId === project.id
    )
    .map((s) => ({
      id: s.opportunity.id,
      title: s.opportunity.title,
      summary: s.opportunity.summary,
      industry: s.opportunity.industry,
      opportunityScore: s.opportunity.opportunityScore,
      mentions: s.opportunity.mentions,
      severity: s.opportunity.severity,
      confidence: s.opportunity.confidence,
      keywords: s.opportunity.keywords,
      suggestedSoftware: s.opportunity.suggestedSoftware,
      targetCustomer: s.opportunity.targetCustomer,
      productAngle: s.opportunity.productAngle,
      createdAt: s.opportunity.createdAt,
      saved: true,
    }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saved Ideas</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Ideas you have bookmarked to revisit later.
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Project: <span className="font-medium text-[var(--color-foreground)]">{project.name}</span>
        </p>
      </div>

      {cards.length === 0 ? (
        <NoSavedEmpty projectId={project.id} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((op) => (
            <OpportunityCard key={op.id} op={op} projectId={project.id} />
          ))}
        </div>
      )}
    </div>
  );
}
