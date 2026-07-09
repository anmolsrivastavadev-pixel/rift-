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
 * - checkComplaintQuota runs before fetching to avoid external API spend when
 *   the project is already full, then again post-dedupe for the exact insert
 *   size.
 * - One ComplaintImport row per import with the caller's sourceType:
 *   "finder" (manual search, counts toward the monthly search quota) or
 *   "watch" (cron, excluded from that quota — watches are capped separately).
 * - Zero-insert imports record no ComplaintImport row; manual zero-result
 *   searches count toward quota via ProductEvent in actions/complaint-finder.ts.
 */

import { prisma } from "@/lib/db";
import { complaintRowSchema } from "@/lib/schemas";
import { normaliseBodyForKey } from "@/lib/text-import";
import {
  fetchRedditComplaints,
  fetchAppStoreComplaints,
  fetchHackerNewsComplaints,
  fetchWebComplaints,
  fetchYouTubeComplaints,
  fetchStackExchangeComplaints,
  fetchGitHubComplaints,
  type SourceResult,
} from "@/lib/complaint-finder";
import {
  sanitiseReceiptUrl,
  type ComplaintSourceKind,
} from "@/lib/complaint-sources";
import { trackProductEvent } from "@/lib/product-events";
import { checkComplaintQuota } from "@/lib/quotas";

const MAX_INSERT = 200;
const DIGEST_TITLE_COUNT = 5;

export type FinderImportResult = {
  inserted: number;
  skipped: number;
  /** How many complaints each source returned (0 for sources that sat out). */
  foundBySource: Record<ComplaintSourceKind, number>;
  /** Source errors, or exactly [quota message] when the project is full. */
  errors: string[];
  /** True when the per-project complaint cap blocked the whole insert. */
  quotaFull: boolean;
  /** First few inserted complaint titles, for the watch digest email. */
  insertedTitles: string[];
};

export function emptyFoundBySource(): Record<ComplaintSourceKind, number> {
  return {
    reddit: 0,
    appstore: 0,
    hackernews: 0,
    web: 0,
    youtube: 0,
    stackexchange: 0,
    github: 0,
  };
}

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
    foundBySource: emptyFoundBySource(),
    errors: [],
    quotaFull: false,
    insertedTitles: [],
  };

  const roomForOne = await checkComplaintQuota(user, projectId, 1);
  if (!roomForOne.ok) {
    return {
      ...base,
      errors: [roomForOne.message],
      quotaFull: true,
    };
  }

  const sourceFetchers: [ComplaintSourceKind, Promise<SourceResult>][] = [
    ["reddit", fetchRedditComplaints(keyword)],
    ["appstore", fetchAppStoreComplaints(keyword)],
    ["hackernews", fetchHackerNewsComplaints(keyword)],
    ["web", fetchWebComplaints(keyword)],
    ["youtube", fetchYouTubeComplaints(keyword)],
    ["stackexchange", fetchStackExchangeComplaints(keyword)],
    ["github", fetchGitHubComplaints(keyword)],
  ];
  const settled = await Promise.all(sourceFetchers.map(([, p]) => p));

  const errors: string[] = [];
  const foundBySource = emptyFoundBySource();
  const found: typeof settled[number]["complaints"] = [];
  settled.forEach((result, i) => {
    const [kind] = sourceFetchers[i];
    if (result.error) errors.push(result.error);
    foundBySource[kind] = result.complaints.length;
    found.push(...result.complaints);
  });

  if (found.length === 0) {
    return { ...base, foundBySource, errors };
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
        foundBySource,
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
    foundBySource,
    inserted: toInsert.length,
    skipped: found.length - toInsert.length,
    errors,
    insertedTitles: toInsert
      .slice(0, DIGEST_TITLE_COUNT)
      .map((r) => r.title),
  };
}
