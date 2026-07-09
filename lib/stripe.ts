/* M28 — Stripe server client, key-gated like Tavily/Resend.
 *
 * Billing is enabled only when STRIPE_SECRET_KEY, STRIPE_PRICE_PRO_MONTHLY,
 * and STRIPE_WEBHOOK_SECRET are all set; without all three the pricing page
 * shows "payments coming soon" and checkout cannot sell an unfulfillable plan.
 */

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isBillingEnabled(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_PRO_MONTHLY &&
      process.env.STRIPE_WEBHOOK_SECRET
  );
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
