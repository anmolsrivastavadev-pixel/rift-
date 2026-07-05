# Rift — Project Context

> Single source of truth for what Rift is, how it is built, and where the moving parts live. Future AI coding sessions should read this before touching the codebase.

---

## What Rift is

Rift is an **AI-powered market research tool that helps founders discover business ideas from real customer pain.**

It takes customer complaints (uploaded as CSV, pasted text, or text files), runs them through Google Gemini to cluster similar complaints into groups, summarises each group into a business problem, and scores each resulting opportunity 0–100 using a deterministic, transparent algorithm. Founders then browse, filter, sort, save, and inspect opportunities that are grounded in real customer text — not invented market stats.

**One sentence pitch:** _Rift helps founders discover business ideas from real customer pain._

**Key positioning:**
- Find business ideas from real customer pain.
- Add complaints, reviews, support tickets, or use demo data. Rift groups repeated problems into business idea hypotheses you can inspect, test, and compare.
- No complaints yet? Use the demo data, then collect your own from app reviews, Reddit posts, support tickets, or things people say in real life. Even 5–10 sentences is enough.
- Today, Rift works from data you provide. Public-source scanning from Reddit, reviews, and forums is a future direction.

---

## Who Rift is for

- **Founders** looking for validated software ideas grounded in real customer pain.
- **Beginners** who have never started a business — Rift explains what complaints are, where to find them, and how to test an idea before building anything.
- Anyone who has (or can collect) a list of customer complaints, reviews, or feedback and wants to know which problems are worth solving next.

Rift is **not**:
- a dental-only product,
- an agent for billing/auth/teams,
- an automatic scraper — you collect complaints manually (copy and paste works).

---

## Core product flow

```
Sign in
  → Select or create a Project / Market Test
  → CSV upload, paste text, .txt/.md file, or Use demo data
  → Complaints stored
  → Run AI clustering (Gemini)
  → Opportunities created with deterministic 0–100 scores
  → Browse/search/filter/sort opportunities
  → Save/bookmark opportunities
  → Open detail page (AI reasoning + breakdown + related + prev/next)
  → Validation Workspace (checklist + copy brief)
  → Validation Evidence Log (aggregate evidence tracking)
  → Compare Ideas board (decide: Pursue / Park / Reject)
  → Start fresh test (clear current project for a new niche)
  → Deploy to Vercel + Neon
```

Rift uses all complaints currently in the selected project. To test one niche cleanly, create/select a separate project or start fresh inside the current project.

Score is **never** computed by Gemini. Gemini only provides severity (1–10) and confidence (0–100). The app computes the final 0–100 score in `lib/scoring.ts` so the same dataset always yields the same score.

---

## Current tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"`, CSS-first config) |
| UI primitives | custom shadcn-style (Button, Card, Badge) on `@radix-ui/react-slot` |
| Icons | `lucide-react` |
| Animation | Framer Motion 12 (used only on the landing hero), CSS/Tailwind transitions everywhere else |
| Charts | Recharts 3 (used on dashboard "Complaints over time") |
| CSV parsing | PapaParse 5 |
| Validation | Zod 4 |
| ORM | Prisma 7.8.0 in **driver-adapter mode** (`@prisma/adapter-pg` + `pg`) |
| Database | PostgreSQL (local Postgres 16 for dev; **Neon** pooled with `?sslmode=require` for production) |
| AI | Google Gemini via `@google/genai` 2.10.0 — model `gemini-2.5-flash` (overridable via `GEMINI_MODEL`) |
| Deployment | Vercel |

---

## Folder structure

