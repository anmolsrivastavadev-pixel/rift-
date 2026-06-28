import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Target,
  Sparkles,
  Users,
  Gauge,
  Layers,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  ComplaintsChart,
  type DayBucket,
} from "@/components/dashboard/complaints-chart";
import { Button } from "@/components/ui/button";

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
  const [
    total,
    recent,
    dated,
    opportunityCount,
    avgScore,
    industries,
  ] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, body: true, createdAt: true },
    }),
    prisma.complaint.findMany({
      select: { sourceDate: true },
      where: { sourceDate: { not: null } },
    }),
    prisma.opportunity.count(),
    prisma.opportunity.aggregate({ _avg: { opportunityScore: true } }),
    prisma.opportunity.findMany({ select: { industry: true } }),
  ]);

  const industriesDiscovered = new Set(industries.map((o) => o.industry)).size;

  const buckets = bucketByDay(dated);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            What your customer complaints look like at a glance.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/complaints">
            Upload <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="Opportunities"
          value={opportunityCount.toLocaleString()}
          hint={
            opportunityCount > 0 ? "Discovered by AI" : "Run AI clustering →"
          }
        />
        <StatCard
          icon={Gauge}
          label="Avg. score"
          value={
            avgScore._avg.opportunityScore != null
              ? Math.round(avgScore._avg.opportunityScore).toString()
              : "—"
          }
          hint="Across all opportunities"
        />
        <StatCard
          icon={Users}
          label="Complaints"
          value={total.toLocaleString()}
          hint="Total processed"
        />
        <StatCard
          icon={Layers}
          label="Industries"
          value={industriesDiscovered.toLocaleString()}
          hint="Distinct contexts"
        />
      </div>

      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="text-base font-semibold">Complaints over time</h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Bucketed by source date when available; falls back to import date.
        </p>
        <div className="mt-4">
          <ComplaintsChart data={buckets} />
        </div>
      </section>

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
          <div className="mt-4 rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-[var(--color-muted-foreground)]" />
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
              No complaints yet. Upload a CSV to see it here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/complaints">
                Upload complaints <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
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

      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Next: generate opportunities</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Use Gemini AI to cluster complaints and score business
              opportunities. Available in Milestone 3.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/opportunities">
            <Target className="h-4 w-4" /> Run AI clustering
          </Link>
        </Button>
      </section>
    </div>
  );
}