# Rift — Roadmap

> Status snapshot. Update this file at the end of each milestone. Post-MVP ideas are listed at the bottom — do **not** treat them as MVP requirements.

---

## Convention

Each milestone:
1. Ends with a working application (you can `pnpm dev` and verify the new feature).
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
- **Not included:** No new features, no UI redesigns, no AI or logic changes. Verified `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` all pass; `pnpm start` smoke-tested locally.

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

The MVP core workflow is complete and now supports separate signed-in, project-scoped market tests:

```
Sign in
  → Select/create a project
  → Upload CSV, paste text, upload text file, use demo/starter data
  → Complaints stored
  → Run AI clustering (Gemini)
  → Opportunities created with deterministic 0–100 scores
  → Browse/search/filter/sort opportunities
  → Save/bookmark opportunities
  → Open detail page (AI reasoning + breakdown + related + prev/next)
  → Deploy to Vercel + Neon
```

Data for complaints, generated ideas, and saved ideas is scoped by both `userId` and `projectId`. Start Fresh clears only the current project.

The Feedback-Driven First-Time User Clarity Patch has been applied to make the MVP understandable for first-time users. Key changes:
- Landing page clearly explains Rift in plain English ("Find business ideas from real customer pain")
- Dashboard has a "Start here" first-time user card with clear CTAs
- Navigation labels updated ("Ideas", "Compare Ideas")
- Opportunities page heading changed to "Business Ideas" with score explanation
- Detail page sections have plain-English explanations
- Empty states use action-focused copy
- "Why complaints?" section explains the value of complaint data
- Honest MVP scope note clarifies current vs future capabilities

The Beginner Business Clarity Patch adds beginner-friendly copy across the app:
- 3-step beginner guide on the landing page ("Find customer pain" → "Turn repeated problems into ideas" → "Test before you build")
- Dashboard beginner guide card with 6-step workflow
- Compare Ideas board explains Pursue/Park/Reject/Undecided in plain English
- Detail page validation and evidence sections have beginner descriptions
- CSV always described as "spreadsheet" in user-facing text
- Tab order prefers paste text → upload spreadsheet → upload text file

The Day 1 Beginner Data Path patches add copy for users who do not yet have complaint data:
- Landing page beginner guide has a "Don't have complaints yet?" section with manual collection examples
- Dashboard start-here card explains where to find complaints
- Complaints page has a "Don't have complaints yet?" section with 4 collection methods
- No scraping or automation needed — collect manually and copy/paste

The Start Fresh Test patch addresses workspace-mixing confusion:
- "Testing a new niche?" section on the Complaints page explains Rift analyzes all current workspace data
- "Start fresh test" danger button clears complaints, ideas, and saved ideas with confirmation
- Opportunities page reminds users ideas come from all current workspace complaints
- No schema/AI/scoring/import/localStorage changes; no auth/multi-workspaces added

### Start Fresh Test Patch (Post-M15)
- **Status:** ✅ Done
- **Purpose:** Fix workspace-mixing confusion where old complaints from previous tests mix with new complaints, creating unrelated business ideas. Give users an easy way to clear old data before testing a new niche.
- **What was built/fixed:**
  - New server action `clearWorkspace` in `actions/workspace.ts` — deletes all saved opportunities, opportunities, and complaints in the correct order (respecting foreign-key constraints), then revalidates all relevant paths.
  - New client component `StartFreshButton` in `components/complaints/start-fresh-button.tsx` — danger button with `window.confirm()` before clearing, shows success/error messages.
  - Complaints page: added "Testing a new niche?" section with explanation and the Start Fresh button.
  - Opportunities page: added reminder copy near the generation card explaining ideas come from all current workspace complaints.
- **Not included:** No schema changes, no AI changes, no scoring changes, no new dependencies, no scraping added, no auth added, no multi-workspaces added. localStorage decision/evidence states for old opportunity IDs remain (harmless — old IDs no longer render after clearing).

`pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build` all pass. `pnpm start` smoke-tested locally.