```
app/                     Next.js App Router routes
├─ layout.tsx            Root layout: Inter font, dark theme, metadata + OG + Twitter
├─ page.tsx              Landing page (Hero, Features, How-it-works, WhyComplaints, Footer)
├─ robots.ts             robots.txt — allows "/", disallows "/dashboard"
├─ sitemap.ts            sitemap.xml — only "/"
├─ not-found.tsx         Global 404
├─ error.tsx             Global error boundary
└─ dashboard/
   ├─ layout.tsx         Sidebar shell (Home/Complaints/Ideas/Compare Ideas/Saved) + project selector
   ├─ page.tsx           Overview: Start here card, 4 KPI cards, complaints-over-time chart, recent list
   ├─ complaints/
   │  ├─ page.tsx        Upload UI + complaints list + search (?q=) + Why complaints? section
   │  ├─ loading.tsx
   │  └─ error.tsx
   ├─ opportunities/
   │  ├─ page.tsx        AI engine + OpportunityBrowser (client-side search/filter/sort)
   │  └─ [id]/
   │     ├─ page.tsx     Detail page (header, summary, AI reasoning, example
   │     │               complaints, score breakdown, Product Opportunity,
   │     │               keywords, related, prev/next, sticky right column)
   │     ├─ loading.tsx
   │     └─ not-found.tsx
   └─ saved/page.tsx     Saved ideas

components/
├─ ui/                   Button, Card, Badge (cva + cn())
├─ container.tsx         max-w wrapper
├─ dashboard/            stat-card, complaints-chart (Recharts), shell, founder-command-client
├─ complaints/           csv-uploader, complaints-input (tabs), text-input (paste/file),
│                        import-summary, complaints-list, complaints-table, complaint-search,
│                        start-fresh-button (client component for workspace clearing)
├─ landing/              hero, features, how-it-works, why-complaints, footer
└─ opportunities/        opportunity-card, opportunity-browser, filters, save-button,
                         related-opportunity-card, no-related-empty, prev-next-nav,
                         example-complaints, complaint-body, empty-states, run-button,
                         market-gap-hypothesis (M9), validation-workspace + validation-checklist
                         + copy-validation-brief (M10), decision-board-client +
                         decision-status-select (M11), validation-evidence-log (M12)

lib/
├─ db.ts                 Prisma client singleton (driver-adapter mode)
├─ projects.ts           Project ownership helpers + project-aware href helper
├─ ai.ts                 Single Gemini service: clustering + summaries, batching, merge
├─ ai-schema.ts          Zod schema for Gemini JSON output
├─ cleaning.ts          Stage 1: normalise + dedupe complaints
├─ scoring.ts            Deterministic Opportunity Score (0–100)
├─ logger.ts            Structured JSON server logs
├─ progress.ts          In-memory job progress tracker (TTL 10 min)
├─ opportunity-relations.ts  selectRelated + selectPrevNext (pure helpers)
├─ schemas.ts           Zod schema for CSV rows + UploadResult
├─ utils.ts             cn() (clsx + tailwind-merge)
├─ text-import.ts       Pure paste/text-file parser → Complaint rows (M8)
├─ validation-plan.ts   Pure deterministic helpers for M10 validation workspace
├─ decision-board.ts    Pure deterministic helpers for M11 decision board
├─ validation-evidence.ts  Pure deterministic helpers for M12 evidence log
├─ prompts.ts            ⚠ LEGACY/UNUSED — dental-specific prompts from an earlier
├─ generated/prisma/    Prisma client output (gitignored — regenerated at build)

actions/
├─ complaints.ts        project-scoped uploadComplaints, loadDemoComplaints, importTextComplaints
├─ opportunities.ts    runPipeline, getProcessingStatus, resetOpportunities,
│                       resetOpportunitiesAction (project-scoped)
├─ projects.ts          createProject (M16A) + renameProject (M16B1) + archive/unarchive (M16B2) + deleteArchivedProject (M16B3), duplicate-name validation
├─ saved.ts             project-scoped saveOpportunity, unsaveOpportunity, saveAction, unsaveAction
├─ validation.ts        M16C DB-backed Validation Workspace: setDecisionStatus, saveValidationChecklist, migrateValidationState
└─ workspace.ts         clearWorkspace (start fresh test — clears current project data)

prisma/
├─ schema.prisma
└─ (migrations/ — created on first `prisma migrate dev`)

scripts/
└─ backfill-default-projects.ts  M16A one-off nullable projectId backfill

public/
├─ sample_complaints.csv  10 fake complaints — served as a static asset
└─ *.svg                  scaffold SVGs (unchanged)
```

> **`lib/prompts.ts`** is a leftover file with dental-SaaS-specific prompts that is **not imported anywhere** in the current pipeline. Future milestones may delete it; do not depend on it. The active AI pipeline lives entirely in `lib/ai.ts`.

---

## Database models (as actually defined in `prisma/schema.prisma`)

Rift now has auth and project-scoped market tests:

