# Rift — Private Beta Launch Runbook

The founder's ordered playbook for taking Rift from "deployed" to "real testers
using it". Do the steps in order. Companion doc: `docs/BETA_QA_CHECKLIST.md`
(the detailed test list referenced in Step 2).

---

## Step 1 — Set up Vercel environment variables

In Vercel → Project → Settings → Environment Variables (Production):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string, ending `?sslmode=require` (should already be set) |
| `GEMINI_API_KEY` | your Gemini key (should already be set) |
| `BETTER_AUTH_URL` | the production origin, e.g. `https://your-app.vercel.app` — **no trailing slash** (also used for social-card/sitemap URLs) |
| `BETTER_AUTH_SECRET` | long random secret (should already be set) |
| `RIFT_ADMIN_EMAILS` | **your email** (comma-separate to add more admins) |
| `RIFT_BETA_MODE` | `off` — leave off until Step 4 |
| `TAVILY_API_KEY` | optional but recommended — enables the complaint finder's whole-web source (free key from app.tavily.com) |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | optional — enables the finder's Reddit source from Vercel IPs (see `.env.example`) |

Then **Redeploy** (env changes only apply to new deployments).

Verify: sign in on production and check the sidebar shows **Beta insights**.
If it doesn't, `RIFT_ADMIN_EMAILS` isn't set correctly or the deploy didn't pick it up.

## Step 2 — QA production yourself (~30–45 min)