### M16A — Multi-Project Market Tests Foundation
- **Status:** ✅ Done
- **Purpose:** Let signed-in users create and switch between separate market-test projects so complaints, generated ideas, saved ideas, demo/starter data, and Start Fresh behavior do not mix across niches.
- **What was built:** Additive `Project` schema with required `userId`, user relation cascade, project relations on `Complaint`, `Opportunity`, and `SavedOpportunity` using nullable `projectId` plus `onDelete: SetNull`; `User.projects`; projectId indexes; one-off `scripts/backfill-default-projects.ts`; project ownership helpers in `lib/projects.ts`; project-aware links via `projectHref`; minimal dashboard project selector and name-only project creation; project-scoped complaint imports/demo/starter actions, AI run/reset actions, save/unsave actions, and Start Fresh; dashboard, complaints, ideas, detail, compare, and saved pages read `?projectId=...` and filter by both `userId` and `projectId`.
- **Important behavior:** Missing `projectId` uses the user's oldest project or creates `Default project`; unowned project IDs do not expose data; direct opportunity detail links without `projectId` resolve the project from the owned opportunity; related ideas and prev/next stay within the same project; demo dedupe is project-scoped; Start Fresh clears only the current project.
- **Not included:** No project rename/delete/archive, no upload history, no nested project routes, no moving validation checklist/evidence/decision localStorage to the DB, no billing/teams/public sharing/scraping/market-size estimates/fake metrics/fake guarantees, no auth config changes, no middleware/proxy changes, no Gemini prompt/schema changes, no scoring changes, no cleaning/parsing changes, no deployment env var changes.

### M16B1 — Project rename + duplicate-name handling
- **Status:** ✅ Done
- **Purpose:** Let users rename the current project and prevent confusing duplicate project names, so beginners don't mix up workspaces like "Fitness", "Fitness test", "New project".
- **What was built:** `renameProject(prev, formData)` server action in `actions/projects.ts` (requires signed-in user, verifies project ownership server-side, trims the name, requires 1–60 characters, rejects duplicate names per user case-insensitively, revalidates dashboard routes); `createProject` now enforces the same 60-char limit and rejects duplicate names with the beginner-friendly error "You already have a project with this name."; sidebar project selector gained a compact inline Rename form (native form, no modal, no new dependency) plus lightly improved copy ("Create project", "Rename project", "Use separate projects for different niches.").
- **Important behavior:** Duplicate names are blocked at the app level only — no DB unique constraint was added, so any pre-existing duplicate rows keep working. Renaming never changes the project id, so `?projectId=...` URLs and all project-scoped complaints/ideas/saved items stay attached. Changing only the casing of a project's own name is allowed.
- **Not included:** No project delete/archive (still M16B future work), no project sharing/teams/billing, no upload history, no schema changes, no AI/scoring/parsing/cleaning changes, no auth or route-protection changes, no new dependencies, no nested project routes.

### M16B2 — Archive projects safely
- **Status:** ✅ Done
- **Purpose:** Let users hide old projects without deleting anything, so the selector stays uncluttered while all complaints, ideas, and saved data are preserved.
- **What was built:** Additive `Project.archivedAt DateTime?` schema field (applied with `prisma db push`, no other schema changes); `lib/projects.ts` now resolves the oldest ACTIVE project by default, creates `Default project` when no active project exists, and redirects to `/dashboard` when a URL points at the user's own archived project (`requireOwnedProject` still checks ownership only, so unarchive and owned deep links keep working); `archiveProject`/`unarchiveProject` server actions in `actions/projects.ts` (ownership verified server-side, archive blocked for the last active project with "You need at least one active project.", success redirects to an active project); sidebar selector shows active projects only, gained an inline "Archive project" confirm panel ("Archiving hides this project. It does not delete your data.", hidden when only one active project remains) and a collapsible "Archived projects (n)" area with per-project Restore buttons ("Archived projects are hidden, not deleted.").
- **Important behavior:** Archiving only sets `archivedAt` — no rows are deleted and no Complaint/Opportunity/SavedOpportunity relations changed, so restoring a project brings back all its data untouched.
- **Not included:** No permanent delete or bulk delete (still future work), no project sharing/teams/billing, no upload history, no scraping, no new AI calls, no new dependencies, no nested project routes, no auth/route-protection changes, no Gemini prompt/scoring/parsing/cleaning changes.

