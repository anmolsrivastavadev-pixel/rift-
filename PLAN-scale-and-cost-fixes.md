# PLAN: Scale + cost correctness (pagination, unbounded queries, wasted API spend)

> **Rank: #5.** Three families of quiet bugs: (1) users literally cannot see
> complaint #101+ — the list caps at 100 with no pagination and no notice;
> (2) several pages load EVERY row of a table to render one widget, which will
> crawl at the 20,000-complaint pro cap; (3) the complaint finder burns paid
> API budget (Tavily×3 + Gemini) even when the project is already full, and
> zero-result searches never count against the quota.

**Executor rules (read first):**
- Read `AGENTS.md`, every doc in `docs/`, and the Next.js docs in
  `node_modules/next/dist/docs/`.
- FORBIDDEN to change: the Gemini prompts (`lib/ai.ts`,
  `lib/web-complaint-extract.ts` prompt text), `lib/scoring.ts`,
  `lib/cleaning.ts`, the CSV parsing schema in `lib/schemas.ts`, and the
  search/filter/sort logic inside `OpportunityBrowser`/`OpportunityFilters`.
  Everything below is query bounding, pagination UI, and call-ordering.
- No new dependencies. No schema changes.
- Line numbers approximate — verify in the real files.
- When done: `npx tsc --noEmit`, `npm run lint`, `npm run build`; report files;
  STOP.

## Part A — Complaints list pagination (user-facing bug)

**Current:** `components/complaints/complaints-list.tsx` (~lines 14-29) fetches
`take: 100` ordered `createdAt desc`; `components/complaints/complaints-table.tsx`
renders them with NO "showing 100 of N" note and NO way to see older rows.
Search (`?q=`) is also capped at 100.

**Change:**
1. Read how the page passes searchParams today
   (`app/dashboard/complaints/page.tsx` → `ComplaintsList`). Add a `?page=N`
   param (1-based), parsed defensively: `Math.max(1, Math.floor(Number(...)))`,
   `NaN` ⇒ 1.
2. In the list query: `skip: (page - 1) * 100, take: 100`, plus a parallel
   `prisma.complaint.count({ where: sameWhere })`.
