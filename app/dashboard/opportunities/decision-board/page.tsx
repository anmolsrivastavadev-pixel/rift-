import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import {
  DecisionBoardClient,
  type DecisionBoardOpportunity,
} from "@/components/opportunities/decision-board-client";
import { requireUser } from "@/lib/auth/current-user";
import { getProjectOrDefault, projectHref } from "@/lib/projects";
import { isValidDecisionStatus, type DecisionStatus } from "@/lib/decision-board";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/* M34 — this route is compare-only: it renders the 2–3 ideas named in
 * `?compare=id,id`. Without a compare selection there is nothing to show
 * here any more (the old standalone decisions board was folded into the
 * Ideas page's decision filter), so it redirects back to Ideas. */
export default async function DecisionBoardPage({
  searchParams,
}: {
  searchParams: Promise<{
    compare?: string | string[];
    projectId?: string | string[];
    from?: string | string[];
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const project = await getProjectOrDefault(firstParam(params.projectId), user);
  // Arrived from the Saved page? Point the back link there instead of Ideas.
  const fromSaved = firstParam(params.from) === "saved";

  const compareIds = (firstParam(params.compare) ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (compareIds.length === 0) {
    redirect(projectHref("/dashboard/opportunities", project.id));
  }

  // Fetch exactly the selected ideas, scoped to the owner + project. Foreign
  // or deleted ids simply don't match and the client renders its empty state.
  const ops = await prisma.opportunity.findMany({
    where: { userId: user.id, projectId: project.id, id: { in: compareIds } },
    orderBy: { opportunityScore: "desc" },
  });

  // M16C — load saved decision statuses for these opportunities from the DB.
  const workspaces = await prisma.validationWorkspace.findMany({
    where: {
      userId: user.id,
      opportunityId: { in: ops.map((o) => o.id) },
    },
    select: { opportunityId: true, decisionStatus: true },
  });
  const initialStatuses: Record<string, DecisionStatus> = {};
  for (const w of workspaces) {
    if (isValidDecisionStatus(w.decisionStatus)) {
      initialStatuses[w.opportunityId] = w.decisionStatus;
    }
  }

  const opportunities: DecisionBoardOpportunity[] = ops.map((o) => ({
    id: o.id,
    title: o.title,
    summary: o.summary,
    industry: o.industry,
    opportunityScore: o.opportunityScore,
    mentions: o.mentions,
    severity: o.severity,
    confidence: o.confidence,
    suggestedSoftware: o.suggestedSoftware,
    targetCustomer: o.targetCustomer,
    productAngle: o.productAngle,
    validationQuestions: o.validationQuestions,
    riskFlags: o.riskFlags,
    createdAt: o.createdAt,
  }));

  return (
    <DecisionBoardClient
      // Remount when the project changes so client state (statuses seeded
      // from the server) never carries over from another project.
      key={project.id}
      opportunities={opportunities}
      projectId={project.id}
      initialStatuses={initialStatuses}
      backHref={fromSaved ? "/dashboard/saved" : undefined}
      backLabel={fromSaved ? "Back to saved ideas" : undefined}
    />
  );
}