### M16B3 — Permanent delete for archived projects
- **Status:** ✅ Done
- **Purpose:** Let users permanently clean up old ARCHIVED projects — including that project's complaints, generated ideas, and saved ideas — while keeping active projects impossible to delete directly.
- **What was built:** `deleteArchivedProject(prev, formData)` server action in `actions/projects.ts` (requires signed-in user, verifies ownership server-side, requires the project to be archived first — "Archive this project before deleting it." — and requires the user to type the project name exactly to confirm — "Type the project name exactly to confirm."); deletion runs in one Prisma transaction, children before parent: SavedOpportunity → Complaint → Opportunity → Project, every statement filtered by BOTH the current user's id and the project id so other projects, other users, and legacy rows with `userId = null` are never touched; on success it redirects to `/dashboard`; the sidebar "Archived projects" area gained a per-project two-step "Delete permanently" flow (button → inline confirmation panel with name input, "This removes the project, complaints, ideas, and saved ideas. This cannot be undone."). Restore remains available right next to it.
- **Important behavior:** Delete is intentionally harder than archive (archived-only + typed name confirmation). There is NO undo after delete. Active projects cannot be deleted — archive/restore behavior from M16B2 is unchanged. No schema changes were needed; M16B3 reuses `Project.archivedAt` from M16B2.
- **Not included:** No deleting active projects, no bulk delete, no undo/restore after delete, no project sharing/teams/billing, no upload history, no scraping, no new AI calls, no new dependencies, no nested project routes, no auth/route-protection changes, no Gemini prompt/scoring/parsing/cleaning changes.

### M16C — Persist Validation Workspace state
- **Status:** ✅ Done
- **Purpose:** Move Validation Workspace progress (testing checklist + decision status) from localStorage into the authenticated database so it survives refreshes, browsers, and devices, per user and per project.
- **What was built:** New `ValidationWorkspace` Prisma model (one row per user per opportunity via `@@unique([userId, opportunityId])`; `decisionStatus` string defaulting to "undecided", `validationChecklist` Json `boolean[]`, reserved nullable `validationEvidence`; Cascade relations to User/Project/Opportunity so M16B3 permanent delete cleans it up automatically; applied with `prisma db push`). New `actions/validation.ts` server actions (`setDecisionStatus`, `saveValidationChecklist`, `migrateValidationState`) — each verifies the opportunity belongs to the session user and derives `projectId` server-side. Pages now load validation state server-side and pass it in: opportunity detail → checklist, decision board → statuses, dashboard home → decision counts. `ValidationChecklist` saves with a 600ms debounce and flushes pending saves on unmount; `useDecisionStatuses` updates local state instantly and persists per change; `FounderCommandClient` no longer reads localStorage at all. One-time migrator (`components/dashboard/validation-state-migrator.tsx`, mounted in the dashboard layout) copies old localStorage keys into the DB per user per browser — only inserting missing rows, never overwriting — then never runs again.
- **Important behavior:** UI is unchanged apart from "Saved only in this browser." captions becoming "Saved to your account." / "Decisions are saved to your account." Old localStorage keys are left in place but never read outside the migrator. The evidence-log UI was removed in an earlier UX patch, so there is no evidence state to persist — the column exists for the future only.
- **Not included:** No UI redesign, no notifications/collaboration/billing/uploads/scraping, no new AI calls, no new dependencies, no Gemini prompt/scoring/parsing/cleaning changes, no auth or archive/delete behavior changes.

### M16D — Upload history + AI run history
- **Status:** ✅ Done
- **Purpose:** Make each project feel like a saved market test: users can see what complaint data they added (and from where), when they added it, and when Rift generated ideas from it.
- **What was built:** New `ComplaintImport` model (one row per successful import — CSV upload, pasted text, demo data, starter packs, custom starter complaints, complaint finder — with sourceType, readable label, complaint count; empty imports are never recorded) and new `AIRun` model (one row per "Find ideas" run: created as "running" before the AI work, marked "completed" with the output idea count, or "failed" with a short safe error message — no stack traces). Nullable lineage links: `Complaint.complaintImportId` and `Opportunity.aiRunId` (both `onDelete: SetNull`, existing rows stay valid with null). Compact "Recent data" / "Recent idea runs" panel on the dashboard home (last 5 each, project-scoped, hidden when empty). M16B3's permanent-delete transaction now also deletes the project's `AIRun` and `ComplaintImport` rows so no orphan history remains.
- **Important behavior:** Rerunning ideas is the existing "Find ideas" button — each click records a new `AIRun`, and the pipeline's existing replace-on-rerun behavior (delete this project's old opportunities, regenerate) is unchanged. Archive/restore preserves history (rows are untouched by `archivedAt`). Start Fresh still clears only complaints/opportunities/saved ideas — history rows remain as a record of past work. All history queries filter by both `userId` and `projectId`.
- **Not included:** No file storage or original-file downloads, no run comparison/diffing, no restoring old runs, no version control, no analytics dashboards, no notifications, no new dependencies, no Gemini prompt/scoring/cleaning/parsing changes, no auth or archive/delete behavior changes beyond the delete transaction covering history.

