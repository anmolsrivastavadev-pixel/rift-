"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { complaintRowSchema } from "@/lib/schemas";
import { normaliseBodyForKey } from "@/lib/text-import";
import {
  fetchRedditComplaints,
  fetchAppStoreComplaints,
  fetchHackerNewsComplaints,
  fetchWebComplaints,
} from "@/lib/complaint-finder";
import { requireUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/projects";
import { trackProductEvent } from "@/lib/product-events";
import { checkComplaintQuota, checkFinderSearchQuota } from "@/lib/quotas";

const MAX_INSERT = 200;

export interface FindComplaintsResult {
  inserted: number;
  skipped: number;
  redditFound: number;
  appStoreFound: number;
  hackerNewsFound: number;
  webFound: number;
  errors: string[];
  keyword: string;
}

/* Server action: type a niche keyword (e.g. "fitness apps") and Rift fetches
 * real complaints from Reddit search + App Store reviews + Hacker News, then
 * imports them into the current project using the same validation + dedupe
 * rules as the paste-text path. The CSV pipeline and AI pipeline are
 * untouched.
 */
export async function findComplaintsAction(
  _prev: FindComplaintsResult | null,
  formData: FormData
): Promise<FindComplaintsResult> {
  const user = await requireUser();
  const project = await requireOwnedProject(
    String(formData.get("projectId") ?? ""),
    user
  );
  const keyword = String(formData.get("keyword") ?? "").trim();

  const base: FindComplaintsResult = {
    inserted: 0,
    skipped: 0,
    redditFound: 0,
    appStoreFound: 0,
    hackerNewsFound: 0,
    webFound: 0,
    errors: [],
    keyword,
  };

  if (keyword.length < 2 || keyword.length > 80) {
    return {
      ...base,
      errors: ["Type a keyword between 2 and 80 characters (e.g. “fitness apps”)."],
    };
  }

  // M26 — search quota BEFORE any external fetches: a search spends
  // Reddit/HN/Tavily/Gemini budget regardless of how many rows it inserts.
  const searchQuota = await checkFinderSearchQuota(user);
  if (!searchQuota.ok) {
    return { ...base, errors: [searchQuota.message] };
  }

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

  const found = [
    ...reddit.complaints,
    ...appStore.complaints,
    ...hackerNews.complaints,
    ...web.complaints,
  ];
  if (found.length === 0) {
    return {
      ...base,
      errors:
        errors.length > 0
          ? errors
          : ["No complaints found for that keyword. Try a broader term."],
    };
  }

  // Validate with the shared schema, then dedupe within the batch.
  const seen = new Set<string>();
  const valid: { title: string; body: string; sourceDate: Date | null }[] = [];
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
    });
  }

  // Dedupe against complaints already in this project (same rule as the
  // paste-text import: case- and whitespace-insensitive body comparison).
  const existing = await prisma.complaint.findMany({
    where: { userId: user.id, projectId: project.id },
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
    const quota = await checkComplaintQuota(user, project.id, toInsert.length);
    if (!quota.ok) {
      return {
        ...base,
        skipped: found.length,
        redditFound: reddit.complaints.length,
        appStoreFound: appStore.complaints.length,
        hackerNewsFound: hackerNews.complaints.length,
        webFound: web.complaints.length,
        errors: [quota.message],
      };
    }
    // M16D — record this find as one import history row and link the
    // complaints back to it.
    const complaintImport = await prisma.complaintImport.create({
      data: {
        userId: user.id,
        projectId: project.id,
        sourceType: "finder",
        label: `Found complaints for “${keyword}”`,
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
          projectId: project.id,
          complaintImportId: complaintImport.id,
        })),
      });
    }
    // M19 — usage metadata only (source + count), never complaint text.
    await trackProductEvent({
      userId: user.id,
      projectId: project.id,
      type: "complaints_added",
      metadata: { sourceType: "finder", complaintCount: toInsert.length },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/complaints");

  return {
    inserted: toInsert.length,
    skipped: found.length - toInsert.length,
    redditFound: reddit.complaints.length,
    appStoreFound: appStore.complaints.length,
    hackerNewsFound: hackerNews.complaints.length,
    webFound: web.complaints.length,
    errors,
    keyword,
  };
}
