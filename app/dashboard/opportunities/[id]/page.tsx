import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import {
  ArrowLeft,
  Briefcase,
  ChevronRight,
  Users,
  Target,
  Hash,
  Lightbulb,
  Layers,
  TrendingUp,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  selectRelated,
  selectPrevNext,
  type RelatedCandidate,
  type NeighbourCandidate,
} from "@/lib/opportunity-relations";
import { ExampleComplaints } from "@/components/opportunities/example-complaints";
import { SaveButton } from "@/components/opportunities/save-button";
import { RelatedOpportunityCard } from "@/components/opportunities/related-opportunity-card";
import { NoRelatedEmpty } from "@/components/opportunities/no-related-empty";
import { PrevNextNav } from "@/components/opportunities/prev-next-nav";
import { MarketGapHypothesis } from "@/components/opportunities/market-gap-hypothesis";
import { IdeaDecisionControl } from "@/components/opportunities/decision-status-select";
import { isValidDecisionStatus } from "@/lib/decision-board";
import { TalkToComplainers } from "@/components/opportunities/talk-to-complainers";
import { ValidationWorkspace } from "@/components/opportunities/validation-workspace";
import { buildOutreachMessage } from "@/lib/complainer-outreach";
import { buildInterviewQuestions } from "@/lib/validation-plan";
import { ExportButtons } from "@/components/reports/export-buttons";
import { ShareButton } from "@/components/reports/share-button";
import { shareUrlForToken } from "@/lib/share";
import {
  computeEvidenceStrength,
  buildEvidenceCaption,
  EVIDENCE_STRENGTH_LABELS,
} from "@/lib/evidence-strength";
import {
  computePainTrend,
  buildPainTrendCaption,
  PAIN_TREND_LABELS,
  PAIN_TREND_HELPER,
} from "@/lib/pain-trend";
import { trackProductEvent } from "@/lib/product-events";
import { requireUser } from "@/lib/auth/current-user";
import { projectHref } from "@/lib/project-href";
import { requireOwnedProject } from "@/lib/projects";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const requestedProjectId = firstParam((await searchParams).projectId);

  let projectId = requestedProjectId;
  if (!projectId) {
    const ownedOpportunity = await prisma.opportunity.findFirst({
      where: { id, userId: user.id },
      select: { projectId: true },
    });
    if (!ownedOpportunity?.projectId) notFound();
    projectId = ownedOpportunity.projectId;
  }

  const project = await requireOwnedProject(projectId, user);

  const [op, allOthers, allNeighbours, activeShareLink, trendDates, receiptThreads, workspace] = await Promise.all([
    prisma.opportunity.findFirst({
      where: { id, userId: user.id, projectId: project.id },
      include: {
        complaints: {
          where: { userId: user.id, projectId: project.id },
          orderBy: { createdAt: "asc" },
          take: 5,
          select: {
            id: true,
            title: true,
            body: true,
            sourceDate: true,
            createdAt: true,
            sourceUrl: true,
            sourceKind: true,
          },
        },
        savedOpportunities: {
          where: { userId: user.id, projectId: project.id },
          select: { id: true },
        },
      },
    }),
    prisma.opportunity.findMany({
      where: { userId: user.id, projectId: project.id },
      select: {
        id: true,
        title: true,
        industry: true,
        opportunityScore: true,
        keywords: true,
        createdAt: true,
      },
    }),
    prisma.opportunity.findMany({
      where: { userId: user.id, projectId: project.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    }),
    // M29 — live share link for this idea, if any.
    prisma.shareLink.findFirst({
      where: { userId: user.id, opportunityId: id, kind: "idea", revokedAt: null },
      select: { id: true, token: true },
    }),
    // M31b — ALL linked complaints (not just the 5 examples) for the
    // display-only pain trend signal and the evidence strength line.
    prisma.complaint.findMany({
      where: { opportunityId: id, userId: user.id },
      select: { sourceDate: true, sourceKind: true },
    }),
    // Receipt-bearing complaints = the real threads behind this idea, for
    // the "Talk to the people behind the complaints" section. App Store is
    // excluded: nobody can reply to an App Store review, so it doesn't
    // belong in a "talk to these people" list.
    prisma.complaint.findMany({
      where: {
        opportunityId: id,
        userId: user.id,
        sourceUrl: { not: null },
        // Reply-able places only (App Store reviews can't be replied to).
        sourceKind: {
          in: ["reddit", "hackernews", "web", "youtube", "stackexchange", "github"],
        },
      },
      orderBy: { sourceDate: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        sourceUrl: true,
        sourceKind: true,
        sourceDate: true,
      },
    }),
    // M16C — saved validation checklist + decision status for this user +
    // opportunity (runs in parallel with the other reads).
    prisma.validationWorkspace.findUnique({
      where: { userId_opportunityId: { userId: user.id, opportunityId: id } },
      select: { validationChecklist: true, decisionStatus: true },
    }),
  ]);

  if (!op) notFound();

  // M31b — display-only pain trend from original complaint dates.
  const painTrend = computePainTrend(trendDates.map((d) => d.sourceDate));
  // Display-only evidence strength ("Backed by 43 complaints from 3 sources…").
  const evidence = computeEvidenceStrength(trendDates);
  // Outreach reply for the complainer threads, built from this idea's own
  // interview questions.
  const outreachMessage = buildOutreachMessage({
    problemTitle: op.title,
    questions: buildInterviewQuestions({
      id: op.id,
      title: op.title,
      summary: op.summary,
      suggestedSoftware: op.suggestedSoftware,
      opportunityScore: op.opportunityScore,
      marketGap: op.marketGap,
      targetCustomer: op.targetCustomer,
      productAngle: op.productAngle,
      validationQuestions: op.validationQuestions,
      riskFlags: op.riskFlags,
    }),
  });
  const complainerThreads = receiptThreads
    .filter((t) => t.sourceUrl !== null)
    .map((t) => ({ ...t, sourceUrl: t.sourceUrl as string }));

  // M19 — usage event (metadata only, fails silently, never blocks the page).
  // after(): runs once the response is sent, so it never blocks render, and
  // Next keeps the lambda alive until the callback settles — the event isn't
  // dropped the way a bare fire-and-forget promise could be on Vercel.
  after(() =>
    trackProductEvent({
      userId: user.id,
      projectId: project.id,
      opportunityId: op.id,
      type: "idea_opened",
    })
  );

  const initialChecklist = Array.isArray(workspace?.validationChecklist)
    ? (workspace.validationChecklist as unknown[]).map(Boolean)
    : null;
  const savedDecision = workspace?.decisionStatus;
  const decisionStatus = isValidDecisionStatus(savedDecision)
    ? savedDecision
    : "undecided";

  const bd = op.scoreBreakdown as {
    weights?: { count: number; severity: number; confidence: number };
    inputs?: { complaintCount: number; severity: number; confidence: number };
    subscores?: { count: number; severity: number; confidence: number };
    final?: number;
  } | null;

  // Related opportunities (no AI; pure keyword + industry).
  const current: RelatedCandidate = {
    id: op.id,
    title: op.title,
    industry: op.industry,
    opportunityScore: op.opportunityScore,
    keywords: op.keywords,
    createdAt: op.createdAt,
  };
  const related = selectRelated(current, allOthers, 3);

  // Prev / Next (createdAt DESC).
  const { prev: prevId, next: nextId } = selectPrevNext(id, allNeighbours as NeighbourCandidate[]);

  // Keywords sorted alphabetically.
  const sortedKeywords = [...op.keywords].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Back */}
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href={projectHref("/dashboard/opportunities", project.id)}>
            <ArrowLeft className="h-4 w-4" /> Back to ideas
          </Link>
        </Button>
      </div>

      {/* Header */}
      <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <Briefcase className="h-3.5 w-3.5" />
              {op.industry}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
              {op.title}
            </h1>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <SaveButton
              opportunityId={op.id}
              projectId={project.id}
              saved={op.savedOpportunities.length > 0}
              size="sm"
              showLabel
            />
            <div className="flex flex-col items-end gap-1">
              <IdeaDecisionControl
                opportunityId={op.id}
                initialStatus={decisionStatus}
                title={op.title}
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Your decision — saved to your account.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <Badge
            variant={
              evidence.strength === "strong"
                ? "success"
                : evidence.strength === "moderate"
                  ? "default"
                  : "warning"
            }
          >
            {EVIDENCE_STRENGTH_LABELS[evidence.strength]}
          </Badge>
          <span>{buildEvidenceCaption(evidence)}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <HeaderStat icon={Target} label="Score" value={op.opportunityScore} highlight />
          <HeaderStat icon={Users} label="Complaints" value={op.mentions} />
          <HeaderStat
            icon={TrendingUp}
            label="Pain trend"
            value={PAIN_TREND_LABELS[painTrend.trend]}
          />
        </div>
      </header>

      <PrevNextNav prevId={prevId} nextId={nextId} projectId={project.id} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* LEFT column */}
        <div className="space-y-6">
          {/* 1. Problem Summary */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-base font-semibold">Problem summary</h2>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              The repeated problem Rift found in the complaints.
            </p>
            <p className="mt-2 text-sm leading-relaxed whitespace-normal break-words text-[var(--color-muted-foreground)]">
              {op.summary}
            </p>
          </section>

          {/* 2. Evidence From Complaints — example complaints + keywords */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-base font-semibold">Evidence from complaints</h2>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Examples from the complaints behind this idea. Complaints found by
              the finder link to the original post.
            </p>
            {painTrend.trend !== "insufficient" && (
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Pain trend: {PAIN_TREND_LABELS[painTrend.trend]}.{" "}
                {buildPainTrendCaption(painTrend)} {PAIN_TREND_HELPER}
              </p>
            )}
            <div className="mt-3">
              <ExampleComplaints items={op.complaints} />
            </div>

            {/* Keywords — alphabetical, evidence of what the cluster is about */}
            <div className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Hash className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                Keywords
              </h3>
              {sortedKeywords.length === 0 ? (
                <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">No keywords.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sortedKeywords.map((k) => (
                    <Badge key={k} variant="default">
                      {k}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 3. Product Opportunity — the broad buildable product (suggestedSoftware).
              The wedge/narrow entry point lives in the Market Gap Hypothesis
              section as "Product Angle" (productAngle) so the two never show
              the same content. suggestedSoftware is always non-null. */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Lightbulb className="h-4 w-4 text-[var(--color-warning)]" />
              Product idea
            </h2>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              A possible solution someone could build.
            </p>
            <p className="mt-2 text-sm leading-relaxed whitespace-normal break-words text-[var(--color-foreground)]/90">
              {op.suggestedSoftware}
            </p>
          </section>

          {/* 4. Market Gap Hypothesis — complaint-grounded hypothesis fields */}
          <MarketGapHypothesis
            data={{
              marketGap: op.marketGap,
              targetCustomer: op.targetCustomer,
              likelyCurrentWorkarounds: op.likelyCurrentWorkarounds,
              whyWorkaroundsFallShort: op.whyWorkaroundsFallShort,
              productAngle: op.productAngle,
              differentiationAngle: op.differentiationAngle,
              reason: op.reason,
            }}
          />

          {/* 5. Talk to the people behind the complaints — receipts turned
              into a concrete validation task, placed AFTER the reader knows
              what the idea is. Hidden when no receipts exist. */}
          <TalkToComplainers
            threads={complainerThreads}
            outreachMessage={outreachMessage}
          />
        </div>

        {/* RIGHT column — sticky on large screens */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Score breakdown — open by default; this is the score's home in
              the sidebar (the old separate score hero duplicated the header
              stat with no interpretation). */}
          {bd?.subscores && (
            <details
              open
              className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]"
            >
              <summary className="flex cursor-pointer select-none items-center gap-2 text-sm font-semibold transition-colors duration-150 ease-out hover:text-[var(--color-primary)] marker:content-none [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 ease-out group-open:rotate-90" />
                Why this score is {op.opportunityScore}
              </summary>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Scores help sort ideas. They do not prove demand.
              </p>
              <div className="mt-3 space-y-3">
                <BarRow
                  label="Frequency"
                  definition="how many complaints mention this type of problem"
                  value={bd.subscores.count}
                  weight={bd.weights?.count ?? 0.4}
                />
                <BarRow
                  label="Severity"
                  definition="how painful or urgent the complaints sound"
                  value={bd.subscores.severity}
                  weight={bd.weights?.severity ?? 0.35}
                />
                <BarRow
                  label="Confidence"
                  definition="how clearly Rift sees this pattern"
                  value={bd.subscores.confidence}
                  weight={bd.weights?.confidence ?? 0.25}
                />
              </div>
              {bd.final != null && (
                <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-sm">
                  <span className="text-[var(--color-muted-foreground)]">Final score</span>
                  <span className="font-semibold text-[var(--color-primary)]">{bd.final}</span>
                </div>
              )}
            </details>
          )}

          {/* Related ideas */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-[var(--color-primary)]" />
              Related ideas
            </h2>
            <div className="mt-3 space-y-2">
              {related.length === 0 ? (
                <NoRelatedEmpty />
              ) : (
                related.map(({ op: r, shared }) => (
                  <RelatedOpportunityCard
                    key={r.id}
                    op={{
                      id: r.id,
                      title: r.title,
                      industry: r.industry,
                      opportunityScore: r.opportunityScore,
                    }}
                    shared={shared}
                    projectId={project.id}
                  />
                ))
              )}
            </div>
          </section>

          {/* M18 — private Markdown export; M29 — public share link */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold">Share or export</h2>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Download this idea as a text report, or create a public link.
              Anyone with the link can view this idea until you revoke it.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <ExportButtons
                kind="idea"
                targetId={op.id}
                exportLabel="Download report"
                copyLabel="Copy report text"
              />
              <ShareButton
                kind="idea"
                targetId={op.id}
                initialLink={
                  activeShareLink
                    ? {
                        linkId: activeShareLink.id,
                        url: shareUrlForToken(activeShareLink.token),
                      }
                    : null
                }
              />
            </div>
          </section>

          {/* M17 — compact next-step hint */}
          <div className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              Next step
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Use the{" "}
              <a
                href="#testing-guide"
                className="font-medium text-[var(--color-primary)] hover:underline"
              >
                testing guide
              </a>{" "}
              below to ask 3 people if they have this problem, then mark your
              decision above.
            </p>
            <p className="mt-1 text-xs">
              <Link
                href={projectHref("/dashboard/opportunities/decision-board", project.id)}
                className="font-medium text-[var(--color-primary)] hover:underline"
              >
                See all your decisions
              </Link>
            </p>
          </div>

        </aside>
      </div>

      {/* Full-width Validation Workspace — below the two-column layout so it
          has room to breathe. Owns interview questions + risks (rendered once,
          not duplicated as standalone sections). */}
      <ValidationWorkspace
        initialChecklist={initialChecklist}
        input={{
          id: op.id,
          title: op.title,
          summary: op.summary,
          suggestedSoftware: op.suggestedSoftware,
          opportunityScore: op.opportunityScore,
          marketGap: op.marketGap,
          targetCustomer: op.targetCustomer,
          productAngle: op.productAngle,
          validationQuestions: op.validationQuestions,
          riskFlags: op.riskFlags,
        }}
      />

      {/* Prev/next again at the end of the read, so finishing an idea never
          means scrolling back to the top to reach the next one. */}
      <PrevNextNav prevId={prevId} nextId={nextId} projectId={project.id} />
    </div>
  );
}

function HeaderStat({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
      <Icon className="h-3.5 w-3.5" />
      <span className={highlight ? "font-semibold text-[var(--color-foreground)]" : ""}>
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
    </span>
  );
}

function BarRow({
  label,
  definition,
  value,
  weight,
}: {
  label: string;
  definition?: string;
  value: number;
  weight: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[var(--color-muted-foreground)]">
        <span>
          {label}
          {definition && (
            <span className="ml-1 text-xs normal-case tracking-normal opacity-70">
              ({definition})
            </span>
          )}
        </span>
        <span>
          {value}/100 × {Math.round(weight * 100)}%
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full bg-[var(--color-primary)] transition-all duration-150 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
