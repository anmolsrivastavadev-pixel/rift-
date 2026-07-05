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
      title: "Add data",
      description: "Paste complaints, upload a file, or use examples.",
      status: complaintCount > 0 ? "done" : "not-started",
      href: "/dashboard/complaints",
      cta: "Add data",
    },
    {
      id: "generate",
      title: "Find ideas",
      description: "Turn complaints into scored ideas.",
      status:
        opportunityCount > 0
          ? "done"
          : complaintCount > 0
            ? "ready"
            : "not-started",
      href: "/dashboard/opportunities",
      cta: "Find ideas",
    },
    {
      id: "review",
      title: "Review ideas",
      description: "Open an idea and check the evidence.",
      status: opportunityCount > 0 ? "in-progress" : "not-started",
      href: "/dashboard/opportunities",
      cta: "Review ideas",
    },
    {
      id: "validate",
      title: "Test an idea",
      description: "Talk to people and save short notes.",
      status:
        local.hasEvidence
          ? "in-progress"
          : opportunityCount > 0
            ? "ready"
            : "not-started",
      href: "/dashboard/opportunities",
      cta: "Review ideas",
    },
    {
      id: "decide",
      title: "Decide next step",
      description: "Compare ideas and pick one to test.",
      status:
        local.hasNonUndecidedDecision
          ? "in-progress"
          : opportunityCount > 0
            ? "ready"
            : "not-started",
      href: "/dashboard/opportunities/decision-board",
      cta: "Compare ideas",
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
      title: "Add data",
      description: "Paste complaints, upload a file, or start with examples.",
      cta: "Add data",
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

  if (!local.hasEvidence) {
    return {
      title: "Pick one to test",
      description: "Open a promising idea and check the evidence.",
      cta: "Review ideas",
      href: "/dashboard/opportunities",
    };
  }

  if (!local.hasNonUndecidedDecision) {
    return {
      title: "Compare ideas",
      description:
        "Pick one idea to test next, or park the rest for later.",
      cta: "Compare ideas",
      href: "/dashboard/opportunities/decision-board",
    };
  }

  if (local.hasPursue) {
    return {
      title: "Review picked ideas",
      description:
        "Keep testing the ideas you chose before building.",
      cta: "Compare ideas",
      href: "/dashboard/opportunities/decision-board",
    };
  }

  return {
    title: "Review your ideas",
    description: "Compare ideas and save short testing notes.",
    cta: "Compare ideas",
    href: "/dashboard/opportunities/decision-board",
  };
}