- `User` — Better Auth user plus relations to sessions/accounts/projects and owned app data.
- `Session`, `Account`, `Verification` — Better Auth tables. Do not change auth config for M16A work.
- `Project` — M16A project / market test. Required `userId`, `User` relation with `onDelete: Cascade`, optional `description`, `createdAt`, `updatedAt`, and `@@index([userId])`. M16B2 added nullable `archivedAt` (`null` = active, set = archived/hidden; all related data is preserved).
- `Complaint` — complaint row with nullable `userId` and nullable `projectId` during the M16A migration. `projectId` has an optional `Project` relation with `onDelete: SetNull` and `@@index([projectId])`.
- `Opportunity` — generated idea row with nullable `userId` and nullable `projectId` during the M16A migration. `projectId` has an optional `Project` relation with `onDelete: SetNull` and `@@index([projectId])`.
- `SavedOpportunity` — saved/bookmarked idea with nullable `userId` and nullable `projectId` during the M16A migration. It keeps `@@unique([userId, opportunityId])`, has `@@index([projectId])`, and its project relation uses `onDelete: SetNull`.
- `ValidationWorkspace` — M16C database-backed Validation Workspace state: one row per user per opportunity (`@@unique([userId, opportunityId])`) holding `decisionStatus` ("undecided" | "pursue" | "park" | "reject"), `validationChecklist` (Json `boolean[]` mirroring `VALIDATION_CHECKLIST_ITEMS`), and a reserved nullable `validationEvidence` Json column (the evidence-log UI was removed in an earlier UX patch). All three relations (`user`, `project`, `opportunity`) use `onDelete: Cascade`, so M16B3 permanent project delete removes validation state automatically.

All application reads/writes for complaints, opportunities, and saved opportunities must filter by both `userId` and the selected `projectId`. Legacy rows with `userId = null` are left alone by the M16A backfill. There is still no `UploadHistory` table; upload history remains future work.

Validation Workspace state (testing checklist + decision status) is database-backed since M16C: pages load it server-side and pass it into the client components, writes go through `actions/validation.ts` (checklist writes are debounced client-side). localStorage is used ONLY by the one-time migrator (`components/dashboard/validation-state-migrator.tsx`), which copies old `rift-opportunity-decision-*` / `rift-validation-checklist-*` keys into the DB on first dashboard load per user per browser — inserting only rows that don't exist yet, never overwriting database data.

---

## Prisma setup (modern, driver-adapter mode)

- `prisma/schema.prisma` keeps only the `provider` in `datasource db {}`. The URL is **never** in the schema.
- `prisma.config.ts` loads `.env` via `import "dotenv/config"` and exposes `datasource.url: env("DATABASE_URL")`.
- `lib/db.ts` instantiates the client:
  ```ts
  new PrismaPg({ connectionString: process.env.DATABASE_URL })
  new PrismaClient({ adapter })
  ```
- Generated client output lives at `lib/generated/prisma/` and is **gitignored** — it is regenerated by the `build` script (`prisma generate && next build`).
- `prisma generate --no-engine` is **not supported** by Prisma 7.x (confirmed via `prisma generate --help`). The standard `prisma generate` is the correct command and works with the driver adapter.

## PostgreSQL setup

- **Local dev:** PostgreSQL 16 running on `localhost:5432`, default `postgres/postgres` credentials, database `rift`. Connection string used: `postgresql://postgres:postgres@localhost:5432/rift?schema=public`.
- **Production:** Neon Postgres pooled connection string, with `?sslmode=require` appended. Vercel env var `DATABASE_URL` carries it.

## Gemini setup

- One file owns all Gemini access: `lib/ai.ts` (per spec — "one AI service file only").
- SDK: `@google/genai` v2.10.0 (`new GoogleGenAI({ apiKey })` → `ai.models.generateContent({ model, contents, config: { responseMimeType: "application/json" } })`).
- Model: `gemini-2.5-flash` (overridable via `GEMINI_MODEL` env var).
- **Mock fallback:** when `GEMINI_API_KEY` is absent, `lib/ai.ts` falls back to `mockCluster()` — a deterministic local keyword-grouping heuristic. This keeps the pipeline runnable end-to-end during local dev without a key, produces stable clusters for UI work, and (M9) emits clearly-fake mock market-gap hypothesis fields prefixed "Mock …" so the M9 UI is exercisable without Gemini.
- Batching: complaints are split into batches of **100** before sending to Gemini to bound token usage and latency.
- Cross-batch merge: clusters across batches are merged if their keyword Jaccard similarity ≥ 0.5 (case-insensitive).
- JSON parsing: tolerant — accepts either a bare array `[{...}]` or `{clusters: [...]}`.
- Pipeline cap: 1500 complaints max per clustering run (configurable via `MAX_COMPLAINTS` in `lib/ai.ts`).

