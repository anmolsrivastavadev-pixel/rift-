# Rift — Testing Checklist

> Practical manual checklist for verifying Rift end-to-end. Run the relevant sections before reporting a milestone complete. Do not run destructive database commands from this checklist.

---

## Pre-flight commands (run before any milestone sign-off)

```bash
pnpm exec tsc --noEmit       # must exit 0 with no output
pnpm lint           # must exit 0 with no warnings
pnpm build          # must exit 0; routes should compile
pnpm exec prisma validate    # must pass without warnings
pnpm exec prisma generate    # must regenerate lib/generated/prisma cleanly
```

For `pnpm build`, the expected output ends with:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /dashboard
├ ƒ /dashboard/complaints
├ ○ /dashboard/opportunities
├ ƒ /dashboard/opportunities/[id]
├ ○ /dashboard/saved
├ ○ /robots.txt
└ ○ /sitemap.xml
```

(Static `○` and dynamic `ƒ` flags are fine — the route list matters.)

---

## 1. Local setup

- [ ] Node.js 18.18+ installed (`node -v`).
- [ ] PostgreSQL installed and running on `localhost:5432` (or a Neon project).
- [ ] `pnpm install` completes (may print peer-dep warnings — pnpm handles these gracefully).
- [ ] `.env` exists with `DATABASE_URL` and `GEMINI_API_KEY` filled in (use `.env.example` as a template).
- [ ] `pnpm exec prisma generate` runs and creates `lib/generated/prisma/`.
- [ ] `pnpm exec prisma db push` runs and creates the three tables in Postgres.
- [ ] `pnpm dev` boots and prints `✓ Ready in`.
- [ ] `curl -I http://localhost:3000/` returns `200`.

## 2. Environment variables

- [ ] `DATABASE_URL` is set in `.env` (local) and in Vercel env vars (production).
- [ ] `GEMINI_API_KEY` is set in `.env` (local) and in Vercel env vars (production).
- [ ] `.env` is **not** staged for commit (`git status` should not list `.env`).
- [ ] `.env.example` **is** committable (gitignored with `!.env.example` exception).
- [ ] No source file imports `process.env.DATABASE_URL` or `process.env.GEMINI_API_KEY` from a `"use client"` file. (Quick audit: `grep -r "process.env" --include="*.tsx" --include="*.ts" app/ components/` should only show hits in `lib/db.ts` and `lib/ai.ts`, plus JSDoc comments inside `lib/generated/prisma/`.)

## 3. Database connection

- [ ] `psql -U postgres -d rift -c "SELECT 1;"` returns 1 (or use the equivalent for your install).
- [ ] `/dashboard` loads without a Prisma connection error.

## 4. CSV upload — happy path

- [ ] Open `/dashboard/complaints`.
- [ ] Download `sample_complaints.csv` from the page (or use the one in `/public`).
- [ ] Drag it onto the uploader, or click to browse and select it.
- [ ] Click **Upload complaints**.
- [ ] A green "Imported 10 complaints" summary appears.
- [ ] `/dashboard` reflects the new count in the **Complaints** KPI card.
- [ ] The "Complaints over time" chart renders with bars.

## 5. CSV upload — invalid input

- [ ] Drag a non-CSV file (e.g., a `.png`) onto the uploader → it is rejected with a clear error ("not a CSV file").
- [ ] Upload a CSV with only a `body` column (no `title`, no `sourceDate`) → rows import successfully.
- [ ] Upload a CSV with a `body` column containing an empty cell for one row → that row is skipped; others import.
- [ ] Upload a CSV whose complaint column is named `feedback` (not `body`) → rows import (the action accepts many synonyms).
- [ ] Upload a CSV whose complaint column is named `manifest_id` (not recognised) → uploader returns a single clear error listing the detected columns and the expected ones.

## 6. "Use demo data" button

- [ ] On `/dashboard/complaints`, click **Use demo data** (now lives below the input tabs, shared across CSV / Paste Text / Upload Text File).
- [ ] A spinner shows "Loading demo…" while pending.
- [ ] A green success message appears — "Demo complaints added (N) …" — and links to **Opportunities → Run AI clustering**.
- [ ] Clicking it again when all demo rows already exist shows "Demo complaints are already loaded. You can run AI clustering now." and creates no duplicates.
- [ ] Complaints list underneath the input refreshes to show the demo rows.

