/* M26 — App-side quota enforcement.
 *
 * All counts derive from existing rows (Project, AIRun, ComplaintImport,
 * Complaint, ProductEvent) — no counter tables. Month windows are UTC calendar
 * months. Zero-result manual finder searches count via ProductEvent so users
 * cannot spend external API budget forever without consuming quota.
 *
 * Callers pass the session user from requireUser(); the Better Auth session
 * does not carry User.plan, so getEffectivePlan fetches it from the database.
 */

import { prisma } from "@/lib/db";
import { getPlanLimits, resolvePlanId, type PlanId, type PlanLimits } from "@/lib/plans";

export type QuotaUser = { id: string; email: string };

export type QuotaResult = { ok: true } | { ok: false; message: string };

export type EffectivePlan = { plan: PlanId; limits: PlanLimits };

function monthStartUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** e.g. "August 1" — when the monthly quotas reset. */
function nextMonthLabel(now = new Date()): string {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return `${next.toLocaleString("en-US", { month: "long", timeZone: "UTC" })} 1`;
}

export async function getEffectivePlan(user: QuotaUser): Promise<EffectivePlan> {
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  });
  const plan = resolvePlanId(row?.plan, user.email);
  return { plan, limits: getPlanLimits(plan) };
}

/** M26 — Active (non-archived) project cap. */
export async function checkProjectQuota(user: QuotaUser): Promise<QuotaResult> {
  const { plan, limits } = await getEffectivePlan(user);
  const active = await prisma.project.count({
    where: { userId: user.id, archivedAt: null },
  });
  if (active < limits.maxActiveProjects) return { ok: true };
  if (plan === "free") {
    return {
      ok: false,
      message: `The free plan includes ${limits.maxActiveProjects} active projects. Archive one you're not using, or upgrade on the Pricing page.`,
    };
  }
  return {
    ok: false,
    message: `You've reached the ${limits.maxActiveProjects}-project limit. Archive a project you're not using to make room.`,
  };
}

/** M26 — Idea runs per UTC month. All statuses count — a failed run already consumed an AI call. */
export async function checkIdeaRunQuota(user: QuotaUser): Promise<QuotaResult> {
  const { plan, limits } = await getEffectivePlan(user);
  const used = await prisma.aIRun.count({
    where: { userId: user.id, createdAt: { gte: monthStartUtc() } },
  });
  if (used < limits.ideaRunsPerMonth) return { ok: true };
  if (plan === "free") {
    return {
      ok: false,
      message: `You've used your ${limits.ideaRunsPerMonth} free idea runs this month. Upgrade on the Pricing page, or wait until ${nextMonthLabel()}.`,
    };
  }
  return {
    ok: false,
    message: `You've used all ${limits.ideaRunsPerMonth} idea runs for this month. They reset on ${nextMonthLabel()}.`,
  };
}

/** M26 — Complaint Finder searches per UTC month. */
export async function checkFinderSearchQuota(user: QuotaUser): Promise<QuotaResult> {
  const { plan, limits } = await getEffectivePlan(user);
  const since = monthStartUtc();
  const [insertedSearches, emptySearches] = await Promise.all([
    prisma.complaintImport.count({
      where: { userId: user.id, sourceType: "finder", createdAt: { gte: since } },
    }),
    prisma.productEvent.count({
      where: { userId: user.id, type: "finder_search_empty", createdAt: { gte: since } },
    }),
  ]);
  const used = insertedSearches + emptySearches;
  if (used < limits.finderSearchesPerMonth) return { ok: true };
  if (plan === "free") {
    return {
      ok: false,
      message: `You've used your ${limits.finderSearchesPerMonth} free Complaint Finder searches this month. Upgrade on the Pricing page, or wait until ${nextMonthLabel()}.`,
    };
  }
  return {
    ok: false,
    message: `You've used all ${limits.finderSearchesPerMonth} Complaint Finder searches for this month. They reset on ${nextMonthLabel()}.`,
  };
}

/** M31c — Active (non-paused) niche watch cap. Cron-run watch imports use
 * ComplaintImport.sourceType "watch", so they never consume the manual finder
 * search quota above — users pay for watches via this cap instead. */
export async function checkWatchQuota(user: QuotaUser): Promise<QuotaResult> {
  const { plan, limits } = await getEffectivePlan(user);
  const active = await prisma.nicheWatch.count({
    where: { userId: user.id, pausedAt: null, project: { is: { archivedAt: null } } },
  });
  if (active < limits.maxActiveWatches) return { ok: true };
  if (plan === "free") {
    return {
      ok: false,
      message: `The free plan includes ${limits.maxActiveWatches} active niche watch${limits.maxActiveWatches === 1 ? "" : "es"}. Pause or delete one, or upgrade on the Pricing page.`,
    };
  }
  return {
    ok: false,
    message: `You've reached the ${limits.maxActiveWatches}-watch limit. Pause or delete a watch you're not using.`,
  };
}

/**
 * M26 — Complaints stored per project. Checked against the batch about to be
 * inserted (after dedupe), so re-importing rows that already exist never
 * false-positives.
 */
export async function checkComplaintQuota(
  user: QuotaUser,
  projectId: string,
  incoming: number
): Promise<QuotaResult> {
  if (incoming <= 0) return { ok: true };
  const { plan, limits } = await getEffectivePlan(user);
  const current = await prisma.complaint.count({
    where: { userId: user.id, projectId },
  });
  if (current + incoming <= limits.complaintsPerProject) return { ok: true };
  const room = Math.max(0, limits.complaintsPerProject - current);
  const roomText =
    room > 0
      ? `This project has room for ${room} more (adding ${incoming}).`
      : `This project is at its limit (adding ${incoming}).`;
  if (plan === "free") {
    return {
      ok: false,
      message: `The free plan stores up to ${limits.complaintsPerProject.toLocaleString("en-US")} complaints per project. ${roomText} Upgrade on the Pricing page for more room.`,
    };
  }
  return {
    ok: false,
    message: `Projects store up to ${limits.complaintsPerProject.toLocaleString("en-US")} complaints. ${roomText}`,
  };
}

export type UsageSummary = {
  plan: PlanId;
  limits: PlanLimits;
  activeProjects: number;
  ideaRunsThisMonth: number;
  finderSearchesThisMonth: number;
};

/** M26 — Usage vs caps for UI ("3 of 10 free idea runs used this month"). */
export async function getUsageSummary(user: QuotaUser): Promise<UsageSummary> {
  const { plan, limits } = await getEffectivePlan(user);
  const since = monthStartUtc();
  const [
    activeProjects,
    ideaRunsThisMonth,
    insertedFinderSearchesThisMonth,
    emptyFinderSearchesThisMonth,
  ] = await Promise.all([
    prisma.project.count({ where: { userId: user.id, archivedAt: null } }),
    prisma.aIRun.count({ where: { userId: user.id, createdAt: { gte: since } } }),
    prisma.complaintImport.count({
      where: { userId: user.id, sourceType: "finder", createdAt: { gte: since } },
    }),
    prisma.productEvent.count({
      where: { userId: user.id, type: "finder_search_empty", createdAt: { gte: since } },
    }),
  ]);
  const finderSearchesThisMonth =
    insertedFinderSearchesThisMonth + emptyFinderSearchesThisMonth;
  return { plan, limits, activeProjects, ideaRunsThisMonth, finderSearchesThisMonth };
}
