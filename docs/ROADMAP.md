# Rift — Roadmap

> Status snapshot. Update this file at the end of each milestone. Post-MVP ideas are listed at the bottom — do **not** treat them as MVP requirements.

---

## Convention

Each milestone:
1. Ends with a working application (you can `npm run dev` and verify the new feature).
2. Reports every modified file, every new file, every database change, and how to test.
3. Stops and waits for the user's confirmation before the next milestone starts.
4. Does **not** modify AI prompts, scoring logic, the CSV upload pipeline, or the Prisma schema unless the milestone explicitly requires it.

---

## Completed milestones

### M1 — Foundation
- **Status:** ✅ Done
- **Purpose:** Stand up the project, design system, and landing experience.
- **What was built:** Next.js 16 + TypeScript + Tailwind v4 scaffold; Prisma + `@prisma/adapter-pg` driver-adapter setup; PostgreSQL `rift` database; design tokens in `app/globals.css` (dark mode, Inter font, `#09090B`/`#18181B`/`#27272A`/`#2563EB` palette, 12px radius); Inter via `next/font`; reusable `Button`/`Card`/`Badge` UI primitives; landing page (Hero with Framer Motion, Features, How-it-works, Footer); dashboard shell with sidebar nav; placeholder routes for `complaints`, `opportunities`, `saved`.
- **Not included:** No application data (no uploads, no opportunities). No real AI calls.

### M2 — CSV upload + complaints
- **Status:** ✅ Done
- **Purpose:** Let the user feed Rift real complaint data.
- **What was built:** `actions/complaints.ts` server action `uploadComplaints` (Zod-validated, chunked inserts, tolerant CSV column matching); `components/complaints/csv-uploader.tsx` (drag/drop, PapaParse on the client, `useActionState`, file-type guard rejecting non-CSV); complaints table + search (`?q=`) on `/dashboard/complaints`; dashboard overview updated with chart + empty state; `next.config.ts` bumped `experimental.serverActions.bodySizeLimit` to `10mb`.
- **Not included:** No AI, no opportunities, no save logic.

### M3 — Gemini AI opportunity engine
- **Status:** ✅ Done
- **Purpose:** Turn uploaded complaints into structured business opportunities.
- **What was built:** `lib/ai.ts` single Gemini service (batching ≤100, tolerant JSON parser, cross-batch Jaccard merge, deterministic mock fallback when no key); `lib/ai-schema.ts` Zod schemas; `lib/cleaning.ts` stage 1; `lib/scoring.ts` deterministic 0–100 score (40% count / 35% severity / 25% confidence); `lib/logger.ts` structured logs; `lib/progress.ts` in-memory tracker; `actions/opportunities.ts` `runPipeline(jobId)`; `RunOpportunitiesButton` with live progress panel; opportunities list page; opportunity detail page with score breakdown; dashboard stats wired to real counts.
- **Not included:** No search/filter/sort on opportunities list, no saved opportunities, no related/prev/next. Gemini prompt and scoring weights are frozen — do not change unless a milestone explicitly asks.

### M4A — Discovery workspace (search/filter/sort/save)
- **Status:** ✅ Done
- **Purpose:** Make the opportunities list explorable.
- **What was built:** Four KPI cards on `/dashboard` (Opportunities / Avg score / Complaints / Industries, each with a Lucide icon); `OpportunityBrowser` client component holding all filter/sort state locally (no DB calls while searching); `OpportunityFilters` (search, industry select, 3 sliders, sort select, reset); `OpportunityCard` extended with save button + hover animation; `actions/saved.ts` save/unsave actions using the existing `SavedOpportunity` model (one global save per opportunity via `@@unique([opportunityId])`); `/dashboard/saved` page; polished empty states (Lucide icons only).
- **Not included:** No auth, no per-user save state. No new database model — `SavedOpportunity` was reused.

### M4B — Opportunity detail page upgrade
- **Status:** ✅ Done
- **Purpose:** Make the detail page evidence-backed and navigable.
- **What was built:** Detail page header with all stats; sticky right column (Score hero, MiniStats, Score Breakdown including Final Opportunity Score, Suggested Software, alphabetical Keywords, Related Opportunities); left column (Summary, highlighted AI Reasoning card, Example Complaints with 5 max + Show more/Show less per complaint >500 chars); `PrevNextNav` ordered by `createdAt DESC` with disabled state; `RelatedOpportunityCard` (`selectRelated` chooses ≥2 keyword overlap first, then same-industry fallback, max 3, deduped); `NoRelatedEmpty` and "No linked complaints" empty states; `loading.tsx` skeleton for `/dashboard/opportunities/[id]`.
- **Not included:** No comparison view, no related-opportunity deep linking beyond the existing detail-link, no AI changes.

