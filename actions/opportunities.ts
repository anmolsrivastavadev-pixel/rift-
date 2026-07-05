"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { setProgress, getProgress, type ProcessingStatus } from "@/lib/progress";
import { cleanComplaints } from "@/lib/cleaning";
import { clusterComplaints } from "@/lib/ai";
import { computeOpportunityScore } from "@/lib/scoring";
import { requireUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/projects";
import { trackProductEvent } from "@/lib/product-events";

/* -------------------------------------------------------------------------
 * Form-action wrapper for Reset (clientside <form action=...>).
 * Accepts FormData so the project id can be sent as a hidden input. M16A:
 * project-scoped reset only — never touches another user's or another
 * project's opportunities / complaints.
 * ------------------------------------------------------------------------- */
export async function resetOpportunitiesAction(formData: FormData): Promise<void> {
  await resetOpportunities(formData);
}

/* -------------------------------------------------------------------------
 * Status polling (read state set by runPipeline)
 * ------------------------------------------------------------------------- */
export async function getProcessingStatus(
  jobId: string,
  projectId: string
): Promise<ProcessingStatus | null> {
  const user = await requireUser();
  await requireOwnedProject(projectId, user);
  return getProgress(jobId);
}

/* -------------------------------------------------------------------------
 * Reset any existing opportunities + unlink all complaints for the current
 * project. Keeps complaints so they can be re-clustered. M16A: scoped to the
 * project only — other projects are untouched.
 * ------------------------------------------------------------------------- */
export async function resetOpportunities(formData: FormData): Promise<{ deleted: number }> {
  const user = await requireUser();
  const project = await requireOwnedProject(String(formData.get("projectId") ?? ""), user);
  const deleted = await prisma.opportunity.deleteMany({
    where: { userId: user.id, projectId: project.id },
  });
  await prisma.complaint.updateMany({
    where: { userId: user.id, projectId: project.id },
    data: { opportunityId: null },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/opportunities");
  revalidatePath("/dashboard/complaints");
  logger.info("pipeline.reset", { deleted: deleted.count, projectId: project.id });
  return { deleted: deleted.count };
}

/* -------------------------------------------------------------------------
 * The full AI pipeline:
 *   cleaning -> clustering -> opportunity generation -> saving
 * Designed to run as a Server Action. Progress is tracked by jobId.
 *
 * M16A: `projectId` selects which project's complaints get clustered; the
 * resulting Opportunities are scoped to that same project. Scoring, cleaning,
 * clustering, and prompts are unchanged — only the data plumbing moves.
 * ------------------------------------------------------------------------- */
export async function runPipeline(
  formData: FormData
): Promise<{ created: number; error?: string }> {
  const user = await requireUser();
  const project = await requireOwnedProject(String(formData.get("projectId") ?? ""), user);
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) {
    return { created: 0, error: "Missing processing job id." };
  }
  setProgress(jobId, { stage: "cleaning", message: "Cleaning complaints…", total: 0, done: 0 });

  // M16D — AI run history row for this pipeline run. Created as "running"
  // before the AI work starts, then marked completed/failed. Metadata only —
  // the pipeline stages themselves are unchanged.
  let runId: string | null = null;
  const failRun = async (message: string) => {
    if (!runId) return;
    await prisma.aIRun
      .update({
        where: { id: runId },
        data: {
          status: "failed",
          errorMessage: message.slice(0, 300),
          completedAt: new Date(),
        },
      })
      .catch(() => {
        // History bookkeeping must never mask the real pipeline error.
      });
    await trackProductEvent({
      userId: user.id,
      projectId: project.id,
      type: "ideas_generation_failed",
    });
  };

  try {
    /* --- Stage 1: Cleaning --- */
    logger.info("pipeline.started", { jobId, projectId: project.id });

    const all = await prisma.complaint.findMany({
      where: { userId: user.id, projectId: project.id },
      select: { id: true, body: true },
    });

    if (all.length === 0) {
      setProgress(jobId, { stage: "error", error: "No complaints to analyse. Upload a CSV first.", message: "No complaints found." });
      logger.warn("pipeline.no_complaints", { jobId });
      return { created: 0, error: "No complaints to analyse. Upload a CSV first." };
    }

    const run = await prisma.aIRun.create({
      data: {
        userId: user.id,
        projectId: project.id,
        inputComplaintCount: all.length,
        status: "running",
      },
      select: { id: true },
    });
    runId = run.id;

    const cleaned = cleanComplaints(all);
    setProgress(jobId, { stage: "cleaning", total: all.length, done: cleaned.length, message: `Cleaned ${cleaned.length} of ${all.length} complaints.` });
    logger.info("pipeline.cleaned", { raw: all.length, cleaned: cleaned.length });

    if (cleaned.length === 0) {
      setProgress(jobId, { stage: "error", error: "All complaints were empty or duplicates.", message: "No clean complaints." });
      await failRun("All complaints were empty or duplicates.");
      return { created: 0, error: "All complaints were empty or duplicates. Nothing to analyse." };
    }

    /* --- Stage 2 + 3: Clustering + Summaries via Gemini --- */
    setProgress(jobId, { stage: "clustering", message: "Clustering complaints with Gemini…", total: cleaned.length, done: 0 });

    const clusters = await clusterComplaints(
      cleaned.map((c) => ({ id: c.id, text: c.text }))
    );

    setProgress(jobId, {
      stage: "clustering",
      done: cleaned.length,
      total: cleaned.length,
      message: `Found ${clusters.length} cluster${clusters.length === 1 ? "" : "s"}.`,
    });
    logger.info("pipeline.clustered", { clusters: clusters.length });

    if (clusters.length === 0) {
      setProgress(jobId, { stage: "error", error: "Gemini returned no clusters.", message: "No clusters returned." });
      await failRun("The AI returned no idea clusters.");
      return { created: 0, error: "Gemini returned no clusters from the complaints." };
    }

    /* --- Stage 4: Opportunity Generation --- */
    setProgress(jobId, { stage: "generating", message: "Generating opportunities…", total: clusters.length, done: 0 });

    // Reset existing opportunities first, so re-runs replace stale data.
    // M16A: scoped to this project so other projects' opportunities survive.
    await prisma.opportunity.deleteMany({
      where: { userId: user.id, projectId: project.id },
    });
    await prisma.complaint.updateMany({
      where: { userId: user.id, projectId: project.id },
      data: { opportunityId: null },
    });

    const created: string[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const complaintIds = cluster.complaintIndices
        .map((idx) => cleaned[idx]?.id)
        .filter((x): x is string => Boolean(x));

      if (complaintIds.length === 0) continue;

      // --- Stage 5: Score (deterministic, computed locally) ---
      const { score, breakdown } = computeOpportunityScore({
        complaintCount: complaintIds.length,
        severity: cluster.severity,
        confidence: cluster.confidence,
      });

      // Trend buckets by complaint source date.
      const linked = await prisma.complaint.findMany({
        where: { id: { in: complaintIds }, userId: user.id, projectId: project.id },
        select: { sourceDate: true },
      });
      const trend = bucketTrend(linked.map((c) => c.sourceDate));

      const op = await prisma.opportunity.create({
        data: {
          title: cluster.title,
          summary: cluster.summary,
          industry: cluster.industry,
          keywords: cluster.keywords,
          opportunityScore: score,
          scoreBreakdown: breakdown as unknown as object,
          mentions: complaintIds.length,
          growth: trendGrowth(trend),
          competition: "Medium",
          sentiment: null,
          severity: cluster.severity,
          confidence: cluster.confidence,
          reason: cluster.reason,
          suggestedSoftware: cluster.suggestedSoftware,
          // M9 market-gap hypothesis fields. Store null for missing optional
          // strings; lists default to [] via the schema/Zod. A missing field
          // never fails the whole pipeline.
          marketGap: cluster.marketGap ?? null,
          targetCustomer: cluster.targetCustomer ?? null,
          likelyCurrentWorkarounds: cluster.likelyCurrentWorkarounds ?? null,
          whyWorkaroundsFallShort: cluster.whyWorkaroundsFallShort ?? null,
          productAngle: cluster.productAngle ?? null,
          differentiationAngle: cluster.differentiationAngle ?? null,
          validationQuestions: cluster.validationQuestions,
          riskFlags: cluster.riskFlags,
          trend: trend as unknown as object,
          userId: user.id,
          projectId: project.id,
          aiRunId: runId,
        },
      });

      await prisma.complaint.updateMany({
        where: { id: { in: complaintIds }, userId: user.id, projectId: project.id },
        data: { opportunityId: op.id },
      });

      created.push(op.id);
      setProgress(jobId, { stage: "generating", done: i + 1, total: clusters.length, message: `Saved opportunity ${i + 1} of ${clusters.length}.` });
      logger.info("pipeline.opportunity_saved", { id: op.id, score, mentions: complaintIds.length });
    }

    setProgress(jobId, { stage: "saving", done: created.length, total: created.length, message: "Saving results…" });

    if (runId) {
      await prisma.aIRun
        .update({
          where: { id: runId },
          data: {
            status: "completed",
            outputOpportunityCount: created.length,
            completedAt: new Date(),
          },
        })
        .catch(() => {
          // History bookkeeping must never fail a successful run.
        });
    }
    await trackProductEvent({
      userId: user.id,
      projectId: project.id,
      type: "ideas_generated",
      metadata: { inputComplaints: all.length, ideasCreated: created.length },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/opportunities");
    revalidatePath("/dashboard/complaints");

    setProgress(jobId, { stage: "complete", done: created.length, total: created.length, message: `Complete. ${created.length} opportunit${created.length === 1 ? "y" : "ies"} created.` });
    logger.info("pipeline.completed", { created: created.length });
    return { created: created.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("pipeline.failed", { jobId, error: message });
    setProgress(jobId, { stage: "error", error: message, message: "Pipeline failed." });
    await failRun(message);
    return { created: 0, error: message };
  }
}

/* --------- helpers --------- */

type TrendPoint = { date: string; count: number };

function bucketTrend(dates: (Date | null)[]): TrendPoint[] {
  const map = new Map<string, number>();
  for (const d of dates) {
    const key = (d ?? new Date()).toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Simple growth ratio: last bucket / first bucket, clamped to 0..5.
function trendGrowth(trend: TrendPoint[]): number {
  if (trend.length < 2) return 0;
  const first = trend[0]?.count ?? 1;
  const last = trend[trend.length - 1]?.count ?? first;
  if (first === 0) return 0;
  return Math.max(0, Math.min(5, last / first));
}
