# PLAN: Reliable "Find ideas" progress + no timeouts on Vercel

> **Rank: #1 — do this first.** The "Find ideas" run is Rift's magic moment, and its
> progress feedback is built on an in-memory store that does not work on Vercel's
> serverless platform. Users watching a long run see a frozen progress panel and
> assume Rift is broken. Long runs can also hit the platform's function time limit.

**Executor rules (read first):**
- Read `AGENTS.md`, every doc in `docs/`, and the bundled Next.js docs in
  `node_modules/next/dist/docs/` (this Next.js 16 differs from your training data).
- Do NOT change the Gemini prompt in `lib/ai.ts`, the scoring in `lib/scoring.ts`,
  the cleaning in `lib/cleaning.ts`, or the batching/merge logic. This plan changes
  progress REPORTING and function duration config only.
- Line numbers below are approximate — always re-verify against the real file.
- Schema changes here are additive only. Apply with `pnpm exec prisma db push`
  then `pnpm exec prisma generate`. NEVER use `--force-reset` or `migrate reset`.
- When done: run `npx tsc --noEmit`, `npm run lint`, `npm run build`; report all
  modified files; STOP.

## Goal

1. Progress for a "Find ideas" run is stored in the database (on the existing
   `AIRun` row) so the polling request always sees it, no matter which serverless
   instance serves the poll.
2. The status poll is scoped to the caller's own run (fixes a known leak where any
   `jobId` string returns any run's progress).
3. The pipeline and finder server actions get an explicit `maxDuration` so long
   runs are not killed by the default function limit.
4. The silent 1,500-complaint clustering cap becomes visible to the user.

## Current behavior (verified July 2026)

- `lib/progress.ts` — in-memory `Map` keyed by `jobId`, 10-min TTL, self-described
  as single-instance only (lines ~5-6, ~28).
- `actions/opportunities.ts` — `runPipeline(formData)` (~line 69) writes progress
  into that Map at each stage; it also creates an `AIRun` row ("running" →
  "completed"/"failed"). `getProcessingStatus(jobId, projectId)` (~line 29) calls
  `requireUser()` + `requireOwnedProject`, but then returns `getProgress(jobId)`
  for ANY jobId — the jobId is never tied to the project or user.
- `components/opportunities/run-button.tsx` — client polls
  `getProcessingStatus(jobId, projectId)` every 1s while the awaited `runPipeline`
  promise is in flight. Inspect this file to find where `jobId` is generated
  (client-side or returned by the action) before coding.
- `lib/ai.ts` — `MAX_COMPLAINTS = 1500`; overflow is sliced off and logged as
  `ai.capped_complaints` but the user is never told.
- No `maxDuration` is exported anywhere except `app/api/cron/niche-watch/route.ts`.

## Exact files to touch

1. `prisma/schema.prisma` — `AIRun` model: add two nullable columns:
   - `jobId String? @unique`
   - `progress Json?`
2. `actions/opportunities.ts` — persist progress to the AIRun row; scope the poll.
3. `lib/progress.ts` — keep the in-memory Map for fast local dev; add nothing
   here except (optionally) exporting the progress-shape type for reuse.
4. `components/opportunities/run-button.tsx` — only if the poll return shape
   changes (aim to keep it identical so this file needs no edits).
5. `app/dashboard/opportunities/page.tsx` — add `export const maxDuration = 300;`
   (segment config) and the cap notice copy.
6. `app/dashboard/complaints/page.tsx` — add `export const maxDuration = 120;`
   (the complaint finder action is invoked from this page).

## Step-by-step implementation order

1. **Schema.** Add `jobId String? @unique` and `progress Json?` to `AIRun`.
   Run `pnpm exec prisma db push` then `pnpm exec prisma generate`.
2. **Write path.** In `runPipeline`:
   - When the `AIRun` row is created, store the `jobId` on it.
   - Wherever the code currently calls the in-memory progress setter, ALSO write
     the same progress object to `AIRun.progress` — but throttled: write to the DB
     only (a) on stage transitions, (b) when the percent crosses a 10-point
     boundary, and (c) on terminal states (completed/failed). Never write per-item;
     Neon round-trips per complaint would slow the pipeline badly.
   - Keep the in-memory writes exactly as they are (they make local dev snappy).
   - On the failure path, make sure the LAST DB write marks progress as terminal
     (e.g. `{ stage: "failed", ... }`) so the client poll can stop.
