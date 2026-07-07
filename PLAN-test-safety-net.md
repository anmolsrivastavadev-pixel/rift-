# PLAN: Automated test safety net + CI (zero new dependencies)

> **Rank: #4.** The repo has ZERO automated tests, no `test` script, and no CI —
> while every change is written by AI agents and pushed straight to `main`,
> which auto-deploys to production. One regression in the frozen scoring formula
> or the quota math ships silently. Node 24 runs TypeScript natively, so a real
> test suite needs no new dependencies at all.

**Executor rules (read first):**
- Read `AGENTS.md`, every doc in `docs/`, and the Next.js docs in
  `node_modules/next/dist/docs/`.
- This plan adds tests and CI config ONLY. Do not modify any file in `lib/` or
  `actions/` to "make it testable" — if something is hard to test, test less of
  it. In particular `lib/scoring.ts`, `lib/ai.ts`, `lib/cleaning.ts` must have
  ZERO diffs.
- No new npm dependencies. Node's built-in `node:test` + `node:assert` only.
- When done: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm test`;
  report files; STOP.

## Goal

1. `npm test` runs a unit suite over Rift's pure helper libraries.
2. The frozen business rules (scoring weights, plan limits, quota windows) are
   locked by characterization tests — any accidental change turns CI red.
3. A GitHub Actions workflow runs typecheck + lint + tests on every push to
   `main`, giving the founder a red X on GitHub within minutes of a bad push.

## Current facts (verified July 2026)

- No `*.test.*`/`*.spec.*` files outside node_modules. No test runner installed.
  No `.github/` directory. `package.json` scripts: dev/build/start/lint only.
- Node 24 is installed (per the machine setup) and runs `.ts` files directly via
  type stripping; `node --test` discovers `*.test.ts`.
- Pure, import-safe modules confirmed good test targets (no DB, no env, no
  server-only imports): `lib/scoring.ts`, `lib/text-import.ts`,
  `lib/cleaning.ts`, `lib/pain-trend.ts`, `lib/evidence-strength.ts`,
  `lib/decision-board.ts`, `lib/validation-plan.ts`, `lib/plans.ts`,
  `lib/complaint-sources.ts`, `lib/niche-suggestions.ts`, `lib/reports.ts`
  (verify each file's imports before including it — anything importing
  `lib/db.ts`, `@google/genai`, `next/*`, or `server-only` is OUT of scope).
- The docs' scoring examples may not match the code exactly — the CODE is the
  source of truth for expected values.

## Exact files to touch

1. **New:** `tests/` directory with one `*.test.ts` file per target lib.
2. `package.json` — add `"test": "node --test tests/"`.
3. **New:** `.github/workflows/ci.yml`.
4. `tsconfig.json` — ONLY if needed to exclude `tests/` from the app typecheck
   or include it; prefer zero changes (see edge cases).

## Step-by-step implementation order

### Step 1 — pilot one test file end to end

Create `tests/scoring.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeOpportunityScore } from "../lib/scoring"; // ← verify the real export name first
```
- RELATIVE imports only (`../lib/...`). The `@/` path alias is a
  tsconfig/bundler alias that plain `node --test` does not resolve.
- Run `npm test` (after adding the script) — if Node complains about TypeScript
  syntax, check the Node version (`node --version` must be ≥ 22.18) and whether
  any tested file uses non-erasable syntax (enums, namespaces, `experimentalDecorators`) —
  those files can't be type-stripped; skip them and note it.

### Step 2 — characterization tests for frozen logic

Write the expected values by READING THE CODE and computing by hand, then
locking them in:
- **`tests/scoring.test.ts`** — at minimum: count=1/severity=5/confidence=50;
  count=10; count=100; severity=1 and 10 boundaries; confidence clamping >100
  and <0; final rounding; the exact weight split (0.40/0.35/0.25). Add one
  comment line: "These values lock the frozen scoring formula (see
  docs/AI_AGENT_INSTRUCTIONS.md). If this test fails, the formula changed —
  that is the bug."
- **`tests/plans.test.ts`** — free = {3 projects, 10 idea runs, 20 finder
  searches, 1000 complaints, 1 watch}; pro = {100, 500, 1000, 20000, 10};
  admin email always resolves pro (call `resolvePlanId`/equivalent with a fake
  user + `RIFT_ADMIN_EMAILS` set via `process.env` inside the test, restoring it
  after — check how `lib/admin.ts` reads env: if it reads at import time, set
  the env var BEFORE the dynamic `await import(...)`).
- **`tests/text-import.test.ts`** — `parseComplaintsFromText`: blank lines,
  <3-char lines dropped, title derivation, whitespace normalization,
  dedupe-key behavior.
- **`tests/pain-trend.test.ts`** — <5 dated complaints ⇒ "not enough data"
  variant; growing vs declining windows (build dates relative to a FIXED
  reference date if the function accepts one; if it uses `Date.now()`
  internally, construct test dates relative to `new Date()` at runtime so the
  test never rots).
- **`tests/cleaning.test.ts`** — normalization + dedupe of the cleaning stage
  (do not modify the lib).
- **`tests/evidence-strength.test.ts`**, **`tests/decision-board.test.ts`** —
  the labeled band boundaries (read each threshold from the code).
- **`tests/complaint-sources.test.ts`** — `sanitiseReceiptUrl`: https ok,
  http ok, `javascript:` rejected, garbage rejected.

### Step 3 — package.json script

`"test": "node --test tests/"` — verify the glob behavior of the installed Node;
if directory discovery misses `.ts`, use `node --test "tests/**/*.test.ts"`.

