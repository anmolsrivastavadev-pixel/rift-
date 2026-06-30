# Rift — Project Context

> Single source of truth for what Rift is, how it is built, and where the moving parts live. Future AI coding sessions should read this before touching the codebase.

---

## What Rift is

Rift is an **AI-powered Opportunity Intelligence Platform for founders**.

It takes customer complaints (uploaded as a CSV), runs them through Google Gemini to cluster similar complaints into groups, summarises each group into a business problem, and scores each resulting opportunity 0–100 using a deterministic, transparent algorithm. Founders then browse, filter, sort, save, and inspect opportunities that are grounded in real customer text — not invented market stats.

**One sentence pitch:** _Rift helps founders discover business opportunities from real customer complaints._

---

## Who Rift is for

- **Founders** looking for validated software ideas grounded in real customer pain.
- Anyone who has (or can scrape) a CSV of customer complaints, reviews, or feedback and wants to know which problems are worth solving next.

Rift is **not**:
- a dental-only product,
- an agent for billing/auth/teams,
- a no-code scraper.

---

## Core product flow

```
CSV upload (drag/drop or demo data)
  → PapaParse on the client
  → server action validates rows with Zod
  → valid rows inserted into Complaint table
        — OR (M8+) —
  Paste text / upload .txt or .md
  → client stages raw text or reads the file in-browser
  → importTextComplaints parses via lib/text-import.ts (split, strip bullets,
    dedupe, cap length, build titles), re-validates with the SAME Zod schema,
    dedups against existing bodies in the DB, inserts only missing rows
  → "Run AI clustering" server action
        → clean complaints (normalise, dedupe, drop empties)
        → batch Gemini calls (≤100 complaints each)
        → tolerant JSON parse (bare array OR {clusters:[]})
        → cross-batch merge via keyword Jaccard ≥ 0.5
        → for each cluster: compute Opportunity Score (locally)
        → insert Opportunity row + link Complaints to it
  → Dashboard shows opportunities (search/filter/sort/save)
  → Opportunity detail page (AI reasoning, score breakdown,
    linked complaints, related opportunities, prev/next)
  → /saved page lists bookmarked opportunities
```

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
├─ page.tsx              Landing page (Hero, Features, How-it-works, Footer)
├─ robots.ts             robots.txt — allows "/", disallows "/dashboard"
├─ sitemap.ts            sitemap.xml — only "/"
├─ not-found.tsx         Global 404
├─ error.tsx             Global error boundary
└─ dashboard/
   ├─ layout.tsx         Sidebar shell (Overview/Complaints/Opportunities/Saved)
   ├─ page.tsx           Overview: 4 KPI cards, complaints-over-time chart, recent list
   ├─ complaints/
   │  ├─ page.tsx        Upload UI + complaints list + search (?q=)
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
   └─ saved/page.tsx     Saved opportunities

components/
├─ ui/                   Button, Card, Badge (cva + cn())
├─ container.tsx         max-w wrapper
├─ dashboard/            stat-card, complaints-chart (Recharts), shell
├─ complaints/           csv-uploader, complaints-input (tabs), text-input (paste/file),
│                        import-summary, complaints-list, complaints-table, complaint-search
└─ opportunities/        opportunity-card, opportunity-browser, filters, save-button,
                         related-opportunity-card, no-related-empty, prev-next-nav,
                         example-complaints, complaint-body, empty-states, run-button,
                         market-gap-hypothesis (M9), validation-workspace + validation-checklist
                         + copy-validation-brief (M10), decision-board-client +
                         decision-status-select (M11), validation-evidence-log (M12)

lib/
├─ db.ts                 Prisma client singleton (driver-adapter mode)
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
├─ complaints.ts        uploadComplaints, loadDemoComplaints, importTextComplaints
├─ opportunities.ts    runPipeline, getProcessingStatus, resetOpportunities,
│                       resetOpportunitiesAction
└─ saved.ts             saveOpportunity, unsaveOpportunity, saveAction, unsaveAction

