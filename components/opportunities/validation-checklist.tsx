"use client";

import * as React from "react";
import { ListChecks, Info } from "lucide-react";

import {
  VALIDATION_CHECKLIST_ITEMS,
  checklistStorageKey,
} from "@/lib/validation-plan";

/* Stable module-level default so useState always starts with the same array
 * reference (no SSR/hydration mismatch, no infinite loop). */
const DEFAULT_CHECKED: boolean[] = VALIDATION_CHECKLIST_ITEMS.map(() => false);

/* Interactive, localStorage-only validation checklist. State is keyed by
 * opportunity ID so each opportunity has its own progress. No DB, no auth.
 * "Saved only in this browser." note is shown below the items.
 *
 * Uses useState + useEffect (not useSyncExternalStore) to avoid the
 * getServerSnapshot infinite-loop error that occurs when the server snapshot
 * returns a new array reference each call.
 */
export function ValidationChecklist({ opportunityId }: { opportunityId: string }) {
  const items = VALIDATION_CHECKLIST_ITEMS;
  const storageKey = checklistStorageKey(opportunityId);

  const [checked, setChecked] = React.useState<boolean[]>(DEFAULT_CHECKED);
  const [hydrated, setHydrated] = React.useState(false);

  // Read from localStorage after mount (SSR-safe — window is only available
  // client-side). eslint: setState in effect is the canonical read-on-mount
  // pattern for localStorage; the alternative (useSyncExternalStore) caused
  // an infinite loop because getServerSnapshot returned a new array each call.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setChecked(DEFAULT_CHECKED.map((_, i) => Boolean(parsed[i]))); // eslint-disable-line react-hooks/set-state-in-effect
        }
      }
    } catch {
      // ignore bad localStorage data
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  // Write to localStorage when checked state changes (only after hydration so
  // we don't overwrite saved data before reading it).
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      // localStorage may be unavailable (private mode) — fail silently.
    }
  }, [checked, hydrated, storageKey]);

  function toggle(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  const doneCount = checked.filter(Boolean).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ListChecks className="h-4 w-4 text-[var(--color-primary)]" />
          Testing checklist
        </h3>
        <span className="text-xs text-[var(--color-muted-foreground)]" aria-live="polite">
          {doneCount}/{items.length} done
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--color-foreground)]/90">
              <input
                type="checkbox"
                checked={hydrated ? checked[i] : false}
                onChange={() => toggle(i)}
                aria-label={item}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-primary)]"
              />
              <span className={checked[i] && hydrated ? "text-[var(--color-muted-foreground)] line-through" : ""}>
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
        <Info className="h-3 w-3" /> Saved only in this browser.
      </p>
    </div>
  );
}