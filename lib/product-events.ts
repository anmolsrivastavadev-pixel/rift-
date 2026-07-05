import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/* M19 — First-party product event tracking (server-side only).
 *
 * Rules:
 *  - NEVER blocks or breaks the core action: every failure is swallowed and
 *    logged, nothing is thrown.
 *  - Metadata is sanitized down to small, safe primitives. Complaint text,
 *    exported report contents, AI prompts, and raw AI output must never be
 *    passed in — and even if something large slips through, values are
 *    truncated hard.
 *  - No third-party analytics; events live in our own ProductEvent table.
 */

export type ProductEventType =
  | "project_created"
  | "project_renamed"
  | "project_archived"
  | "project_restored"
  | "project_deleted"
  | "complaints_added"
  | "ideas_generated"
  | "ideas_generation_failed"
  | "idea_opened"
  | "idea_saved"
  | "idea_unsaved"
  | "decision_set"
  | "checklist_updated"
  | "project_exported"
  | "idea_exported";

const MAX_STRING = 120;
const MAX_KEYS = 10;

function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, string | number | boolean> | undefined {
  if (!metadata) return undefined;
  const clean: Record<string, string | number | boolean> = {};
  let keys = 0;
  for (const [key, value] of Object.entries(metadata)) {
    if (keys >= MAX_KEYS) break;
    if (typeof value === "number" && Number.isFinite(value)) {
      clean[key] = value;
    } else if (typeof value === "boolean") {
      clean[key] = value;
    } else if (typeof value === "string") {
      clean[key] = value.slice(0, MAX_STRING);
    } else {
      continue; // drop objects/arrays/null — metadata stays small and flat
    }
    keys++;
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

export async function trackProductEvent(input: {
  userId: string;
  type: ProductEventType;
  projectId?: string | null;
  opportunityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.productEvent.create({
      data: {
        userId: input.userId,
        projectId: input.projectId ?? null,
        opportunityId: input.opportunityId ?? null,
        type: input.type,
        metadata: sanitizeMetadata(input.metadata),
      },
    });
  } catch (err) {
    // Analytics must never break the product.
    logger.warn("product_event.failed", {
      type: input.type,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