---

## Scoring logic (`lib/scoring.ts`)

The Opportunity Score is **deterministic and computed locally**. Gemini never sees it.

```ts
final = round(
  countScore     * 0.40 +
  severityScore  * 0.35 +
  confScore      * 0.25
)
// clamped to 0..100
```

Where:
- `countScore = clamp(round(50 * log10(count + 1)))` — 1 complaint ≈ 15, 10 ≈ 52, 100 ≈ 100.
- `severityScore = clamp(round(((severity - 1) / 9) * 100))` — severity 1 → 10, 10 → 100.
- `confScore = clamp(round(confidence))` — already 0..100.

The full breakdown (`weights`, `inputs`, `subscores`, `final`) is stored on the `Opportunity.scoreBreakdown` JSON column so the detail page can render each contribution as a progress bar.

> Do NOT change these weights or the formulas unless a future milestone explicitly instructs you to. The same dataset must always yield the same score.

---

## AI pipeline (`lib/ai.ts` + `actions/opportunities.ts`)

`runPipeline(formData)`:
1. Verifies the signed-in user and selected project, then loads that user's complaints for the current project.
2. **Stage 1 — cleaning** (`lib/cleaning.ts`): normalise whitespace, drop rows <3 chars or duplicates.
3. **Stage 2 — clustering** (`lib/ai.ts:clusterComplaints`): batch Gemini calls; tolerant JSON parse; cross-batch merge.
4. **Stage 3 — opportunity generation**: for each cluster, link its complaints, compute the Opportunity Score locally, build the trend `[{date, count}]`, persist an `Opportunity` row (including the M9 market-gap hypothesis fields returned by Gemini — `marketGap`, `targetCustomer`, `likelyCurrentWorkarounds`, `whyWorkaroundsFallShort`, `productAngle`, `differentiationAngle`, `validationQuestions`, `riskFlags`; missing optional strings stored as `null`, `productAngle` falls back to `suggestedSoftware`), set `Complaint.opportunityId`.
5. **Stage 4 — revalidation**: `revalidatePath` for dashboard, opportunities, and complaints routes so caches refresh.
6. Progress is tracked in `lib/progress.ts` (in-memory, keyed by jobId, 10-min TTL) so the client `RunOpportunitiesButton` can poll `getProcessingStatus(jobId, projectId)` and render stages + progress bars.

The pipeline **deletes existing opportunities in the current project before inserting new ones** (re-run replaces stale data for that project only). Complaints themselves are preserved (only `opportunityId` is cleared then relinked).

> Do NOT change the Gemini prompt unless a future milestone explicitly instructs you to. Do NOT make Gemini compute the score.

---

## Current routes

Dashboard routes use query-param project routing in M16A: `?projectId=...`. If the query param is omitted, the user's oldest ACTIVE project is used (or `Default project` is created for first use / when every project is archived). Unowned project IDs must not expose data. Since M16B2, a URL pointing at the user's own ARCHIVED project redirects to `/dashboard`, which re-resolves to the oldest active project — archived projects never render as the current workspace.

| Route | Type | Renders |
|---|---|---|
| `/` | static | Landing page |
| `/dashboard` | static | Overview: KPI cards, chart, recent complaints, next-steps |
| `/dashboard/complaints` | dynamic | Upload UI + complaints list + search (?q=) |
| `/dashboard/opportunities` | static | AI engine + OpportunityBrowser (client-side search/filter/sort) |
| `/dashboard/opportunities/[id]` | dynamic | Detail page |
| `/dashboard/opportunities/decision-board` | static | Decision Board (M11) |
| `/dashboard/saved` | static | Saved opportunities grid |
| `/robots.txt` | static | Robots |
| `/sitemap.xml` | static | Sitemap (only `/`) |
| `/_not-found` | static | Global 404 (only renders when nothing more specific matches) |

---

## Current key components