## 7. Complaint validation

- [ ] Duplicates are dropped by `cleanComplaints` — verified via `lib/cleaning.ts` behaviour or by uploading a CSV with two identical bodies and seeing only one import.
- [ ] Complaints shorter than 3 non-whitespace characters are dropped.

## 8. AI clustering (requires `GEMINI_API_KEY`)

- [ ] Open `/dashboard/opportunities`.
- [ ] Click **Run AI clustering**. The progress panel renders stages: Cleaning → Clustering → Generating → Saving → Complete.
- [ ] Within ~30s for the 10-row sample, the panel shows a green "Complete. N opportunities created" message.
- [ ] Opportunity cards appear on the grid, sorted by Opportunity Score.
- [ ] Without a `GEMINI_API_KEY`, the same flow runs and produces mock clusters (key-less fallback) — cards still appear with `Mock cluster (no Gemini key)` reasoning.

## 9. Opportunity creation

- [ ] The **Opportunities** KPI on `/dashboard` increments.
- [ ] The **Avg. score** KPI updates from `—` to a numeric value.
- [ ] The **Industries** KPI reflects distinct industries from the run.
- [ ] Visiting `/dashboard/opportunities/<id>` for any created opportunity renders the detail page (no 404).

## 10. Opportunity scoring

- [ ] Every opportunity has `opportunityScore` between 0 and 100.
- [ ] The score breakdown panel on the detail page shows three bars (Frequency, Severity, Confidence) and a Final Opportunity Score match.
- [ ] Re-running the pipeline on the same dataset produces the same scores (deterministic — same input → same output).
- [ ] The scores match the formula in `lib/scoring.ts`: `round(countScore*0.4 + severityScore*0.35 + confScore*0.25)`. (Spot-check one opportunity.)

## 11. Dashboard stats

- [ ] `/dashboard` shows 4 KPI cards: Opportunities, Avg. score, Complaints, Industries — each with a Lucide icon.
- [ ] "Complaints over time" chart renders bars of varying heights when source dates differ.
- [ ] "Recent complaints" shows the latest 5 with title + truncated body. Empty state shows when no complaints exist.
- [ ] "Next: generate opportunities" card links to `/dashboard/opportunities`.

## 12. Search

- [ ] On `/dashboard/opportunities`, type into the search box.
- [ ] Results filter live against title, summary, industry, Product Opportunity text (stored as `suggestedSoftware`), and keywords.
- [ ] The "Showing X of Y opportunities" counter updates with `aria-live="polite"` (visible to screen readers).
- [ ] Clearing the search box restores the full list.

## 13. Filters

- [ ] Industry dropdown is populated from the actual industries in the dataset.
- [ ] Setting "Min score" to e.g. 65 hides opportunities below 65.
- [ ] "Min severity" slider and "Min complaints" slider each filter correctly.
- [ ] Multiple filters combine.
- [ ] **Reset filters** button restores all defaults.

## 14. Sorting

- [ ] Switching the Sort dropdown reorders cards for: Highest Opportunity Score, Lowest Opportunity Score, Highest Severity, Most Complaints, Newest.

## 15. Saved opportunities

- [ ] Click the bookmark icon on a card → it fills in primary colour within ~150ms.
- [ ] Navigate to `/dashboard/saved` → the saved opportunity appears.
- [ ] Click the bookmark again (on either page) → it un-fills and the saved page no longer shows it.
- [ ] On the saved page with no saved items, the `BookmarkX` empty state appears with a "Browse opportunities" CTA.

## 16. Opportunity detail page

- [ ] Header shows: industry, title, and the five stats (Score, Severity, Confidence, Complaints, Created).
- [ ] Prev/Next nav appears above the columns; clicking navigates to the right neighbour by `createdAt DESC`.
- [ ] On the newest opportunity, the **Next** button is disabled (opacity 50%, `aria-disabled="true"`).
- [ ] On the oldest opportunity, the **Previous** button is disabled.
- [ ] Right column is sticky on desktop (`lg:sticky lg:top-6`) and not sticky on mobile.
- [ ] Score Breakdown shows three progress bars plus the Final Opportunity Score.
- [ ] Keywords are sorted alphabetically.
- [ ] Example Complaints lists up to 5 complaints, oldest first.
- [ ] If any complaint body exceeds 500 chars, a **Show more** / **Show less** toggle appears for that complaint.
- [ ] AI Reasoning is shown inside the M9 Market Gap Hypothesis section as a "Why this could matter" note (M9 restructured the page; the standalone "AI Reasoning" card was retired in favour of the hypothesis section).
- [ ] Product Opportunity card uses the Lightbulb icon and renders `productAngle` (falling back to `suggestedSoftware` on legacy rows).

