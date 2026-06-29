<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Rift — agent onboarding

Before making changes to this codebase, read every doc in `/docs`:

- `docs/PROJECT_CONTEXT.md` — what Rift is, the architecture, the database models, the AI pipeline, the scoring algorithm, the env vars, and what is intentionally out of scope.
- `docs/ROADMAP.md` — which milestone you are on, what each completed milestone delivered, and which post-MVP ideas are explicitly out of scope.
- `docs/AI_AGENT_INSTRUCTIONS.md` — the rules you must follow while editing Rift (inspect before editing, extend not replace, do not change the AI prompt, do not change the scoring logic, do not run destructive DB commands, report modified files at the end, stop after the requested task).
- `docs/TESTING_CHECKLIST.md` — the manual checklist you must run before reporting a milestone complete.

Then inspect the relevant source files for the current task. The real code is the source of truth — do not rely on chat history alone.

Key reminders (full rules live in `docs/AI_AGENT_INSTRUCTIONS.md`):

- Do not make unrelated changes.
- Do not change the Gemini prompt in `lib/ai.ts`.
- Do not change the scoring logic in `lib/scoring.ts`.
- Do not change the CSV upload pipeline, the search/filter/sort logic, or the saved-opportunity logic unless the milestone explicitly authorises it.
- Do not run destructive database commands (`prisma db push --force-reset`, `prisma migrate reset`, `DROP TABLE`, `TRUNCATE`, unguarded `DELETE`).
- Do not expose secrets. `.env` is gitignored; use `.env.example` for placeholders only.
- Do not add authentication, billing, teams, notifications, or scraping — they are post-MVP only.
- Keep the Prisma driver-adapter setup (`lib/db.ts` + `prisma.config.ts`); do not move the URL back into `schema.prisma`.
- Keep the `build` script as `prisma generate && next build` — the generated Prisma client is gitignored and must regenerate on every build.

Stop after the requested task and wait for confirmation.