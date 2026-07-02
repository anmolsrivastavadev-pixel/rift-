import { Suspense } from "react";

import { ComplaintsInput } from "@/components/complaints/complaints-input";
import { ComplaintsList } from "@/components/complaints/complaints-list";
import { StartFreshButton } from "@/components/complaints/start-fresh-button";
import { StarterMarkets } from "@/components/complaints/starter-markets";
import { requireUser } from "@/lib/auth/current-user";

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const query = sp.q ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Complaints</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Add market pain by uploading a spreadsheet, pasting raw comments, or uploading
          a text file. Rift will turn each complaint or review into a row before
          AI clustering. Uploaded data stays in this MVP project database.
        </p>
      </div>

      <section>
        <h2 className="text-base font-semibold">Why complaints?</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Complaints reveal repeated pain. Repeated pain is often where useful business ideas begin.
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          You can use product reviews, support tickets, Reddit/forum snippets you manually collect, sales call notes, or the built-in demo data.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">What counts as a complaint?</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          A complaint is any real customer frustration. You can paste reviews, app-store feedback, support tickets, Reddit/forum snippets you manually collected, interview notes, or use demo data.
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          You are looking for problems people repeat, not random opinions.
        </p>
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
          Do not include private personal information. Keep the text focused on the problem people are describing.
        </p>
      </section>

      <StarterMarkets />

      <section>
        <h2 className="text-base font-semibold">Don't have complaints yet?</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          That is normal. Here are easy ways to collect your first few:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted-foreground)]">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
            Read app store reviews (1–3 star) and copy any sentence that names a problem
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
            Screenshot Reddit, Twitter/X, or forum posts where people complain
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
            Note things your friends, coworkers, or customers say annoy them
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
            Paste a few complaint sentences — even 5–10 is enough to start
          </li>
        </ul>
        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
          No scraping or automation needed. Collect manually — copy and paste works.
          Or try the demo data first to see how Rift works.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Add complaints</h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Choose an input method below. For spreadsheet upload, a CSV is a simple spreadsheet file you can export from Excel, Google Sheets, Airtable, or many review/support tools. The expected columns are{" "}
          <code className="font-mono">body</code> (required); optional{" "}
          <code className="font-mono">title</code>,{" "}
          <code className="font-mono">sourceDate</code> (ISO date). For pasted
          text or <code className="font-mono">.txt</code>/<code>.md</code> files,
          one complaint per line or one per blank-line-separated paragraph.
          You can also download a sample spreadsheet or use demo data below.
        </p>
        <div className="mt-3">
          <ComplaintsInput />
        </div>
      </section>

      <section className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/60 p-5">
        <h2 className="text-sm font-semibold">Testing a new niche?</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Rift analyzes all complaints currently in this MVP workspace. To get
          clean results, start fresh before adding a new set of complaints.
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Use this when you want to test a new market, like student productivity
          apps, fitness apps, or restaurant booking tools, without mixing old
          complaints into the results.
        </p>
        <div className="mt-3">
          <StartFreshButton />
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">All complaints</h2>
        <div className="mt-3">
          <Suspense fallback={<ComplaintsSkeleton />}>
            <ComplaintsList query={query} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

function ComplaintsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full max-w-sm animate-pulse rounded-[12px] bg-[var(--color-card)]" />
      <div className="h-64 w-full animate-pulse rounded-[12px] bg-[var(--color-card)]" />
    </div>
  );
}