## 17. Related opportunities (if present)

- [ ] Related Opportunities section in the right column shows up to 3 cards.
- [ ] When ≥2 keywords overlap with another opportunity, that card appears with a "N shared keywords" badge.
- [ ] When fewer than 3 keyword-matched opportunities exist, same-industry opportunities fill the remaining slots (no shared-keyword badge).
- [ ] If no related opportunities exist, a small `Layers` empty state appears.
- [ ] No duplicates; current opportunity is excluded.

## 18. Empty states

- [ ] `/dashboard/opportunities` with 0 opportunities shows the `Target` empty state with a "Run AI clustering" CTA.
- [ ] Search returning no matches shows the `SearchX` empty state with a "Reset filters" CTA.
- [ ] `/dashboard/saved` with no saves shows the `BookmarkX` empty state.
- [ ] Detail page with no linked complaints shows the `MessageSquareOff` empty state inside Example Complaints.
- [ ] Detail page with no related opportunities shows the `Layers` empty state inside Related Opportunities.

## 19. Accessibility

- [ ] Icon-only buttons (save, prev/next disabled state) have `aria-label`.
- [ ] All filter inputs (search, industry select, sort select, three sliders) have `aria-label`.
- [ ] Disabled prev/next use `aria-disabled="true"` and `role="link"` (announce intentionally disabled).
- [ ] Tabbing through the page shows a visible focus outline on interactive elements.
- [ ] Heading order is reasonable: page H1, section H2s, card H3s.

## 20. Mobile layout

- [ ] On a 375px viewport (mobile), `/dashboard` KPI grid collapses to 2 columns.
- [ ] `/dashboard/opportunities` filter row stacks vertically; sort dropdown and reset button remain accessible.
- [ ] Opportunity cards span the full width and never overflow horizontally.
- [ ] Detail page renders a single column (right sidebar moves below left content) with no sticky behaviour.
- [ ] Prev/Next nav wraps gracefully without horizontal scroll.

## 21. Production build

- [ ] `pnpm build` exits 0.
- [ ] `pnpm start` boots the production server (`✓ Ready in ...`).
- [ ] `curl -I http://localhost:3000/` returns `200`.
- [ ] `curl -I http://localhost:3000/dashboard` returns `200`.
- [ ] `curl -I http://localhost:3000/robots.txt` returns `200`.
- [ ] `curl -I http://localhost:3000/sitemap.xml` returns `200`.
- [ ] `curl -I http://localhost:3000/sample_complaints.csv` returns `200` and the right `Content-Type`.

## 22. Vercel deployment readiness

Pre-deploy checks:
- [ ] `.env` is not staged for commit.
- [ ] `public/sample_complaints.csv` is committed.
- [ ] `package.json` `build` script is `prisma generate && next build`.
- [ ] `.gitignore` excludes `.env*` (except `.env.example`) and `/lib/generated/prisma`.
- [ ] No temp files (`test-*`, `seed-*`, `gen_complaints.*`) are staged.
- [ ] No screenshots or accidental binary files are staged.
- [ ] `git log` on the working branch shows clean, conventional commit messages.

Vercel env vars to add:
- [ ] `DATABASE_URL` — Neon pooled connection string with `?sslmode=require`.
- [ ] `GEMINI_API_KEY` — your Gemini API key.

Post-deploy checks (on the deployed URL):
- [ ] `/` loads (landing page).
- [ ] `/dashboard` loads, KPIs are 0 / "—" before any upload.
- [ ] `/dashboard/complaints` lets you click **Use demo data** and shows the green success summary.
- [ ] `/dashboard/opportunities` lets you click **Run AI clustering** and shows the progress panel.
- [ ] After completion, opportunities render with scores.
- [ ] `/dashboard/saved` shows the `BookmarkX` empty state (no saves yet).
- [ ] `/sample_complaints.csv` downloads the sample file.
- [ ] `/robots.txt` and `/sitemap.xml` serve correctly.

---

## 23. M7 — Repositioning + demo flow

