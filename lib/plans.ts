/* M25 — Plan definitions and limits.
 *
 * Two plans: "free" and "pro" ($9/month via Stripe, M28). Limits are enforced
 * app-side in lib/quotas.ts from existing history tables — no counter tables.
 * Admins from RIFT_ADMIN_EMAILS always resolve to pro limits so the founder
 * never hits caps, regardless of their stored plan.
 *
 * Pro's project cap absorbs the old M16A soft cap (100 projects per user).
 */

import { isAdminEmail } from "@/lib/admin";

/**
 * Founder switch — free beta mode.
 *
 * While true, every account resolves to the Pro limits and all payment UI
 * stays out of the app (pricing CTAs become "free during the beta" notes,
 * billing actions refuse to start). Both plans stay visible on /pricing.
 * Flip to false to restore the real Free/Pro split — only on the founder's
 * explicit instruction.
 */
export const FREE_BETA = true;

export type PlanId = "free" | "pro";

export type PlanLimits = {
  /** Non-archived projects a user can have at once. */
  maxActiveProjects: number;
  /** "Find ideas" pipeline runs per UTC calendar month (all statuses count). */
  ideaRunsPerMonth: number;
  /** Complaint Finder searches per UTC calendar month. */
  finderSearchesPerMonth: number;
  /** Complaints stored per project. */
  complaintsPerProject: number;
  /** M31c — active (non-paused) weekly niche watches at once. */
  maxActiveWatches: number;
};

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    maxActiveProjects: 3,
    ideaRunsPerMonth: 10,
    finderSearchesPerMonth: 20,
    complaintsPerProject: 1000,
    maxActiveWatches: 1,
  },
  pro: {
    maxActiveProjects: 100,
    ideaRunsPerMonth: 500,
    finderSearchesPerMonth: 1000,
    complaintsPerProject: 20000,
    maxActiveWatches: 10,
  },
};

export const PRO_PRICE_LABEL = "$9/month";

export function isPlanId(value: string | null | undefined): value is PlanId {
  return value === "free" || value === "pro";
}

/**
 * Resolve the effective plan from the stored User.plan value and the user's
 * email. Unknown stored values fall back to "free"; admins are always "pro".
 * During the free beta (FREE_BETA) everyone resolves to "pro" so no quota or
 * upgrade nag ever fires — User.plan in the database is never touched.
 */
export function resolvePlanId(
  storedPlan: string | null | undefined,
  email: string | null | undefined
): PlanId {
  if (FREE_BETA) return "pro";
  if (isAdminEmail(email)) return "pro";
  return isPlanId(storedPlan) ? storedPlan : "free";
}

export function getPlanLimits(plan: PlanId): PlanLimits {
  return PLANS[plan];
}