### M17 — Beginner onboarding + first-run flow
- **Status:** ✅ Done
- **Purpose:** Give a first-time user one obvious path: add complaints → find ideas → pick one to test, without adding clutter or a new onboarding system.
- **What was built:** `components/dashboard/onboarding-card.tsx` — a compact "Start your market test" card on the dashboard home with three steps (Add complaints / Find ideas / Pick one to test), each with a done/active state and one clear action button; it REPLACES the two old dashed empty-state blocks and hides itself once the project has complaints, ideas, and any testing progress. Progress is inferred entirely from existing data (complaint count, opportunity count, saved ideas, decisions, checklist ticks from `ValidationWorkspace`) — no new model, nothing stored, no localStorage. Ideas page now shows one state-appropriate action: "Add complaints first" when the project is empty, a prominent "Find ideas — Rift will use N complaints from this project." when there are complaints but no ideas, and a collapsed "Run again" (with honest replace warning) once ideas exist. Complaints page subtitle clarified ("Add real complaints, reviews, or support messages. Rift will look for repeated problems."). Idea detail page gained a compact sidebar "Next step" hint linking to Compare Ideas. All links preserve `projectId` via `projectHref`.
- **Not included:** No new Prisma model, no localStorage product data, no billing/teams/scraping/notifications/sharing/analytics dashboards, no new dependencies, no Gemini prompt/scoring/cleaning/parsing changes, no auth or history behavior changes.

