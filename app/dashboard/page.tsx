import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Target,
  Users,
  Bookmark,
  Trophy,
  Briefcase,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  ComplaintsChart,
  type DayBucket,
} from "@/components/dashboard/complaints-chart";
import { FounderCommandClient } from "@/components/dashboard/founder-command-client";
import { Button } from "@/components/ui/button";
import type { DashboardStats } from "@/lib/dashboard-plan";
import { requireUser } from "@/lib/auth/current-user";

function bucketByDay(rows: { sourceDate: Date | null }[]): DayBucket[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = r.sourceDate ?? new Date();
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [
    complaintCount,
    recent,
    dated,
    opportunityCount,
    savedCount,
    topOpportunity,
    topOpportunities,
    opportunityIds,
  ] = await Promise.all([
    prisma.complaint.count({ where: { userId: user.id } }),
    prisma.complaint.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, body: true, createdAt: true },
    }),
    prisma.complaint.findMany({
      where: { userId: user.id, sourceDate: { not: null } },
      select: { sourceDate: true },
    }),
    prisma.opportunity.count({ where: { userId: user.id } }),
    prisma.savedOpportunity.count({ where: { userId: user.id } }),
    prisma.opportunity.aggregate({ _max: { opportunityScore: true }, where: { userId: user.id } }),
    prisma.opportunity.findMany({
      where: { userId: user.id },
      orderBy: { opportunityScore: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        summary: true,
        industry: true,
        opportunityScore: true,
        mentions: true,
      },
    }),
    prisma.opportunity.findMany({
      where: { userId: user.id },
      orderBy: { opportunityScore: "desc" },
      take: 100,
      select: { id: true },
    }),
  ]);

  const highestScore = topOpportunity._max.opportunityScore ?? null;
  const buckets = bucketByDay(dated);

  const stats: DashboardStats = {
    complaintCount,
    opportunityCount,
    savedCount,
    highestScore,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Founder Command Center
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Track your opportunity discovery workflow from raw complaints to
          validated next steps.
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Rift helps you move from customer pain signals to opportunities,
          validation evidence, and decisions.
        </p>
      </div>

      {/* First-time user guidance */}
      <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="text-base font-semibold">Start here</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          New to Rift? Use demo data to see how customer complaints become business ideas. Then replace the demo data with complaints, reviews, or support tickets from your own market.
        </p>
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
          Don't have complaints yet? No problem — use the demo data to see how Rift works, then come back with your own. You can read app store reviews (1–3 star), screenshot Reddit or forum posts, note things people complain about in real life, or paste support tickets. Even 5–10 sentences is enough to start.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/dashboard/complaints">Use demo data</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/complaints">Add complaints</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/opportunities">View business ideas</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
          Current MVP: works from complaints, reviews, support tickets, or demo data you provide. Future direction: scan public sources like Reddit, reviews, and forums to surface market pain automatically.
        </p>
      </div>

      {/* Beginner guide */}
      <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="text-base font-semibold">What should I do first?</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          If you do not have your own complaints yet, start with demo data. Once you understand the workflow, replace it with real complaints or reviews from a market you care about.
        </p>
        <ol className="mt-4 space-y-2 text-sm text-[var(--color-muted-foreground)]">
          <li className="flex gap-2">
            <span className="font-medium text-[var(--color-foreground)]">1.</span>
            Use demo data
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-[var(--color-foreground)]">2.</span>
            Generate business ideas
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-[var(--color-foreground)]">3.</span>
            Open one idea
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-[var(--color-foreground)]">4.</span>
            Read the evidence and score
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-[var(--color-foreground)]">5.</span>
            Talk to real people
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-[var(--color-foreground)]">6.</span>
            Mark the idea as Pursue, Park, or Reject
          </li>
        </ol>
        <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
          Plain English: Rift helps you spot repeated problems people complain about, turn them into possible business ideas, then decide which one is worth testing.
        </p>
      </div>

      {/* Project stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Complaints loaded"
          value={complaintCount.toLocaleString()}
          hint={complaintCount > 0 ? "Ready for clustering" : "None yet"}
        />
        <StatCard
          icon={Target}
          label="Opportunities generated"
          value={opportunityCount.toLocaleString()}
          hint={opportunityCount > 0 ? "Discovered by AI" : "Run clustering →"}
        />
        <StatCard
          icon={Bookmark}
          label="Saved opportunities"
          value={savedCount.toLocaleString()}
          hint={savedCount > 0 ? "Bookmarked" : "None saved"}
        />
        <StatCard
          icon={Trophy}
          label="Highest score"
          value={highestScore !== null ? highestScore.toString() : "—"}
          hint="Opportunity score (0–100)"
        />
      </div>

      {/* Empty state: no complaints */}
      {complaintCount === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-[var(--color-muted-foreground)]" />
          <h2 className="mt-4 text-base font-semibold">
            No complaints yet
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Start with demo data or add complaints, reviews, support tickets, or manually collected forum snippets.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/complaints">
              Go to Complaints <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : opportunityCount === 0 ? (
        /* Empty state: complaints but no opportunities */
        <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
          <Target className="mx-auto h-8 w-8 text-[var(--color-muted-foreground)]" />
          <h2 className="mt-4 text-base font-semibold">
            Ready to generate business ideas
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Generate business ideas to turn complaints into scored business idea hypotheses.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/opportunities">
              Go to Ideas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}

      {/* Client-side workflow + next action + decision/evidence snapshot */}
      <FounderCommandClient stats={stats} opportunityIds={opportunityIds.map((o) => o.id)} />

      {/* High-signal opportunities (only when they exist) */}
      {topOpportunities.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">High-signal opportunities</h2>
            <Link
              href="/dashboard/opportunities"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topOpportunities.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/opportunities/${o.id}`}
                className="group flex flex-col rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[var(--color-primary)]/60 hover:shadow-md"
              >
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  <Briefcase className="h-3 w-3" />
                  {o.industry}
                </div>
                <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-[var(--color-primary)]">
                  {o.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted-foreground)]">
                  {o.summary}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-2">
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                    <Users className="h-3 w-3" /> {o.mentions} complaints
                  </span>
                  <span className="text-lg font-bold text-[var(--color-primary)]">
                    {o.opportunityScore}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Complaints over time chart (keep existing) */}
      {complaintCount > 0 && (
        <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="text-base font-semibold">Complaints over time</h2>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Bucketed by source date when available; falls back to import date.
          </p>
          <div className="mt-4">
            <ComplaintsChart data={buckets} />
          </div>
        </section>
      )}

      {/* Recent complaints (keep existing, only when complaints exist) */}
      {complaintCount > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent complaints</h2>
            <Link
              href="/dashboard/complaints"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
              No complaints found.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {recent.map((c) => (
                <li
                  key={c.id}
                  className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-4"
                >
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-muted-foreground)]">
                    {c.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
