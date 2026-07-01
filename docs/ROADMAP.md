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

### M8 — Flexible Input (paste text + text files)
- **Status:** ✅ Done
- **Purpose:** Remove the spreadsheet-only friction so founders can add market pain without preparing a CSV. Driven by real tester feedback that CSV upload felt like the wrong default.
- **What was built:** Tabbed input on `/dashboard/complaints` (Upload CSV / Paste Text / Upload Text File) via new `components/complaints/complaints-input.tsx`; shared paste + file flow in `components/complaints/text-input.tsx` (source-type dropdown, optional source label, textarea or `.txt`/`.md` file picker, client-side file read, reuses one `importTextComplaints` server action); pure parsing helper `lib/text-import.ts` (`parseComplaintsFromText`, `createTitleFromBody`, `normaliseComplaintBody`, `SOURCE_TYPES`); server action `importTextComplaints` in `actions/complaints.ts` reusing the existing `complaintRowSchema` + `insertValidRows`; DB-level dedup (match exact body, insert only missing rows) so re-imports and demo re-imports don't duplicate; shared import summaries in `components/complaints/import-summary.tsx`. CSV upload, sample CSV download, Use Demo Data, validation, complaints list/search, and the AI clustering flow are all unchanged and still work.
- **Not included:** No schema changes (no `Source`/`Upload`/`User` models), no new dependencies, no OCR, no PDF, no DOCX, no image parsing, no web scraping, no Reddit/app-store APIs, no AI pipeline or scoring changes, no auto-run of clustering after import. Source type/label is UI-only metadata — not stored on the complaint.

