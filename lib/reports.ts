/* M18 — Pure Markdown report builders for private export.
 *
 * No Gemini, no DB, no side effects: the server actions in
 * actions/reports.ts fetch the owned data and pass plain objects in here.
 * Reports only ever contain data already stored in the app — no invented
 * evidence, no new AI calls.
 */

import { buildReceiptHref, buildReceiptLabel } from "@/lib/complaint-sources";
import { DECISION_LABELS, type DecisionStatus } from "@/lib/decision-board";
import {
  buildEvidenceCaption,
  EVIDENCE_STRENGTH_LABELS,
  type EvidenceStrengthResult,
} from "@/lib/evidence-strength";
import {
  buildPainTrendCaption,
  PAIN_TREND_LABELS,
  type PainTrendResult,
} from "@/lib/pain-trend";

/** "AI Fitness Coach!" -> "ai-fitness-coach" (safe, readable filenames). */
export function slugifyForFilename(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "report";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ----------------------------- Project report ---------------------------- */

export type ProjectReportInput = {
  projectName: string;
  generatedAt: Date;
  complaintCount: number;
  ideaCount: number;
  savedCount: number;
  topIdeas: {
    title: string;
    opportunityScore: number;
    mentions: number;
    severity: number | null;
    confidence: number | null;
    summary: string;
  }[];
  savedIdeas: { title: string }[];
  decisions: { title: string; status: DecisionStatus }[];
  recentImports: { label: string; complaintCount: number; createdAt: Date }[];
  recentRuns: {
    status: string;
    inputComplaintCount: number;
    outputOpportunityCount: number;
    createdAt: Date;
  }[];
};

export function buildProjectReport(input: ProjectReportInput): string {
  const lines: string[] = [];
  lines.push(`# Rift Project Report: ${input.projectName}`);
  lines.push("");
  lines.push(`Generated: ${formatDate(input.generatedAt)}`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push(`- Complaints added: ${input.complaintCount}`);
  lines.push(`- Ideas found: ${input.ideaCount}`);
  lines.push(`- Saved ideas: ${input.savedCount}`);
  const lastRun = input.recentRuns[0];
  if (lastRun) {
    lines.push(
      `- Last idea run: ${formatDate(lastRun.createdAt)} (${lastRun.status})`
    );
  }
  lines.push("");

  if (input.topIdeas.length > 0) {
    lines.push(`## Top Ideas`);
    input.topIdeas.forEach((idea, i) => {
      lines.push(`${i + 1}. ${idea.title}`);
      lines.push(`   - Score: ${idea.opportunityScore}/100`);
      lines.push(`   - Complaints in cluster: ${idea.mentions}`);
      if (idea.severity != null) lines.push(`   - Severity: ${idea.severity}`);
      if (idea.confidence != null) lines.push(`   - Confidence: ${idea.confidence}%`);
      lines.push(`   - Why it matters: ${idea.summary}`);
    });
    lines.push("");
  }

  if (input.savedIdeas.length > 0) {
    lines.push(`## Saved Ideas`);
    for (const s of input.savedIdeas) lines.push(`- ${s.title}`);
    lines.push("");
  }

  if (input.decisions.length > 0) {
    lines.push(`## Decisions`);
    for (const d of input.decisions) {
      lines.push(`- ${d.title}: ${DECISION_LABELS[d.status]}`);
    }
    lines.push("");
  }

  if (input.recentImports.length > 0) {
    lines.push(`## Recent Data`);
    for (const imp of input.recentImports) {
      lines.push(
        `- ${imp.label}: ${imp.complaintCount} complaint${imp.complaintCount === 1 ? "" : "s"} on ${formatDate(imp.createdAt)}`
      );
    }
    lines.push("");
  }

  if (input.recentRuns.length > 0) {
    lines.push(`## Recent Idea Runs`);
    for (const run of input.recentRuns) {
      lines.push(
        `- ${run.status}: ${run.inputComplaintCount} complaints → ${run.outputOpportunityCount} ideas on ${formatDate(run.createdAt)}`
      );
    }
    lines.push("");
  }

  lines.push(`## What to do next`);
  lines.push(
    `Pick one idea and test whether people actually have this problem.`
  );
  lines.push("");
  return lines.join("\n");
}

/* ------------------------------- Idea report ------------------------------ */

export type IdeaReportInput = {
  title: string;
  projectName: string;
  generatedAt: Date;
  summary: string;
  opportunityScore: number;
  subscores: { count: number; severity: number; confidence: number } | null;
  mentions: number;
  severity: number | null;
  confidence: number | null;
  reason: string | null;
  marketGap: string | null;
  targetCustomer: string | null;
  evidence: { body: string; sourceUrl: string | null; sourceKind: string | null }[];
  painTrend: PainTrendResult | null;
  evidenceStrength: EvidenceStrengthResult | null;
  decisionStatus: DecisionStatus | null;
  checklistDone: number;
  checklistTotal: number;
};

export function buildIdeaReport(input: IdeaReportInput): string {
  const lines: string[] = [];
  lines.push(`# Rift Idea Report: ${input.title}`);
  lines.push("");
  lines.push(`Project: ${input.projectName}`);
  lines.push(`Generated: ${formatDate(input.generatedAt)}`);
  lines.push("");
  lines.push(`## Idea`);
  lines.push(input.summary);
  if (input.targetCustomer) {
    lines.push("");
    lines.push(`Target customer: ${input.targetCustomer}`);
  }
  lines.push("");

  lines.push(`## Score`);
  lines.push(`- Overall: ${input.opportunityScore}/100`);
  if (input.subscores) {
    lines.push(`- Frequency: ${input.subscores.count}`);
    lines.push(`- Severity: ${input.subscores.severity}`);
    lines.push(`- Confidence: ${input.subscores.confidence}`);
  } else {
    lines.push(`- Complaints in cluster: ${input.mentions}`);
    if (input.severity != null) lines.push(`- Severity: ${input.severity}`);
    if (input.confidence != null) lines.push(`- Confidence: ${input.confidence}%`);
  }
  if (input.painTrend) {
    lines.push(
      `- Pain trend: ${PAIN_TREND_LABELS[input.painTrend.trend]}. ${buildPainTrendCaption(input.painTrend)}`
    );
  }
  if (input.evidenceStrength) {
    lines.push(
      `- Evidence: ${EVIDENCE_STRENGTH_LABELS[input.evidenceStrength.strength]} — ${buildEvidenceCaption(input.evidenceStrength)}`
    );
  }
  lines.push("");

  const why = input.marketGap ?? input.reason;
  if (why) {
    lines.push(`## Why this problem exists`);
    lines.push(why);
    lines.push("");
  }

  if (input.evidence.length > 0) {
    lines.push(`## Evidence`);
    for (const e of input.evidence) {
      const quote = e.body.length > 240 ? `${e.body.slice(0, 240)}…` : e.body;
      const label = buildReceiptLabel(e.sourceKind, e.sourceUrl);
      const href = buildReceiptHref(e.sourceKind, e.sourceUrl);
      const receipt = label && href ? ` — [${label}](${href})` : "";
      lines.push(`- “${quote.replace(/\s+/g, " ").trim()}”${receipt}`);
    }
    lines.push("");
  }

  lines.push(`## Testing status`);
  lines.push(
    `Decision: ${input.decisionStatus ? DECISION_LABELS[input.decisionStatus] : "Not decided"}`
  );
  lines.push(`Checklist: ${input.checklistDone}/${input.checklistTotal} complete`);
  lines.push("");

  lines.push(`## Next step`);
  lines.push(
    `Ask 3 people if they have this problem and what they do today.`
  );
  lines.push("");
  return lines.join("\n");
}
