"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { logger } from "@/lib/logger";
import { getAppBaseUrl, getProPriceId, getStripe, isBillingEnabled } from "@/lib/stripe";

/* M28 — Stripe checkout + billing portal server actions.
 *
 * These actions only START billing flows. The plan itself is written
 * exclusively by the webhook (app/api/stripe/webhook/route.ts) after Stripe
 * confirms payment — never here, so a cancelled checkout changes nothing.
 *
 * Both actions redirect() to Stripe on success and only return a value when
 * something went wrong (useActionState-compatible result shape).
 */

export type BillingActionResult = { ok: false; error: string };

const BILLING_DISABLED_MESSAGE =
  "Payments aren't live yet. Rift is free during the private beta.";

async function getOrCreateStripeCustomerId(user: {
  id: string;
  email: string;
}): Promise<string> {
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  });
  if (row?.stripeCustomerId) return row.stripeCustomerId;

  const customer = await getStripe().customers.create({
    email: user.email,
    metadata: { riftUserId: user.id },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

/** Start a subscription checkout for Rift Pro. */
export async function createCheckoutSession(): Promise<BillingActionResult> {
  const user = await requireUser();
  if (!isBillingEnabled()) {
    return { ok: false, error: BILLING_DISABLED_MESSAGE };
  }

  let url: string | null = null;
  try {
    const customerId = await getOrCreateStripeCustomerId(user);
    const base = getAppBaseUrl();
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: getProPriceId(), quantity: 1 }],
      success_url: `${base}/dashboard?upgraded=1`,
      cancel_url: `${base}/pricing`,
      allow_promotion_codes: true,
    });
    url = session.url;
  } catch (err) {
    logger.error("billing.checkout_failed", {
      userId: user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: "Could not start checkout. Please try again." };
  }
  if (!url) {
    return { ok: false, error: "Could not start checkout. Please try again." };
  }
  redirect(url);
}

/** Open the Stripe billing portal (manage / cancel the subscription). */
export async function createPortalSession(): Promise<BillingActionResult> {
  const user = await requireUser();
  if (!isBillingEnabled()) {
    return { ok: false, error: BILLING_DISABLED_MESSAGE };
  }

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  });
  if (!row?.stripeCustomerId) {
    return { ok: false, error: "No subscription found for this account yet." };
  }

  let url: string | null = null;
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: row.stripeCustomerId,
      return_url: `${getAppBaseUrl()}/pricing`,
    });
    url = session.url;
  } catch (err) {
    logger.error("billing.portal_failed", {
      userId: user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: "Could not open the billing portal. Please try again." };
  }
  redirect(url);
}
