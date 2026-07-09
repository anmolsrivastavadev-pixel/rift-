"use server";

import { revalidatePath } from "next/cache";

import { emptyFoundBySource, runFinderImport } from "@/lib/finder-import";
import type { ComplaintSourceKind } from "@/lib/complaint-sources";
import { BETA_BLOCKED_MESSAGE, BetaAccessError, requireActor } from "@/lib/action-auth";
import { requireOwnedProject } from "@/lib/projects";
import { checkFinderSearchQuota } from "@/lib/quotas";
import { trackProductEvent } from "@/lib/product-events";

export interface FindComplaintsResult {
  inserted: number;
  skipped: number;
  /** How many complaints each source returned (0 for sources that sat out). */
  foundBySource: Record<ComplaintSourceKind, number>;
  errors: string[];
  keyword: string;
}

/* Server action: type a niche keyword (e.g. "fitness apps") and Rift fetches
 * real complaints from Reddit search + App Store reviews + Hacker News +
 * YouTube comments + the web, then imports them into the current project
 * using the same validation + dedupe rules as the paste-text path. The CSV
 * pipeline and AI pipeline are untouched.
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
  const keyword = String(formData.get("keyword") ?? "").trim();
  const base: FindComplaintsResult = {
    inserted: 0,
    skipped: 0,
    foundBySource: emptyFoundBySource(),
    errors: [],
    keyword,
  };

  let user;
  try {
    user = await requireActor();
  } catch (err) {
    if (err instanceof BetaAccessError) return { ...base, errors: [BETA_BLOCKED_MESSAGE] };
    throw err;
  }
  const project = await requireOwnedProject(
    String(formData.get("projectId") ?? ""),
    user
  );
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

  const foundTotal = Object.values(result.foundBySource).reduce(
    (a, b) => a + b,
    0
  );
  if (foundTotal === 0) {
    await trackProductEvent({
      userId: user.id,
      projectId: project.id,
      type: "finder_search_empty",
      metadata: { keyword },
    });
    return {
      ...base,
      foundBySource: result.foundBySource,
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
    foundBySource: result.foundBySource,
    errors: result.errors,
    keyword,
  };
}
