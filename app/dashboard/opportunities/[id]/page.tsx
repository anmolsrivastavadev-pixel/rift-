import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Users,
  AlertTriangle,
  Target,
  Sparkles,
  Hash,
  CheckCircle2,
  Lightbulb,
  Layers,
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
import { RelatedOpportunityCard } from "@/components/opportunities/related-opportunity-card";
import { NoRelatedEmpty } from "@/components/opportunities/no-related-empty";
import { PrevNextNav } from "@/components/opportunities/prev-next-nav";
import { MarketGapHypothesis } from "@/components/opportunities/market-gap-hypothesis";
import { ValidationWorkspace } from "@/components/opportunities/validation-workspace";
import { ExportButtons } from "@/components/reports/export-buttons";
import { ShareButton } from "@/components/reports/share-button";
import { shareUrlForToken } from "@/lib/share";
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

  const [op, allOthers, allNeighbours, activeShareLink] = await Promise.all([
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
  ]);

  if (!op) notFound();

  // M19 — usage event (metadata only, fails silently, never blocks the page).
  await trackProductEvent({
    userId: user.id,
    projectId: project.id,
    opportunityId: op.id,
    type: "idea_opened",
  });

  // M16C — load the saved validation checklist for this user + opportunity.
  const workspace = await prisma.validationWorkspace.findUnique({
    where: { userId_opportunityId: { userId: user.id, opportunityId: op.id } },
    select: { validationChecklist: true },
  });
  const initialChecklist = Array.isArray(workspace?.validationChecklist)
    ? (workspace.validationChecklist as unknown[]).map(Boolean)
    : null;

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
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          <Briefcase className="h-3.5 w-3.5" />
          {op.industry}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
          {op.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <HeaderStat icon={Target} label="Score" value={op.opportunityScore} highlight />
          <HeaderStat
            icon={AlertTriangle}
            label="Severity"
            value={op.severity !== null ? op.severity.toFixed(1) : "—"}
          />
          <HeaderStat
            icon={Sparkles}
            label="Confidence"
            value={op.confidence !== null ? `${op.confidence}%` : "—"}
          />
          <HeaderStat icon={Users} label="Complaints" value={op.mentions} />
          <HeaderStat
            icon={CheckCircle2}
            label="Created"
            value={op.createdAt.toLocaleDateString()}
          />
        </div>
      </header>

      <PrevNextNav prevId={prevId} nextId={nextId} projectId={project.id} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* LEFT column */}
        <div className="space-y-6">
          {/* 1. Problem Summary */}
          <section>
            <h2 className="text-base font-semibold">Problem Summary</h2>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              The repeated problem Rift found in the complaints.
            </p>
            <p className="mt-2 text-sm leading-relaxed whitespace-normal break-words text-[var(--color-muted-foreground)]">
              {op.summary}
            </p>
          </section>

          {/* 2. Evidence From Complaints — example complaints + keywords */}
          <section>
            <h2 className="text-base font-semibold">Evidence From Complaints</h2>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Examples from the text you added.
            </p>
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
                    <Badge key={k} variant="primary">
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
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4 text-[var(--color-warning)]" />
              Product Opportunity
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
        </div>

        {/* RIGHT column — sticky on large screens */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Opportunity Score hero */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)] text-center">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Opportunity score
            </p>
            <p className="mt-2 text-5xl font-bold leading-none">
              {op.opportunityScore}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">out of 100</p>
          </div>

          {/* M24 — MiniStats tile row removed: it duplicated the header
              stats exactly (Complaints/Severity/Confidence) and added to the
              reviewer-reported information overload. */}

          {/* Score Breakdown */}
          {bd?.subscores && (
            <details className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
              <summary className="cursor-pointer text-sm font-semibold">Score breakdown</summary>
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
                  <span className="text-[var(--color-muted-foreground)]">Final Opportunity Score</span>
                  <span className="font-semibold text-[var(--color-primary)]">{bd.final}</span>
                </div>
              )}
            </details>
          )}

          {/* Related Opportunities */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-[var(--color-primary)]" />
              Related opportunities
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
          <div className="flex flex-col gap-2">
            <ExportButtons
              kind="idea"
              targetId={op.id}
              exportLabel="Export idea"
              copyLabel="Copy idea report"
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

          {/* M17 — compact next-step hint */}
          <div className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              Next step
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Ask 3 people if they have this problem. Then mark this idea in{" "}
              <Link
                href={projectHref("/dashboard/opportunities/decision-board", project.id)}
                className="font-medium text-[var(--color-primary)] hover:underline"
              >
                Compare Ideas
              </Link>
              .
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
            Created {op.createdAt.toLocaleDateString()}
          </div>

          {op.savedOpportunities.length > 0 && <Badge variant="success">Saved</Badge>}
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
            <span className="ml-1 text-[10px] normal-case tracking-normal opacity-70">
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
