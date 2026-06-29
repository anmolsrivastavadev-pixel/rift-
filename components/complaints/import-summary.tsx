import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";

import type { UploadResult } from "@/lib/schemas";

/* Shared import summaries used by the CSV demo path and the text import path.
 * Kept here so each input method renders consistent success / already-loaded /
 * error messages and a single "next step" CTA to Run AI clustering.
 */

export function ImportNextStepLink() {
  return (
    <p className="text-xs text-[var(--color-muted-foreground)]">
      Next: head to{" "}
      <Link
        href="/dashboard/opportunities"
        className="font-medium text-[var(--color-primary)] hover:underline"
      >
        Opportunities → Run AI clustering
      </Link>{" "}
      to turn the complaints into scored startup opportunities.
    </p>
  );
}

/* Demo data success / already-loaded state. Validation can't realistically
 * fail (rows are hardcoded), so inserted === 0 means every demo row was
 * already in the database — surface an informational message, not an error.
 */
export function DemoSummary({ result }: { result: UploadResult }) {
  if (result.inserted === 0) {
    return (
      <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-4 text-sm text-[var(--color-primary)]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">
            Demo complaints are already loaded. You can run AI clustering now.
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Demo data is fake and safe to test with.{" "}
            <Link
              href="/dashboard/opportunities"
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Opportunities → Run AI clustering
            </Link>{" "}
            to generate scored opportunities.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">
          Demo complaints added ({result.inserted}). Now run AI clustering to
          generate opportunities.
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          This is fake demo data, safe to test with. <ImportNextStepLink />
        </p>
      </div>
    </div>
  );
}

/* Paste-text / text-file success / already-loaded / error state. */
export function TextImportSummary({
  result,
  sourceLabel,
}: {
  result: UploadResult;
  sourceLabel?: string;
}) {
  const fromLabel = sourceLabel ? ` from ${sourceLabel}` : "";

  // inserted === 0 with no errors => every parsed complaint was already loaded.
  if (result.inserted === 0 && result.errors.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-4 text-sm text-[var(--color-primary)]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">
            These complaints are already loaded. You can run AI clustering now.
          </p>
          <ImportNextStepLink />
        </div>
      </div>
    );
  }

  if (result.inserted === 0 && result.errors.length > 0) {
    return (
      <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">No complaints were imported{fromLabel}.</p>
          {result.errors.slice(0, 5).map((e, i) => (
            <p key={i} className="text-xs">
              {e.reason}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">
          Imported {result.inserted} complaint
          {result.inserted === 1 ? "" : "s"}
          {fromLabel}. Now run AI clustering to generate opportunities.
        </p>
        {result.skipped > 0 && (
          <p className="text-xs">
            Skipped {result.skipped} entr{result.skipped === 1 ? "y" : "ies"}
            {" "}(too short, invalid, or already loaded).
          </p>
        )}
        <ImportNextStepLink />
      </div>
    </div>
  );
}