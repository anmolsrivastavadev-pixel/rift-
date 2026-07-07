# PLAN: Close the server-action security gaps (beta gate + archived-project writes)

> **Rank: #2.** The invite-only beta gate protects page LOADS only
> (`app/dashboard/layout.tsx` calls `requireBetaAccess`). Every server action —
> imports, AI runs, finder searches, share links, billing — checks only
> `requireUser()`. A revoked tester with a live session can keep mutating data
> indefinitely. This was documented as a known issue in M21; it must close before
> more testers are invited. Same pass fixes archived-project writes and silent
> admin-action failures.

**Executor rules (read first):**
- Read `AGENTS.md`, every doc in `docs/`, and the Next.js docs in
  `node_modules/next/dist/docs/`.
- Do NOT touch Better Auth config (`lib/auth/index.ts`), the Stripe webhook, the
  Gemini prompt, scoring, cleaning, or the CSV parsing schema.
- No schema changes are needed for this plan. No new dependencies.
- Line numbers are approximate — verify in the real files.
- When done: `npx tsc --noEmit`, `npm run lint`, `npm run build`; report modified
  files; STOP.

## Goal

1. Every data-mutating server action re-checks beta access (no-op when
   `RIFT_BETA_MODE` is off/unset; admins always pass).
2. Data-writing actions refuse archived projects (project-management actions that
   legitimately operate on archived projects keep working).
3. Admin beta actions stop failing silently for non-admins.
4. Niche watches on archived projects stop consuming the active-watch quota.

## Current facts (verified July 2026)

- `lib/beta-access.ts` — `hasBetaAccess(user)` returns a boolean;
  `requireBetaAccess(user)` redirects to `/beta-access`. Only the dashboard layout
  calls it. `RIFT_BETA_MODE` off/unset ⇒ everyone passes. Admins from
  `RIFT_ADMIN_EMAILS` always pass.
- `lib/auth/current-user.ts` — `requireUser()` redirects to `/sign-in` and returns
  the session user. Every action uses it.
- `lib/projects.ts` (~line 96) — `requireOwnedProject(projectId, user)` checks
  `{ id, userId }` and DELIBERATELY allows archived projects (needed by
  unarchive/delete). Actions receive `projectId` from client-controlled hidden
  form inputs, so the layout's archived-project redirect protects nothing.
- `actions/beta.ts` — `addBetaTester` / `revokeBetaTester` / `reactivateBetaTester`
  return `void` and silently no-op for non-admins; `revoke`/`reactivate` update by
  raw client-supplied `accessId` with errors swallowed.
- `lib/quotas.ts` — `checkWatchQuota` counts watches where `pausedAt: null`
  regardless of the project's `archivedAt`, while the cron skips archived
  projects — an archived project's watch consumes quota but never runs.
- `submitBetaFeedback` (actions/beta.ts ~line 81) is the ONLY action that already
  checks beta access (`hasBetaAccess`). Keep it as-is.

## Exact files to touch

1. **New:** `lib/action-auth.ts` — one shared guard.
2. `lib/projects.ts` — add an option to `requireOwnedProject`.
3. Every action file below (full call-site table included).
4. `lib/quotas.ts` — `checkWatchQuota` archived filter.

## Step-by-step implementation order

### Step 1 — shared guard `lib/action-auth.ts`

```ts
import { requireUser } from "@/lib/auth/current-user";
import { hasBetaAccess } from "@/lib/beta-access";

export const BETA_BLOCKED_MESSAGE =
  "Your beta access is not active. Ask the founder if you think this is a mistake.";

/** requireUser + beta check for server actions. Throws on missing beta access
 *  so each action's catch/early-return can convert it to its own error shape. */
export async function requireActor() {
  const user = await requireUser();
  if (!(await hasBetaAccess(user))) {
    throw new BetaAccessError();
  }
  return user;
}

export class BetaAccessError extends Error {
  constructor() {
    super(BETA_BLOCKED_MESSAGE);
    this.name = "BetaAccessError";
  }
}
```
Check `hasBetaAccess`'s actual signature/async-ness in `lib/beta-access.ts` and
match it. If it is sync, drop the `await`.

### Step 2 — archived-project option

In `lib/projects.ts`, change `requireOwnedProject(projectId, user)` to
`requireOwnedProject(projectId, user, opts?: { allowArchived?: boolean })`.
Default `allowArchived: false` ⇒ add `archivedAt: null` to the `findFirst` where
clause; `notFound()` behavior otherwise unchanged. Then audit EVERY caller:
callers that must keep `allowArchived: true` are ONLY the project-management
paths that legitimately handle archived projects (unarchive, permanent delete —
these do their own inline `findFirst` in `actions/projects.ts`, so most likely NO
caller needs the flag; verify with a grep for `requireOwnedProject(`). If a page
(not action) uses it for reads of the current project, note that
`getProjectOrDefault` already redirects archived projects — keep page reads
working (pages resolve active projects only).

### Step 3 — wire the guard into every action

Replace `requireUser()` with `requireActor()` in the actions below, converting
`BetaAccessError` to each action's existing error shape (do NOT invent new
shapes). The table lists every exported action and its return contract — match it
exactly:

| File | Action | On beta failure return |
|---|---|---|
| actions/projects.ts | createProject, renameProject, archiveProject, unarchiveProject, deleteArchivedProject | its existing `{ ok: false, error: BETA_BLOCKED_MESSAGE }`-style state shape (inspect each) |
| actions/projects.ts | getProjectsForCurrentUser | read-only; still guard (return empty list) |
| actions/opportunities.ts | runPipeline, resetOpportunities, resetOpportunitiesAction | existing error/result shape of each |
| actions/opportunities.ts | getProcessingStatus | return `null` |
| actions/complaints.ts | uploadComplaints, loadDemoComplaints, loadStarterComplaints, importTextComplaints, createCustomStarterComplaints | each returns an UploadResult-style state — use its existing failure variant with the message |
| actions/complaint-finder.ts | findComplaintsAction | existing failure shape |
| actions/niche-watch.ts | createNicheWatchAction, toggleNicheWatchAction, deleteNicheWatchAction | existing failure shape |
| actions/saved.ts | saveOpportunity, unsaveOpportunity (wrappers saveAction/unsaveAction inherit) | existing shape |
| actions/validation.ts | setDecisionStatus, saveValidationChecklist, migrateValidationState | existing shape |
| actions/share.ts | createShareLink, revokeShareLink | existing shape |
| actions/reports.ts | getProjectReport, getIdeaReport | existing shape |
| actions/workspace.ts | clearWorkspace | existing shape |
| actions/billing.ts | createCheckoutSession, createPortalSession | existing friendly-error shape |

Leave alone: `actions/beta.ts` admin actions (admin check is stronger),
`submitBetaFeedback` (already checks), the Stripe webhook and cron routes
(machine-authenticated), `app/api/auth/[...all]` (must stay open).

Pattern per action (adjust to each action's structure):
```ts
let user;
try {
  user = await requireActor();
} catch (err) {
  if (err instanceof BetaAccessError) {
    return { ok: false, error: BETA_BLOCKED_MESSAGE }; // ← match THIS action's shape
  }
  throw err; // requireUser redirects throw internally — rethrow everything else
}
```
CRITICAL: `requireUser()` uses Next's `redirect()`, which works by THROWING a
special error. Your catch must rethrow anything that is not `BetaAccessError`,
or sign-in redirects will break.

### Step 4 — block data writes on archived projects

The default `allowArchived: false` from Step 2 already covers every action that
uses `requireOwnedProject` (complaints imports, runPipeline, reset, finder,
watch create, clearWorkspace, saved). Verify by grep. Actions in
`actions/projects.ts` use inline `findFirst` — leave their archived-handling
logic exactly as it is (archive/unarchive/delete depend on it).

### Step 5 — fix silent admin actions

In `actions/beta.ts`: make `addBetaTester`, `revokeBetaTester`,
`reactivateBetaTester` return a state object (e.g. `{ ok: boolean; error?: string }`)
instead of `void`-silent: non-admin ⇒ `{ ok: false, error: "Admin only." }`;
unknown `accessId` ⇒ `{ ok: false, error: "Tester not found." }` (remove the
`.catch(() => {})` swallow; use try/catch). Then update the admin UI on
`/dashboard/beta-insights` that invokes them (find the form components; if they
use plain `action={...}` forms, switch to `useActionState` only if a component
already does so elsewhere on that page — otherwise render nothing on success and
keep changes minimal but surface the error string).

### Step 6 — watch quota on archived projects

In `lib/quotas.ts` `checkWatchQuota`, add `project: { archivedAt: null }` to the
watch count's where clause (relation filter). The cron already skips archived
projects; this just stops phantom quota consumption.

## Edge cases a weaker model would miss

- **`redirect()` throws.** Never wrap `requireUser()`/`requireActor()` in a
  catch-all that swallows errors — rethrow non-`BetaAccessError` (see pattern).
- **`RIFT_BETA_MODE` off must stay a total no-op.** Production currently runs
  with the gate off for some users; the guard must add zero friction there.
  `hasBetaAccess` already encodes this — do not add your own env parsing.
- **Do not redirect from data actions.** Client components using
  `useActionState` expect a returned state object; a redirect mid-action breaks
  their pending UI. Return the error in the action's own shape.
- **Wrappers:** `saveAction`/`unsaveAction`/`resetOpportunitiesAction` delegate to
  the main actions — guard the MAIN action once; do not double-guard.
- **`getProjectsForCurrentUser`** feeds the project selector inside the (already
  gated) dashboard layout; returning `[]` for blocked users is safe and avoids a
  crash if the layout race-renders during revocation.
- **Per-action error shapes genuinely differ** (some `{ ok }`, some
  UploadResult, some plain objects, some `null`). Copy each action's existing
  failure construction — search each file for its current early-return errors.
- **Testing caution:** local `.env` points at the PRODUCTION database. Do NOT
  create test accounts or test data through the app. Verify by (a) grep: every
  action file imports `requireActor`, (b) `npx tsc --noEmit`, (c) sign in with
  the founder's admin account and confirm normal flows still work (admins bypass
  the gate, proving the no-regression path), (d) code-review the
  `BetaAccessError` branch in each action.

## Acceptance criteria

- [ ] `grep -l "requireActor" actions/*.ts` lists every actions file except
      `beta.ts` (which uses the admin guard).
- [ ] `grep -n "requireUser()" actions/*.ts` returns ONLY hits inside
      `lib/action-auth.ts` delegation or `actions/beta.ts` (feedback action may
      keep its current pair). No mutating action calls bare `requireUser()`.
- [ ] With `RIFT_BETA_MODE` unset locally, the app behaves exactly as before
      (manual click-through of import → find ideas → save → share as admin).
- [ ] `requireOwnedProject` defaults to rejecting archived projects; unarchive +
      permanent-delete flows still work (they use their own inline checks).
- [ ] Admin beta actions surface "Admin only." / "Tester not found." instead of
      silently doing nothing.
- [ ] `checkWatchQuota` ignores watches on archived projects.
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass.
- [ ] No diffs in: `lib/auth/index.ts`, `lib/ai.ts`, `lib/scoring.ts`,
      Stripe webhook, cron route.
