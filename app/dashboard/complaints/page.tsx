import { Suspense } from "react";

import { CsvUploader } from "@/components/complaints/csv-uploader";
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
          Upload a CSV of real customer complaints. Rift stores them for AI
          clustering and opportunity scoring.
        </p>
      </div>

      <section>
        <h2 className="text-base font-semibold">Upload CSV</h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Expected columns: <code className="font-mono">body</code> (required);
          optional <code className="font-mono">title</code>,{" "}
          <code className="font-mono">sourceDate</code> (ISO date).
        </p>
        <div className="mt-3">
          <CsvUploader />
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