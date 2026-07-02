# Rift — AI Agent Instructions

> Read this file **before** touching the Rift codebase. Then read `docs/PROJECT_CONTEXT.md` for the architecture and `docs/ROADMAP.md` for which milestone you are on.

---

## Before you write any code

1. Read `AGENTS.md` at the project root.
2. Read every doc in `docs/`:
   - `docs/PROJECT_CONTEXT.md`
   - `docs/ROADMAP.md`
   - `docs/AI_AGENT_INSTRUCTIONS.md` (this file)
   - `docs/TESTING_CHECKLIST.md`
3. Inspect the actual files relevant to the current task. The real code is the source of truth — never trust only the chat history or the docs alone.
4. Confirm which milestone you are on by checking `docs/ROADMAP.md`. Do not start a future milestone without an explicit user prompt.
5. Read the bundled Next.js docs: `node_modules/next/dist/docs/` (the project's `AGENTS.md` mandates this — Next.js 16 has breaking changes versus your training data).

---

## Editorial rules

### Inspect, do not assume
- The project's runtime versions matter: Next.js 16.2.9, React 19.2.4, Prisma 7.8.0 (driver-adapter mode), Tailwind CSS v4, Zod 4. APIs in these versions differ from older versions you may remember. Verify against the installed packages before writing code.
- Prefer reading the actual file over guessing its contents.
- If a referenced file does not exist, say so explicitly in your final report and continue with the rest of the task.

### Extend, do not rebuild
- Extend existing components instead of replacing them.
- Do not refactor code that is unrelated to the current milestone.
- Do not move files unless the milestone explicitly asks for it.
- Do not rename components unless a TypeScript or lint fix requires it.
- Preserve all existing functionality. A "polish" milestone is **not** a UI redesign.
- Do not introduce dead code. If you remove functionality, remove its imports and helpers too.

### Keep it small and typed
- Strict TypeScript only. No `any` unless a third-party type genuinely requires it.
- Keep files small. None should exceed roughly 300 lines unless the task inherently requires it.
- Reusable code goes in `lib/` (pure helpers) or `components/` (UI). Don't duplicate logic.
- Stick to the existing folder structure (`app/`, `components/`, `lib/`, `actions/`, `prisma/`).

### Design language
- Use the existing design tokens defined in `app/globals.css` — background `#09090B`, card `#18181B`, border `#27272A`, primary `#2563EB`, success/warning/danger, radius 12px, spacing scale 4/8/12/16/24/32/48, type scale 48→12.
- Inter font via `next/font/google` is already wired. Do not introduce another font.
- Lucide icons only. Do not add custom SVG illustrations or emoji.
- No Framer Motion on dashboard / detail pages. The Hero on the landing page is the only place Framer Motion is allowed, and it must stay subtle (no excessive animation).
- Hover/transitions: `duration-150 ease-out` only (per M5 convention). Do not introduce longer durations.

### Server vs client
- Default to Server Components. Mark a file `"use client"` only when it uses React state, effects, event handlers, `useActionState`, `useRouter`, browser-only APIs, or Framer Motion.
- Never import `process.env.DATABASE_URL` or `process.env.GEMINI_API_KEY` from a `"use client"` file. (Audit this before committing — see Security below.)
- Server actions live in `actions/*.ts` and start with `"use server"`. They use `revalidatePath` to refresh routes after mutations.

---

## Hard "do not" rules

Do **not** do any of the following unless a future milestone explicitly asks:

- **Do not change the Gemini prompt** in `lib/ai.ts`. The prompt deliberately forbids inventing market stats and instructs Gemini not to compute the score.
- **Do not change the scoring logic** in `lib/scoring.ts`. The weights (0.40 / 0.35 / 0.25) and the log10 scaling for complaint count are frozen — the same dataset must always produce the same score.
- **Do not change the CSV upload pipeline** in `actions/complaints.ts` / `components/complaints/csv-uploader.tsx`. The Zod schema in `lib/schemas.ts` is intentional (empty title/sourceDate strings are treated as absent).
- **Do not change the cleaning logic** in `lib/cleaning.ts`.
- **Do not change the search / filter / sort / save logic** in `OpportunityBrowser`, `OpportunityFilters`, or `actions/saved.ts`. Polish (aria labels, focus styles) is OK; behaviour changes are not.
- **Do not modify the Prisma schema unless the milestone explicitly requires it.** If a milestone genuinely needs a new column, model, or index, run `pnpm exec prisma db push` — never run destructive commands (see Database safety below).
- **Do not remove the driver-adapter setup.** Keep `lib/db.ts` using `new PrismaPg({ connectionString: process.env.DATABASE_URL })` and `new PrismaClient({ adapter })`. Do not revert to the legacy Prisma engine.
- **Do not move `DATABASE_URL` back into `prisma/schema.prisma`.** The URL lives in `prisma.config.ts`; the schema keeps only the `provider`.
- **Do not change `package.json` `build` script** (`prisma generate && next build`). The Prisma client output is gitignored and must be regenerated on every build (local + Vercel).
- **Do not run any destructive database command.** See Database safety below.
- **Do not add new dependencies** unless the milestone lists them explicitly. No auth libraries, no billing SDKs, no UI kits, no notification services.
- **Do not introduce authentication, billing, teams, notifications, or automatic scraping.** These are post-MVP ideas only — see `docs/ROADMAP.md`.
- **Do not continue automatically past a milestone boundary.** Each milestone ends by reporting modified/new files and waiting for user confirmation.

---

## Database safety

Allowed commands:
- `pnpm exec prisma generate` (regenerate the TypeScript client)
- `pnpm exec prisma validate` (lint the schema)
- `pnpm exec prisma db push` (apply a schema change non-destructively — only when the milestone explicitly needs it)

Forbidden commands — never run these:
- `prisma db push --force-reset`
- `prisma migrate reset`
- `DROP TABLE`, `DROP DATABASE`, `TRUNCATE`
- Any command that deletes user data or wipes the local database

If you encounter stale data while developing, prefer the app's own `resetOpportunities` action (which preserves complaints) over wiping tables.

---

## Security rules

- `.env` is gitignored via `.gitignore` (`.env*` + `!.env.example`). Never modify `.gitignore` to allow committing `.env`.
- Use `.env.example` for placeholder values only — never real credentials.
- When you need to demonstrate an env var in a doc or comment, use placeholders:
  - `GEMINI_API_KEY="your_gemini_api_key_here"`
  - `DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"`
- Never print env values to the terminal, to logs exposed to users, or to error messages returned to the client.
- The current `lib/logger.ts` only logs stage transitions and error messages — it does not log env values. Keep it that way.
- If you accidentally discover a secret in the chat or a file, do not echo it back to the user.

---

## When you complete a task

Report, in this order:
1. Every modified file (with a one-line summary of what changed).
2. Every new file (with its purpose).
3. Every deleted file.
4. Any Prisma migration created and why — or explicit confirmation that none was needed.
5. Any new dependency added and why.
6. How to test the new behaviour (commands + expected observations).
7. Confirmation that:
   - the AI pipeline was not modified,
   - the upload pipeline was not modified,
   - the scoring logic was not modified,
   - the search/filter/sort/save logic was not modified (unless the milestone explicitly authorised it),
   - no secrets were exposed,
   - `pnpm exec tsc --noEmit` passes,
   - `pnpm lint` passes,
   - `pnpm build` passes (or the only blocker is a clearly identified missing local env var).
8. Then STOP and wait for confirmation. Do not start the next milestone.

---

## Out-of-scope features (do not add)

These are explicitly out of scope for the MVP. Do not start them without an explicit user-issued milestone prompt:

- Authentication / user accounts
- Billing / subscriptions / Stripe
- Multi-user teams / workspaces
- Email or in-app notifications
- Automatic scraping or data ingestion
- Real-time product analytics dashboard
- Market-size or competition signals beyond what's already stored
- Custom favicon / brand logo / illustrations
- Multi-language / i18n
- Light-mode toggle MVP (dark mode is the default — implementation is intentionally deferred)
- AI prompt experimentation
- Per-user saved state

If the user asks for any of the above, first confirm whether they want it under the current milestone or as a new milestone, then update `docs/ROADMAP.md` accordingly before writing code.