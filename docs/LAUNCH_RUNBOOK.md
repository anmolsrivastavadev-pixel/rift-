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

- Privacy policy + Terms pages and footer links to them.
- A custom domain and updated `BETTER_AUTH_URL`.
- Decide pricing/limits (there is no billing in the app today).
- Revisit the known issues listed under M21 in `docs/ROADMAP.md`.