- [ ] Landing page hero explains Rift finds startup opportunities from real market pain and offers a demo path.
- [ ] Landing page hero, features, and how-it-works each have a distinct purpose (no repeated hook).
- [ ] `/sample_complaints.csv` downloads and uploads successfully.
- [ ] "Use demo data" inserts the fake demo complaints.
- [ ] Clicking "Use demo data" a second time shows the "Demo complaints are already loaded. You can run AI clustering now." message and does NOT create duplicates.
- [ ] After demo data load, the success message guides to Opportunities → Run AI clustering.
- [ ] Opportunity cards say "Product opportunity:" instead of "Suggested:".
- [ ] Opportunity detail page shows a "Product Opportunity" labelled section.
- [ ] Opportunity cards show a compact score helper: "Score combines frequency, severity, and confidence."
- [ ] Opportunity detail page shows the full score explanation under the score breakdown.
- [ ] No-opportunities empty state offers direct CTAs: Use Demo Data / Download Sample CSV / Upload CSV / Run AI clustering.
- [ ] Dashboard overview copy reads as "this MVP workspace" tone; the stale "Available in Milestone 3" note is gone.
- [ ] No UI text says "Suggested Software" or "Suggested:" any more (internal `suggestedSoftware` DB field unchanged).

---

## 24. M8 — Flexible input (paste text + text files)

- [ ] On `/dashboard/complaints`, three input tabs render: Upload CSV, Paste Text, Upload Text File.
- [ ] CSV upload still works (retest the M2/M4 happy path).
- [ ] "Download sample CSV" and "Use demo data" appear below all tabs (moved out of the CSV-only area) and still work.
- [ ] Paste Text: paste bullet-list text → "Import pasted text" creates complaint rows.
- [ ] Paste Text: paste blank-line-separated paragraphs → each paragraph becomes one complaint row.
- [ ] Paste Text: entries under 10 characters are ignored (not imported).
- [ ] Paste Text: exact duplicate bodies (case-insensitive) within the paste are skipped.
- [ ] Paste Text: bodies already in the database (case- + whitespace-insensitive) are not re-inserted.
- [ ] Paste Text: success summary "Imported N complaints … Now run AI clustering to generate opportunities." appears and links to Opportunities.
- [ ] Repeat Paste Text with the same content in different casing → "These complaints are already loaded. You can run AI clustering now."
- [ ] Upload Text File: a `.txt` file imports the same rows as pasting its contents would.
- [ ] Upload Text File: a `.md` file imports the same rows.
- [ ] Uploading a non-text file (e.g. `.png`) shows a clear "Unsupported file type" error and does not submit.
- [ ] Source type dropdown + optional source label render for both paste and file; the label is not stored on the complaint (UI feedback only).
- [ ] After a text import, clicking "Run AI clustering" on `/dashboard/opportunities` processes the new complaints into scored opportunities exactly as it does for CSV data.
- [ ] Dashboard complaint KPI, complaints list, and complaints search reflect the new rows.
- [ ] No Prisma model was changed for M8 (`Complaint` reused; no `Source`/`Upload`/`User` models).

---

## 25. M9 — Market Gap Hypothesis

- [ ] `pnpm exec prisma validate` passes; `pnpm exec prisma generate` regenerates the client; `pnpm exec prisma db push` adds the new `Opportunity` columns non-destructively (no data wipe).
- [ ] Run AI clustering creates opportunities that include `marketGap`, `targetCustomer`, `likelyCurrentWorkarounds`, `whyWorkaroundsFallShort`, `productAngle`, `differentiationAngle`, `validationQuestions`, `riskFlags`.
- [ ] Opportunity detail page left column reads (in order): Problem Summary → Evidence From Complaints → Product Opportunity → Market Gap Hypothesis → Validation Workspace.
- [ ] Market Gap Hypothesis section shows the six hypothesis fields with a clear "hypothesis, not proven market research" sub-label.
- [ ] Validation Questions and Risk Flags are rendered inside the Validation Workspace (not as separate duplicate sections).
- [ ] Score Breakdown, Related Opportunities, and Prev/Next are still present (in the right column / below).
- [ ] Opportunity cards show a compact "For: [targetCustomer] / Angle: [productAngle]" preview when M9 fields exist; the preview is hidden on legacy rows.
- [ ] Saved page cards show the same compact M9 preview.
- [ ] Product Opportunity section uses `suggestedSoftware` (broad); Product Angle field inside Market Gap Hypothesis uses `productAngle` (wedge) — never the same content twice.
- [ ] Legacy opportunities created before M9 render without crashing: missing M9 fields show a subtle "Run AI clustering again to generate market gap hypotheses…" rerun hint (no fake placeholder analysis).
- [ ] Mock fallback (no `GEMINI_API_KEY`) produces clearly-fake M9 fields prefixed "Mock …".
- [ ] No UI text claims market size, revenue, or named competitors (unless a competitor is literally in the complaint text).
- [ ] Search matches against `targetCustomer` and `productAngle` (type a word from either into the opportunities search box).
- [ ] Save/unsave, CSV upload, paste text, `.txt`/`.md` upload, and Use Demo Data all still work unchanged.

