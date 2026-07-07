/* M31c — Shared complaint-finder import core.
 *
 * NOT a pure helper: this module talks to the network (four finder sources)
 * and the database, same tier as lib/email.ts. It exists so the manual
 * "Find complaints" server action (actions/complaint-finder.ts) and the
 * weekly niche-watch cron route (app/api/cron/niche-watch) run EXACTLY the
 * same fetch → validate → dedupe → quota → insert pipeline and can never
 * drift apart.
 *
 * Behavior notes (kept identical to the pre-M31c action):
 * - complaintRowSchema validation + normaliseBodyForKey dedupe (in-batch and
 *   against the project's existing complaints).
 * - checkComplaintQuota runs post-dedupe; when full, nothing is inserted and
 *   quotaFull is set so callers can explain honestly.
 * - One ComplaintImport row per import with the caller's sourceType:
 *   "finder" (manual search, counts toward the monthly search quota) or
 *   "watch" (cron, excluded from that quota — watches are capped separately).
 * - Zero-insert imports record no ComplaintImport row (quota quirk documented
 *   in lib/quotas.ts).
 */

import { prisma } from "@/lib/db";
import { complaintRowSchema } from "@/lib/schemas";
import { normaliseBodyForKey } from "@/lib/text-import";
import {
  fetchRedditComplaints,
  fetchAppStoreComplaints,
  fetchHackerNewsComplaints,
  fetchWebComplaints,
} from "@/lib/complaint-finder";
import { sanitiseReceiptUrl } from "@/lib/complaint-sources";
import { trackProductEvent } from "@/lib/product-events";
import { checkComplaintQuota } from "@/lib/quotas";

const MAX_INSERT = 200;
const DIGEST_TITLE_COUNT = 5;

export type FinderImportResult = {
  inserted: number;
  skipped: number;
  redditFound: number;
  appStoreFound: number;
  hackerNewsFound: number;
  webFound: number;
  /** Source errors, or exactly [quota message] when the project is full. */
  errors: string[];
  /** True when the per-project complaint cap blocked the whole insert. */
  quotaFull: boolean;
  /** First few inserted complaint titles, for the watch digest email. */
  insertedTitles: string[];
};

export async function runFinderImport(input: {
  user: { id: string; email: string };
  projectId: string;
  keyword: string;
  sourceType: "finder" | "watch";
  label: string;
}): Promise<FinderImportResult> {
  const { user, projectId, keyword, sourceType, label } = input;

  const base: FinderImportResult = {
    inserted: 0,
    skipped: 0,
    redditFound: 0,
    appStoreFound: 0,
    hackerNewsFound: 0,
    webFound: 0,
    errors: [],
    quotaFull: false,
    insertedTitles: [],
  };

  const [reddit, appStore, hackerNews, web] = await Promise.all([
    fetchRedditComplaints(keyword),
    fetchAppStoreComplaints(keyword),
    fetchHackerNewsComplaints(keyword),
    fetchWebComplaints(keyword),
  ]);

  const errors: string[] = [];
  if (reddit.error) errors.push(reddit.error);
  if (appStore.error) errors.push(appStore.error);
  if (hackerNews.error) errors.push(hackerNews.error);
  if (web.error) errors.push(web.error);

  const counts = {
    redditFound: reddit.complaints.length,
    appStoreFound: appStore.complaints.length,
    hackerNewsFound: hackerNews.complaints.length,
    webFound: web.complaints.length,
  };

  const found = [
    ...reddit.complaints,
    ...appStore.complaints,
    ...hackerNews.complaints,
    ...web.complaints,
  ];
  if (found.length === 0) {
    return { ...base, ...counts, errors };
  }

  // Validate with the shared schema, then dedupe within the batch.
  const seen = new Set<string>();
  const valid: {
    title: string;
    body: string;
    sourceDate: Date | null;
    sourceUrl: string | null;
    sourceKind: string | null;
  }[] = [];
  for (const f of found.slice(0, MAX_INSERT)) {
    const parsed = complaintRowSchema.safeParse({
      title: f.title,
      body: f.body,
      sourceDate: f.sourceDate ?? undefined,
    });
    if (!parsed.success) continue;
    const key = normaliseBodyForKey(parsed.data.body);
    if (seen.has(key)) continue;
    seen.add(key);
    valid.push({
      title: parsed.data.title ?? parsed.data.body.slice(0, 80),
      body: parsed.data.body,
      sourceDate: parsed.data.sourceDate ? new Date(parsed.data.sourceDate) : null,
      // M31a — receipt: sanitised original-post URL + which source it was.
      sourceUrl: sanitiseReceiptUrl(f.sourceUrl),
      sourceKind: f.source,
    });
  }

  // Dedupe against complaints already in this project (same rule as the
  // paste-text import: case- and whitespace-insensitive body comparison).
  const existing = await prisma.complaint.findMany({
    where: { userId: user.id, projectId },
    select: { body: true },
  });
  const existingKeys = new Set(
    existing.map((c: { body: string }) => normaliseBodyForKey(c.body))
  );
  const toInsert = valid.filter(
    (r) => !existingKeys.has(normaliseBodyForKey(r.body))
  );

  if (toInsert.length > 0) {
    // M26 — per-project complaint cap (post-dedupe).
    const quota = await checkComplaintQuota(user, projectId, toInsert.length);
    if (!quota.ok) {
      return {
        ...base,
        ...counts,
        skipped: found.length,
        errors: [quota.message],
        quotaFull: true,
      };
    }
    // M16D — record this find as one import history row and link the
    // complaints back to it.
    const complaintImport = await prisma.complaintImport.create({
      data: {
        userId: user.id,
        projectId,
        sourceType,
        label,
        complaintCount: toInsert.length,
      },
      select: { id: true },
    });
    const CHUNK = 500;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      await prisma.complaint.createMany({
        data: toInsert.slice(i, i + CHUNK).map((row) => ({
          ...row,
          userId: user.id,
          projectId,
          complaintImportId: complaintImport.id,
        })),
      });
    }
    // M19 — usage metadata only (source + count), never complaint text.
    await trackProductEvent({
      userId: user.id,
      projectId,
      type: "complaints_added",
      metadata: { sourceType, complaintCount: toInsert.length },
    });
  }

  return {
    ...base,
    ...counts,
    inserted: toInsert.length,
    skipped: found.length - toInsert.length,
    errors,
    insertedTitles: toInsert
      .slice(0, DIGEST_TITLE_COUNT)
      .map((r) => r.title),
  };
}
