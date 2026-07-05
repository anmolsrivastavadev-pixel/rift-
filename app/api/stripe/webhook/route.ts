import Stripe from "stripe";

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { trackProductEvent } from "@/lib/product-events";

/* M28 — Stripe webhook: the ONLY place that writes User.plan.
 *
 * Signature-verified with STRIPE_WEBHOOK_SECRET. Events handled:
 *  - checkout.session.completed        -> plan "pro"
 *  - customer.subscription.updated     -> "pro" while active/trialing/past_due,
 *                                         "free" otherwise (e.g. unpaid, canceled)
 *  - customer.subscription.deleted     -> plan "free"
 *
 * Returns 400 on bad signatures, 503 when Stripe env vars are missing, and
 * 500 on processing errors so Stripe retries the delivery.
 */

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

async function findUserId(
  customerId: string | null,
  clientReferenceId?: string | null
): Promise<string | null> {
  if (customerId) {
    const byCustomer = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (byCustomer) return byCustomer.id;
  }
  if (clientReferenceId) {
    const byId = await prisma.user.findUnique({
      where: { id: clientReferenceId },
      select: { id: true },
    });
    if (byId) return byId.id;
  }
  return null;
}

async function setPlan(
  userId: string,
  plan: "free" | "pro",
  subscriptionId: string | null,
  customerId: string | null
): Promise<void> {
  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      stripeSubscriptionId: subscriptionId,
      planUpdatedAt: new Date(),
      // Keep the customer id in sync in case checkout created it out-of-band.
      ...(customerId ? { stripeCustomerId: customerId } : {}),
    },
  });
  // Track only real transitions, not repeated webhook deliveries.
  if (before && before.plan !== plan) {
    await trackProductEvent({
      userId,
      type: plan === "pro" ? "subscription_started" : "subscription_canceled",
    });
  }
  logger.info("billing.plan_set", { userId, plan });
}

function customerIdOf(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

export async function POST(req: Request): Promise<Response> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return new Response("Billing is not configured.", { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature.", { status: 400 });
  }

  const body = await req.text();
  const stripe = new Stripe(secretKey);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    logger.warn("billing.webhook_bad_signature", {
      error: err instanceof Error ? err.message : String(err),
    });
    return new Response("Invalid signature.", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription") break;
        const customerId = customerIdOf(session.customer);
        const userId = await findUserId(customerId, session.client_reference_id);
        if (!userId) {
          logger.warn("billing.webhook_user_not_found", { eventType: event.type });
          break;
        }
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;
        await setPlan(userId, "pro", subscriptionId, customerId);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = customerIdOf(subscription.customer);
        const userId = await findUserId(customerId);
        if (!userId) {
          logger.warn("billing.webhook_user_not_found", { eventType: event.type });
          break;
        }
        const active = ACTIVE_STATUSES.has(subscription.status);
        await setPlan(userId, active ? "pro" : "free", active ? subscription.id : null, customerId);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = customerIdOf(subscription.customer);
        const userId = await findUserId(customerId);
        if (!userId) {
          logger.warn("billing.webhook_user_not_found", { eventType: event.type });
          break;
        }
        await setPlan(userId, "free", null, customerId);
        break;
      }
      default:
        // Ignore event types we didn't subscribe to.
        break;
    }
  } catch (err) {
    logger.error("billing.webhook_failed", {
      eventType: event.type,
      error: err instanceof Error ? err.message : String(err),
    });
    // 500 -> Stripe retries the delivery.
    return new Response("Webhook processing failed.", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