---

## 26. M10 — Opportunity Validation Workflow

- [ ] Opportunity detail page shows a Validation Workspace section (full-width, below the two-column layout).
- [ ] Validation Workspace includes: Hypothesis To Test, Who To Interview, Interview Questions, Evidence To Collect, Signs This May Be Worth Pursuing, Risks To Test, Validation Checklist, Copy Validation Brief.
- [ ] Hypothesis To Test uses `marketGap` → `productAngle` → `summary` → `suggestedSoftware` fallback; shows rerun hint when all M9 fields are missing.
- [ ] Who To Interview uses `targetCustomer` when available; falls back to "Start with people who match the complaints shown in Evidence From Complaints."
- [ ] Interview Questions use `validationQuestions` when available; deterministic fallback questions fill in until at least 3 exist.
- [ ] Evidence To Collect shows the deterministic 5-item checklist.
- [ ] Signs This May Be Worth Pursuing shows the deterministic 5-item success signals.
- [ ] Risks To Test uses `riskFlags` when available; deterministic fallback risks appear when missing.
- [ ] Validation Questions and Risk Flags are NOT rendered as separate standalone sections (only inside the Validation Workspace — no duplicates).
- [ ] Interactive checklist can be checked and unchecked.
- [ ] Checklist state persists after refresh in the same browser (localStorage key `rift-validation-checklist-${opportunity.id}`).
- [ ] Checklist state is separate per opportunity ID (check an item on one opportunity, navigate to another — it is unchecked).
- [ ] "Saved only in this browser." note appears below the checklist.
- [ ] "Copy validation brief" copies concise plain text to clipboard; "Copied validation brief." appears on success.
- [ ] If clipboard fails, "Copy failed. Select the text manually." appears.
- [ ] Existing Score Breakdown, Related Opportunities, Prev/Next, save/unsave all still work.
- [ ] Existing search/filter/sort, CSV/paste/.txt/.md upload, demo data, AI clustering all still work.
- [ ] No Prisma schema was changed; no new dependencies; no new Gemini calls.

---

## 27. M11 — Opportunity Decision Board

- [ ] `/dashboard/opportunities/decision-board` loads.
- [ ] `/dashboard/opportunities` has a "Decision Board" link/button to the new page.
- [ ] `/dashboard/opportunities` page still works unchanged.
- [ ] Empty state shows when there are no opportunities ("No opportunities to compare yet" + CTAs to Complaints and Opportunities).
- [ ] Existing opportunities render as comparison cards on the Decision Board.
- [ ] Summary cards show Total / Pursue / Park / Reject / Undecided counts.
- [ ] Status selector (native `<select>`) works — can change an opportunity to Pursue / Park / Reject / Undecided.
- [ ] Status persists after refresh in the same browser (localStorage key `rift-opportunity-decision-${opportunity.id}`).
- [ ] Status is separate per opportunity ID.
- [ ] Filters work for All / Pursue / Park / Reject / Undecided.
- [ ] Testing Priority labels appear (Needs more evidence / High risk / Strong signal / Worth testing / Needs review).
- [ ] Testing Priority copy makes clear it is not a new AI score.
- [ ] Testing Priority is NOT shown as a numeric score, percentage, rank, or replacement for Opportunity Score.
- [ ] Each card links to the opportunity detail page.
- [ ] "Saved only in this browser." note appears.
- [ ] "Saved opportunities are bookmarks. Decision status is your local next-step choice." helper line appears in the header.
- [ ] Existing Opportunity Browser, detail page, Validation Workspace, checklist, Copy Validation Brief, save/unsave, and upload flows all still work.
- [ ] No localStorage or hydration errors in the browser console.
- [ ] No Prisma schema was changed; no new dependencies; no new Gemini calls.

