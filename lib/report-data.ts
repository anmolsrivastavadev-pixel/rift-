/* M29 — Shared report data assembly.
 *
 * Extracted verbatim from actions/reports.ts so the Markdown export (M18)
 * and the public share page (M29) render from ONE source of truth. Pure data
 * fetching: no auth, no events, no side effects — callers decide whose
 * userId to query with (the export actions pass the signed-in user; the share
 * page passes the share link OWNER's id) and must do their own access checks
 * first.
 */

import { prisma } from "@/lib/db";
import { computeEvidenceStrength } from "@/lib/evidence-strength";
import { computePainTrend } from "@/lib/pain-trend";
import { isValidDecisionStatus, type DecisionStatus } from "@/lib/decision-board";
import { VALIDATION_CHECKLIST_ITEMS } from "@/lib/validation-plan";
import type { IdeaReportInput, ProjectReportInput } from "@/lib/reports";

export type ProjectReportData = ProjectReportInput & { projectId: string };
export type IdeaReportData = IdeaReportInput & {
  opportunityId: string;
  projectId: string | null;
};

export async function getProjectReportData(
  userId: string,
  projectId: string
): Promise<ProjectReportData | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, name: true },
  });
  if (!project) return null;

  const scoped = { userId, projectId: project.id };
  const [complaintCount, ideaCount, topIdeas, saved, workspaces, imports, runs] =
    await Promise.all([
      prisma.complaint.count({ where: scoped }),
      prisma.opportunity.count({ where: scoped }),
      prisma.opportunity.findMany({
        where: scoped,
        orderBy: { opportunityScore: "desc" },
        take: 5,
        select: {
          title: true,
          opportunityScore: true,
          mentions: true,
          severity: true,
          confidence: true,
          summary: true,
        },
      }),
      prisma.savedOpportunity.findMany({
        where: scoped,
        select: { opportunity: { select: { title: true } } },
      }),
      prisma.validationWorkspace.findMany({
        where: {
          userId,
          projectId: project.id,
          decisionStatus: { not: "undecided" },
        },
        select: {
          decisionStatus: true,
          opportunity: { select: { title: true } },
        },
      }),
      prisma.complaintImport.findMany({
        where: scoped,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { label: true, complaintCount: true, createdAt: true },
      }),
      prisma.aIRun.findMany({
        where: scoped,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          status: true,
          inputComplaintCount: true,
          outputOpportunityCount: true,
          createdAt: true,
        },
      }),
    ]);

  return {
    projectId: project.id,
    projectName: project.name,
    generatedAt: new Date(),
    complaintCount,
    ideaCount,
    savedCount: saved.length,
    topIdeas,
    savedIdeas: saved.map((s) => ({ title: s.opportunity.title })),
    decisions: workspaces
      .filter((w) => isValidDecisionStatus(w.decisionStatus))
      .map((w) => ({
        title: w.opportunity.title,
        status: w.decisionStatus as DecisionStatus,
      })),
    recentImports: imports,
    recentRuns: runs,
  };
}

export async function getIdeaReportData(
  userId: string,
  opportunityId: string
): Promise<IdeaReportData | null> {
  const op = await prisma.opportunity.findFirst({
    where: { id: opportunityId, userId },
    select: {
      id: true,
      title: true,
      summary: true,
      opportunityScore: true,
      scoreBreakdown: true,
      mentions: true,
      severity: true,
      confidence: true,
      reason: true,
      marketGap: true,
      targetCustomer: true,
      projectId: true,
      project: { select: { name: true } },
      complaints: {
        where: { userId },
        orderBy: { createdAt: "asc" },
        take: 5,
        // M31a — receipts are DELIBERATELY included in shared/exported
        // reports: every sourceUrl points at an already-public post, and
        // evidence with links is the point of sharing. title feeds the
        // App Store "look for the review titled…" hint.
        select: { body: true, sourceUrl: true, sourceKind: true, title: true },
      },
    },
  });
  if (!op) return null;

  const [workspace, trendDates] = await Promise.all([
    prisma.validationWorkspace.findUnique({
      where: { userId_opportunityId: { userId, opportunityId: op.id } },
      select: { decisionStatus: true, validationChecklist: true },
    }),
    // M31b — all linked complaints for the pain trend line and the
    // evidence strength caption.
    prisma.complaint.findMany({
      where: { opportunityId: op.id, userId },
      select: { sourceDate: true, sourceKind: true },
    }),
  ]);

  const checklist = Array.isArray(workspace?.validationChecklist)
    ? (workspace.validationChecklist as unknown[]).map(Boolean)
    : [];
  const bd = op.scoreBreakdown as {
    subscores?: { count: number; severity: number; confidence: number };
  } | null;

  return {
    opportunityId: op.id,
    projectId: op.projectId,
    title: op.title,
    projectName: op.project?.name ?? "Untitled project",
    generatedAt: new Date(),
    summary: op.summary,
    opportunityScore: op.opportunityScore,
    subscores: bd?.subscores ?? null,
    mentions: op.mentions,
    severity: op.severity,
    confidence: op.confidence,
    reason: op.reason,
    marketGap: op.marketGap,
    targetCustomer: op.targetCustomer,
    evidence: op.complaints,
    painTrend: computePainTrend(trendDates.map((d) => d.sourceDate)),
    evidenceStrength: computeEvidenceStrength(trendDates),
    decisionStatus:
      workspace && isValidDecisionStatus(workspace.decisionStatus)
        ? (workspace.decisionStatus as DecisionStatus)
        : null,
    checklistDone: checklist.filter(Boolean).length,
    checklistTotal: VALIDATION_CHECKLIST_ITEMS.length,
  };
}