3. Above/below the table render: "Showing X–Y of N complaints" plus
   Previous/Next links built with the existing `projectHref` helper
   (`lib/projects.ts`) so `projectId` AND `q` survive navigation. Disable
   Previous on page 1; disable Next when `page * 100 >= total`. Match the
   existing link/button styling used elsewhere on the page (plain `<Link>` with
   the app's border/muted classes — no new component library).
4. Out-of-range page (e.g. `?page=999`) renders the empty table with the count
   line and a working Previous link — never a crash.

**Edge cases:** keep the `?q=` search param applied to BOTH the rows query and
the count; page must reset to 1 when a new search is submitted (check the search
form component — add a hidden input or drop the page param from the form
action). `projectId` must be preserved in every pagination link.

## Part B — Bound the unbounded queries

For each, keep the rendered output identical for typical data:

1. **Dashboard chart** — `app/dashboard/page.tsx` (~lines 70-73): fetches
   `createdAt` of EVERY complaint. The chart buckets recent days only (read the
   bucketing helper to confirm the window — likely 30/60/90 days). Add
   `where: { createdAt: { gte: <window start> } }` matching the chart's real
   window, and `select: { createdAt: true }` (verify it already selects
   narrowly).
2. **Ideas-list trend badges** — `app/dashboard/opportunities/page.tsx`
   (~lines 43-51): loads all dated complaints. `lib/pain-trend.ts` compares the
   last 180 days vs the prior 180 (sourceDate-based). Bound with
   `sourceDate: { gte: now - 365 days, not: null }` — 365 covers both windows
   (180+180 = 360, +5 days slack). Confirm the exact window arithmetic in
   `lib/pain-trend.ts` FIRST; if it needs 360 days of history, 365 is safe, but
   if it uses a different span, size the bound to cover it fully. An
   under-sized bound silently changes trend labels — that is a regression.
3. **Idea detail related/prev-next** — `app/dashboard/opportunities/[id]/page.tsx`
   (~lines 105-131): three unbounded queries (`allOthers`, `allNeighbours`,
   `trendDates`).
   - `allOthers` (related ideas): `select` only `{ id, title, keywords, industry, score }`
     (check what `selectRelated` in `lib/opportunity-relations.ts` actually
     reads) and add `take: 300` with `orderBy: { createdAt: "desc" }`.
     Rationale: ideas per project are ≤ ~100 per run today; 300 is generous
     headroom, and related-idea quality over the newest 300 is unchanged.
   - `allNeighbours` (prev/next): needs only `{ id, createdAt }` — verify
     `selectPrevNext`'s needs and select narrowly; prev/next must still consider
     ALL ideas in the project (it's ordered navigation), so do NOT `take` here —
     narrowing the select is the win.
   - `trendDates`: same 365-day `sourceDate` bound as item 2.
4. **Pipeline trend N+1** — `actions/opportunities.ts` (~lines 203-206): one
   `findMany` per cluster inside the loop. Replace with ONE query before the
   loop fetching `{ id, sourceDate, createdAt }` for all involved complaint ids,
   grouped in JS into a `Map<complaintId, ...>`. The per-cluster trend
   computation must produce byte-identical results — this is a pure query
   consolidation. Do not touch scoring or the cluster loop's other writes.
5. **`idea_opened` analytics await** — `app/dashboard/opportunities/[id]/page.tsx`
   (~lines 186-191): the `trackProductEvent` call is `await`ed, blocking render.
   Change to fire-and-forget: `void trackProductEvent(...)` (it already
   swallows its own errors — verify that in `lib/product-events.ts` before
   removing the await).

## Part C — Finder cost ordering + quota honesty

**Current:** `lib/finder-import.ts` checks `checkComplaintQuota` AFTER all 7
sources have fetched and Gemini extraction has run (~line 157). A project at its
complaint cap still burns 3 Tavily calls + 1 Gemini call + 4 free-API calls per
search. Separately (documented quirk, `lib/quotas.ts` ~lines 5-11): searches
that insert 0 rows record no `ComplaintImport` row and therefore never consume
finder-search quota — unlimited free external API burn.

**Change (minimal, preserves the documented history contract):**
1. In `lib/finder-import.ts`, BEFORE the source fetches, add a cheap pre-check:
   call `checkComplaintQuota(user, projectId, 1)` (i.e. "is there room for even
   one more complaint?"). If it fails, return the same friendly quota error the
   post-dedupe check returns today, without fetching anything. KEEP the existing
   post-dedupe check unchanged (it enforces the real batch size).
2. In `actions/complaint-finder.ts`, count zero-result searches against the
   finder-search quota WITHOUT polluting import history: the quota counts
   `ComplaintImport` rows where `sourceType: "finder"` (see
   `checkFinderSearchQuota` in `lib/quotas.ts`). Do NOT start recording empty
   imports (M16D contract: "empty imports are never recorded" — history UI
   depends on it). Instead, track zero-result searches with the existing
   `trackProductEvent` system (`finder_search_empty`) AND change
   `checkFinderSearchQuota` to count `ComplaintImport(finder)` rows PLUS
   `ProductEvent` rows of type `finder_search_empty` in the same month window
   (both models have `userId` + `createdAt`). Read `lib/product-events.ts` to
   confirm events are queryable (they are — beta-insights reads them) and that
   `trackProductEvent` failing silently means, worst case, an uncounted search —
   acceptable.
3. Update the stale comment blocks that document the loophole
   (`lib/quotas.ts` top comment, `lib/finder-import.ts` ~lines 17-19) to
   describe the new behavior.
4. Add a defensive timeout around the Gemini web-extraction call:
   in `lib/complaint-finder.ts` where `extractComplaintsFromPages` is awaited
   (~line 445), wrap with `Promise.race` against a 60s timeout that resolves to
   a soft `SourceResult` error ("Web extraction timed out") — never a throw that
   kills the whole search. Do NOT modify `lib/web-complaint-extract.ts` itself.

**Edge cases:**
- The cron path (`sourceType: "watch"`) reuses `runFinderImport` — the new
  pre-check must apply there too (it already returns quota-full gracefully;
  verify `app/api/cron/niche-watch/route.ts` maps a pre-check failure to its
  existing `quota_full` status, not to `failed`).
- `checkComplaintQuota(user, projectId, 1)` semantics: read the function — it
  takes an incoming count; ensure passing 1 means "at least one slot free" and
  that a 0/negative incoming short-circuits to ok (it does — keep that).
- Watch searches must NOT consume finder-search quota (existing design) — the
  `finder_search_empty` event must only be tracked in
  `actions/complaint-finder.ts` (manual path), never in `lib/finder-import.ts`.
- `Promise.race` leaves the loser promise running — that is fine here (the
  serverless function ends when the action returns), but never attach a `.then`
  that mutates shared state after the race.

## Part D — Housekeeping (tiny, do last)

1. `docs/TESTING_CHECKLIST.md` is badly stale (references "Run AI clustering",
   removed KPI cards, localStorage flows removed in M16C). Do NOT rewrite it:
   add a banner at the very top: "⚠ STALE — superseded by
   `docs/BETA_QA_CHECKLIST.md` (see ROADMAP M21). Kept for history." and leave
   the rest untouched.
2. Repo root contains stray `kimi.py` (0 bytes) and `test.py` — they are not
   part of the app. Do NOT delete them; list them in the final report and ask
   the founder to confirm deletion.

## Acceptance criteria

- [ ] With >100 complaints in a project: complaints page shows
      "Showing 1–100 of N", Next/Previous work, search + pagination compose,
      `projectId` survives every link.
- [ ] Dashboard, ideas list, and idea detail render identically for a normal
      project (visual spot-check) — but the complaint-table queries in Neon's
      query view (or Prisma debug logs) show bounded row counts.
- [ ] Pain-trend badges show the same labels before/after (verify on one
      project with dated complaints — the 365-day bound must not change any
      label).
- [ ] Finder search on a quota-full project returns the quota message without
      any external fetch (add a temporary `logger` line to prove ordering while
      testing, then remove it).
- [ ] A zero-result finder search increments the monthly finder-search usage
      (visible in the free-plan usage line after refresh).
- [ ] Weekly-watch cron behavior unchanged for non-full projects.
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass.
- [ ] Zero diffs in: `lib/ai.ts`, `lib/web-complaint-extract.ts` prompt,
      `lib/scoring.ts`, `lib/cleaning.ts`, `OpportunityBrowser`.