3. **Read path.** Rewrite `getProcessingStatus(jobId, projectId)`:
   - `requireUser()` + `requireOwnedProject(projectId, user)` (unchanged).
   - First try the in-memory `getProgress(jobId)` (fast path, same instance).
   - If memory returns nothing, look up
     `prisma.aIRun.findFirst({ where: { jobId, userId: user.id, projectId } })`
     and return its `progress` (or `null` if no row). This is BOTH the serverless
     fix and the security fix: an unknown or foreign jobId now returns `null`.
   - Keep the returned object shape identical to what `run-button.tsx` expects.
4. **maxDuration.** Add the `maxDuration` segment-config exports to the two pages
   listed above. IMPORTANT: in Next.js App Router, a server action's duration is
   governed by the segment config of the PAGE that invokes it, not the actions
   file. Verify this against `node_modules/next/dist/docs/` before relying on it,
   and confirm the account's Vercel plan allows 300s (Hobby caps lower — if the
   build/deploy warns, use the highest allowed value instead).
5. **Cap visibility.** In `runPipeline`, after cleaning, if the cleaned complaint
   count exceeds the pipeline cap (import `MAX_COMPLAINTS` from `lib/ai.ts` if
   exported, otherwise mirror the constant — do NOT change `lib/ai.ts` logic),
   include `cappedAt: 1500` (number) in the progress object and final result. On
   the Ideas page, when the project's complaint count exceeds 1,500, render one
   muted sentence near the run button: "Rift analyzes your 1,500 most recent
   complaints per run." Do not block the run.
6. **Verify** (see acceptance criteria), then run `npx tsc --noEmit`,
   `npm run lint`, `npm run build`.

## Edge cases a weaker model would miss

- **The poll and the run are concurrent requests.** On Vercel they routinely land
  on different lambda instances. That is the entire reason for the DB write — do
  not "optimize" it away or gate it behind `NODE_ENV`.
- **Throttle DB writes.** A 1,500-complaint run has 15 sequential Gemini batches;
  per-complaint DB progress writes would add hundreds of Neon round-trips.
  Stage-transition + 10%-step + terminal writes only.
- **jobId generation:** inspect `run-button.tsx` first. If the client generates
  the jobId, a malicious client could pass someone else's jobId — that is exactly
  why the DB lookup must filter by `userId` AND `projectId`, never by jobId alone.
- **`@unique` on a nullable column** is fine in Postgres (many NULLs allowed), but
  a retried run reusing the same jobId would violate it — if `runPipeline` can be
  retried with the same jobId, catch Prisma error `P2002` on AIRun creation and
  generate a fresh suffix rather than crashing.
- **The quota check runs BEFORE the AIRun row is created** (M26 rule: no history
  rows for quota-blocked runs). Keep it that way — create the AIRun with jobId
  after `checkIdeaRunQuota` passes, exactly where the row is created today.
- **Mock mode** (no `GEMINI_API_KEY`) completes in ~1s. Ensure the terminal DB
  write still happens so the poll never spins forever on a fast run.
- **Prisma client model name:** the generated client may expose `AIRun` as
  `prisma.aIRun` (odd casing). Check `lib/generated/prisma` typings or existing
  usages in `actions/opportunities.ts` and copy that exact spelling.
- **Do not** touch the pipeline's replace-on-rerun behavior, the AIRun
  status/error semantics (M16D), or `getProcessingStatus`'s 1s client cadence.

## Acceptance criteria

- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass.
- [ ] Run "Find ideas" on a project with 100+ complaints: the progress panel
      advances through stages (not frozen at idle) — verify on the DEPLOYED
      Vercel app, not just localhost.
- [ ] While a run is in flight, the `AIRun` row's `progress` JSON updates (check
      via a read-only Prisma query or the Neon console — never a destructive
      command).
- [ ] Calling `getProcessingStatus` with a made-up jobId returns `null`.
- [ ] A failed run (e.g. temporarily rename `GEMINI_API_KEY` locally — NOT in
      production env) ends with terminal progress and the poll stops.
- [ ] With >1,500 complaints in a project, the Ideas page shows the cap sentence.
- [ ] `app/dashboard/opportunities/page.tsx` and `app/dashboard/complaints/page.tsx`
      export `maxDuration`, and the Vercel build output does not warn about it.
- [ ] `lib/ai.ts` prompt/batching, `lib/scoring.ts`, `lib/cleaning.ts` diffs: NONE.