- `ProjectSelector` (`components/dashboard/project-selector.tsx`) — client. Native select plus name-only new-project form. Uses server-provided project list/current default and navigates by changing `?projectId=...`.
- `OpportunityBrowser` (`components/opportunities/opportunity-browser.tsx`) — client. Holds all filter/sort/search state in `useState`; everything operates on the already-loaded dataset; **no DB calls** while interacting. Emits `aria-live` count.
- `OpportunityFilters` (`components/opportunities/filters.tsx`) — client. Search input, Industry select, 3 range sliders, sort select, Reset button. All inputs have `aria-label`s + visible focus.
- `OpportunityCard` (`components/opportunities/opportunity-card.tsx`) — server. Card with title, score (color-coded), industry, Product Opportunity (stored as `suggestedSoftware`), keywords (max 4), 3 mini-stats, save button, and a compact score helper line. Title uses `line-clamp-2`, Product Opportunity uses `line-clamp-1`. Hover animation: `hover:-translate-y-0.5 hover:shadow-md` (150ms ease-out).
- `SaveButton` (`components/opportunities/save-button.tsx`) — client. `useActionState` form. Toggle bookmark + save; `aria-pressed` + `aria-label`. Calls `saveAction`/`unsaveAction` from `actions/saved.ts`.
- `RunOpportunitiesButton` (`components/opportunities/run-button.tsx`) — client. Triggers `runPipeline`; renders ProgressPanel that polls `getProcessingStatus(jobId)` every 1 s; disables itself while pending.
- `PrevNextNav` (`components/opportunities/prev-next-nav.tsx`) — server. Prev/Next by `createdAt DESC`. Disabled states use `aria-disabled="true" role="link"` so screen readers announce them as intentionally disabled.
- `RelatedOpportunityCard` (`components/opportunities/related-opportunity-card.tsx`) — server. Mini card with `aria-label` describing the destination and shared keyword count.
- `ComplaintsChart` (`components/dashboard/complaints-chart.tsx`) — client Recharts bar chart, buckets by `sourceDate`.
- `CsvUploader` (`components/complaints/csv-uploader.tsx`) — client. Drag/drop + PapaParse + `useActionState`; **also** renders the "Download sample CSV" link (`/sample_complaints.csv`, `download` attribute) and a "Use demo data" form that calls `loadDemoComplaints`.

---

## Current server actions

| File | Actions |
|---|---|
| `actions/complaints.ts` | `uploadComplaints(prev, formData)`, `loadDemoComplaints(prev, formData)`, starter/demo actions, `importTextComplaints(prev, formData)`. All require a user and owned project. |
| `actions/opportunities.ts` | `runPipeline(formData)`, `getProcessingStatus(jobId, projectId)`, `resetOpportunities(formData)`, `resetOpportunitiesAction(formData)`. All require a user and owned project. |
| `actions/projects.ts` | `createProject(prev, formData)` (M16A), `renameProject(prev, formData)` (M16B1), `archiveProject(prev, formData)` and `unarchiveProject(prev, formData)` (M16B2). All verify ownership server-side. Create/rename trim the name, enforce required/max-60-char names, and reject duplicate project names per user (case-insensitive, app-level — no DB unique constraint). Archive sets `archivedAt`, refuses to archive the last active project ("You need at least one active project."), and redirects to the oldest remaining active project; unarchive clears `archivedAt` and redirects into the restored project. `deleteArchivedProject(prev, formData)` (M16B3) permanently deletes an ARCHIVED project only: it requires the user to type the project name exactly (`confirmName`), rejects active projects ("Archive this project before deleting it."), and deletes saved ideas → complaints → ideas → the project row in one transaction, every statement filtered by the current user's id and the project id. There is no undo. |
| `actions/saved.ts` | `saveOpportunity(prev, formData)`, `unsaveOpportunity(prev, formData)`, `saveAction(formData)`, `unsaveAction(formData)`. All require a user and owned project. |
| `actions/validation.ts` | M16C: `setDecisionStatus(opportunityId, status)`, `saveValidationChecklist(opportunityId, checked)`, `migrateValidationState(entries)`. All verify the opportunity belongs to the session user server-side before upserting the `ValidationWorkspace` row; `projectId` is copied from the owned opportunity, never from the client. Migration only inserts rows that don't already exist. |
| `actions/workspace.ts` | `clearWorkspace(projectId)` clears only saved opportunities, opportunities, and complaints for the current user's current project. |

