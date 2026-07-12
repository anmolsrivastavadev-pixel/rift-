"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { setProgress, getProgress, type ProcessingStatus, type Stage } from "@/lib/progress";
import { cleanComplaints } from "@/lib/cleaning";
import { clusterComplaints, MAX_COMPLAINTS } from "@/lib/ai";
import { computeOpportunityScore } from "@/lib/scoring";
import { BETA_BLOCKED_MESSAGE, BetaAccessError, requireActor } from "@/lib/action-auth";
import { requireOwnedProject } from "@/lib/projects";
import { trackProductEvent } from "@/lib/product-events";
import { checkIdeaRunQuota } from "@/lib/quotas";

/* How many raw complaints the pipeline pulls before cleaning. Deliberately
 * larger than MAX_COMPLAINTS (the post-dedupe clustering cap in lib/ai.ts):
 * cleaning collapses duplicate bodies, so the raw fetch needs headroom to
 * still yield a full MAX_COMPLAINTS unique complaints. 4x covers a project
 * that is three-quarters duplicates while keeping the fetch bounded. */
const COMPLAINT_FETCH_LIMIT = MAX_COMPLAINTS * 4;

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
 *
 * The poll is the *only* way the client sees progress. On Vercel the poll
 * frequently lands on a different lambda instance to the one running the
 * pipeline, so the in-memory store (`lib/progress.ts`) is not enough on its
 * own — we additionally persist throttled progress to the AIRun row.
 *
 * The lookup is scoped by BOTH `userId` AND `projectId`, never by `jobId`
 * alone. This is also the privacy fix: an unknown / foreign ownerId now
 * returns null, so a guessed jobId cannot read another user's progress.
 * ------------------------------------------------------------------------- */
export async function getProcessingStatus(
  jobId: string,
  projectId: string
): Promise<ProcessingStatus | null> {
  let user: Awaited<ReturnType<typeof requireActor>>;
  try {
    user = await requireActor();
  } catch (err) {
    if (err instanceof BetaAccessError) return null;
    throw err;
  }
  await requireOwnedProject(projectId, user);

  // Fast path — same instance that is running the pipeline.
  const mem = getProgress(jobId);
  if (mem) return mem;

  // Slow path — different lambda instance. Read the persisted snapshot from
  // the user's own AIRun row for this job.
  const run = await prisma.aIRun.findFirst({
    where: { jobId, userId: user.id, projectId },
    select: { progress: true },
  });
  if (!run || !run.progress) return null;
  return parseStoredProgress(run.progress);
}

/* The persisted JSON is a ProcessingStatus minus functions; restore its
 * shape so the client-facing type stays identical. We tolerate small schema
 * drift (extra/missing fields) so an older snapshot never breaks the poll. */
function parseStoredProgress(raw: unknown): ProcessingStatus | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const stage = typeof o.stage === "string" ? (o.stage as ProcessingStatus["stage"]) : null;
  if (!stage) return null;
  return {
    stage,
    message: typeof o.message === "string" ? o.message : undefined,
    total: typeof o.total === "number" ? o.total : undefined,
    done: typeof o.done === "number" ? o.done : undefined,
    error: typeof o.error === "string" ? o.error : undefined,
    cappedAt: typeof o.cappedAt === "number" ? o.cappedAt : undefined,
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : Date.now(),
  };
}

/* -------------------------------------------------------------------------
 * Reset any existing opportunities + unlink all complaints for the current
 * project. Keeps complaints so they can be re-clustered. M16A: scoped to the
 * project only — other projects are untouched.
 * ------------------------------------------------------------------------- */
