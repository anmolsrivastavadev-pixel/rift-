import { prisma } from "@/lib/db";

/* A run can legitimately occupy the full maxDuration (300s) of its Server
 * Action. Past this window a row still marked "running" is a corpse: the
 * lambda was killed (timeout, OOM, deploy) before runPipeline's catch could
 * call failRun, so nothing ever moved it out of "running". */
export const STALE_RUN_MS = 10 * 60 * 1000;

export const STALE_RUN_MESSAGE =
  "The run stopped unexpectedly and was marked failed. Please try again.";

/**
 * Mark abandoned "running" AIRuns as failed, and return the jobId of the one
 * genuinely-live run (if any) so the Ideas page can reattach its progress poll.
 *
 * Reaping matters as much as the reattach: a corpse row left "running" would
 * re-arm the poll on every visit (disabling "Find ideas" permanently) and show
 * a "Running…" line in the user's history forever, since project-history
 * renders anything that isn't completed/failed as still in flight.
 *
 * Safe to call on every page load: the updateMany is idempotent and only ever
 * touches this user's own stale rows.
 */
export async function reapStaleRunsAndFindLive(
  userId: string,
  projectId: string,
  now: number = Date.now()
): Promise<{ jobId: string | null } | null> {
  const staleBefore = new Date(now - STALE_RUN_MS);

  await prisma.aIRun.updateMany({
    where: {
      userId,
      projectId,
      status: "running",
      createdAt: { lt: staleBefore },
    },
    data: { status: "failed", errorMessage: STALE_RUN_MESSAGE },
  });

  return prisma.aIRun.findFirst({
    where: {
      userId,
      projectId,
      status: "running",
      createdAt: { gte: staleBefore },
    },
    orderBy: { createdAt: "desc" },
    select: { jobId: true },
  });
}
