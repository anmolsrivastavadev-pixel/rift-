"use client";

import * as React from "react";
import { ListChecks, Info } from "lucide-react";

import { VALIDATION_CHECKLIST_ITEMS } from "@/lib/validation-plan";
import { saveValidationChecklist } from "@/actions/validation";

/* M16C — Database-backed validation checklist. The server page loads the
 * saved state (per user, per opportunity) and passes it in as
 * `initialChecked`; toggles update local state immediately and are saved to
 * the database with a short debounce so rapid clicking doesn't spam writes.
 * The pending state is flushed on unmount so the last toggle isn't lost.
 */
export function ValidationChecklist({
  opportunityId,
  initialChecked,
}: {
  opportunityId: string;
  initialChecked: boolean[] | null;
}) {
  const items = VALIDATION_CHECKLIST_ITEMS;

  const [checked, setChecked] = React.useState<boolean[]>(() =>
    items.map((_, i) => Boolean(initialChecked?.[i]))
  );

  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsavedRef = React.useRef<boolean[] | null>(null);

  const scheduleSave = React.useCallback(
    (next: boolean[]) => {
      unsavedRef.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        const toSave = unsavedRef.current;
        unsavedRef.current = null;
        if (toSave) {
          void saveValidationChecklist(opportunityId, toSave).catch(() => {
            // Offline / transient failure — state stays visible locally and the
            // next toggle retries the save.
          });
        }
      }, 600);
    },
    [opportunityId]
  );

  // Flush any pending save on unmount so navigating away right after a toggle
  // doesn't drop it.
  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const pending = unsavedRef.current;
      unsavedRef.current = null;
      if (pending) {
        void saveValidationChecklist(opportunityId, pending).catch(() => {});
      }
    };
  }, [opportunityId]);

  function toggle(i: number) {
    const next = checked.map((v, idx) => (idx === i ? !v : v));
    setChecked(next);
    scheduleSave(next);
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
                checked={checked[i]}
                onChange={() => toggle(i)}
                aria-label={item}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-primary)]"
              />
              <span className={checked[i] ? "text-[var(--color-muted-foreground)] line-through" : ""}>
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
        <Info className="h-3 w-3" /> Saved to your account.
      </p>
    </div>
  );
}
