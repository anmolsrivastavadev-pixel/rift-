"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { isValidDecisionStatus, type DecisionStatus } from "@/lib/decision-board";
import { VALIDATION_CHECKLIST_ITEMS } from "@/lib/validation-plan";

/* M16C — Database-backed Validation Workspace state.
 *
 * One ValidationWorkspace row per user per opportunity, storing the decision
 * status and the testing-checklist state that used to live in localStorage.
 *
 * Security: every action resolves the opportunity by BOTH its id and the
 * current session user's id before touching a workspace row, and the row's
 * projectId is copied from the owned opportunity server-side. Client-supplied
 * ids for other users' opportunities simply no-op.
 *
 * Performance: reads happen server-side in the pages (no client round-trip);
 * checklist writes are debounced client-side; migration runs as one batched
 * action with three queries total.
 */

type SaveResult = { ok: boolean };

/** Resolve an opportunity ONLY if the current user owns it. */
async function findOwnedOpportunity(opportunityId: string, userId: string) {
  if (!opportunityId) return null;
  return prisma.opportunity.findFirst({
    where: { id: opportunityId, userId },
    select: { id: true, projectId: true },
  });
}

function sanitizeChecklist(checked: unknown): boolean[] {
  const arr = Array.isArray(checked) ? checked : [];
  return VALIDATION_CHECKLIST_ITEMS.map((_, i) => Boolean(arr[i]));
}

/** Persist the decision status for an owned opportunity. */
export async function setDecisionStatus(
  opportunityId: string,
  status: DecisionStatus
): Promise<SaveResult> {
  const user = await requireUser();
  if (!isValidDecisionStatus(status)) return { ok: false };

  const opportunity = await findOwnedOpportunity(opportunityId, user.id);
  if (!opportunity) return { ok: false };

  await prisma.validationWorkspace.upsert({
    where: {
      userId_opportunityId: { userId: user.id, opportunityId: opportunity.id },
    },
    update: { decisionStatus: status },
    create: {
      userId: user.id,
      projectId: opportunity.projectId,
      opportunityId: opportunity.id,
      decisionStatus: status,
    },
  });
  return { ok: true };
}

/** Persist the testing-checklist state for an owned opportunity. */
export async function saveValidationChecklist(
  opportunityId: string,
  checked: boolean[]
): Promise<SaveResult> {
  const user = await requireUser();

  const opportunity = await findOwnedOpportunity(opportunityId, user.id);
  if (!opportunity) return { ok: false };

  const clean = sanitizeChecklist(checked);
  await prisma.validationWorkspace.upsert({
    where: {
      userId_opportunityId: { userId: user.id, opportunityId: opportunity.id },
    },
    update: { validationChecklist: clean },
    create: {
      userId: user.id,
      projectId: opportunity.projectId,
      opportunityId: opportunity.id,
      validationChecklist: clean,
    },
  });
  return { ok: true };
}

export type MigrationEntry = {
  opportunityId: string;
  decisionStatus?: string;
  checklist?: boolean[];
};

const MAX_MIGRATION_ENTRIES = 200;

/**
 * One-time localStorage → DB migration. The client collects whatever the old
 * localStorage keys held and posts it here once per user per browser.
 *
 * NEVER overwrites: only opportunities the current user owns AND that have no
 * ValidationWorkspace row yet are inserted. Everything else is ignored.
 */
export async function migrateValidationState(
  entries: MigrationEntry[]
): Promise<{ ok: true; migrated: number }> {
  const user = await requireUser();

  const wanted = (Array.isArray(entries) ? entries : [])
    .slice(0, MAX_MIGRATION_ENTRIES)
    .filter((e) => e && typeof e.opportunityId === "string" && e.opportunityId);
  if (wanted.length === 0) return { ok: true, migrated: 0 };

  const ids = Array.from(new Set(wanted.map((e) => e.opportunityId)));
  const [ownedOps, existingRows] = await Promise.all([
    prisma.opportunity.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true, projectId: true },
    }),
    prisma.validationWorkspace.findMany({
      where: { userId: user.id, opportunityId: { in: ids } },
      select: { opportunityId: true },
    }),
  ]);
  const ownedById = new Map(ownedOps.map((o) => [o.id, o]));
  const existing = new Set(existingRows.map((r) => r.opportunityId));

  const rows = [];
  for (const entry of wanted) {
    const opportunity = ownedById.get(entry.opportunityId);
    if (!opportunity || existing.has(opportunity.id)) continue;
    existing.add(opportunity.id); // dedupe within the batch

    const decisionStatus = isValidDecisionStatus(entry.decisionStatus)
      ? entry.decisionStatus
      : "undecided";
    const hasChecklist = Array.isArray(entry.checklist);
    if (decisionStatus === "undecided" && !hasChecklist) continue; // nothing worth saving

    rows.push({
      userId: user.id,
      projectId: opportunity.projectId,
      opportunityId: opportunity.id,
      decisionStatus,
      validationChecklist: hasChecklist ? sanitizeChecklist(entry.checklist) : undefined,
    });
  }

  if (rows.length > 0) {
    await prisma.validationWorkspace.createMany({
      data: rows,
      skipDuplicates: true,
    });
  }
  return { ok: true, migrated: rows.length };
}