### M5 — Polish + build clean
- **Status:** ✅ Done
- **Purpose:** Bring the MVP to a production-build-quality bar without adding features.
- **What was built:** Accessibility pass on opportunity components (`aria-label` on icon-only buttons, sliders, selects, related links; `aria-live` on the "Showing X of Y" counter; `aria-disabled` on disabled prev/next; visible focus-visible outlines with primary tint); refined typography (line-clamp on long titles, balanced line-height); global `app/not-found.tsx` and `app/error.tsx` using the design system. No new dependencies.
- **Not included:** No new features, no UI redesigns, no AI or logic changes. Verified `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass; `npm run start` smoke-tested locally.

### M6 — Production readiness + Vercel/Neon deployment
- **Status:** ✅ Done
- **Purpose:** Ship to Vercel with Neon Postgres.
- **What was built:** `.env.example` with Neon placeholder format (`?sslmode=require`) and Gemini key placeholder; `package.json` `build` script updated to `prisma generate && next build` (required because `lib/generated/prisma/` is gitignored and Vercel must regenerate it); `.gitignore` `!.env.example` exception so the example is committable while `.env*` stays ignored; `app/robots.ts` (allow `/`, disallow `/dashboard`); `app/sitemap.ts` (only `/`); global `app/not-found.tsx`; global `app/error.tsx`; updated `app/layout.tsx` metadata + OpenGraph + Twitter card; beginner-friendly `README.md` with setup, common errors, Neon setup, and Vercel deploy sections; removed leftover `gen_complaints.ps1`.
- **Decision (documented):** `prisma generate --no-engine` is **unsupported** in Prisma 7.x (verified via `prisma generate --help`). The correct build command is `prisma generate && next build` — the driver adapter produces a TypeScript-only client with no engine binary to strip.
- **Not included:** Real account creation; real deploy. Deployment is the user's manual step once Neon + Vercel env vars are added.

### Post-M6 add-on — Sample data onboarding
- **Status:** ✅ Done (small follow-up to M6)
- **What was built:** `public/sample_complaints.csv` (10 fake realistic complaints, no real user data); "Download sample CSV" link (`href="/sample_complaints.csv" download`) and "Use demo data" button on `/dashboard/complaints`; `loadDemoComplaints` server action in `actions/complaints.ts` that inserts the same 10 demo rows via the shared `insertValidRows` helper. Demo success message guides the user to `/dashboard/opportunities` → Run AI clustering.
- **Not included:** No AI changes, no schema changes, no new database model. The demo action validates the same rows with the same Zod schema as `uploadComplaints`.

### Docs milestone — `/docs` folder + `AGENTS.md`
- **Status:** ✅ Done (this milestone)
- **What was built:** `docs/PROJECT_CONTEXT.md`, `docs/ROADMAP.md`, `docs/AI_AGENT_INSTRUCTIONS.md`, `docs/TESTING_CHECKLIST.md`; `AGENTS.md` updated to point future agents at these docs.
- **Scope:** Documentation only — no app functionality modified, no schema changes, no packages installed.

### M7 — Repositioning + Demo Flow
- **Status:** ✅ Done
- **Purpose:** Make Rift clearer, easier to test, and better aligned with the promise "Rift helps founders discover startup opportunities from real market pain." Driven by real tester feedback.
- **What was built:** Repositioned landing copy (hero, features, how-it-works, footer) so a new user understands Rift in under 30 seconds and sees the demo-data path; demo data duplicate prevention in `loadDemoComplaints` (matches exact demo bodies, inserts only missing rows); "already loaded" message in `CsvUploader`; renamed user-facing "Suggested Software"/"Suggested:" to "Product Opportunity" everywhere (internal `suggestedSoftware` field unchanged); restructured the opportunity detail page into Problem Summary → Evidence From Complaints (example complaints + keywords) → Why This Matters → Product Opportunity; added plain-English score explanations on the opportunity card ("Score combines frequency, severity, and confidence.") and beside the detail-page score breakdown; improved empty states with direct CTAs (Use Demo Data / Download Sample CSV / Upload CSV / Run AI clustering); clarified dashboard/opportunities/saved/complaints copy to "this MVP workspace" tone and removed the stale "Available in Milestone 3" note.
- **Not included:** No schema changes, no AI prompt changes, no scoring logic changes, no new dependencies, no new components beyond copy/labels. Sample CSV download and "Use demo data" button already shipped in the Post-M6 add-on; this milestone added idempotency + onboarding copy around them.

---

## Current state

The MVP core workflow is complete and ships cleanly:

```
Upload CSV or Use demo data
  → Complaints stored
  → Run AI clustering (Gemini)
  → Opportunities created with deterministic 0–100 scores
  → Browse/search/filter/sort opportunities
  → Save/bookmark opportunities
  → Open detail page (AI reasoning + breakdown + related + prev/next)
  → Deploy to Vercel + Neon
```

`npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass. `npm run start` smoke-tested locally.

---

## Future / post-MVP milestones (not started)

Do **not** start any of these without an explicit user prompt. They appear here only for visibility.

### M7 — Authentication & user accounts
- Per-user saved opportunities, upload ownership, private dashboards.
- Likely tech: NextAuth or Clerk; new `User` model + FK on `SavedOpportunity` and a new `UploadHistory`.

### M8 — Upload history & re-runs
- Persist each upload as a row in the DB; let users reopen past analyses and compare AI re-runs.
- Requires a new `Upload` model (file name, date, complaint count, opportunities generated, processing status).

### M9 — Comparison & multi-opportunity tools
- Side-by-side comparison view for 2–3 opportunities; export to PDF/CSV.

### M10 — Notification & in-app messaging
- Server-side status when long jobs complete; optional email digest.

### M11 — Multi-source ingestion / scraping (if explicitly approved)
- Auto-pull complaints from review sites, app stores, forums. **Out of scope for MVP** — must not be added automatically.

### M12 — Light mode + theming
- Toggle light/dark; persist preference locally. Pure UX; no schema changes.

### M13 — Prompt experimentation
- A/B different Gemini prompts and track quality. **Must not change the production prompt or scoring weights without explicit sign-off.**

---

## Standing rules per milestone

- Do not add authentication, billing, teams, notifications, or automatic scraping as MVP requirements.
- Do not change AI prompts unless the milestone explicitly asks for it.
- Do not change scoring logic unless the milestone explicitly asks for it.
- Keep the MVP focused on proving the core workflow (upload → cluster → score → browse → save → detail → deploy).