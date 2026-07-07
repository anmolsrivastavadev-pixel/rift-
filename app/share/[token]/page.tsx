import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { getIdeaReportData, getProjectReportData } from "@/lib/report-data";
import { buildReceiptLabel } from "@/lib/complaint-sources";
import {
  buildEvidenceCaption,
  EVIDENCE_STRENGTH_LABELS,
} from "@/lib/evidence-strength";
import { buildPainTrendCaption, PAIN_TREND_LABELS } from "@/lib/pain-trend";
import { DECISION_LABELS } from "@/lib/decision-board";
import { PrintButton } from "@/components/reports/print-button";
import { ExternalLink } from "@/components/ui/external-link";

/* M29 — Public report page. No auth: anyone with the token URL can view
 * until the owner revokes the link (revoked/unknown tokens 404). Data is
 * fetched with the link OWNER's userId through the same lib/report-data.ts
 * queries the Markdown export uses. Not indexable: robots meta below plus
 * /share in robots.ts disallow.
 */

export const metadata: Metadata = {
  title: "Shared report",
  robots: { index: false, follow: false },
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const link = await prisma.shareLink.findFirst({
    where: { token, revokedAt: null },
    select: { kind: true, userId: true, projectId: true, opportunityId: true },
  });
  if (!link) notFound();

  let content: React.ReactNode = null;
  let heading = "";
  let subheading = "";

  if (link.kind === "project" && link.projectId) {
    const data = await getProjectReportData(link.userId, link.projectId);
    if (!data) notFound();
    heading = `Project report: ${data.projectName}`;
    subheading = `Generated ${formatDate(data.generatedAt)}`;
    content = (
      <>
        <Section title="Summary">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Complaints added" value={data.complaintCount} />
            <Stat label="Ideas found" value={data.ideaCount} />
            <Stat label="Saved ideas" value={data.savedCount} />
          </div>
        </Section>
        {data.topIdeas.length > 0 && (
          <Section title="Top ideas">
            <ol className="space-y-4">
              {data.topIdeas.map((idea, i) => (
                <li key={idea.title + i}>
                  <p className="font-medium">
                    {i + 1}. {idea.title}{" "}
                    <span className="text-xs font-normal text-[var(--color-muted-foreground)]">
                      · score {idea.opportunityScore}/100 · {idea.mentions} complaint
                      {idea.mentions === 1 ? "" : "s"}
                    </span>
                  </p>
                  <p className="mt-1 text-[var(--color-muted-foreground)]">{idea.summary}</p>
                </li>
              ))}
            </ol>
          </Section>
        )}
        {data.decisions.length > 0 && (
          <Section title="Decisions">
            <ul className="space-y-1.5">
              {data.decisions.map((d, i) => (
                <li key={d.title + i}>
                  {d.title}:{" "}
                  <span className="text-[var(--color-muted-foreground)]">
                    {DECISION_LABELS[d.status]}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </>
    );
  } else if (link.kind === "idea" && link.opportunityId) {
    const data = await getIdeaReportData(link.userId, link.opportunityId);
    if (!data) notFound();
    heading = `Idea report: ${data.title}`;
    subheading = `From project “${data.projectName}” · Generated ${formatDate(data.generatedAt)}`;
    const why = data.marketGap ?? data.reason;
    content = (
      <>
        <Section title="The idea">
          <p>{data.summary}</p>
          {data.targetCustomer && (
            <p className="text-[var(--color-muted-foreground)]">
              Target customer: {data.targetCustomer}
            </p>
          )}
        </Section>
        <Section title="Score">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Overall" value={`${data.opportunityScore}/100`} />
            <Stat label="Complaints" value={data.mentions} />
            {data.severity != null && <Stat label="Severity" value={data.severity} />}
            {data.confidence != null && <Stat label="Confidence" value={`${data.confidence}%`} />}
            {data.painTrend && (
              <Stat
                label="Pain trend"
                value={PAIN_TREND_LABELS[data.painTrend.trend]}
              />
            )}
          </div>
          {data.painTrend && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {buildPainTrendCaption(data.painTrend)}
            </p>
          )}
          {data.evidenceStrength && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {EVIDENCE_STRENGTH_LABELS[data.evidenceStrength.strength]} —{" "}
              {buildEvidenceCaption(data.evidenceStrength)}
            </p>
          )}
        </Section>
        {why && (
          <Section title="Why this problem exists">
            <p>{why}</p>
          </Section>
        )}
        {data.evidence.length > 0 && (
          <Section title="Evidence: what customers say">
            <ul className="space-y-2">
              {data.evidence.map((e, i) => {
                const quote =
                  e.body.length > 240 ? `${e.body.slice(0, 240)}…` : e.body;
                const receiptLabel = buildReceiptLabel(e.sourceKind, e.sourceUrl);
                return (
                  <li
                    key={i}
                    className="border-l-2 border-[var(--color-border)] pl-3 text-[var(--color-muted-foreground)]"
                  >
                    “{quote.replace(/\s+/g, " ").trim()}”
                    {receiptLabel && e.sourceUrl && (
                      <span className="mt-1 block text-xs">
                        <ExternalLink href={e.sourceUrl}>
                          {receiptLabel}
                        </ExternalLink>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
        <Section title="Testing status">
          <p>
            Decision:{" "}
            {data.decisionStatus ? DECISION_LABELS[data.decisionStatus] : "Not decided"}
          </p>
          <p>
            Validation checklist: {data.checklistDone}/{data.checklistTotal} complete
          </p>
        </Section>
      </>
    );
  } else {
    notFound();
  }

  return (
    <div className="share-report min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="print-hide mb-8 flex items-center justify-between">
          <Link href="/" className="text-base font-semibold tracking-tight text-[var(--color-foreground)]">
            Rift
          </Link>
          <span className="text-xs text-[var(--color-muted-foreground)]">Shared report</span>
        </div>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{subheading}</p>
          </div>
          <PrintButton />
        </header>

        <div className="mt-8 space-y-5">{content}</div>

        <footer className="mt-10 border-t border-[var(--color-border)] pt-6 text-center text-xs text-[var(--color-muted-foreground)]">
          <p>
            Powered by{" "}
            <Link href="/" className="font-medium underline hover:text-[var(--color-foreground)]">
              Rift
            </Link>
            . Business ideas from real customer pain.
          </p>
          <Link
            href="/sign-up"
            className="print-hide mt-3 inline-flex items-center rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-all duration-150 ease-out hover:opacity-90"
          >
            Turn your customer complaints into ideas. Try Rift free
          </Link>
        </footer>
      </div>
    </div>
  );
}
