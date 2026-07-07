"use server";

import { revalidatePath } from "next/cache";

import { runFinderImport } from "@/lib/finder-import";
import { requireUser } from "@/lib/auth/current-user";
import { requireOwnedProject } from "@/lib/projects";
import { checkFinderSearchQuota } from "@/lib/quotas";

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
 * real complaints from Reddit search + App Store reviews + Hacker News + the
 * web, then imports them into the current project using the same validation +
 * dedupe rules as the paste-text path. The CSV pipeline and AI pipeline are
 * untouched.
 *
 * M31c — the fetch/validate/dedupe/insert core lives in lib/finder-import.ts,
 * shared with the weekly niche-watch cron. This action keeps what is
 * manual-search-specific: auth, keyword validation, the monthly search quota,
 * and path revalidation.
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

  const result = await runFinderImport({
    user,
    projectId: project.id,
    keyword,
    sourceType: "finder",
    label: `Found complaints for “${keyword}”`,
  });

  const foundTotal =
    result.redditFound +
    result.appStoreFound +
    result.hackerNewsFound +
    result.webFound;
  if (foundTotal === 0) {
    return {
      ...base,
      ...{
        redditFound: result.redditFound,
        appStoreFound: result.appStoreFound,
        hackerNewsFound: result.hackerNewsFound,
        webFound: result.webFound,
      },
      errors:
        result.errors.length > 0
          ? result.errors
          : ["No complaints found for that keyword. Try a broader term."],
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/complaints");

  return {
    inserted: result.inserted,
    skipped: result.skipped,
    redditFound: result.redditFound,
    appStoreFound: result.appStoreFound,
    hackerNewsFound: result.hackerNewsFound,
    webFound: result.webFound,
    errors: result.errors,
    keyword,
  };
}
