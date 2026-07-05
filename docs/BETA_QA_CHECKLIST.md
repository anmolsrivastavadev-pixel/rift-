# Rift — Private Beta QA Checklist (M21)

Practical manual checklist for the founder before (and during) the private beta.
Run top to bottom on the deployed app with a real browser session. Items that
need a second account are marked **[2nd account]**.

---

## Environment setup

- [ ] Vercel has `DATABASE_URL` (Neon pooled string, `?sslmode=require`).
- [ ] Vercel has `GEMINI_API_KEY`.
- [ ] Vercel has `BETTER_AUTH_URL` = deployed origin, no trailing slash.
- [ ] Vercel has `BETTER_AUTH_SECRET`.
- [ ] Vercel has `RIFT_ADMIN_EMAILS` = your email (comma-separated for more).
- [ ] Vercel has `RIFT_BETA_MODE` = `off` (or `invite_only` when gating).
- [ ] Vercel has `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` (optional `REDDIT_USER_AGENT`) so the complaint finder's Reddit search works from Vercel IPs (M22).
- [ ] `pnpm build` succeeds locally; Vercel production build succeeds.

## Auth and beta access

- [ ] Sign up with a new email works; sign in works; sign out works.
- [ ] Landing page CTAs ("Start with a market") go to `/dashboard` home.
- [ ] With `RIFT_BETA_MODE=off`: any signed-in user reaches the dashboard.
- [ ] With `RIFT_BETA_MODE=invite_only`: admin email still reaches the dashboard.
- [ ] **[2nd account]** Non-approved user is redirected to `/beta-access` and sees their signed-in email.
- [ ] Admin adds that email under Beta insights → Beta access; user can enter after reload (status flips to "Access active").
- [ ] Admin revokes the tester; tester is redirected to `/beta-access` on next navigation.
- [ ] Admin restores the tester; access works again.

## Project management

- [ ] Create a project ("Fitness"). Selector switches to it.
- [ ] Creating another project named "fitness" (any casing) is blocked: "You already have a project with this name."
- [ ] Rename works; URL/projectId unchanged; data still attached.
- [ ] Blank rename and >60-char rename are blocked.
- [ ] Archive hides the project from the selector; it appears under "Archived projects".
- [ ] Archiving the last active project is blocked: "You need at least one active project."
- [ ] Restore brings the project back with all data.
- [ ] Permanent delete requires typing the exact project name; wrong text is blocked.
- [ ] Deleted project disappears everywhere, including history; app does not crash.

## Complaints

- [ ] Paste text imports complaints; success message shows count + "Now find ideas" link.
- [ ] "Use demo data" works and is idempotent (second click says already loaded).
- [ ] Starter pack import works.
- [ ] Complaint finder (keyword) imports and reports counts.
- [ ] Complaint finder with Reddit creds set: a common keyword (e.g. "fitness") reports "N from Reddit" with N > 0. With creds removed, the Reddit error line names the env vars instead of a bare HTTP 403; App Store results still import.
- [ ] Complaint finder reports "K from Hacker News" with K > 0 for a tech-ish keyword (e.g. "fitness apps") — works with no env vars (M23).
- [ ] CSV upload works; bad CSV shows a readable error, not a crash.
- [ ] Search (`?q=`) filters the complaints list.

## Idea generation

- [ ] With 0 complaints, Ideas page says "Add complaints first" (no run button).
- [ ] With complaints, "Find ideas" shows "Rift will use N complaints from this project."
- [ ] Run completes; progress stages advance; ideas appear scored.
- [ ] With ideas present, rerun lives in a collapsed "Run again" section and replaces ideas.
- [ ] A failed run shows a friendly error (no stack traces / provider internals).

## Idea detail

- [ ] Detail page opens from the ideas list and keeps `projectId` in the URL.
- [ ] Evidence complaints shown belong to this idea.
- [ ] Prev/Next navigation works and never shows another idea's checklist state.
- [ ] "Next step" hint links to Compare Ideas.

## Validation persistence

- [ ] Tick checklist items; refresh — still ticked.
- [ ] Set decision to Pursue on Compare Ideas; refresh — still Pursue.
- [ ] Open a different browser/device; checklist + decision are there.
- [ ] Switch projects; each project's validation state stays separate.

## Saved ideas

- [ ] Save an idea; it appears on `/dashboard/saved`.
- [ ] Unsave removes it; refresh confirms.

## Compare ideas

- [ ] Summary counts (Pursue/Park/Reject/Undecided) match the selects.
- [ ] Filters work; compare mode (`?compare=`) renders the table.
- [ ] Switching projects on the board shows THAT project's decisions (no carry-over).

## Export

- [ ] Dashboard "Export report" downloads `rift-project-<name>.md`; counts match the app.
- [ ] "Copy report" copies the same Markdown.
- [ ] Idea detail "Export idea" downloads `rift-idea-<title>.md` with score + real evidence quotes only.
- [ ] Exports contain only the current project's data.

## History

- [ ] "Recent data" lists each import with source, count, date.
- [ ] "Recent idea runs" lists runs with status and in/out counts; a failed run shows "Failed — try again".
- [ ] History survives archive → restore.
- [ ] History is gone after permanent delete.

## Admin beta insights

- [ ] `/dashboard/beta-insights` loads for the admin email.
- [ ] **[2nd account]** Non-admin gets a 404 (notFound), and no sidebar link.
- [ ] Totals and funnel counts look sane and update after activity.
- [ ] Recent activity shows type/email/project/metadata only — never complaint text, report contents, or AI prompts.

## Feedback inbox

- [ ] Feedback widget (sidebar / mobile row) submits with type + optional rating.
- [ ] Empty message is blocked; success shows "Thanks — feedback saved."
- [ ] Feedback appears in Beta insights → Recent feedback with page path.

## Mobile checks

- [ ] Dashboard shell has no horizontal overflow on a narrow viewport.
- [ ] Mobile top nav scrolls; project selector + feedback form stay reachable when expanded.
- [ ] Onboarding card, idea cards, compare table (horizontal scroll container) all fit.
- [ ] Export/feedback buttons wrap without breaking layout.

## Security checks

- [ ] **[2nd account]** Changing `?projectId=` to another user's project id → 404, no data.
- [ ] **[2nd account]** Another user's opportunity detail URL → 404.
- [ ] **[2nd account]** Exporting with another user's ids fails ("not found").
- [ ] **[2nd account]** Rename/archive/delete with a forged projectId fails.
- [ ] Revoked tester cannot reach the dashboard in invite-only mode.
- [ ] `/dashboard/beta-insights` unreachable for non-admins.

## Vercel deployment checks

- [ ] Production build green in Vercel after push to `main`.
- [ ] `BETTER_AUTH_URL` matches the production domain (no trailing slash).
- [ ] Sign-in works on the deployed domain (trusted origins OK).
- [ ] A full happy path on production: sign in → create project → demo data → find ideas → open idea → decide → export.
