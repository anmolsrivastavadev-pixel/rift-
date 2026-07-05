"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  createCheckoutSession,
  createPortalSession,
  type BillingActionResult,
} from "@/actions/billing";

/* M28 — client buttons for the pricing page. On success the server actions
 * redirect() straight to Stripe, so the only state that ever renders here is
 * an error message.
 */

export function UpgradeButton() {
  const [state, formAction, pending] = useActionState<BillingActionResult | null, FormData>(
    createCheckoutSession,
    null
  );
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Opening checkout…" : "Upgrade to Pro"}
      </Button>
      {state && !state.ok && (
        <p className="text-xs text-[var(--color-danger)]">{state.error}</p>
      )}
    </form>
  );
}

export function ManageSubscriptionButton() {
  const [state, formAction, pending] = useActionState<BillingActionResult | null, FormData>(
    createPortalSession,
    null
  );
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" variant="outline" disabled={pending} className="w-full">
        {pending ? "Opening portal…" : "Manage subscription"}
      </Button>
      {state && !state.ok && (
        <p className="text-xs text-[var(--color-danger)]">{state.error}</p>
      )}
    </form>
  );
}
