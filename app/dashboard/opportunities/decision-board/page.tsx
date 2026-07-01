import { prisma } from "@/lib/db";
import {
  DecisionBoardClient,
  type DecisionBoardOpportunity,
} from "@/components/opportunities/decision-board-client";

export default async function DecisionBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ compare?: string }>;
}) {
  const params = await searchParams;
  const compareParam = params.compare;

  const ops = await prisma.opportunity.findMany({
    orderBy: { opportunityScore: "desc" },
    take: 100,
  });

  let filteredOps = ops;
  let isCompareMode = false;
  let compareIds: string[] = [];

  if (compareParam) {
    compareIds = compareParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (compareIds.length > 0) {
      filteredOps = ops.filter((o) => compareIds.includes(o.id));
      isCompareMode = true;
    }
  }

  const opportunities: DecisionBoardOpportunity[] = filteredOps.map((o) => ({
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
      opportunities={opportunities}
      isCompareMode={isCompareMode}
    />
  );
}