export async function resetOpportunities(formData: FormData): Promise<{ deleted: number }> {
  let user: Awaited<ReturnType<typeof requireActor>>;
  try {
    user = await requireActor();
  } catch (err) {
    if (err instanceof BetaAccessError) return { deleted: 0 };
    throw err;
  }
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
): Promise<{ created: number; error?: string; cappedAt?: number }> {
  let user: Awaited<ReturnType<typeof requireActor>>;
  try {
    user = await requireActor();
  } catch (err) {
    if (err instanceof BetaAccessError) return { created: 0, error: BETA_BLOCKED_MESSAGE };
    throw err;
  }
  const project = await requireOwnedProject(String(formData.get("projectId") ?? ""), user);
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) {
    return { created: 0, error: "Missing processing job id." };
  }

  // M26 — plan quota check BEFORE any progress/history rows, so a blocked run
  // consumes nothing.
  const quota = await checkIdeaRunQuota(user);
  if (!quota.ok) {
    setProgress(jobId, { stage: "error", error: quota.message, message: quota.message });
    return { created: 0, error: quota.message };
  }

  // M16D — AI run history row for this pipeline run. Created as "running"
  // before the AI work starts, then marked completed/failed. Metadata only —
  // the pipeline stages themselves are unchanged.
  //
  // The row also carries `jobId` + `progress` (post-M31 reliable-progress
  // change) so the status poll can find live progress across Vercel lambda
  // instances and survive the in-memory store being on a different instance.
  let runId: string | null = null;
  // Closure-scoped counter that `createAIRunRow` (declared below) needs before
  // `all` exists; assigned inside try{} once the complaints are loaded.
  let allCount = 0;
  // Throttle state for the DB progress writer. These `let`s MUST be declared
  // before the first setJobProgress call: the helper is hoisted, but reading a
  // `let` before its declarator runs throws a TDZ ReferenceError.
  let lastWrittenStage: Stage | null = null;
  let lastWrittenBucket = -1;

  await setJobProgress({ stage: "cleaning", message: "Cleaning complaints…", total: 0, done: 0 });

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

    // Newest first. Without the orderBy, Postgres returned rows in physical
    // order, so the 1,500 that survived lib/ai.ts's slice were arbitrary and
    // unstable between runs — while the UI promised "your 1,500 most recent
    // complaints". The id tiebreaker matters: a CSV chunk is one transaction,
    // so up to 500 rows share an identical createdAt, and a cut that lands
    // inside a tie group would still be nondeterministic without it.
    //
    // The fetch is bounded but NOT at MAX_COMPLAINTS: cleanComplaints dedupes
    // by body, and lib/ai.ts takes its 1,500 from the CLEANED list. Fetching
    // exactly 1,500 raw rows would hand it fewer than 1,500 unique ones
    // whenever there are duplicates (CSV upload deliberately does not dedupe
    // against the DB), quietly shrinking every run. The buffer keeps the
    // analyzed set at a full 1,500 unique while still refusing to drag all
    // 20k bodies into the lambda.
    //
    // totalComplaints is counted separately because the cap notice below has
    // to know the project is bigger than the fetched slice.
    const where = { userId: user.id, projectId: project.id };
    const [totalComplaints, all] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        select: { id: true, body: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: COMPLAINT_FETCH_LIMIT,
      }),
    ]);

    if (all.length === 0) {
      await setJobProgress({ stage: "error", error: "No complaints to analyze. Add complaints first.", message: "No complaints found." });
      logger.warn("pipeline.no_complaints", { jobId });
      return { created: 0, error: "No complaints to analyze. Add complaints first." };
    }

    // The project total, not the fetched buffer: AIRun.inputComplaintCount and
    // the product event both mean "complaints this project held at run time",
    // and that meaning predates the fetch cap. Keeping it identical means the
    // run-history line and the analytics series don't quietly change
    // definition at this deploy. The cap the user actually hit is carried
    // separately by cappedAt.
    allCount = totalComplaints;
    await createAIRunRow(jobId);
    if (!runId) {
      throw new Error("Unable to create AI run history row.");
    }

    const cleaned = cleanComplaints(all);
    // The clustering stage caps at MAX_COMPLAINTS (see lib/ai.ts). Surface the
    // cap to the user's progress panel + final result so it isn't silent.
    // Derived from the project total, not the fetched slice, which the query
    // above already caps.
    const cappedAt = totalComplaints > MAX_COMPLAINTS ? MAX_COMPLAINTS : undefined;
    await setJobProgress({ stage: "cleaning", total: all.length, done: cleaned.length, message: `Cleaned ${cleaned.length} of ${all.length} complaints.`, cappedAt });
    logger.info("pipeline.cleaned", { raw: all.length, cleaned: cleaned.length, capped: cappedAt ?? null });

    if (cleaned.length === 0) {
      await setJobProgress({ stage: "error", error: "All complaints were empty or duplicates.", message: "No clean complaints." });
      await failRun("All complaints were empty or duplicates.");
      return { created: 0, error: "All complaints were empty or duplicates. Nothing to analyze." };
    }

    /* --- Stage 2 + 3: Clustering + Summaries via Gemini --- */
    await setJobProgress({ stage: "clustering", message: "Grouping similar complaints…", total: cleaned.length, done: 0, cappedAt });

    const clusters = await clusterComplaints(
      cleaned.map((c) => ({ id: c.id, text: c.text }))
    );

    await setJobProgress({
      stage: "clustering",
      done: cleaned.length,
      total: cleaned.length,
      message: `Found ${clusters.length} problem group${clusters.length === 1 ? "" : "s"}.`,
      cappedAt,
    });
    logger.info("pipeline.clustered", { clusters: clusters.length });

    if (clusters.length === 0) {
      await setJobProgress({ stage: "error", error: "No repeated problems found.", message: "No clusters returned." });
      await failRun("The AI returned no idea clusters.");
      return { created: 0, error: "The AI couldn't find repeated problems in these complaints. Add more complaints and try again." };
    }

    const involvedComplaintIds = Array.from(
      new Set(
        clusters.flatMap((cluster) =>
          cluster.complaintIndices
            .map((idx) => cleaned[idx]?.id)
            .filter((x): x is string => Boolean(x))
        )
      )
    );
    const involvedComplaints = involvedComplaintIds.length
      ? await prisma.complaint.findMany({
          where: {
            id: { in: involvedComplaintIds },
            userId: user.id,
            projectId: project.id,
          },
          select: { id: true, sourceDate: true, createdAt: true },
        })
      : [];
    const complaintDateById = new Map(
      involvedComplaints.map((c) => [c.id, { sourceDate: c.sourceDate, createdAt: c.createdAt }])
    );

    /* --- Stage 4: Opportunity Generation --- */
    await setJobProgress({ stage: "generating", message: "Creating ideas…", total: clusters.length, done: 0, cappedAt });

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

      // Trend buckets by the day each complaint was added to Rift (not the
      // parsed source date, which can be years old and made charts look wrong).
      const linked = complaintIds
        .map((complaintId) => complaintDateById.get(complaintId))
        .filter((c): c is { sourceDate: Date | null; createdAt: Date } => Boolean(c));
      const trend = bucketTrend(linked.map((c) => c.createdAt));

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
      await setJobProgress({ stage: "generating", done: i + 1, total: clusters.length, message: `Saved idea ${i + 1} of ${clusters.length}.`, cappedAt });
      logger.info("pipeline.opportunity_saved", { id: op.id, score, mentions: complaintIds.length });
    }

    await setJobProgress({ stage: "saving", done: created.length, total: created.length, message: "Saving results…", cappedAt });

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

    await setJobProgress({ stage: "complete", done: created.length, total: created.length, message: `Done — ${created.length} idea${created.length === 1 ? "" : "s"} created.`, cappedAt });
    logger.info("pipeline.completed", { created: created.length });
    return { created: created.length, cappedAt };
  } catch (err) {
    // The raw error goes to the logs only. AIRun.errorMessage is NOT an admin
    // field — components/dashboard/project-history.tsx prints it verbatim in
    // the user's run history, so storing the raw message there was showing
    // people things like Gemini's quota-metric JSON. Store the friendly line.
    const message = err instanceof Error ? err.message : String(err);
    const friendly = "Idea generation failed. Please try again in a moment.";
    logger.error("pipeline.failed", { jobId, error: message });
    await setJobProgress({ stage: "error", error: friendly, message: "Pipeline failed." });
    await failRun(friendly);
    return { created: 0, error: friendly };
  }

  /* ---------------------------------------------------------------------
   * Local progress helpers (closure over jobId/runId/user/project).
   * ---------------------------------------------------------------------
   * setJobProgress keeps the in-memory write (`lib/progress.ts`) for fast
   * local dev — SAME shape — and additionally persists a throttled snapshot
   * to the AIRun row. DB writes fire on:
   *   - stage transitions,
   *   - the 10-point percent bucket changing (within a stage),
   *   - terminal states (complete / error).
   * Per-item writes are skipped so a 1,500-complaint run doesn't add
   * hundreds of Neon round-trips.
   */
  function progressBucket(s: ProcessingStatus): number {
    if (typeof s.total === "number" && typeof s.done === "number" && s.total > 0) {
      // 10-point granularity (0, 10, …, 100). clamp at 100.
      return Math.min(100, Math.floor((s.done / s.total) * 10) * 10);
    }
    return -1;
  }

  async function persistProgress(s: ProcessingStatus): Promise<void> {
    if (!runId) return;
    try {
      await prisma.aIRun.update({
        where: { id: runId },
        data: { progress: s as unknown as object },
      });
    } catch {
      // Bookkeeping must never fail the pipeline.
    }
  }

  async function setJobProgress(
    patch: Partial<Omit<ProcessingStatus, "updatedAt">>
  ): Promise<void> {
    setProgress(jobId, patch);
    if (!runId) return;
    const s = getProgress(jobId);
    if (!s) return;
    const stage = s.stage;
    const bucket = progressBucket(s);
    const isTerminal = stage === "complete" || stage === "error";
    const stageChanged = stage !== lastWrittenStage;
    const bucketChanged = bucket !== -1 && bucket !== lastWrittenBucket;
    if (!isTerminal && !stageChanged && !bucketChanged) return;
    lastWrittenStage = stage;
    if (bucket !== -1) lastWrittenBucket = bucket;
    await persistProgress(s);
  }

  /* Create the AIRun row with jobId + seeded progress. A retried run that
   * reuses the same client jobId will hit the (@unique jobId) constraint —
   * catch Prisma P2002 and mint a fresh suffix instead of crashing. */
  async function createAIRunRow(tryId: string): Promise<void> {
    const seed = getProgress(jobId) ?? {
      stage: "cleaning" as const,
      message: "Cleaning complaints…",
      total: 0,
      done: 0,
      updatedAt: Date.now(),
    };
    try {
      const run = await prisma.aIRun.create({
        data: {
          userId: user.id,
          projectId: project.id,
          inputComplaintCount: allCount,
          status: "running",
          jobId: tryId,
          progress: seed as unknown as object,
        },
        select: { id: true },
      });
      runId = run.id;
      lastWrittenStage = seed.stage;
      lastWrittenBucket = progressBucket(seed);
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code: unknown }).code
          : null;
      if (code === "P2002") {
        // Same-client retry reused by a previous run's row. Mint a fresh
        // suffix so the pipeline keeps running — the cross-instance poll
        // falls back to in-memory on the running instance; rare in practice
        // because the form is disabled while a run is in flight.
        const fresh = `${jobId}-${Math.random().toString(36).slice(2, 8)}`;
        await createAIRunRow(fresh);
      } else {
        throw err;
      }
    }
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
