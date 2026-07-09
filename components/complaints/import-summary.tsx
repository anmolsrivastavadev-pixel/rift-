import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { UploadResult } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { projectHref } from "@/lib/project-href";

/* Shared import summaries used by the CSV demo path and the text import path.
 * Kept here so each input method renders consistent success / already-loaded /
 * error messages and a single "next step" CTA to Generate business ideas.
 */

export function ImportNextStepLink({ projectId }: { projectId: string }) {
  // The single most important next action in the funnel gets a real button,
  // not a text link buried in helper copy.
  return (
    <span className="mt-2 block">
      <Button asChild size="sm">
        <Link href={projectHref("/dashboard/opportunities", projectId)}>
          Find ideas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
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
      <Notice
        variant="info"
        title="Example complaints are already loaded. You can find ideas now."
      >
        <p className="text-xs">Demo data is fake and safe to test with.</p>
        <ImportNextStepLink projectId={projectId} />
      </Notice>
    );
  }

  return (
    <Notice
      variant="success"
      title={`Loaded ${result.inserted} example complaints. Next: turn them into ideas.`}
    >
      <p className="text-xs">These examples are safe to test with.</p>
      <ImportNextStepLink projectId={projectId} />
    </Notice>
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
      <Notice
        variant="info"
        title="These complaints are already loaded. You can find ideas now."
      >
        <ImportNextStepLink projectId={projectId} />
      </Notice>
    );
  }

  if (result.inserted === 0 && result.errors.length > 0) {
    return (
      <Notice variant="danger" title={`No complaints were imported${fromLabel}.`}>
        {result.errors.slice(0, 5).map((e, i) => (
          <p key={i} className="text-xs">
            {e.reason}
          </p>
        ))}
      </Notice>
    );
  }

  return (
    <Notice
      variant="success"
      title={`Imported ${result.inserted} complaint${result.inserted === 1 ? "" : "s"}${fromLabel}. Now find ideas.`}
    >
      {result.skipped > 0 && (
        <p className="text-xs">
          Skipped {result.skipped} entr{result.skipped === 1 ? "y" : "ies"}
          {" "}(too short, invalid, or already loaded).
        </p>
      )}
      <ImportNextStepLink projectId={projectId} />
    </Notice>
  );
}
