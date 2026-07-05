"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/projects";
import { isValidDecisionStatus, type DecisionStatus } from "@/lib/decision-board";
import { VALIDATION_CHECKLIST_ITEMS } from "@/lib/validation-plan";
import {
  buildProjectReport,
  buildIdeaReport,
  slugifyForFilename,
} from "@/lib/reports";
import { trackProductEvent } from "@/lib/product-events";

/* M18 — Private Markdown export.
 *
 * Both actions verify ownership server-side (requireOwnedProject for the
 * project, id + userId for the opportunity) before reading anything, so a
 * forged id from the client only ever returns an error. Reports contain only
 * data already stored for THIS user and THIS project — no other projects, no
 * other users, no new AI calls. Nothing is saved to the database.
 */

export type ExportResult =
  | { ok: true; markdown: string; filename: string }
  | { ok: false; error: string };

export async function getProjectReport(projectId: string): Promise<ExportResult> {
  const user = await requireUser();
  const project = await requireOwnedProject(projectId, user);

  const scoped = { userId: user.id, projectId: project.id };
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
          userId: user.id,
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

  const markdown = buildProjectReport({
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
  });

  // M19 — event metadata only; the report contents are never logged.
  await trackProductEvent({
    userId: user.id,
    projectId: project.id,
    type: "project_exported",
  });

  return {
    ok: true,
    markdown,
    filename: `rift-project-${slugifyForFilename(project.name)}.md`,
  };
}

export async function getIdeaReport(opportunityId: string): Promise<ExportResult> {
  const user = await requireUser();

  const op = await prisma.opportunity.findFirst({
    where: { id: opportunityId, userId: user.id },
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
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        take: 5,
        select: { body: true },
      },
    },
  });
  if (!op) {
    return { ok: false, error: "Idea not found." };
  }

  const workspace = await prisma.validationWorkspace.findUnique({
    where: { userId_opportunityId: { userId: user.id, opportunityId: op.id } },
    select: { decisionStatus: true, validationChecklist: true },
  });

  const checklist = Array.isArray(workspace?.validationChecklist)
    ? (workspace.validationChecklist as unknown[]).map(Boolean)
    : [];
  const bd = op.scoreBreakdown as {
    subscores?: { count: number; severity: number; confidence: number };
  } | null;

  const markdown = buildIdeaReport({
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
    decisionStatus:
      workspace && isValidDecisionStatus(workspace.decisionStatus)
        ? workspace.decisionStatus
        : null,
    checklistDone: checklist.filter(Boolean).length,
    checklistTotal: VALIDATION_CHECKLIST_ITEMS.length,
  });

  // M19 — event metadata only; the report contents are never logged.
  await trackProductEvent({
    userId: user.id,
    projectId: op.projectId,
    opportunityId: op.id,
    type: "idea_exported",
  });

  return {
    ok: true,
    markdown,
    filename: `rift-idea-${slugifyForFilename(op.title)}.md`,
  };
}
