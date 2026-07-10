import { prisma } from "@/lib/db";
import { NoSavedEmpty } from "@/components/opportunities/empty-states";
import { requireUser } from "@/lib/auth/current-user";
import { getProjectOrDefault } from "@/lib/projects";
import {
  isValidDecisionStatus,
  type DecisionStatus,
} from "@/lib/decision-board";
import { SavedBrowser, type SavedCard } from "./saved-browser";

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

  const validSaved = saved.filter(
    (s) =>
      s.opportunity != null &&
      s.opportunity.userId === user.id &&
      s.opportunity.projectId === project.id
  );

  // Decision statuses for the saved ideas (same pattern as the Decisions
  // board) so each card can show a Pursuing / Parked / Rejected badge.
  const workspaces = await prisma.validationWorkspace.findMany({
    where: {
      userId: user.id,
      opportunityId: { in: validSaved.map((s) => s.opportunity.id) },
    },
    select: { opportunityId: true, decisionStatus: true },
  });
  const statuses: Record<string, DecisionStatus> = {};
  for (const w of workspaces) {
    if (isValidDecisionStatus(w.decisionStatus)) {
      statuses[w.opportunityId] = w.decisionStatus;
    }
  }

  const cards: SavedCard[] = validSaved.map((s) => ({
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
    decisionStatus: statuses[s.opportunity.id] ?? null,
  }));

  // Ideas already marked Pursue lead; everything else keeps its saved order.
  const sortedCards = [...cards].sort(
    (a, b) =>
      (b.decisionStatus === "pursue" ? 1 : 0) -
      (a.decisionStatus === "pursue" ? 1 : 0)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saved ideas</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {sortedCards.length > 0
            ? `Your shortlist in ${project.name} — ${sortedCards.length} saved. Pick 2–3 ideas below to compare them side by side.`
            : `Your shortlist in ${project.name}. Save ideas to compare them side by side later.`}
        </p>
      </div>

      {sortedCards.length === 0 ? (
        <NoSavedEmpty projectId={project.id} />
      ) : (
        <SavedBrowser cards={sortedCards} projectId={project.id} />
      )}
    </div>
  );
}