---

## 28. M12 — Validation Evidence Log

- [ ] Opportunity detail page shows a Validation Evidence Log section below the Validation Workspace.
- [ ] Evidence Log has three grouped cards: Conversation counts, Signal quality, Evidence summary.
- [ ] Numeric fields (Interviews completed, People reporting same pain, People using workaround, People willing to try, People willing to pay) update and persist after refresh.
- [ ] Numeric fields clamp to 0–20.
- [ ] Dependent counts never exceed Interviews completed.
- [ ] Lowering Interviews completed automatically clamps dependent counts down.
- [ ] Empty numeric input does not store `NaN`.
- [ ] Select fields (Strongest signal, Biggest concern) update and persist after refresh.
- [ ] Unknown select values in localStorage fall back to "None yet".
- [ ] Textarea updates and persists after refresh.
- [ ] Textarea clamps to 500 characters.
- [ ] Reset evidence resets only evidence for that opportunity (does not reset checklist, decision status, saved, or DB).
- [ ] Evidence state is separate per opportunity ID (localStorage key `rift-validation-evidence-${opportunity.id}`).
- [ ] Evidence Signal label updates deterministically (No evidence → Needs more → Weak → Promising → Mixed → Early).
- [ ] Evidence Signal copy says it is not an AI score or proof.
- [ ] Suggested Next Step appears as helper copy only (does not update M11 decision status).
- [ ] "Saved only in this browser." note appears.
- [ ] Privacy helper appears ("Store patterns, not personal details…").
- [ ] No localStorage or hydration errors in browser console.
- [ ] Decision Board still loads, filters work, status persists.
- [ ] Copy Validation Brief still works.
- [ ] Save/unsave, Score Breakdown, Related Opportunities, Prev/Next, and upload flows all still work.
- [ ] No Prisma schema was changed; no new dependencies; no new Gemini calls.

---

## 29. M13 — Evidence-Aware Decision Board

- [ ] `/dashboard/opportunities/decision-board` loads with evidence snapshots on each opportunity card.
- [ ] Each card shows: Evidence Signal label, interview/pain/willing-to-try/willing-to-pay counts, Suggested Next Step, and "Open evidence log" link.
- [ ] Opportunities with no evidence show "No evidence yet" + link.
- [ ] Evidence entered on the detail page appears on the Decision Board after refresh.
- [ ] Evidence refreshes when the window receives focus (edit on detail page → return to board → focus → snapshot updates).
- [ ] Evidence state is separate per opportunity ID.
- [ ] Decision Board never writes to `rift-validation-evidence-${opportunityId}` (read-only).
- [ ] "Open evidence log" links to `/dashboard/opportunities/[id]#validation-evidence-log`.
- [ ] Anchor `#validation-evidence-log` scrolls to the Evidence Log section on the detail page.
- [ ] Header helper line explains Testing Priority vs Evidence Signal.
- [ ] Testing Priority still appears and still says it is not a new AI score.
- [ ] Evidence Signal does not automatically change decision status.
- [ ] No evidence filters were added.
- [ ] Decision status selector, filters, and summary counts all still work.
- [ ] Copy Validation Brief still works unchanged.
- [ ] Save/unsave, Score Breakdown, Related Opportunities, Prev/Next, and upload flows all still work.
- [ ] No localStorage or hydration errors in browser console.
- [ ] No Prisma schema was changed; no new dependencies; no new Gemini calls.

---

## 30. M14 — Founder Command Center