prisma/
├─ schema.prisma
└─ (migrations/ — created on first `prisma migrate dev`)

public/
├─ sample_complaints.csv  10 fake complaints — served as a static asset
└─ *.svg                  scaffold SVGs (unchanged)
```

> **`lib/prompts.ts`** is a leftover file with dental-SaaS-specific prompts that is **not imported anywhere** in the current pipeline. Future milestones may delete it; do not depend on it. The active AI pipeline lives entirely in `lib/ai.ts`.

---

## Database models (as actually defined in `prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
  // NO url here — provided via prisma.config.ts (driver-adapter setup)
}

model Complaint {
  id            String       @id @default(cuid())
  title         String
  body          String
  sourceDate    DateTime?
  sentiment     Float?       // -1..1 (unused; reserved for future)
  severity      Float?       // 0..100 (unused; reserved for future)
  opportunity   Opportunity? @relation(fields: [opportunityId], references: [id], onDelete: SetNull)
  opportunityId String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  @@index([opportunityId])
}

model Opportunity {
  id                 String   @id @default(cuid())
  title              String
  summary            String
  industry           String
  keywords           String[]
  opportunityScore   Int      // 0..100, computed locally
  scoreBreakdown     Json     // full breakdown object from lib/scoring.ts
  mentions           Int      // number of complaints in this cluster
  growth             Float    // ratio last/first bucket, clamped 0..5
  competition        String   // currently hardcoded "Medium" (reserved)
  sentiment          Float?   // reserved
  severity           Float?   // 1..10, from Gemini
  confidence         Int?     // 0..100, from Gemini
  reason             String?  // Gemini reasoning, grounded in complaints
  suggestedSoftware  String   // kept for backwards compat; UI prefers productAngle
  // M9 — complaint-grounded market-gap hypothesis (all optional so legacy
  // rows render without crashing). UI prefers productAngle and falls back
  // to suggestedSoftware.
  marketGap                String?
  targetCustomer           String?
  likelyCurrentWorkarounds String?
  whyWorkaroundsFallShort  String?
  productAngle             String?
  differentiationAngle     String?
  validationQuestions      String[] @default([])
  riskFlags                String[] @default([])
  trend              Json     // [{ date, count }] for trend chart
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  complaints        Complaint[]
  savedOpportunities SavedOpportunity[]
}

model SavedOpportunity {
  id            String      @id @default(cuid())
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)
  opportunityId String
  note          String?
  createdAt      DateTime    @default(now())
  @@unique([opportunityId])  // one global save per opportunity (no auth in MVP)
}
```

Three models. No `User`. No auth. No `UploadHistory` table — upload history is not persisted (deliberately out of scope).

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

`runPipeline(jobId)`:
1. Loads all complaints from the DB (`Complaint.findMany`).
2. **Stage 1 — cleaning** (`lib/cleaning.ts`): normalise whitespace, drop rows <3 chars or duplicates.
3. **Stage 2 — clustering** (`lib/ai.ts:clusterComplaints`): batch Gemini calls; tolerant JSON parse; cross-batch merge.
4. **Stage 3 — opportunity generation**: for each cluster, link its complaints, compute the Opportunity Score locally, build the trend `[{date, count}]`, persist an `Opportunity` row (including the M9 market-gap hypothesis fields returned by Gemini — `marketGap`, `targetCustomer`, `likelyCurrentWorkarounds`, `whyWorkaroundsFallShort`, `productAngle`, `differentiationAngle`, `validationQuestions`, `riskFlags`; missing optional strings stored as `null`, `productAngle` falls back to `suggestedSoftware`), set `Complaint.opportunityId`.
5. **Stage 4 — revalidation**: `revalidatePath` for dashboard, opportunities, and complaints routes so caches refresh.
6. Progress is tracked in `lib/progress.ts` (in-memory, keyed by jobId, 10-min TTL) so the client `RunOpportunitiesButton` can poll `getProcessingStatus(jobId)` and render stages + progress bars.

The pipeline **deletes existing opportunities before inserting new ones** (re-run replaces stale data). Complaints themselves are preserved (only `opportunityId` is cleared then relinked).

> Do NOT change the Gemini prompt unless a future milestone explicitly instructs you to. Do NOT make Gemini compute the score.

---

## Current routes

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
| `actions/complaints.ts` | `uploadComplaints(prev, formData)`, `loadDemoComplaints()` (form-action compatible). Both share `insertValidRows()` for chunked inserts. |
| `actions/opportunities.ts` | `runPipeline(jobId)`, `getProcessingStatus(jobId)`, `resetOpportunities()`, `resetOpportunitiesAction()` (form-action wrapper). |
| `actions/saved.ts` | `saveOpportunity(prev, formData)`, `unsaveOpportunity(prev, formData)`, `saveAction(formData)`, `unsaveAction(formData)` (form-action wrappers). |

All actions are `"use server"` files. They import `prisma` from `lib/db.ts` and `revalidatePath` from `next/cache`.

---

## Required environment variables

| Variable | Purpose | Local example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (driver adapter uses it). | `postgresql://postgres:postgres@localhost:5432/rift?schema=public` |
| `GEMINI_API_KEY` | Google Gemini API key (server-only). Get one free at https://aistudio.google.com/apikey. | `your_gemini_api_key_here` |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-2.5-flash` in `lib/ai.ts`. | `gemini-2.5-flash` |

