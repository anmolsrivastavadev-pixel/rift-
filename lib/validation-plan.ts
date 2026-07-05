/* Pure deterministic helpers for the M10 Opportunity Validation Workflow.
 *
 * No Gemini, no DB, no side effects. Everything is computed from the existing
 * M9 fields already stored on the Opportunity row. When an M9 field is
 * missing (legacy rows), deterministic generic fallback copy is used so the
 * validation workspace is always usable.
 */

export interface ValidationPlanInput {
  id: string;
  title: string;
  summary: string;
  suggestedSoftware: string;
  opportunityScore: number;
  marketGap?: string | null;
  targetCustomer?: string | null;
  productAngle?: string | null;
  validationQuestions: string[];
  riskFlags: string[];
}

/* --- Section 1: Hypothesis To Test --- */

export function buildHypothesis(input: ValidationPlanInput): string {
  const { marketGap, productAngle, summary, suggestedSoftware } = input;
  if (marketGap && marketGap.trim()) {
    return marketGap.trim();
  }
  if (productAngle && productAngle.trim()) {
    return `${productAngle.trim()} This is a hypothesis to test — not a proven opportunity.`;
  }
  if (summary && summary.trim()) {
    return `${summary.trim()} A possible product direction: ${suggestedSoftware}.`;
  }
  return "Find ideas again to create richer testing guidance for this idea.";
}

/* --- Section 2: Who To Interview --- */

export function buildTargetCustomer(input: ValidationPlanInput): string {
  const tc = input.targetCustomer?.trim();
  if (tc) return `Start with: ${tc}`;
  return "Start with people who match the complaints shown in Evidence From Complaints.";
}

export const INTERVIEW_HELPER =
  "Prioritize people who recently experienced this problem, not people giving abstract opinions.";

/* --- Section 3: Interview Questions --- */

const FALLBACK_QUESTIONS = [
  "When was the last time this problem happened?",
  "What did you do to work around it?",
  "How painful was it?",
  "What would make you switch from your current workaround?",
  "Would solving this save time, money, or frustration?",
];

export function buildInterviewQuestions(input: ValidationPlanInput): string[] {
  const existing = (input.validationQuestions ?? [])
    .map((q) => q.trim())
    .filter((q) => q.length > 0);
  const out = [...existing];
  for (const q of FALLBACK_QUESTIONS) {
    if (out.length >= 3) break;
    if (!out.some((e) => e.toLowerCase() === q.toLowerCase())) {
      out.push(q);
    }
  }
  return out.slice(0, 5);
}

/* --- Section 4: Evidence To Collect --- */

export const EVIDENCE_CHECKLIST = [
  "At least 5 conversations with target users",
  "Specific examples of the problem happening recently",
  "Current workaround users rely on",
  "Cost of the problem in time, money, frustration, or lost revenue",
  "Signs users would try or pay for a dedicated solution",
] as const;

/* --- Section 5: Signs This May Be Worth Pursuing --- */

export const SUCCESS_SIGNALS = [
  "Multiple users describe the same pain without being prompted.",
  "Users already use messy workarounds.",
  "The problem happens repeatedly, not once.",
  "The problem costs time, money, trust, or revenue.",
  "At least some users agree to test a rough prototype or join a waitlist.",
] as const;

/* --- Section 6: Risks To Test --- */

const FALLBACK_RISKS = [
  "This may be a one-off complaint, not a repeated market pain.",
  "Users may already have a good-enough workaround.",
  "The buyer may not be the same person experiencing the pain.",
  "The pain may not be urgent enough to pay for.",
];

export function buildRisksToTest(input: ValidationPlanInput): string[] {
  const existing = (input.riskFlags ?? [])
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  if (existing.length > 0) return existing.slice(0, 4);
  return FALLBACK_RISKS;
}

/* --- Section 7: Validation Checklist (interactive, localStorage) --- */

export const VALIDATION_CHECKLIST_ITEMS = [
  "Identify 5 target users.",
  "Interview at least 3 people.",
  "Ask about recent real examples.",
  "Document current workarounds.",
  "Identify the strongest pain trigger.",
  "Test a simple mockup, landing page, or explanation.",
  "Decide: pursue, park, or reject.",
] as const;

export function checklistStorageKey(opportunityId: string): string {
  return `rift-validation-checklist-${opportunityId}`;
}

/* --- Section 8: Copy Validation Brief --- */

export function buildValidationBrief(input: ValidationPlanInput): string {
  const lines: string[] = [];
  lines.push(`RIFT VALIDATION BRIEF`);
  lines.push(`=================`);
  lines.push("");
  lines.push(`Opportunity: ${input.title}`);
  lines.push(`Opportunity Score: ${input.opportunityScore}/100`);
  lines.push("");
  lines.push(`HYPOTHESIS TO TEST`);
  lines.push(buildHypothesis(input));
  lines.push("");
  lines.push(`TARGET CUSTOMER`);
  lines.push(buildTargetCustomer(input));
  lines.push("");
  lines.push(`PRODUCT OPPORTUNITY`);
  lines.push(input.suggestedSoftware);
  lines.push("");
  if (input.productAngle?.trim()) {
    lines.push(`PRODUCT ANGLE`);
    lines.push(input.productAngle.trim());
    lines.push("");
  }
  lines.push(`INTERVIEW QUESTIONS`);
  buildInterviewQuestions(input).forEach((q, i) => {
    lines.push(`${i + 1}. ${q}`);
  });
  lines.push("");
  lines.push(`RISKS TO TEST`);
  buildRisksToTest(input).forEach((r, i) => {
    lines.push(`${i + 1}. ${r}`);
  });
  lines.push("");
  lines.push(`EVIDENCE TO COLLECT`);
  EVIDENCE_CHECKLIST.forEach((e, i) => {
    lines.push(`${i + 1}. ${e}`);
  });
  lines.push("");
  lines.push(`— Generated by Rift. This is a hypothesis to validate, not a proven opportunity.`);
  return lines.join("\n");
}
