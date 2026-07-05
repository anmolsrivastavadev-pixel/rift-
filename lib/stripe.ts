/* M28 — Stripe server client, key-gated like Tavily/Resend.
 *
 * Billing is enabled only when BOTH STRIPE_SECRET_KEY and
 * STRIPE_PRICE_PRO_MONTHLY are set; without them the pricing page shows
 * "payments coming soon" and the billing actions return a friendly error.
 * STRIPE_WEBHOOK_SECRET is checked separately inside the webhook route.
 */

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isBillingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO_MONTHLY);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe is not configured.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getProPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!priceId) {
    throw new Error("Stripe price is not configured.");
  }
  return priceId;
}

/** Absolute base URL for checkout/portal return links. */
export function getAppBaseUrl(): string {
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
}
