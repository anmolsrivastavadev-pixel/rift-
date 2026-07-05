"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { migrateValidationState, type MigrationEntry } from "@/actions/validation";
import { isValidDecisionStatus } from "@/lib/decision-board";

const DECISION_PREFIX = "rift-opportunity-decision-";
const CHECKLIST_PREFIX = "rift-validation-checklist-";

/**
 * M16C — Invisible one-time localStorage → DB migration for Validation
 * Workspace state. Renders nothing.
 *
 * On first dashboard load per user per browser it collects the old
 * `rift-opportunity-decision-*` and `rift-validation-checklist-*` keys and
 * sends them to the server, which only inserts rows for opportunities this
 * user owns that have no database state yet (never overwrites). A per-user
 * flag prevents it from ever running again; if the request fails, the flag is
 * not set so migration retries on the next load. The old keys are left in
 * place but are never read by the app again.
 */
export function ValidationStateMigrator({ userId }: { userId: string }) {
  const router = useRouter();
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const flagKey = `rift-validation-migrated-${userId}`;
    let entries: MigrationEntry[] = [];
    try {
      if (window.localStorage.getItem(flagKey)) return;

      const byOpportunity = new Map<string, MigrationEntry>();
      const get = (id: string): MigrationEntry => {
        const found = byOpportunity.get(id);
        if (found) return found;
        const fresh: MigrationEntry = { opportunityId: id };
        byOpportunity.set(id, fresh);
        return fresh;
      };

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        if (key.startsWith(DECISION_PREFIX)) {
          const id = key.slice(DECISION_PREFIX.length);
          const raw = window.localStorage.getItem(key);
          if (id && isValidDecisionStatus(raw)) get(id).decisionStatus = raw;
        } else if (key.startsWith(CHECKLIST_PREFIX)) {
          const id = key.slice(CHECKLIST_PREFIX.length);
          try {
            const parsed = JSON.parse(window.localStorage.getItem(key) ?? "");
            if (id && Array.isArray(parsed)) {
              get(id).checklist = parsed.map(Boolean);
            }
          } catch {
            // ignore malformed checklist data
          }
        }
      }
      entries = Array.from(byOpportunity.values());

      if (entries.length === 0) {
        window.localStorage.setItem(flagKey, "1");
        return;
      }
    } catch {
      // localStorage unavailable (private mode) — nothing to migrate.
      return;
    }

    migrateValidationState(entries)
      .then((result) => {
        try {
          window.localStorage.setItem(flagKey, "1");
        } catch {
          // ignore
        }
        if (result.migrated > 0) router.refresh();
      })
      .catch(() => {
        // Leave the flag unset so migration retries on the next load.
      });
  }, [userId, router]);

  return null;
}