All actions are `"use server"` files. They import `prisma` from `lib/db.ts` and `revalidatePath` from `next/cache`.

---

## Required environment variables

| Variable | Purpose | Local example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (driver adapter uses it). | `postgresql://postgres:postgres@localhost:5432/rift?schema=public` |
| `GEMINI_API_KEY` | Google Gemini API key (server-only). Get one free at https://aistudio.google.com/apikey. | `your_gemini_api_key_here` |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-2.5-flash` in `lib/ai.ts`. | `gemini-2.5-flash` |
| `BETTER_AUTH_URL` | Better Auth app origin, no trailing slash. Set to the deployed site origin on Vercel. | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Better Auth secret for sessions/tokens. | `replace-with-a-long-random-secret` |

`DATABASE_URL`, `GEMINI_API_KEY`, `BETTER_AUTH_URL`, and `BETTER_AUTH_SECRET` are server-only. No client component imports them. See `.env.example` for placeholder examples; never commit `.env`.

On Vercel, set `BETTER_AUTH_URL` to the deployed site origin with no trailing slash. For Preview deployments, ensure the same required env vars are available to the Preview environment and set `BETTER_AUTH_URL` to the preview deployment origin.

For Neon (production) use the **pooled** connection string and append `?sslmode=require`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
```

---

## Important product decisions

1. **Authentication exists.** Better Auth owns `User`, `Session`, `Account`, and `Verification`; do not change auth config for M16A work.
2. **Projects are the market-test boundary.** Complaints, opportunities, saved opportunities, demo dedupe, AI runs, and Start Fresh are scoped by both `userId` and `projectId`.
3. **No market stats from AI.** The Gemini prompt explicitly forbids inventing market size or statistics; every AI conclusion must be grounded in the uploaded complaints.
4. **Scores are deterministic and local.** Gemini returns severity + confidence; the app computes the 0–100 score via fixed formulas. Same dataset → same score, always.
5. **Re-running the AI pipeline is destructive only for current-project opportunities.** It deletes existing opportunities in the selected project, unlinks that project's complaints, then regenerates. Other projects are untouched.
6. **Demo data path.** `loadDemoComplaints` inserts the same 10 fictional complaints as `/public/sample_complaints.csv`. M16A dedupe is project-scoped so the same demo rows can be loaded into separate projects.
7. **Driver-adapter Prisma.** No query engine binary is shipped; `lib/generated/prisma` is pure TypeScript. Build script `prisma generate && next build` is mandatory on Vercel because the generated client is gitignored.
8. **Dark mode by default.** `html { color-scheme: dark }` + token CSS palette in `app/globals.css`. No light-mode toggle in MVP.

---

## Known constraints

- **In-memory progress tracker** (`lib/progress.ts`) is process-local — fine for single-instance Vercel/Neon MVP; multi-instance deployments would need a shared store.
- **M16A nullable projectId** → `projectId` stays nullable for the first migration/backfill so existing rows do not break. Future M16 steps may make it required after legacy data is handled.
- **Upload history is not persisted** in the DB. There is no `Upload` model by design.
- **Severity/sentiment on `Complaint`** are nullable reserved fields — the current pipeline does not populate them.
- **Competition on `Opportunity`** is hardcoded to `"Medium"`. Reserved for future work.
- **OneDrive project folder** can noticeably slow dev-server cold start (~25s) — this is a Windows/OneDrive filesystem artifact, not a code bug.
- **Server Action body limit** is bumped to `10mb` in `next.config.ts` (`experimental.serverActions.bodySizeLimit`) so CSV uploads don't hit the default 1MB cap.

---

## Features intentionally out of scope (MVP)

Do NOT build these unless a future milestone explicitly requests them:

- Billing / subscriptions / Stripe
- Multi-user teams / workspaces
- Email or in-app notifications
- Automatic scraping or data ingestion
- Real-time product analytics dashboard
- AI prompt changes (unless explicitly requested)
- Scoring logic changes (unless explicitly requested)
- Multiple database schemas / migrations history beyond MVP needs
- Custom favicon / brand logo / illustrations (Scope explicitly OKs Lucide icons + custom SVG assets in `public/` only when no real user data is involved)

These are **post-MVP possibilities only** and should not be added without an explicit milestone prompt.
