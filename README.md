# Rift

Rift helps founders find and test business ideas using real customer complaints instead of guesses.

Type a market (like "dog grooming") and Rift's built-in finder collects real complaints about it from seven public sources. Or paste your own reviews, support messages, and feedback. Gemini-powered AI groups the complaints that describe the same problem, and each group becomes a business idea with a transparent 0-100 score computed by a fixed formula (never by the AI). Every idea links back to the original complaints, so you can check the evidence yourself.

Live at: https://rift-fawn.vercel.app

## What it does today

- **Accounts and projects.** Sign up with email and password (Better Auth). Organise research into separate projects, one per market or niche.
- **Complaint finder.** Type a market and Rift searches the web, Reddit, app reviews, Hacker News, GitHub issues, Stack Exchange, and YouTube comments for real complaints. Each source is optional and key-gated; sources without keys quietly sit out.
- **Bring your own data.** Upload a CSV, paste text, or drop in a .txt/.md file. Even 5-10 sentences is enough to start.
- **AI clustering.** Gemini groups complaints that describe the same underlying problem and summarises each group. It never invents market statistics.
- **Deterministic scoring.** Each idea gets a 0-100 score from a fixed formula (frequency, severity, consistency). The same complaints always give the same score. The AI never computes the score.
- **Validation tools.** A per-idea validation workspace with a checklist and copyable research brief, an evidence log, Pursue / Park / Reject decisions, and side-by-side comparison of 2-3 ideas.
- **Sharing.** Create a revocable public share link for an idea.
- **Weekly niche watch.** Rift can watch a niche and email you (via Resend) when new complaints appear, powered by a Vercel cron job.
- **Billing.** Free plan plus Rift Pro at £9/month via Stripe. All billing code is key-gated: without Stripe keys the pricing page shows "payments coming soon" and no billing code runs.

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 (warm cream "doodle" theme, Nunito + Baloo 2 fonts)
- **Auth:** Better Auth (email + password, password reset via Resend)
- **Database:** PostgreSQL (Neon in production) + Prisma ORM 7 in driver-adapter mode
- **AI:** Google Gemini (`@google/genai`)
- **Billing:** Stripe (subscription, webhook-driven)
- **Email:** Resend
- **Charts:** Recharts. **CSV parsing:** PapaParse. **Validation:** Zod.

## Environment variables

Copy `.env.example` to `.env` and fill in real values. Never commit `.env` (it is gitignored).

Core (required for the app to run):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (local Postgres, or Neon pooled URL with `?sslmode=require`) |
| `GEMINI_API_KEY` | Google Gemini API key, from https://aistudio.google.com/apikey |
| `BETTER_AUTH_URL` | App origin with no trailing slash |
| `BETTER_AUTH_SECRET` | Long random secret for sessions and tokens |

Optional, key-gated features (the app runs without them; the matching feature switches off politely): `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` / `REDDIT_USER_AGENT` (Reddit source), `TAVILY_API_KEY` (whole-web source), `YOUTUBE_API_KEY` (YouTube source), `RESEND_API_KEY` / `EMAIL_FROM` (password reset + watch emails), `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_PRO_MONTHLY` (billing), `CRON_SECRET` (weekly niche watch), `RIFT_ADMIN_EMAILS` / `RIFT_BETA_MODE` / `NEXT_PUBLIC_SUPPORT_EMAIL` (admin page + beta gate), `NEXT_PUBLIC_APP_URL` (browser auth origin on Vercel).

Full setup instructions for every key live as comments in `.env.example`.

## Local setup

1. Install Node.js 18.18+ and pnpm.
2. Install PostgreSQL locally (create a database named `rift`), or create a free Neon project at https://neon.tech and use its pooled connection string.
3. `pnpm install`
4. Copy `.env.example` to `.env` and fill in at least the four core variables.
5. `pnpm exec prisma generate` then `pnpm exec prisma db push` (creates the typed client and the tables).
6. `pnpm dev` and visit http://localhost:3000.

## How to use Rift

1. Sign up, then create a project for the market you want to research.
2. On the Complaints page, either type a market and let the finder collect complaints, or upload/paste your own (`sample_complaints.csv` in the project root has 10 fake complaints for a quick test).
3. On the Ideas page, run the AI engine. Ideas appear as scored cards you can search, filter, and sort.
4. Open an idea for the full breakdown: AI reasoning, score breakdown, example complaints with source links, validation workspace, and evidence log.
5. Record a Pursue / Park / Reject decision, compare shortlisted ideas side by side, and save favourites.

## Deploy to Vercel

1. Push the repo to GitHub (`.env` stays out; `.gitignore` covers it).
2. Create a Vercel project from the repo. Leave the default build command (`package.json` already runs `prisma generate && next build`).
3. Add the environment variables in Vercel project settings. Use the Neon pooled `DATABASE_URL` and set `BETTER_AUTH_URL` to the deployed origin.
4. For Stripe, add the webhook endpoint `https://YOUR-DOMAIN/api/stripe/webhook` (events listed in `.env.example`) and set the three Stripe variables.
5. For the weekly niche watch, set `CRON_SECRET`; the cron schedule is defined in `vercel.json`.

## Common errors and fixes

- **Prisma error about an undefined URL at boot:** `DATABASE_URL` is missing from `.env` or Vercel env vars.
- **`Cannot find module '@/lib/generated/prisma/client'`:** run `pnpm exec prisma generate`. The generated client is gitignored and must be created on every machine; the `build` script already does this.
- **AI run returns a mock/no-key note:** `GEMINI_API_KEY` is missing.
- **Connection refused on `localhost:5432`:** local PostgreSQL is not running. On Windows: `Get-Service postgresql-*` then `Start-Service postgresql-x64-16`.
- **A finder source shows "not configured":** that source's optional API key is missing; see `.env.example`.

## Documentation

The full internal docs live in `/docs`:

- `docs/PROJECT_CONTEXT.md` covers the architecture, database models, AI pipeline, scoring algorithm, and env vars in depth.
- `docs/ROADMAP.md` tracks milestones.
- `docs/AI_AGENT_INSTRUCTIONS.md` and `docs/TESTING_CHECKLIST.md` govern how AI coding agents work on this repo.

## Development scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Start the dev server (Turbopack) on port 3000 |
| `pnpm build` | Generate Prisma client + production build |
| `pnpm start` | Start the production server (after `build`) |
| `pnpm lint` | Run ESLint |

## License

Private project. All rights reserved.
