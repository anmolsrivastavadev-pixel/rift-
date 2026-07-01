/* Pure deterministic helpers for the M14 Founder Command Center.
 *
 * No Gemini, no DB, no side effects. Computes workflow step statuses and the
 * recommended next action from server-side counts + client-side local
 * decision/evidence summaries.
 */

export interface DashboardStats {
  complaintCount: number;
  opportunityCount: number;
  savedCount: number;
  highestScore: number | null;
}

export interface LocalSummary {
  hasEvidence: boolean;
  hasNonUndecidedDecision: boolean;
  hasPursue: boolean;
}

export type WorkflowStepStatus = "not-started" | "ready" | "in-progress" | "done";

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: WorkflowStepStatus;
  href: string;
  cta: string;
}

export function computeWorkflowSteps(
  stats: DashboardStats,
  local: LocalSummary,
): WorkflowStep[] {
  const { complaintCount, opportunityCount } = stats;

  return [
    {
      id: "import",
      title: "Import complaints",
      description: "Add customer pain signals via CSV, paste, text file, or demo data.",
      status: complaintCount > 0 ? "done" : "not-started",
      href: "/dashboard/complaints",
      cta: "Go to Complaints",
    },
    {
      id: "generate",
      title: "Generate opportunities",
      description: "Generate business ideas to turn complaints into scored opportunity hypotheses.",
      status:
        opportunityCount > 0
          ? "done"
          : complaintCount > 0
            ? "ready"
            : "not-started",
      href: "/dashboard/opportunities",
      cta: "Go to Opportunities",
    },
    {
      id: "review",
      title: "Review details",
      description: "Open opportunity detail pages to inspect evidence and hypotheses.",
      status: opportunityCount > 0 ? "in-progress" : "not-started",
      href: "/dashboard/opportunities",
      cta: "Browse opportunities",
    },
    {
      id: "validate",
      title: "Validate evidence",
      description: "Record what you learn from real customer conversations.",
      status:
        local.hasEvidence
          ? "in-progress"
          : opportunityCount > 0
            ? "ready"
            : "not-started",
      href: "/dashboard/opportunities",
      cta: "Review Opportunities",
    },
    {
      id: "decide",
      title: "Decide next step",
      description: "Mark opportunities as Pursue, Park, or Reject on the Decision Board.",
      status:
        local.hasNonUndecidedDecision
          ? "in-progress"
          : opportunityCount > 0
            ? "ready"
            : "not-started",
      href: "/dashboard/opportunities/decision-board",
      cta: "Open Decision Board",
    },
  ];
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
      description: "Import customer pain signals to start discovering opportunities.",
      cta: "Go to Complaints",
      href: "/dashboard/complaints",
    };
  }

  if (opportunityCount === 0) {
    return {
      title: "Generate opportunities",
      description: "Generate business ideas to turn complaints into opportunity hypotheses.",
      cta: "Go to Opportunities",
      href: "/dashboard/opportunities",
    };
  }

  if (!local.hasEvidence) {
    return {
      title: "Start validation",
      description: "Open a promising opportunity and record early validation evidence.",
      cta: "Review Opportunities",
      href: "/dashboard/opportunities",
    };
  }

  if (!local.hasNonUndecidedDecision) {
    return {
      title: "Decide what to pursue",
      description:
        "Use evidence and testing priority to mark opportunities as Pursue, Park, or Reject.",
      cta: "Open Decision Board",
      href: "/dashboard/opportunities/decision-board",
    };
  }

  if (local.hasPursue) {
    return {
      title: "Review pursued opportunities",
      description:
        "Review the opportunities you marked Pursue and continue validation before building.",
      cta: "Open Decision Board",
      href: "/dashboard/opportunities/decision-board",
    };
  }

  return {
    title: "Review your opportunities",
    description: "Continue comparing opportunities and collecting evidence.",
    cta: "Open Decision Board",
    href: "/dashboard/opportunities/decision-board",
  };
}