**Both env vars are server-only.** They are read exclusively in `lib/db.ts` and `lib/ai.ts`. No client component imports them. See `.env.example` for placeholder examples; never commit `.env`.

For Neon (production) use the **pooled** connection string and append `?sslmode=require`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
```

---

## Important product decisions

1. **No authentication in MVP.** One global save per opportunity (enforced via `@@unique([opportunityId])`).
2. **No market stats from AI.** The Gemini prompt explicitly forbids inventing market size or statistics; every AI conclusion must be grounded in the uploaded complaints.
3. **Scores are deterministic and local.** Gemini returns severity + confidence; the app computes the 0–100 score via fixed formulas. Same dataset → same score, always.
4. **Re-running the AI pipeline is destructive for opportunities.** It deletes existing opportunities, unlinks all complaints, then regenerates. Complaints themselves are never deleted by the pipeline.
5. **Demo data path.** `loadDemoComplaints` inserts the same 10 fictional complaints as `/public/sample_complaints.csv`. Lets new users explore Rift without needing a real CSV.
6. **Driver-adapter Prisma.** No query engine binary is shipped; `lib/generated/prisma` is pure TypeScript. Build script `prisma generate && next build` is mandatory on Vercel because the generated client is gitignored.
7. **Dark mode by default.** `html { color-scheme: dark }` + token CSS palette in `app/globals.css`. No light-mode toggle in MVP.

---

## Known constraints

- **In-memory progress tracker** (`lib/progress.ts`) is process-local — fine for single-instance Vercel/Neon MVP; multi-instance deployments would need a shared store.
- **No auth** → "saved" state is global per opportunity, not per user. Acceptable for MVP demo.
- **Upload history is not persisted** in the DB. There is no `Upload` model by design.
- **Severity/sentiment on `Complaint`** are nullable reserved fields — the current pipeline does not populate them.
- **Competition on `Opportunity`** is hardcoded to `"Medium"`. Reserved for future work.
- **OneDrive project folder** can noticeably slow dev-server cold start (~25s) — this is a Windows/OneDrive filesystem artifact, not a code bug.
- **Server Action body limit** is bumped to `10mb` in `next.config.ts` (`experimental.serverActions.bodySizeLimit`) so CSV uploads don't hit the default 1MB cap.

---

## Features intentionally out of scope (MVP)

Do NOT build these unless a future milestone explicitly requests them:

- Authentication / user accounts
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