- [ ] `/dashboard` loads with "Founder Command Center" header.
- [ ] 4 project stat cards render: Complaints loaded, Opportunities generated, Saved, Highest score (shows `—` when no opportunities).
- [ ] Recommended Next Action card renders and changes based on complaints/opportunities/local decision+evidence state.
- [ ] 5 Workflow Step cards render (Import → Generate → Review → Validate → Decide) with deterministic status labels (Not started / Ready / In progress / Done).
- [ ] Decision status summary reads existing localStorage decision statuses (Pursue / Park / Reject / Undecided counts).
- [ ] Evidence summary reads existing localStorage evidence (with evidence / no evidence / promising / needs more counts).
- [ ] Dashboard does NOT write to decision or evidence localStorage (read-only).
- [ ] Evidence/decision summaries refresh on window focus.
- [ ] High-signal opportunities section shows up to 3 top-scoring opportunities with links to detail pages.
- [ ] Empty state "Start by adding customer complaints" appears when complaintCount = 0.
- [ ] Empty state "Ready to generate opportunities" appears when complaints exist but no opportunities.
- [ ] Links to Complaints, Opportunities, Decision Board, and detail pages all work.
- [ ] Existing `/dashboard/complaints`, `/dashboard/opportunities`, `/dashboard/opportunities/decision-board`, and detail pages all still work.
- [ ] Validation Evidence Log, Decision Board, Copy Validation Brief, save/unsave all still work.
- [ ] No localStorage or hydration errors in browser console.
- [ ] No Prisma schema was changed; no new dependencies; no new Gemini calls.

---

## 31. M15 — MVP Release Candidate Polish

- [ ] Sidebar nav says "Home" (not "Overview") and includes a "Decision Board" link.
- [ ] Mobile top-nav bar renders on small screens (horizontal scroll) with all nav links.
- [ ] Mobile content is not hidden under the top-nav bar (`pt-12` on mobile, `pt-0` on desktop).
- [ ] Detail-page loading skeleton grid matches the actual page layout (`minmax(0,1fr)_420px`).
- [ ] No UI text says "Suggested Software" or "Suggested:" (internal `suggestedSoftware` field is fine).
- [ ] No UI text says "Available in Milestone N" or references milestone numbers.
- [ ] No UI text claims "guaranteed", "proven opportunity", "blue ocean", "validated opportunity", "highest ROI", or "confirmed market" (careful disclaimers like "not proven market research" are correct and should remain).
- [ ] All local-only features (Validation Checklist, Evidence Log, Decision Board, Dashboard summaries) include a "this browser" note.
- [ ] Save button has `aria-pressed` and `aria-label`.
- [ ] Prev/Next nav has `aria-label` and `aria-disabled`.
- [ ] No `useSyncExternalStore` actual usage in the codebase (comments mentioning it are fine).
- [ ] No obvious horizontal overflow on desktop on any page.
- [ ] Mobile layout stacks cleanly on: dashboard, opportunities, detail page, Decision Board, Saved.
- [ ] All existing routes still load and work.
- [ ] No Prisma schema was changed; no new dependencies; no new Gemini calls; no new features.

---

### 32. Feedback-Driven First-Time User Clarity Patch

- [ ] Landing page hero says "Find business ideas from real customer pain" and leads with "Try demo data".
- [ ] Landing page has honest MVP scope note below the CTA.
- [ ] How-it-works section explains demo data is available and mentions future direction.
- [ ] Dashboard "Start here" card is visible with three CTAs and an honest note about MVP vs future.
- [ ] Navigation labels read "Ideas" and "Compare Ideas" (routes unchanged).
- [ ] `/dashboard/opportunities` heading is "Business Ideas" with score explanation helper text.
- [ ] `/dashboard/opportunities/[id]` has score explanation: "The score is a rough sorting signal...".
- [ ] `/dashboard/opportunities/decision-board` is labeled "Compare Ideas" with clear subtitle.
- [ ] Empty states use action-focused plain English ("No business ideas yet", "No saved ideas yet").
- [ ] No overclaiming language remains ("proven", "guaranteed", "validated opportunity").
- [ ] All existing functionality still works (no regressions in CSV upload, paste text, demo data, AI clustering, save/unsave, search/filter/sort, Validation Workspace, Evidence Log, Decision Board).
- [ ] `pnpm lint` passes with no errors or warnings.
- [ ] `pnpm build` passes.
- [ ] No Prisma schema changes, no AI/scoring changes, no new dependencies, no scraping added.

---

## Do not run

These are destructive and must never appear in your testing flow:

- ❌ `prisma db push --force-reset`
- ❌ `prisma migrate reset`
- ❌ Any SQL containing `DROP`, `TRUNCATE`, or `DELETE FROM <table>` without a WHERE clause
- ❌ `git push --force` to a shared branch
- ❌ `pnpm audit --fix` (can break intentional legacy peer deps)

If you hit stale test data, prefer the in-app **Reset** button on `/dashboard/opportunities` (which preserves complaints) or `resetOpportunitiesAction` via the API.