# Rift

Rift helps founders discover business opportunities from real customer complaints.

Upload a CSV of customer complaints, run the Gemini-powered AI engine, and Rift clusters similar complaints, summarises the underlying problems, and scores each resulting business opportunity — so you build what people already want.

---

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **UI:** Lucide icons, Radix Slot, custom shadcn-style primitives
- **Charts:** Recharts
- **Database:** PostgreSQL (Neon in production) + Prisma ORM 7 (driver-adapter mode)
- **AI:** Google Gemini (`@google/genai`)
- **CSV parsing:** PapaParse

---

## Required environment variables

Create a `.env` file in the project root (this file is gitignored) by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Purpose | Where to get it |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | local Postgres, or Neon pooled URL |
| `GEMINI_API_KEY` | Google Gemini API key (server-only) | https://aistudio.google.com/apikey |
| `BETTER_AUTH_URL` | Better Auth app origin, with no trailing slash | local app URL, Vercel production URL, or preview URL |
| `BETTER_AUTH_SECRET` | Better Auth secret for sessions/tokens | generate a long random string |

Example local `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rift?schema=public"
GEMINI_API_KEY="your_key_here"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
```

Example Neon `.env` (production):

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
GEMINI_API_KEY="your_key_here"
BETTER_AUTH_URL="https://your-app.vercel.app"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
```

> Never commit `.env`. The `.gitignore` is already configured to ignore it.

---

## Local setup

### 1. Install Node.js

Install Node.js 18.18+ (LTS recommended) from https://nodejs.org.

### 2. Install PostgreSQL (or skip and use Neon)

Either:
- install PostgreSQL locally and create a database named `rift`, OR
- create a free Neon project at https://neon.tech and use its pooled connection string.

### 3. Install dependencies

```bash
pnpm install
```

> On React 19 + Recharts the install prints a peer-dep warning. This is expected — pnpm handles this gracefully.

### 4. Configure `.env`

See "Required environment variables" above.

### 5. Generate the Prisma client + push the schema

```bash
pnpm exec prisma generate
pnpm exec prisma db push
```

`prisma generate` creates the typed client at `lib/generated/prisma/` (gitignored).
`prisma db push` creates the tables in your database.

### 6. Run the dev server

```bash
pnpm dev
```

Visit http://localhost:3000.

---

## How to use Rift

### Upload a CSV of complaints

1. Open http://localhost:3000/dashboard/complaints.
2. Drag a CSV file into the upload box.
3. Required column: `body`. Optional columns: `title`, `sourceDate`.
4. A sample file (`sample_complaints.csv`) is included in the project root — 10 fake complaints.

### Run AI clustering

1. Go to http://localhost:3000/dashboard/opportunities.
2. Click **Run AI clustering** — wait ~20s for 10 complaints.
3. Opportunities appear as cards, sorted by score.
4. Use search, filters, and sort to explore them.
5. Click any card to open the detail page with AI reasoning, score breakdown, related opportunities, and linked complaints.
6. Bookmark opportunities with the save icon; view saved ones at `/dashboard/saved`.

---

## Neon Postgres setup

1. Create a free account at https://neon.tech.
2. Create a new project; pick a region close to your Vercel deployment.
3. On the dashboard, find the **Connection string**.
4. Use the **pooled** connection string (it includes `-pooler` in the hostname). Append `?sslmode=require`.
5. Paste it into `.env` locally and into the Vercel env vars (see below).
6. Run `pnpm exec prisma db push` once against the Neon database so tables are created.
   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.neon.tech/DBNAME?sslmode=require" pnpm exec prisma db push
   ```

---

## Deploy to Vercel

