import { Suspense } from "react";

import { ComplaintsInput } from "@/components/complaints/complaints-input";
import { ComplaintsList } from "@/components/complaints/complaints-list";

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const query = sp.q ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Complaints</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Add market pain by uploading a CSV, pasting raw comments, or uploading
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
        <h2 className="text-base font-semibold">Add complaints</h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Choose an input method below. For CSV, the expected columns are{" "}
          <code className="font-mono">body</code> (required); optional{" "}
          <code className="font-mono">title</code>,{" "}
          <code className="font-mono">sourceDate</code> (ISO date). For pasted
          text or <code className="font-mono">.txt</code>/<code>.md</code> files,
          one complaint per line or one per blank-line-separated paragraph.
          You can also download a sample CSV or use demo data below.
        </p>
        <div className="mt-3">
          <ComplaintsInput />
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