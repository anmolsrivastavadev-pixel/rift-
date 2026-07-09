/* Pure deterministic helpers for the M14 Founder Command Center.
 *
 * No Gemini, no DB, no side effects. Computes the recommended next action
 * from server-side counts + the client-side local decision summary.
 */

export interface DashboardStats {
  complaintCount: number;
  opportunityCount: number;
  savedCount: number;
  highestScore: number | null;
}

export interface LocalSummary {
  hasNonUndecidedDecision: boolean;
  hasPursue: boolean;
}

export interface NextAction {
  title: string;
  description: string;
  cta: string;
  href: string;
}

export function computeNextAction(
  stats: DashboardStats,
  local: LocalSummary,
): NextAction {
  const { complaintCount, opportunityCount } = stats;

  if (complaintCount === 0) {
    return {
      title: "Add complaints",
      description: "Paste reviews, upload a file, or let the finder search for you.",
      cta: "Add complaints",
      href: "/dashboard/complaints",
    };
  }

  if (opportunityCount === 0) {
    return {
      title: "Find ideas",
      description: "Turn this project’s complaints into scored ideas.",
      cta: "Find ideas",
      href: "/dashboard/opportunities",
    };
  }

  if (!local.hasNonUndecidedDecision) {
    return {
      title: "Pick one to test",
      description: "Compare your ideas and mark the best one Pursue.",
      cta: "Compare ideas",
      href: "/dashboard/opportunities/decision-board",
    };
  }

  if (local.hasPursue) {
    return {
      title: "Test your chosen idea",
      description: "Open it and follow the testing guide before building.",
      cta: "Review ideas",
      href: "/dashboard/opportunities",
    };
  }

  return {
    title: "Revisit your ideas",
    description: "Nothing marked Pursue yet. Compare again and pick one.",
    cta: "Compare ideas",
    href: "/dashboard/opportunities/decision-board",
  };
}