1. Push the project to a GitHub repository. Ensure `.env` is NOT committed (it isn't — `.gitignore` covers it).
2. Sign in to https://vercel.com and create a new project from the GitHub repo.
3. In the Vercel project settings → **Environment Variables**, add:
   - `DATABASE_URL` — Neon pooled connection string with `?sslmode=require`.
   - `GEMINI_API_KEY` — your Gemini API key.
   - `BETTER_AUTH_URL` — the deployed site origin with no trailing slash, for example `https://your-app.vercel.app`.
   - `BETTER_AUTH_SECRET` — a long random secret.
4. Build command: leave the default `pnpm build` — `package.json` already runs `prisma generate && next build`.
5. Deploy.
6. Open the deployed URL and verify:
   - homepage loads,
   - `/dashboard` loads,
   - `/dashboard/complaints` lets you upload the sample CSV,
    - `/dashboard/opportunities` lets you run AI clustering.

For Vercel Preview deployments, make sure these environment variables are available to the Preview environment too. Set `BETTER_AUTH_URL` to the preview deployment origin with no trailing slash.

---

## Common beginner errors and fixes

### Missing `DATABASE_URL`
**Symptom:** App crashes at boot with a Prisma error about an undefined URL.
**Fix:** Add `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rift?schema=public"` to `.env` (local) or as a Vercel env var (production).

### Missing `GEMINI_API_KEY`
**Symptom:** "Run AI clustering" returns "ai.no_key_using_mock" or the pipeline errors during clustering.
**Fix:** Add `GEMINI_API_KEY="..."` to `.env` (local) or as a Vercel env var (production). Get a free key at https://aistudio.google.com/apikey.

### Prisma generate issues
**Symptom:** TypeScript error like `Cannot find module '@/lib/generated/prisma/client'`.
**Fix:** Run `pnpm exec prisma generate`. The `lib/generated/prisma/` folder is gitignored and must be created on every machine/Vercel build. The `build` script already does this — `prisma generate && next build`.

### Local PostgreSQL not running
**Symptom:** Connection refused on `localhost:5432`.
**Fix:** Start the PostgreSQL service. On Windows: `Get-Service postgresql-*` then `Start-Service postgresql-x64-16`. Verify port 5432 is open.

### Vercel build fails because env vars are missing
**Symptom:** `pnpm build` fails on Vercel with "Missing required environment variable: DATABASE_URL".
**Fix:** Add `DATABASE_URL` and `GEMINI_API_KEY` in Vercel → Project → Settings → Environment Variables. Re-deploy.

### Accidentally committed `.env`
**Symptom:** A secret appears in the git history.
**Fix:** Remove the file from git (`git rm --cached .env`), commit, then force-push or rotate any exposed secrets. `.gitignore` already excludes `.env`; this only happens if you `git add -f .env`.

---

## Project structure

```
app/                    Next.js App Router routes
  layout.tsx            Root layout (Inter font, dark mode, metadata)
  page.tsx              Landing page
  dashboard/            Dashboard routes (overview, complaints, opportunities, saved)
components/
  ui/                   Button, Card, Badge primitives
  dashboard/            StatCard, ComplaintsChart
  complaints/           CSV uploader, complaints table, search
  opportunities/        Card, browser, filters, save button, related card, etc.
  landing/              Hero, Features, How-it-works, Footer
lib/
  db.ts                 Prisma client singleton (driver-adapter mode)
  ai.ts                 Gemini clustering + summarisation service
  cleaning.ts           Complaint cleaning stage
  scoring.ts            Deterministic Opportunity Score (0-100)
  schemas.ts            Zod schemas for CSV rows
  logger.ts             Structured server logs
  progress.ts           In-memory pipeline progress tracker
  generated/prisma/     Prisma client (gitignored; regenerated at build)
actions/                Server actions (upload, pipeline, saved)
prisma/                 schema.prisma + prisma.config.ts
```

---

## Development scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Start the dev server (Turbopack) on port 3000 |
| `pnpm build` | Generate Prisma client + production build |
| `pnpm start` | Start the production server (after `build`) |
| `pnpm lint` | Run ESLint |

---

## License

Private project. All rights reserved.
