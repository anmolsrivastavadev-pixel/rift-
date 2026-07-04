import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";

import type { UploadResult } from "@/lib/schemas";
import { projectHref } from "@/lib/project-href";

/* Shared import summaries used by the CSV demo path and the text import path.
 * Kept here so each input method renders consistent success / already-loaded /
 * error messages and a single "next step" CTA to Generate business ideas.
 */

export function ImportNextStepLink({ projectId }: { projectId: string }) {
  return (
    <span className="block text-xs text-[var(--color-muted-foreground)]">
      Next: head to{" "}
      <Link
        href={projectHref("/dashboard/opportunities", projectId)}
        className="font-medium text-[var(--color-primary)] hover:underline"
      >
        Opportunities → Generate business ideas
      </Link>{" "}
      to turn the complaints into scored startup opportunities.
    </span>
  );
}

/* Demo data success / already-loaded state. Validation can't realistically
 * fail (rows are hardcoded), so inserted === 0 means every demo row was
 * already in the database — surface an informational message, not an error.
 */
export function DemoSummary({
  result,
  projectId,
}: {
  result: UploadResult;
  projectId: string;
}) {
  if (result.inserted === 0) {
    return (
      <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-4 text-sm text-[var(--color-primary)]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">
            Demo complaints are already loaded. You can generate business ideas now.
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Demo data is fake and safe to test with.{" "}
            <Link
              href={projectHref("/dashboard/opportunities", projectId)}
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Opportunities → Generate business ideas
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
          Demo complaints added ({result.inserted}). Now generate business ideas to
          create opportunities.
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          This is fake demo data, safe to test with. <ImportNextStepLink projectId={projectId} />
        </p>
      </div>
    </div>
  );
}

/* Paste-text / text-file success / already-loaded / error state. */
export function TextImportSummary({
  result,
  sourceLabel,
  projectId,
}: {
  result: UploadResult;
  sourceLabel?: string;
  projectId: string;
}) {
  const fromLabel = sourceLabel ? ` from ${sourceLabel}` : "";

  // inserted === 0 with no errors => every parsed complaint was already loaded.
  if (result.inserted === 0 && result.errors.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-4 text-sm text-[var(--color-primary)]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">
            These complaints are already loaded. You can generate business ideas now.
          </p>
          <ImportNextStepLink projectId={projectId} />
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
          {fromLabel}. Now generate business ideas to create opportunities.
        </p>
        {result.skipped > 0 && (
          <p className="text-xs">
            Skipped {result.skipped} entr{result.skipped === 1 ? "y" : "ies"}
            {" "}(too short, invalid, or already loaded).
          </p>
        )}
        <ImportNextStepLink projectId={projectId} />
      </div>
    </div>
  );
}
