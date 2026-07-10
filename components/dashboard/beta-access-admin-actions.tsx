"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";

import {
  addBetaTester,
  reactivateBetaTester,
  revokeBetaTester,
  type BetaAdminActionResult,
} from "@/actions/beta";

const INITIAL_STATE: BetaAdminActionResult | null = null;

export function AddBetaTesterForm() {
  const [state, action, pending] = useActionState(addBetaTester, INITIAL_STATE);

  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-2">
      <input
        name="email"
        type="email"
        required
        placeholder="tester@example.com"
        className="h-9 w-64 max-w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none focus:border-[var(--color-primary)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary-fill)] px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <UserPlus className="h-3.5 w-3.5" /> {pending ? "Adding..." : "Add tester"}
      </button>
      {state && !state.ok ? (
        <p className="basis-full text-xs text-[var(--color-danger)]">{state.error}</p>
      ) : null}
    </form>
  );
}

export function BetaTesterRowAction({ accessId, revoked }: { accessId: string; revoked: boolean }) {
  const [state, action, pending] = useActionState(
    revoked ? reactivateBetaTester : revokeBetaTester,
    INITIAL_STATE
  );

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="accessId" value={accessId} />
      <button
        type="submit"
        disabled={pending}
        className={
          revoked
            ? "rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-foreground)] hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            : "rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-danger)] hover:border-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {pending ? "Saving..." : revoked ? "Restore access" : "Revoke access"}
      </button>
      {state && !state.ok ? (
        <p className="max-w-40 text-right text-xs text-[var(--color-danger)]">{state.error}</p>
      ) : null}
    </form>
  );
}