### M18 — Exportable project + idea reports (private Markdown)
- **Status:** ✅ Done
- **Purpose:** Let users take their research out of Rift — save it, paste it into docs, or share it manually — without public links.
- **What was built:** Pure Markdown builders in `lib/reports.ts` (project report: summary counts, top 5 ideas by score, saved ideas, decisions, recent imports/runs, next-step; idea report: summary, score + subscores, why-this-exists, up to 5 evidence quotes from the idea's own linked complaints, decision + checklist status, next step). Server actions `getProjectReport(projectId)` / `getIdeaReport(opportunityId)` in `actions/reports.ts` verify ownership before reading anything and only include the current user's current project/idea data — no invented evidence. `components/reports/export-buttons.tsx` renders small secondary "Export report"/"Copy report" buttons (dashboard home) and "Export idea"/"Copy idea report" (idea detail sidebar): download is a client-side Blob with a safe slugified filename (`rift-project-fitness.md`, `rift-idea-ai-fitness-coach.md`), copy uses the clipboard API with inline success/failure notices.
- **Not included:** No public share pages/URLs, no PDF, no email sending, no Notion/Google Docs integrations, no file storage, reports are NOT saved to the database, no new dependencies, no schema changes, no Gemini/scoring/parsing/auth changes.

### M19 — Lightweight first-party analytics + beta insights
- **Status:** ✅ Done
- **Purpose:** Let the founder see whether real users are progressing through Rift (create project → add complaints → find ideas → open/save → decide → export) without any third-party analytics.
- **What was built:** Additive `ProductEvent` model (userId required, optional projectId/opportunityId with `SetNull`, string `type`, small sanitized Json `metadata`, createdAt). `lib/product-events.ts` `trackProductEvent()` — server-only, sanitizes metadata to ≤10 flat keys with 120-char string caps, swallows all failures so analytics can never break an action. Events tracked: project_created/renamed/archived/restored/deleted, complaints_added (source + count), ideas_generated / ideas_generation_failed, idea_opened (detail page), idea_saved/idea_unsaved, decision_set, checklist_updated (post-debounce), project_exported/idea_exported. `lib/admin.ts` reads `RIFT_ADMIN_EMAILS` (comma-separated, case-insensitive, nothing hardcoded). `/dashboard/beta-insights` — admin-only (everyone else gets notFound()): six total counters, an 8-step usage funnel (distinct-user counts), and the 25 most recent events with user email, project name, and sanitized metadata. Admin-only "Beta insights" sidebar link.
- **Privacy:** events store metadata/counts only — never complaint text, exported report contents, AI prompts, or raw AI output. `.env.example` documents `RIFT_ADMIN_EMAILS`.
- **Not included:** No Mixpanel/PostHog/GA or any third-party tool, no charts library, no cohorts/date filters, no notifications/billing/teams/scraping/sharing, no new dependencies, no auth overhaul, no Gemini/scoring/parsing changes.

### M20 — Private beta access + feedback inbox
- **Status:** ✅ Done
- **Purpose:** Let the founder run a controlled private beta: invite specific testers, revoke access, and collect in-app feedback — without touching Better Auth config or blocking sign-in itself.
- **What was built:** `RIFT_BETA_MODE` env flag ("off"/unset = app behaves exactly as before; "invite_only" = the dashboard layout calls `requireBetaAccess(user)` after `requireUser()`). New `BetaAccess` model (unique normalized lowercase email, status "invited"/"active"/"revoked"; admins from `RIFT_ADMIN_EMAILS` never need a row and can never be locked out) and `BetaFeedback` model (type bug/confusing/idea/praise/other, optional 1–5 rating, message ≤2000 chars, optional pagePath/projectId — project attached only if owned). `lib/beta-access.ts` helpers; invited users are auto-promoted to "active" with `acceptedAt` on first entry; blocked users land on `/beta-access` (shows their signed-in email, "Ask the founder to add this email to the beta." — no email sending, no fake "invite sent"). Admin "Beta access" section on Beta insights (add tester / revoke / restore via `actions/beta.ts`, admin verified server-side) plus a "Recent feedback" inbox (type, rating, message, user email, project, page, date). Compact Feedback widget in the dashboard shell (desktop sidebar + mobile row) via `submitBetaFeedback`. Product events: beta_access_granted, beta_access_revoked, beta_feedback_submitted (feedback text is never logged into events).
- **Not included:** No email sending, no billing/subscriptions/teams, no public sharing, no screenshot upload, no support chat, no third-party tools, no new dependencies, no Better Auth config changes, no Gemini/scoring/parsing changes.

### M21 — Beta hardening + bug bash
- **Status:** ✅ Done (code fixes + build verification; on-device manual QA is tracked in `docs/BETA_QA_CHECKLIST.md`)
- **Purpose:** Stability pass before real private beta testers. No new product features.
- **Bugs found & fixed:**
  1. **Stale client state on soft navigation (real data bug):** the Compare Ideas board kept the previous project's decision statuses when switching projects, and the testing checklist kept the previous idea's ticks when using Prev/Next (React preserves client-component state across same-route navigations). Fixed by keying `DecisionBoardClient` by project id and `ValidationChecklist` by opportunity id so they remount with fresh server-seeded state.
  2. **Duplicate competing CTAs on the dashboard:** the M17 onboarding card and the Founder Command "Next step" card showed the same action at once. Now exactly one renders — onboarding until complaints + ideas + testing progress exist, Founder Command afterwards.
  3. **Raw internals leaked in errors:** the pipeline catch-all surfaced raw Gemini/provider error text to users, and custom starter generation embedded `err.message`. Both now show friendly messages ("Idea generation failed. Please try again in a moment."); real errors still go to server logs and the AIRun row for admins.
  4. **Confusing beta status label:** invited-but-never-signed-in testers displayed as "Access active"; now "Invited — not signed in yet".
  5. **Mobile fixed-header overflow:** an expanded project create/rename/archive or feedback form could push the fixed mobile header past the viewport with unreachable buttons; the row now caps at 70vh and scrolls.
  6. **Repo hygiene / docs-env mismatch:** `.gitignore` now excludes local AI-tool configs (`.commandcode/`, `opencode.json`) and `*.lnk`; the env table in `docs/PROJECT_CONTEXT.md` was missing `RIFT_ADMIN_EMAILS`/`RIFT_BETA_MODE` and now documents the safe `prisma db push` workflow.
- **Also added:** `docs/BETA_QA_CHECKLIST.md` — the founder's manual pre-beta checklist (env, auth/beta access, projects, complaints, generation, detail, validation persistence, saved, compare, export, history, insights, feedback, mobile, security, Vercel).
- **Known issues (documented, not built):**
  - Server actions are not beta-gated: a revoked tester who keeps a tab open could still submit actions on their own data until they navigate (page-level gate then blocks them). Low risk — acceptable for beta; revisit if needed.
  - `idea_opened` fires on every detail render (including prev/next), so per-user event volume is chatty; fine at beta scale.
  - `docs/TESTING_CHECKLIST.md` predates M16C and still references "Saved only in this browser." captions that no longer exist; superseded by `docs/BETA_QA_CHECKLIST.md` for beta QA.
- **Not changed:** Gemini prompt, scoring, cleaning/parsing, auth/Better Auth config, ownership rules, schema (no schema changes in M21). No billing/scraping/sharing/notifications/new dependencies.

### M22 — Complaint finder: Reddit OAuth (403 fix)
- **Status:** ✅ Done
- **Purpose:** The complaint finder's Reddit source always failed with "Reddit search failed (HTTP 403)" — Reddit now blocks unauthenticated requests to the public `www.reddit.com/search.json` endpoint from server/datacenter IPs. Fix it with Reddit's official OAuth API instead of scraping workarounds.
- **What was built:** `lib/complaint-finder.ts` now authenticates via Reddit's OAuth2 client_credentials flow when `REDDIT_CLIENT_ID`/`REDDIT_CLIENT_SECRET` are set (create a "script" app at https://www.reddit.com/prefs/apps): app-only token from `www.reddit.com/api/v1/access_token` (Basic auth, form-encoded), cached in module memory with the response's `expires_in` minus a 60s margin, search via `oauth.reddit.com/search` with a Bearer token; on HTTP 401 the cached token is invalidated and the search retried once. Optional `REDDIT_USER_AGENT` sets the descriptive User-Agent Reddit asks for. Without credentials the finder still tries the public endpoint and, on 403, the error message now tells the founder to set the env vars. 429 gets a "rate limit, try again in a minute" hint. Error strings and logs contain env-var names and HTTP statuses only — never the secret or token. Documented in `.env.example`, the env table in `docs/PROJECT_CONTEXT.md`, and `docs/BETA_QA_CHECKLIST.md`.
- **Not changed:** Gemini prompt, scoring, CSV/paste pipeline, App Store fetcher, `actions/complaint-finder.ts`, the finder UI component, Prisma schema, auth. No new dependencies (built-in `fetch` + `Buffer`). The fail-soft source contract (`{ complaints, error? }`) is preserved — a dead Reddit source still never breaks App Store results.

### M23 — Complaint finder: Hacker News source (user-approved)
- **Status:** ✅ Done
- **Purpose:** Reddit disabled self-serve API app creation (Responsible Builder Policy, Nov 2025) — new credentials now require an application to Reddit and a multi-week wait. While the founder waits for approval, the finder needed a third source that works with no key or sign-up. The founder explicitly approved adding Hacker News.
- **What was built:** `fetchHackerNewsComplaints()` in `lib/complaint-finder.ts` using the free HN Algolia search API (`hn.algolia.com/api/v1/search`, no auth). Algolia has no OR query syntax, so it runs three parallel searches (`<keyword> frustrating|annoying|problem`) over stories + comments from the last 2 years, merges and dedupes by `objectID`, strips HTML/entities from comment text, applies the same ≥30-char body bar as Reddit, caps at 25. One failed term-query is ignored; total failure fails soft with "Hacker News search failed (…)". `actions/complaint-finder.ts` runs it in the same `Promise.all` and returns `hackerNewsFound`; the finder UI line now reads "N from Reddit, M from App Store reviews, K from Hacker News".
- **Not changed:** Gemini prompt, scoring, CSV/paste pipeline, Reddit/App Store fetchers, dedupe rules, Prisma schema, auth. No new dependencies, no env vars needed for HN.

### Post-M21 — Beta launch prep + landing polish (small pass, no milestone number)
- **Status:** ✅ Done
- **What was done:** New `docs/LAUNCH_RUNBOOK.md` (ordered founder playbook: Vercel env setup → production QA → flip invite-only → invite testers with a message template → week-one monitoring → rollback). Landing/SEO polish: `metadataBase` from `BETTER_AUTH_URL`; metadata retitled from "Opportunity Intelligence Platform" to "Rift — Turn complaints into business ideas" with description matching the hero; new `app/opengraph-image.tsx` (next/og, no dependency) so shared links render a real social card; new slim sticky `components/landing/nav.tsx` (logo + Sign in + Get started — previously there was NO way to reach sign-in from the landing page); footer gained Sign in / Create account / How it works links; hero trust line changed from "Free to try. No card required." to "Free during the private beta."; auth-page "Rift" headings link back home; `/beta-access` added to robots disallow.
- **Not included:** No Privacy/Terms pages (pre-public-launch work, listed in the runbook), no invite-code field on sign-up (gating stays post-signup via `/beta-access`), no product/schema/AI changes.

### M25 — Pricing page + plan design
- **Status:** ✅ Done (July 2026, built in the M25–M29 one-run push; M24 skipped by founder decision)
- **What was built:** `lib/plans.ts` (free: 3 active projects, 10 idea runs/mo, 20 finder searches/mo, 1,000 complaints/project; pro: 100/500/1,000/20,000; Pro = $9/month), public `/pricing` page (Free vs Pro cards, honest copy, no fake urgency; CTA adapts to signed-out / free / pro / billing-disabled states), Pricing links in landing nav + footer + sitemap. Admins from `RIFT_ADMIN_EMAILS` always resolve to pro limits.

### M26 — Usage limits / quotas
- **Status:** ✅ Done (July 2026)
- **What was built:** `lib/quotas.ts` — all counts derived from existing rows (`Project.archivedAt`, `AIRun`, `ComplaintImport sourceType="finder"`, `Complaint`), UTC calendar-month windows, friendly limit messages pointing at the Pricing page. Enforcement wraps existing actions only: `createProject` (replaces the M16A 100-cap, which became pro's cap), `runPipeline` (checked before any progress/history rows), all five complaint import actions (checked post-dedupe so re-imports never trip), and the complaint finder (search quota before external fetches + complaint cap before insert). Usage line ("N of 10 free idea runs used this month") on the Ideas page for free-plan users. Known generous quirk: zero-result finder searches record no import row, so they don't count.

### M27 — Pre-billing prerequisites
- **Status:** ✅ Done (July 2026)
- **What was built:** `/privacy` + `/terms` (plain-English, linked from footer and sign-up agree-line), `lib/email.ts` (Resend HTTP API via fetch — no SDK; key-gated on `RESEND_API_KEY`; `EMAIL_FROM` optional), Better Auth `emailAndPassword.sendResetPassword` registered only when email is enabled, `/forgot-password` (neutral anti-enumeration copy) + `/reset-password` pages, sign-in page split into a server wrapper + `components/auth/sign-in-form.tsx` so "Forgot password?" only renders when reset emails can actually send. Domain steps documented in the runbook (no code needed — metadata derives from `BETTER_AUTH_URL`).

### M28 — Billing with Stripe
- **Status:** ✅ Done (July 2026, founder-authorized)
- **What was built:** `stripe` dependency (the only new package), `lib/stripe.ts` (key-gated on `STRIPE_SECRET_KEY` + `STRIPE_PRICE_PRO_MONTHLY`), `actions/billing.ts` (checkout session in subscription mode + billing portal; both redirect to Stripe), `app/api/stripe/webhook/route.ts` — signature-verified, and the **single writer of `User.plan`** (`checkout.session.completed`, `customer.subscription.updated`, `.deleted`; active/trialing/past_due ⇒ pro). User gained `plan`/`stripeCustomerId`/`stripeSubscriptionId`/`planUpdatedAt`. Product events `subscription_started`/`subscription_canceled` on real transitions only.

### M29 — Public share links + print-to-PDF reports
- **Status:** ✅ Done (July 2026 — both variants shipped)
- **What was built:** `ShareLink` model (32-hex crypto-random token, all relations `onDelete: Cascade` so a public URL can never outlive its data; M16B3's manual delete transaction clears them too), `actions/share.ts` (create reuses the live link per target; revoke sets `revokedAt`), report data assembly extracted verbatim to `lib/report-data.ts` (Markdown export output unchanged), public `/share/[token]` page (no auth, revoked/unknown ⇒ 404, `robots` noindex + `/share` disallowed), "Save as PDF" print button + scoped `@media print` CSS, Share/Revoke buttons beside the existing export buttons on the dashboard and idea detail pages.

---

## Planned milestones (founder-approved sequence, July 2026)

Do **not** start any of these without an explicit user prompt for that specific milestone. The ORDER is deliberate — do not jump ahead (especially not to Stripe).

> Note: M7–M23 and M25–M29 are complete — see "Completed milestones" above. M25–M29 were built in one founder-approved run in July 2026.

### M24 — Feedback fixes from first testers
- **Status:** ⏸ SKIPPED FOR NOW (founder decision, July 2026) — the founder chose to finish M25–M29 first. Revisit once real testers have used the app for ~a week; scope is their feedback (Beta insights funnel + feedback inbox), which cannot be written in advance.
- **Ad-hoc fixes shipped as feedback arrives:** visible "Save"/"Saved" label on the idea-card bookmark button (July 2026 — a tester flagged the icon-only button as unclear; `SaveButton` gained a `showLabel` prop, behavior unchanged).
- **Round 2 (July 2026, @Berserk review):** collapsible desktop sidebar (icon rail, localStorage-persisted) + mobile hamburger drawer replacing the horizontally-scrolling pill strip (`components/dashboard/shell.tsx`); RiftMark brand mark in the dashboard shell; tab titles switched to `|` separator and the doubled "— Rift · Rift" suffix bug fixed; Save-button `group/inline-flex`→`inline-flex` alignment fix; dashboard home folds "Recent activity" and "Recent complaints" into collapsed `<details>`; duplicate MiniStats row removed from the idea detail page.
- **Rejected suggestion (do not re-litigate):** the same review recommended adopting "opendesign" from GitHub for UI components. Deep-researched July 2026: no such React/Tailwind component library exists (the name resolves to an unrelated AI design desktop app, a dead UNLICENSED design-file SDK, and a Vue-only library); unsolicited install tips like this match documented supply-chain attack patterns. Rift keeps its own hand-built primitives; do not add UI-kit dependencies without an explicit founder decision.

### M30 — Complaint Finder v2 (PARTIALLY BUILT EARLY, founder decision, July 2026)
- **Shipped early (before beta launch):** whole-web source via Tavily search API (`fetchWebComplaints` in `lib/complaint-finder.ts`; `TAVILY_API_KEY`; Gemini extracts verbatim complaint passages via the isolated `lib/web-complaint-extract.ts` — clustering prompt/scoring untouched; fail-soft like every other source) + one-click niche suggestion chips in the finder (`lib/niche-suggestions.ts`, curated list, no AI) so beginners never face a blank input.
- **Remaining future scope:** scheduled/zero-input automatic discovery. Highest external risk on the list (source ToS, IP blocking, rate limits, AI cost) — scope carefully and keep fail-soft per-source behavior. Do not start without an explicit prompt.

---

## Unscheduled ideas (no slot, revisit after M30)

### Light mode + theming
- Toggle light/dark; persist preference locally. Pure UX; no schema changes.

### Notification & in-app messaging
- Server-side status when long jobs complete; optional email digest. (Email capability arrives in M27.)

### Prompt experimentation
- A/B different Gemini prompts and track quality. **Must not change the production prompt or scoring weights without explicit sign-off.**

---

## Standing rules per milestone

- Billing (M28) and the password-reset auth config change (M27) are SHIPPED, founder-authorized one-offs. Do not extend billing or auth config further without an explicit founder prompt. Never write `User.plan` anywhere except the Stripe webhook (`app/api/stripe/webhook/route.ts`).
- Do not add teams, notifications, or automatic scraping as MVP requirements.
- Do not change AI prompts unless the milestone explicitly asks for it.
- Do not change scoring logic unless the milestone explicitly asks for it.
- Keep the MVP focused on proving the core workflow (upload → cluster → score → browse → save → detail → deploy).