### Step 4 — CI workflow `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: npm ci
      - run: npx prisma generate
        env: { DATABASE_URL: "postgresql://ci:ci@localhost:5432/ci" }
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm test
```
- First check which lockfile the repo actually has (`package-lock.json` vs
  `pnpm-lock.yaml`) and use the matching install command/cache setting.
- `prisma generate` is REQUIRED before `tsc` because the generated client is
  gitignored. It does not connect to a database, but `prisma.config.ts` may
  demand `DATABASE_URL` to exist — hence the dummy value. Verify by deleting
  nothing and simply running the workflow.
- Deliberately NO `next build` in CI: the Vercel build is the authoritative
  build check and CI has no real env. Do not add secrets to CI.

### Step 5 — prove the net catches a regression

Locally: change one scoring weight, run `npm test`, watch it fail, REVERT.
Mention this in the final report (do not commit the temporary change).

## Edge cases a weaker model would miss

- **`@/` aliases don't resolve in `node --test`.** Relative imports in tests.
- **Import-time side effects:** some libs read `process.env` at module top
  level. For those, set env vars before a `await import()` inside the test
  rather than a static import.
- **`tsc --noEmit` now sees `tests/`** (tsconfig `include` is likely broad).
  `node:test` types come from `@types/node`, already a devDependency — verify
  the version supports the `node:test` module types; if the typecheck fails on
  test files, add `tests` to tsconfig `include` explicitly or fix types — do
  NOT loosen `strict`.
- **Do not test through `lib/db.ts` or anything importing it** — the local
  `.env` points at the PRODUCTION database. Unit tests must never open a DB
  connection. Grep each candidate lib's import tree first.
- **`lib/reports.ts`** may import server-only helpers — check before including.
- **Characterization, not aspiration:** if a helper's current output looks odd,
  lock the CURRENT output and add a `// NOTE:` comment. Changing app behavior is
  out of scope for this plan.
- **CI failure ≠ blocked deploy.** Vercel deploys on push regardless of GitHub
  Actions. Note in the final report that CI is a fast alarm, not a gate; gating
  deploys on CI is a separate founder decision (Vercel "Ignored Build Step" or
  branch protection).

## Acceptance criteria

- [ ] `npm test` passes locally with ≥ 6 test files and ≥ 30 assertions total.
- [ ] Temporarily changing a scoring weight makes `npm test` fail (reverted).
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` still pass.
- [ ] `git push` triggers the GitHub Actions run and it goes green (check
      `gh run list --limit 1` after pushing).
- [ ] Zero diffs in `lib/**` and `actions/**` (git diff shows only `tests/`,
      `package.json`, `.github/`, and possibly `tsconfig.json`).
- [ ] No new entries in `package.json` `dependencies`/`devDependencies`.
