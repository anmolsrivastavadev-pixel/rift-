# PLAN: Billing go-live hardening (Stripe webhook + env safety)

> **Rank: #3.** Stripe LIVE mode is imminent (test mode passed; ID check pending).
> Before real money flows, three holes need closing: (1) a customer can PAY while
> the webhook is unconfigured and never get upgraded, (2) webhook events have no
> replay/idempotency guard, (3) `NEXT_PUBLIC_APP_URL` is undocumented and the
> auth client silently falls back to `http://localhost:3000`. Plus: no env var is
> validated anywhere — a missing production key fails at runtime in front of a
> user instead of at boot in front of the founder.

**Executor rules (read first):**
- Read `AGENTS.md`, every doc in `docs/`, and the Next.js docs in
  `node_modules/next/dist/docs/`.
- Billing was founder-authorized in M28 and this plan is the explicit founder
  authorization to harden it. STILL: `User.plan` may only ever be written inside
  `app/api/stripe/webhook/route.ts`. Do not add any other writer.
- Do not touch Better Auth config beyond the `lib/auth-client.ts` baseURL fix
  described below. No new dependencies. Additive schema change only
  (`pnpm exec prisma db push` + `pnpm exec prisma generate`).
- When done: `npx tsc --noEmit`, `npm run lint`, `npm run build`; report files;
  STOP.

## Current facts (verified July 2026)

- `lib/stripe.ts` — `isBillingEnabled()` requires only `STRIPE_SECRET_KEY` +
  `STRIPE_PRICE_PRO_MONTHLY`. The webhook route separately 503s without
  `STRIPE_WEBHOOK_SECRET`. So checkout can be LIVE while upgrades are impossible.
- `app/api/stripe/webhook/route.ts` — handles `checkout.session.completed`,
  `customer.subscription.updated` (pro if status in {active, trialing, past_due}),
  `customer.subscription.deleted`. No handling for
  `customer.subscription.paused`/`resumed`, `invoice.payment_failed`. No
  event-id dedup — a replayed event re-runs the write (product events are
  transition-guarded, plan writes are unconditional).
- `lib/auth-client.ts` (~line 4) — reads `NEXT_PUBLIC_APP_URL` with a
  `http://localhost:3000` fallback. The var is in NEITHER `.env.example` NOR the
  `docs/PROJECT_CONTEXT.md` env table.
- No central env validation exists (no `env.ts`, no startup check). Key gaps
  fail at runtime: missing `CRON_SECRET` ⇒ watches silently never run; partial
  Stripe config ⇒ 503s.
- `docs/LAUNCH_RUNBOOK.md` "Going paid" steps are written but not all executed;
  Step 0 (prisma db push on prod schema) is REQUIRED before deploys that add
  billing columns.

## Exact files to touch

1. `prisma/schema.prisma` — new tiny model for webhook idempotency.
2. `app/api/stripe/webhook/route.ts` — idempotency + extra events.
3. `lib/stripe.ts` — tighten `isBillingEnabled()`.
4. `lib/auth-client.ts` — same-origin default instead of localhost fallback.
5. **New:** `instrumentation.ts` (project root) — boot-time env sanity warnings.
6. `.env.example` + `docs/PROJECT_CONTEXT.md` env table — document
   `NEXT_PUBLIC_APP_URL` and correct the stale Reddit "public endpoint fallback"
   text in `.env.example` (the fallback was removed in July 2026; the code
   comment at the top of `lib/complaint-finder.ts` confirms).
7. `docs/LAUNCH_RUNBOOK.md` — add a "LIVE-mode flip checklist" section.

## Step-by-step implementation order

### Step 1 — idempotency model

```prisma
model StripeWebhookEvent {
  id        String   @id            // Stripe event id, e.g. evt_...
  type      String
  createdAt DateTime @default(now())
}
```
`pnpm exec prisma db push` + `pnpm exec prisma generate`.

### Step 2 — webhook hardening (`app/api/stripe/webhook/route.ts`)

After signature verification succeeds and BEFORE the switch statement:
```ts
try {
  await prisma.stripeWebhookEvent.create({ data: { id: event.id, type: event.type } });
} catch (err) {
  if (isPrismaUniqueViolation(err)) return NextResponse.json({ received: true }); // replay → ack, skip
  throw err;
}
```
(`isPrismaUniqueViolation` = check `err.code === "P2002"` the same way other
files in this repo already do — grep for `P2002` and copy the pattern.)

Then extend the switch:
- `customer.subscription.paused` and `customer.subscription.resumed`: the event
  object is a subscription — reuse the exact status→plan mapping the
  `customer.subscription.updated` case uses (extract it to a small local helper
  so the three cases share one code path). Paused is not in ACTIVE_STATUSES so
  paused ⇒ free, resumed(active) ⇒ pro.
- `invoice.payment_failed`: do NOT change the plan (past_due already keeps pro as
  a deliberate grace period). Only `logger`-log it and `trackProductEvent`
  (`payment_failed`, no amounts in metadata) for the user resolved via
  `stripeCustomerId` — skip silently if no user matches. No emails (notifications
  are out of scope).
