import { prisma } from "@/lib/db";
import {
  DecisionBoardClient,
  type DecisionBoardOpportunity,
} from "@/components/opportunities/decision-board-client";

export default async function DecisionBoardPage() {
  const ops = await prisma.opportunity.findMany({
    orderBy: { opportunityScore: "desc" },
    take: 100,
  });

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

  return <DecisionBoardClient opportunities={opportunities} />;
}