Run `docs/BETA_QA_CHECKLIST.md` top to bottom on the production URL.
You need a **throwaway second account** (any second email) for the items
marked **[2nd account]** — especially the security checks (forged
`?projectId=`, other user's idea URLs, admin page as non-admin).

Fix anything broken before inviting anyone. If something fails, note it and
ask for a fix — don't invite testers onto a broken flow.

## Step 3 — Do one full happy path yourself

On production, in one sitting: create a fresh project → "Use demo data" →
Find ideas → open the top idea → tick 2 checklist items → mark it Pursue on
Compare Ideas → Export report. This is exactly what you'll ask testers to do,
so it must feel smooth to you first.

## Step 4 — Flip to invite-only

1. Set `RIFT_BETA_MODE` = `invite_only` in Vercel → redeploy.
2. Confirm YOU still get in (admins bypass the gate).
3. Confirm the throwaway account now lands on `/beta-access` and sees its email.
4. In Beta insights → Beta access, add the throwaway email → reload as that
   account → it should get in (status flips to "Access active").

## Step 5 — Invite 3–5 testers

**Add each tester's email in Beta insights → Beta access BEFORE messaging
them.** The app sends no emails — the invite IS your message. Testers must
sign up with the exact email you added (case doesn't matter).

Message template:

> I'm testing Rift — it turns real customer complaints into scored business
> ideas. You're one of 5 people I'm inviting.
>
> 1. Go to <production URL> and create an account with THIS email address.
> 2. Create a project for a niche you know, add complaints (or use the
>    examples), and hit "Find ideas".
> 3. Poke around for 10 minutes. Use the "Feedback" button in the sidebar for
>    anything confusing, broken, or missing — brutal honesty helps most.

Pick testers who match the target user (beginners exploring business ideas),
not just friends who'll say it's nice.

## Step 6 — Watch week one

Check daily (5 min): **Beta insights**
- **Usage funnel** — where do people stop? Signed up but no project → onboarding
  problem. Added complaints but never generated → the "Find ideas" step isn't
  obvious enough. Generated but no decisions → Compare Ideas isn't landing.
- **Recent idea runs** — any `failed` runs? The AIRun row keeps a short error
  message; repeated failures usually mean a Gemini API/key/quota issue.
- **Feedback inbox** — reply to testers personally (you have their emails);
  fastest way to keep them engaged.

After a week, the feedback inbox + funnel decide what to build next.

## Step 7 — Rollback / access control

- Open the app to everyone again: `RIFT_BETA_MODE` = `off` → redeploy.
- Remove one person: Beta insights → Beta access → **Revoke access** (they're
  redirected to `/beta-access` on their next navigation; their data is kept).
- Re-admit them later: **Restore access**.
- Admins can never be locked out (the allowlist bypasses the gate).

## Before a PUBLIC launch (not needed for beta)

- ~~Privacy policy + Terms pages and footer links to them~~ — ✅ shipped in M27 (`/privacy`, `/terms`).
- A custom domain and updated `BETTER_AUTH_URL` (see "Going paid" Step 3 below).
- ~~Decide pricing/limits~~ — ✅ shipped in M25/M26 (Pro $9/mo; free limits enforced app-side).
- Revisit the known issues listed under M21 in `docs/ROADMAP.md`.

---

# Going paid (M25–M29 activation)

Everything below is ALREADY BUILT and key-gated: the app runs exactly as
before until you paste keys into Vercel. Do the steps in order.

## Step 0 — REQUIRED: apply the database schema

The M25–M29 code adds columns to `User` and a new `ShareLink` table. Vercel's
build does NOT change the database, so until you run this, the deployed code
will error on sign-in and dashboard pages.

From the project folder on your computer (your `.env` points at Neon):

```
pnpm exec prisma db push
pnpm exec prisma generate
```

This is **additive only** — no data is deleted or changed. Run it once,
before (or immediately after) merging the M25–M29 pull request.

## Step 1 — Resend (password reset emails), ~5 minutes

1. Sign up at https://resend.com (free tier: 100 emails/day — plenty).
2. Dashboard → **API Keys** → Create API Key (Full access) → copy it.
3. Vercel → your project → Settings → Environment Variables → add
   `RESEND_API_KEY` = the key → **Redeploy**.
4. That's it: the "Forgot password?" link appears on sign-in and reset emails
   send from Resend's shared `onboarding@resend.dev` sender. (Branded sender
   comes in Step 3.)

## Step 2 — Stripe in TEST mode, ~15 minutes

1. Create an account at https://dashboard.stripe.com. Stay in **Test mode**
   (toggle in the top-right).
2. **Product catalog → Add product**: name "Rift Pro", price **$9.00 USD,
   Recurring, Monthly** → Save. Click the price and copy the id
   (`price_...`).
3. **Developers → API keys** → copy the **Secret key** (`sk_test_...`).
4. Vercel → Environment Variables → add:
   - `STRIPE_SECRET_KEY` = the secret key
   - `STRIPE_PRICE_PRO_MONTHLY` = the price id
   → **Redeploy**. The pricing page now shows a real Upgrade button.
5. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-DOMAIN/api/stripe/webhook` (your live Vercel URL)
   - Events: `checkout.session.completed`,
     `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing secret** (`whsec_...`) → Vercel env var
     `STRIPE_WEBHOOK_SECRET` → **Redeploy**.
6. **Test the loop** (still test mode — no real money): sign in with a
   non-admin account → Pricing → Upgrade to Pro → pay with card
   `4242 4242 4242 4242`, any future date, any CVC → you land back on the
   dashboard → Pricing shows "You're on Pro" and the caps are lifted.
   Then **Manage subscription → Cancel** → within a minute the account is
   back on Free.
7. When you're ready to charge real money: flip Stripe to **Live mode**,
   repeat steps 2–5 with the live product/keys/webhook, and replace the four
   values in Vercel.

## Step 3 — Custom domain + branded email (whenever you buy one)

1. Vercel → project → Settings → **Domains** → add your domain, follow the
   DNS instructions.
2. Vercel env var `BETTER_AUTH_URL` = `https://yourdomain.com` → Redeploy.
   (Metadata, share links, and checkout return URLs all derive from it.)
3. Resend → **Domains** → Add domain → add the DNS records it shows → once
   verified, set Vercel env var `EMAIL_FROM` = `Rift <hello@yourdomain.com>`
   → Redeploy.
4. Stripe → Developers → Webhooks → update the endpoint URL to the new
   domain (or add a second endpoint and delete the old one).

## Step 4 — QA the paid features

Run the four new sections at the bottom of `docs/BETA_QA_CHECKLIST.md`
(pricing + quotas, legal + reset, billing test mode, share links + print).