- Keep the default case silently ignoring everything else.
- Do not change the existing three cases' plan semantics.

### Step 3 — tighten `isBillingEnabled()`

In `lib/stripe.ts`, require all THREE: `STRIPE_SECRET_KEY`,
`STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_WEBHOOK_SECRET`. Effect: with a partial
config the pricing page shows its existing "payments coming soon" state instead
of selling checkouts that can never fulfill. Check `app/pricing/page.tsx` still
renders sensibly for the disabled state (it already has that branch).

### Step 4 — auth client baseURL

In `lib/auth-client.ts`: if `NEXT_PUBLIC_APP_URL` is set, pass it as baseURL;
if unset, pass NO baseURL at all so the Better Auth client defaults to the
same origin (this is the documented client default — verify against the
installed `better-auth` package docs/types, not memory). Never default to a
hardcoded localhost string.

### Step 5 — boot-time env sanity (`instrumentation.ts`)

Next.js supports a root `instrumentation.ts` with an exported `register()` that
runs once per server boot — verify the exact convention in
`node_modules/next/dist/docs/` first. Inside, WARN (console.warn via
`lib/logger.ts` if it fits) — never throw, never crash:
- Always: missing `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GEMINI_API_KEY`.
- If exactly one/two of the three Stripe vars are set: "Stripe partially
  configured — billing disabled until all three are set."
- If `RIFT_BETA_MODE=invite_only` and `RIFT_ADMIN_EMAILS` empty: "No admins
  configured — everyone will be locked out."
- If any `NicheWatch` feature envs matter: missing `CRON_SECRET` ⇒ "niche
  watches will never run."
- If `NODE_ENV=production` and `NEXT_PUBLIC_APP_URL` unset ⇒ info-level note.
Guard everything so a missing env never makes `register()` itself throw. Do not
import Prisma or anything heavy here — string checks on `process.env` only.

### Step 6 — docs

- `.env.example`: add `NEXT_PUBLIC_APP_URL` (documented as optional, "set to the
  deployed origin on Vercel; leave unset for same-origin default"), and fix the
  stale Reddit fallback sentence.
- `docs/PROJECT_CONTEXT.md`: add `NEXT_PUBLIC_APP_URL` to the env table.
- `docs/LAUNCH_RUNBOOK.md`: append a short "Flipping Stripe to LIVE" checklist:
  swap the three Stripe env vars to live values on Vercel; create the live-mode
  webhook endpoint pointing at `/api/stripe/webhook` and copy its signing
  secret; send a test event from the Stripe dashboard; confirm a
  `StripeWebhookEvent` row appears; confirm `isBillingEnabled` states on
  /pricing.

## Edge cases a weaker model would miss

- **Ack replays with 200, not 4xx/5xx.** Returning an error for a duplicate
  makes Stripe retry forever and eventually flags the endpoint unhealthy.
- **The idempotency insert must come AFTER signature verification** — otherwise
  an attacker who can't forge signatures could still pollute the table.
- **Out-of-order events remain possible** (e.g. `updated(active)` delivered after
  `deleted`). This plan deliberately does NOT add ordering logic — note it as a
  known accepted risk in the code comment; the table gives replay protection
  only. Do not invent timestamp comparisons; `planUpdatedAt` is bumped on every
  write and cannot be used for ordering.
- **`past_due` keeping pro is intentional** (grace period). Do not "fix" it.
- **Webhook route runs without a user session** — `trackProductEvent` needs a
  userId; the existing code resolves it from `stripeCustomerId`. If no user is
  found, skip tracking; never throw (a throw makes Stripe retry the event, and
  the idempotency row now exists, so the retry would be SKIPPED — meaning a
  throw after the insert loses the event forever. Therefore: insert the
  idempotency row, then wrap the switch body in try/catch that logs and still
  returns 200 unless the error happened before any plan write could matter — the
  safest simple contract: keep plan writes as the FIRST thing in each case, and
  treat post-write failures as non-fatal).
- **`instrumentation.ts` runs in multiple runtimes** (node + edge) in some Next
  configs — check the docs; if needed, guard with
  `process.env.NEXT_RUNTIME === "nodejs"`.
- **Local `.env` points at the production database.** Do not fire test webhooks
  locally against it. Verify replay-skip logic with `stripe` CLI test events on
  the TEST-mode keys only, or by code review + unit-style reasoning.

## Acceptance criteria

- [ ] Replaying the same Stripe TEST event twice produces one
      `StripeWebhookEvent` row and one plan write (second delivery returns 200
      with no write).
- [ ] With only two of three Stripe env vars set, /pricing shows the
      billing-disabled state and `createCheckoutSession` refuses politely.
- [ ] `lib/auth-client.ts` contains no hardcoded localhost fallback.
- [ ] Boot log on `npm run dev` shows env warnings when a key var is missing
      (temporarily unset one locally to see it, then restore).
- [ ] `.env.example` documents `NEXT_PUBLIC_APP_URL`; the stale Reddit fallback
      sentence is gone; PROJECT_CONTEXT env table updated.
- [ ] `User.plan` is still written in exactly one file (grep `plan:` writers).
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass.
