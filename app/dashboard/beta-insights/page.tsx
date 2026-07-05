import { notFound } from "next/navigation";
import { BarChart3, Activity, UserPlus, Inbox } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { isAdminEmail } from "@/lib/admin";
import { isBetaModeEnabled } from "@/lib/beta-access";
import {
  addBetaTester,
  revokeBetaTester,
  reactivateBetaTester,
} from "@/actions/beta";

/* M19 — Private, admin-only beta insights.
 *
 * Access: only signed-in users whose email is in RIFT_ADMIN_EMAILS; everyone
 * else gets notFound(). Shows usage metadata and counts ONLY — never
 * complaint text, exported report contents, AI prompts, or raw AI output.
 */

export const dynamic = "force-dynamic";

const EXPORT_TYPES = ["project_exported", "idea_exported"];

function distinctUsers(rows: { userId: string | null }[]): number {
  return new Set(rows.map((r) => r.userId).filter(Boolean)).size;
}

export default async function BetaInsightsPage() {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) notFound();

  const [
    totalUsers,
    totalProjects,
    totalComplaints,
    totalIdeas,
    totalSaved,
    totalExports,
    projectOwners,
    complaintUsers,
    ideaUsers,
    openedUsers,
    savedUsers,
    decidedUsers,
    exportUsers,
    recentEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.complaint.count(),
    prisma.opportunity.count(),
    prisma.savedOpportunity.count(),
    prisma.productEvent.count({ where: { type: { in: EXPORT_TYPES } } }),
    prisma.project.findMany({ distinct: ["userId"], select: { userId: true } }),
    prisma.complaint.findMany({
      where: { userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.opportunity.findMany({
      where: { userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.productEvent.findMany({
      where: { type: "idea_opened" },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.savedOpportunity.findMany({
      where: { userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.validationWorkspace.findMany({
      where: { decisionStatus: { not: "undecided" } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.productEvent.findMany({
      where: { type: { in: EXPORT_TYPES } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.productEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        type: true,
        metadata: true,
        createdAt: true,
        user: { select: { email: true } },
        project: { select: { name: true } },
      },
    }),
  ]);

  // M20 — beta access rows + recent feedback (admin-only page, metadata and
  // user-typed feedback messages only).
  const [betaAccessRows, recentFeedback] = await Promise.all([
    prisma.betaAccess.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.betaFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        rating: true,
        message: true,
        pagePath: true,
        createdAt: true,
        user: { select: { email: true } },
        project: { select: { name: true } },
      },
    }),
  ]);

  const funnel: { label: string; count: number }[] = [
    { label: "Signed up", count: totalUsers },
    { label: "Created project", count: distinctUsers(projectOwners) },
    { label: "Added complaints", count: distinctUsers(complaintUsers) },
    { label: "Generated ideas", count: distinctUsers(ideaUsers) },
    { label: "Opened idea", count: distinctUsers(openedUsers) },
    { label: "Saved idea", count: distinctUsers(savedUsers) },
    { label: "Made decision", count: distinctUsers(decidedUsers) },
    { label: "Exported report", count: distinctUsers(exportUsers) },
  ];

  const totals = [
    { label: "Users", value: totalUsers },
    { label: "Projects", value: totalProjects },
    { label: "Complaints", value: totalComplaints },
    { label: "Ideas", value: totalIdeas },
    { label: "Saved ideas", value: totalSaved },
    { label: "Exports", value: totalExports },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Beta insights</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Private usage overview. Counts and metadata only — no complaint text,
          no report contents.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {totals.map((t) => (
          <div
            key={t.label}
            className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center"
          >
            <p className="text-2xl font-bold">{t.value}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {t.label}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <BarChart3 className="h-4 w-4 text-[var(--color-primary)]" />
          Usage funnel
        </h2>
        <ul className="mt-4 space-y-2">
          {funnel.map((step, i) => (
            <li key={step.label} className="flex items-center gap-3 text-sm">
              <span className="w-6 shrink-0 text-xs text-[var(--color-muted-foreground)]">
                {i + 1}.
              </span>
              <span className="flex-1">{step.label}</span>
              <span className="font-semibold">{step.count}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* M20 — beta tester management */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <UserPlus className="h-4 w-4 text-[var(--color-primary)]" />
          Beta access
        </h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Invite-only mode is currently{" "}
          <span className="font-medium text-[var(--color-foreground)]">
            {isBetaModeEnabled() ? "ON (RIFT_BETA_MODE=invite_only)" : "OFF"}
          </span>
          . Admins from RIFT_ADMIN_EMAILS always have access. No emails are sent —
          tell testers to sign up with the address you add here.
        </p>
        <form action={addBetaTester} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="tester@example.com"
            className="h-9 w-64 max-w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none focus:border-[var(--color-primary)]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add tester
          </button>
        </form>
        {betaAccessRows.length > 0 && (
          <ul className="mt-4 space-y-2">
            {betaAccessRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)]/60 pb-2 text-xs last:border-b-0"
              >
                <span className="min-w-0 truncate font-medium text-[var(--color-foreground)]">
                  {row.email}
                </span>
                <span
                  className={
                    row.status === "revoked"
                      ? "text-[var(--color-danger)]"
                      : row.status === "invited"
                        ? "text-[var(--color-warning)]"
                        : "text-[var(--color-success)]"
                  }
                >
                  {row.status === "revoked"
                    ? "Access revoked"
                    : row.status === "invited"
                      ? "Invited — not signed in yet"
                      : "Access active"}
                </span>
                {row.status === "revoked" ? (
                  <form action={reactivateBetaTester}>
                    <input type="hidden" name="accessId" value={row.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-foreground)] hover:border-[var(--color-primary)]"
                    >
                      Restore access
                    </button>
                  </form>
                ) : (
                  <form action={revokeBetaTester}>
                    <input type="hidden" name="accessId" value={row.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-danger)] hover:border-[var(--color-danger)]"
                    >
                      Revoke access
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* M20 — feedback inbox */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Inbox className="h-4 w-4 text-[var(--color-primary)]" />
          Recent feedback
        </h2>
        {recentFeedback.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            No feedback yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentFeedback.map((f) => (
              <li
                key={f.id}
                className="rounded-[12px] border border-[var(--color-border)]/60 p-3 text-xs"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-[var(--color-foreground)]">
                    {f.type}
                    {f.rating != null ? ` · ${f.rating}/5` : ""}
                  </span>
                  <span className="text-[var(--color-muted-foreground)]">
                    {f.user.email}
                    {f.project?.name ? ` · ${f.project.name}` : ""}
                    {f.pagePath ? ` · ${f.pagePath}` : ""}
                    {" · "}
                    {f.createdAt.toLocaleString()}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-[var(--color-foreground)]/90">
                  {f.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-4 w-4 text-[var(--color-primary)]" />
          Recent activity
        </h2>
        {recentEvents.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            No events yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recentEvents.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-[var(--color-border)]/60 pb-2 text-xs last:border-b-0"
              >
                <span className="font-medium text-[var(--color-foreground)]">
                  {e.type}
                </span>
                <span className="text-[var(--color-muted-foreground)]">
                  {e.user.email}
                  {e.project?.name ? ` · ${e.project.name}` : ""}
                  {e.metadata ? ` · ${summariseMetadata(e.metadata)}` : ""}
                </span>
                <span className="ml-auto shrink-0 text-[var(--color-muted-foreground)]">
                  {e.createdAt.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Render sanitized metadata as "key: value" pairs (already small + safe). */
function summariseMetadata(metadata: unknown): string {
  if (typeof metadata !== "object" || metadata === null) return "";
  return Object.entries(metadata as Record<string, unknown>)
    .slice(0, 4)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
}