### M9 — Market Gap Hypothesis
- **Status:** ✅ Done
- **Purpose:** Make each generated opportunity feel like an evidence-backed startup opportunity, not issue prioritization. Adds a complaint-grounded market-gap hypothesis (explicitly a hypothesis, not real market research).
- **What was built:** Non-destructive `Opportunity` schema extension — `marketGap`, `targetCustomer`, `likelyCurrentWorkarounds`, `whyWorkaroundsFallShort`, `productAngle`, `differentiationAngle` (nullable `String?`) + `validationQuestions`, `riskFlags` (`String[] @default([])`). Gemini prompt extended to request these fields with strict grounding rules (only infer from the complaint text, never invent market size/stats, don't name competitors unless mentioned in complaints, frame workarounds/differentiation as hypotheses, never compute the score); `clusterSchema` extended with the same fields as optional/defaulted so a missing field never fails the pipeline; mock fallback in `lib/ai.ts` emits clearly-fake mock M9 fields; cross-batch merge adopts the dominant cluster's fields and unions the lists. `runPipeline` persists the new fields (null for missing strings, `productAngle` falls back to `suggestedSoftware`). Detail page restructured to: Problem Summary → Evidence From Complaints → Product Opportunity (prefers `productAngle`, falls back to `suggestedSoftware`, never both) → Market Gap Hypothesis (`components/opportunities/market-gap-hypothesis.tsx`) → Validation Questions (list) → Risk Flags (list) → Score Breakdown → Related Opportunities → Prev/Next. Opportunity card shows a compact "For: … / Angle: …" preview when M9 fields exist. Client-side search haystack extended with `targetCustomer` + `productAngle`. Legacy pre-M9 opportunities render with subtle "Run AI clustering again…" rerun hints instead of fake placeholder analysis.
- **Not included:** No real market research, no scraping, no competitor agents, no market-size estimation, no new dependencies, no scoring changes, no new models, no save/upload behavior changes. `suggestedSoftware` kept for backwards compatibility.

### M10 — Opportunity Validation Workflow
- **Status:** ✅ Done
- **Purpose:** Turn the opportunity detail page into a lightweight validation workspace so founders can decide what to do next with an opportunity — "how do I validate it?" instead of just "what is it?"
- **What was built:** A `ValidationWorkspace` section on the detail page with 8 sub-sections: Hypothesis To Test, Who To Interview, Interview Questions, Evidence To Collect, Signs This May Be Worth Pursuing, Risks To Test, Validation Checklist, and Copy Validation Brief. Pure deterministic helpers in `lib/validation-plan.ts` (hypothesis builder, fallback questions/risks, evidence checklist, success signals, copyable plain-text brief) — no Gemini calls, no new AI content. Interactive checklist uses `useSyncExternalStore` + localStorage keyed by opportunity ID (no DB, no auth, "Saved only in this browser" note). Copy Validation Brief uses the browser clipboard API. Standalone M9 `ValidationQuestions` and `RiskFlags` sections were removed from the detail page and absorbed into the Validation Workspace to avoid duplicates. Missing M9 fields use deterministic fallback copy or a rerun hint. Legacy pre-M9 rows render with fallbacks.
- **Not included:** No schema changes, no AI prompt/schema changes, no scoring changes, no new dependencies, no DB-persisted validation notes, no interview CRM, no PDF/CSV export, no auth, no scraping. localStorage is the only persistence for checklist state.

### M11 — Opportunity Decision Board
- **Status:** ✅ Done
- **Purpose:** Help founders move from discovery to decision — "which opportunity should I test, park, or reject next?" instead of just listing opportunities.
- **What was built:** New route `/dashboard/opportunities/decision-board` (server page fetches opportunities, passes to a client component). `components/opportunities/decision-board-client.tsx` renders summary cards (Total / Pursue / Park / Reject / Undecided), client-side status filters, and comparison cards showing title, score, Testing Priority label, product opportunity, target customer, mini-stats (complaints, severity, confidence, risk count, question count), and a decision status selector. `components/opportunities/decision-status-select.tsx` — native `<select>` + a `useDecisionStatuses` hook that reads/writes localStorage keyed `rift-opportunity-decision-${id}` after hydration (no `useSyncExternalStore`, no hydration crash). `lib/decision-board.ts` — pure deterministic `computeTestingPriority` helper (Needs more evidence → High risk → Strong signal → Worth testing → Needs review) based on score/mentions/confidence/riskFlags, plus `TestingPriority` labels and helper copy. Link from `/dashboard/opportunities` to the Decision Board. Empty state with CTAs to Complaints and Opportunities. Saved-vs-Decision helper line.
- **Not included:** No schema changes, no DB persistence, no auth, no new dependencies, no AI calls, no scoring changes, no notes, no drag-and-drop, no kanban, no export. Decision status is localStorage-only and separate from Saved/bookmark behavior.

### M12 — Validation Evidence Log
- **Status:** ✅ Done
- **Purpose:** Let founders record structured aggregate evidence from customer validation — "what did I learn from interviews?" — without accounts or database changes.
- **What was built:** Full-width `ValidationEvidenceLog` section on the opportunity detail page (below the Validation Workspace). `lib/validation-evidence.ts` — pure deterministic helpers: `EvidenceState` type, `DEFAULT_EVIDENCE`, `parseEvidenceState` (safe localStorage parsing with fallback), `clampCount` (0–20), `clampDependentCounts` (dependent counts never exceed interviews), `computeEvidenceSignal` (No evidence → Needs more → Weak → Promising → Mixed → Early), `computeSuggestedNextStep`, and all option lists. `components/opportunities/validation-evidence-log.tsx` — client component with three grouped cards (Conversation counts, Signal quality, Evidence summary), 5 numeric fields (0–20), 2 select fields, a 500-char textarea, a Reset button, Evidence Signal label + helper copy, Suggested Next Step, privacy note, and "Saved only in this browser." localStorage key `rift-validation-evidence-${id}`, `useState`+`useEffect` (no `useSyncExternalStore`), SSR-safe.
- **Not included:** No schema changes, no DB persistence, no auth, no new dependencies, no AI calls, no scoring changes, no Decision Board modification, no Copy Validation Brief modification, no personal details (names/emails/phones), no interview CRM, no export. Evidence state is separate from M11 decision status and M10 checklist.

### M13 — Evidence-Aware Decision Board
- **Status:** ✅ Done
- **Purpose:** Connect M12 evidence to the M11 Decision Board so founders can see which opportunities have evidence, how many interviews were done, and what the Evidence Signal is — all without leaving the board.
- **What was built:** Updated `components/opportunities/decision-board-client.tsx` to read M12 evidence from localStorage (read-only, never writes) via a `useEvidenceSnapshots` hook that loads on mount and refreshes on window focus. Each opportunity card now shows a compact evidence snapshot: Evidence Signal label (reused from `computeEvidenceSignal`), interview/pain/willing-to-try/willing-to-pay counts, Suggested Next Step (reused from `computeSuggestedNextStep`), and an "Open evidence log" link to `/dashboard/opportunities/[id]#validation-evidence-log`. Added a Testing Priority vs Evidence Signal helper line to the board header. Added `id="validation-evidence-log"` + `scroll-mt-6` to the Evidence Log `<section>` on the detail page so the anchor link scrolls cleanly. No evidence editing on the board, no evidence filters, no automatic decision updates.
- **Not included:** No schema changes, no DB persistence, no auth, no new dependencies, no AI calls, no scoring changes, no evidence editing on the Decision Board, no evidence filters, no Copy Validation Brief modification, no automatic decision status changes. Evidence is read-only on the board; editing remains detail-page only.

### M14 — Founder Command Center
- **Status:** ✅ Done
- **Purpose:** Make `/dashboard` feel like one connected product — a calm founder workspace that shows where the user is in the opportunity discovery workflow and what to do next.
- **What was built:** Rewrote `app/dashboard/page.tsx` with a Founder Command Center header, 4 project stat cards (Complaints loaded / Opportunities generated / Saved / Highest score — all server-side via Prisma), a `FounderCommandClient` client component that reads decision + evidence localStorage (read-only, never writes, refreshes on window focus) and renders: Recommended Next Action card, 5 Workflow Step cards (Import → Generate → Review → Validate → Decide with deterministic status labels), Decision status summary (Pursue/Park/Reject/Undecided counts), Evidence summary (with evidence / no evidence / promising / needs more counts). Pure helpers in `lib/dashboard-plan.ts` (`computeWorkflowSteps`, `computeNextAction`, types). High-signal opportunities section (top 3 by score, server-side). Empty states for no-complaints and no-opportunities. Kept the existing Complaints-over-time chart and Recent complaints list.
- **Not included:** No schema changes, no DB persistence, no auth, no new dependencies, no AI calls, no scoring changes, no evidence/decision editing on the dashboard, no Copy Validation Brief changes, no existing routes removed. Dashboard reads localStorage but never writes to decision or evidence keys.

### M15 — MVP Release Candidate Polish
- **Status:** ✅ Done
- **Purpose:** Final polish pass to make Rift feel clean, coherent, demo-ready, and free of obvious UI/copy/accessibility issues. Not a feature expansion.
- **What was built/fixed:**
  - Sidebar nav: renamed "Overview" → "Home" (matches the Founder Command Center page), added Decision Board to the nav, added `aria-label` on the nav element, added `focus-visible` outline on sidebar links.
  - Mobile nav: added a fixed top-nav bar (horizontal scroll) visible only on `md:hidden` so mobile users can navigate — previously the sidebar was `hidden md:block` with no mobile alternative. Added `pt-12 md:pt-0` to the main content area so it doesn't sit under the mobile bar.
  - Detail-page loading skeleton: fixed the grid ratio from `lg:grid-cols-[2fr_1fr]` to `lg:grid-cols-[minmax(0,1fr)_420px]` to match the actual detail page layout from the M10 layout polish.
  - Verified: no stale "Suggested Software" in UI, no "Milestone N" in app code, no `useSyncExternalStore` actual usage (only comments), no overclaiming ("guaranteed/proven/validated opportunity/blue ocean" — the only "proven" hits are in careful disclaimers like "not proven market research"), all local-only features have "Saved only in this browser" or equivalent, `SaveButton` has `aria-pressed`/`aria-label`, `PrevNextNav` has `aria-label`/`aria-disabled`.
- **Not included:** No schema changes, no AI/scoring changes, no new dependencies, no new features, no redesign, no new routes, no removed routes. Dead-code cleanup was conservative — only the loading skeleton grid was updated to match the actual page.

### Feedback-Driven First-Time User Clarity Patch (Post-M15)
- **Status:** ✅ Done
- **Purpose:** Make the MVP understandable for first-time users after real feedback indicated confusion. No schema changes, no AI changes, no scoring changes, no new dependencies, no scraping added.
- **What was built/fixed:**
  - Landing Page: updated hero copy "Find business ideas from real customer pain", CTA "Try demo data", added honest MVP scope note, updated features/how-it-works copy.
  - Dashboard: added "Start here" first-time user card with three CTAs and honest MVP scope note.
  - Navigation labels: "Opportunities" → "Ideas", "Decision Board" → "Compare Ideas" (routes unchanged).
  - Opportunities page: heading "Business Ideas", score explanation helper text, updated AI engine copy.
  - Opportunity detail page: score explanation, updated Market Gap Hypothesis / Validation Workspace / Evidence Log helper text.
  - Decision Board: renamed to Compare Ideas, updated empty state and header copy.
  - Empty states: updated across app using action-focused plain English.
  - Saved page: updated heading to "Saved Ideas" and helper copy.
- **Not included:** No schema changes, no AI changes, no scoring changes, no new dependencies, no scraping added. Public-source scanning remains future direction only.

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

The Feedback-Driven First-Time User Clarity Patch has been applied to make the MVP understandable for first-time users. Key changes:
- Landing page clearly explains Rift in plain English ("Find business ideas from real customer pain")
- Dashboard has a "Start here" first-time user card with clear CTAs
- Navigation labels updated ("Ideas", "Compare Ideas")
- Opportunities page heading changed to "Business Ideas" with score explanation
- Detail page sections have plain-English explanations
- Empty states use action-focused copy
- "Why complaints?" section explains the value of complaint data
- Honest MVP scope note clarifies current vs future capabilities

`npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass. `npm run start` smoke-tested locally.

---

## Future / post-MVP milestones (not started)

Do **not** start any of these without an explicit user prompt. They appear here only for visibility.

> Note: M7–M15 are complete — see "Completed milestones" above. The items below are post-MVP and start at M16.

### M16 — Authentication & user accounts
- Per-user saved opportunities, upload ownership, private dashboards.
- Likely tech: NextAuth or Clerk; new `User` model + FK on `SavedOpportunity` and a new `UploadHistory`.

### M17 — Upload history & re-runs
- Persist each upload as a row in the DB; let users reopen past analyses and compare AI re-runs.
- Requires a new `Upload` model (file name, date, complaint count, opportunities generated, processing status).

### M18 — Comparison & multi-opportunity tools
- Side-by-side comparison view for 2–3 opportunities; export to PDF/CSV.

### M19 — Notification & in-app messaging
- Server-side status when long jobs complete; optional email digest.

### M20 — Multi-source ingestion / scraping (if explicitly approved)
- Auto-pull complaints from review sites, app stores, forums. **Out of scope for MVP** — must not be added automatically.

### M21 — Light mode + theming
- Toggle light/dark; persist preference locally. Pure UX; no schema changes.

### M22 — Prompt experimentation
- A/B different Gemini prompts and track quality. **Must not change the production prompt or scoring weights without explicit sign-off.**

---

## Standing rules per milestone

- Do not add authentication, billing, teams, notifications, or automatic scraping as MVP requirements.
- Do not change AI prompts unless the milestone explicitly asks for it.
- Do not change scoring logic unless the milestone explicitly asks for it.
- Keep the MVP focused on proving the core workflow (upload → cluster → score → browse → save → detail → deploy).