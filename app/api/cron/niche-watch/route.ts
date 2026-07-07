import { prisma } from "@/lib/db";
import {
  buildNicheWatchDigestEmail,
  isEmailEnabled,
  sendEmail,
} from "@/lib/email";
import { runFinderImport } from "@/lib/finder-import";
import { logger } from "@/lib/logger";
import { trackProductEvent } from "@/lib/product-events";

/* M31c — Weekly niche watch runner, the app's first scheduled route.
 *
 * Vercel Cron calls this DAILY (vercel.json); each watch is only "due" once
 * its lastRunAt is older than ~a week, so per-watch behavior is weekly while a
 * daily trigger drains any backlog and makes double-fires harmless.
 *
 * Gate ladder mirrors the Stripe webhook: no CRON_SECRET env → 503 (feature
 * off, never runs); wrong/missing Bearer token → 401. Vercel automatically
 * sends `Authorization: Bearer $CRON_SECRET` when the env var is set.
 *
 * Bounded work: at most MAX_WATCHES_PER_RUN watches per invocation,
 * oldest-run first, sequential, each in its own try/catch. Claim-first:
 * lastRunAt is written BEFORE the fetch, so a crash mid-watch retries next
 * week instead of hammering daily, and concurrent invocations find nothing
 * due. Watch imports use sourceType "watch" — they never consume the user's
 * manual finder-search quota (watches are capped by plan instead). The
 * per-project complaint cap IS enforced (quota_full status + honest digest).
 *
 * Email is optional: without RESEND_API_KEY the import still runs (the data
 * has value on its own) and the digest is skipped. Digests are only sent when
 * something happened (inserted > 0 or the project is full) — no weekly
 * "nothing new" noise. Response JSON is counts only, never user data.
 */

export const maxDuration = 300;

const MAX_WATCHES_PER_RUN = 3;
const DUE_AFTER_MS = 6.5 * 24 * 60 * 60 * 1000; // ~a week, with slack for cron timing drift

export async function GET(req: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return new Response("Niche watch cron is not configured.", { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized.", { status: 401 });
  }

  const now = new Date();
  const dueBefore = new Date(now.getTime() - DUE_AFTER_MS);

  const due = await prisma.nicheWatch.findMany({
    where: {
      pausedAt: null,
      project: { archivedAt: null },
      OR: [{ lastRunAt: null }, { lastRunAt: { lt: dueBefore } }],
    },
    orderBy: [{ lastRunAt: { sort: "asc", nulls: "first" } }],
    take: MAX_WATCHES_PER_RUN,
    select: {
      id: true,
      keyword: true,
      projectId: true,
      userId: true,
      project: { select: { name: true } },
      user: { select: { id: true, email: true } },
    },
  });

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const watch of due) {
    // Claim first: a crash below leaves this watch waiting until NEXT week
    // (never retried daily), and a concurrent invocation finds nothing due.
    await prisma.nicheWatch.update({
      where: { id: watch.id },
      data: { lastRunAt: new Date(), lastRunStatus: "failed", lastRunInserted: 0 },
    });

    try {
      const result = await runFinderImport({
        user: watch.user,
        projectId: watch.projectId,
        keyword: watch.keyword,
        sourceType: "watch",
        label: `Weekly watch: “${watch.keyword}”`,
      });

      const status = result.quotaFull
        ? "quota_full"
        : result.inserted > 0
          ? "ok"
          : "ok_no_new";
      await prisma.nicheWatch.update({
        where: { id: watch.id },
        data: { lastRunStatus: status, lastRunInserted: result.inserted },
      });
      processed += 1;

      if ((result.inserted > 0 || result.quotaFull) && isEmailEnabled()) {
        const baseUrl = process.env.BETTER_AUTH_URL ?? "";
        const complaintsUrl = `${baseUrl}/dashboard/complaints?projectId=${watch.projectId}`;
        const email = buildNicheWatchDigestEmail({
          projectName: watch.project.name,
          keyword: watch.keyword,
          inserted: result.inserted,
          topComplaintTitles: result.insertedTitles,
          complaintsUrl,
          quotaFull: result.quotaFull,
        });
        try {
          await sendEmail({ to: watch.user.email, ...email });
          sent += 1;
          await trackProductEvent({
            userId: watch.userId,
            projectId: watch.projectId,
            type: "watch_digest_sent",
            metadata: { keyword: watch.keyword, inserted: result.inserted },
          });
        } catch (err) {
          // Mail failure never rolls back the import — the complaints stay.
          logger.error("niche_watch.digest_failed", {
            watchId: watch.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch (err) {
      failed += 1;
      logger.error("niche_watch.run_failed", {
        watchId: watch.id,
        error: err instanceof Error ? err.message : String(err),
      });
      // lastRunStatus already claimed as "failed" above; retries next week.
    }
  }

  logger.info("niche_watch.cron_done", { due: due.length, processed, sent, failed });
  return Response.json({ processed, sent, failed });
}
