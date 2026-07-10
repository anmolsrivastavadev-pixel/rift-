import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { projectHref } from "@/lib/project-href";

/* Prev / Next navigation. Since M34 the detail page feeds it neighbours in
 * the same score-ranked order as the Ideas list, so Next walks down the list.
 * Buttons disabled when no neighbour exists.
 */
export function PrevNextNav({
  prevId,
  nextId,
  projectId,
}: {
  prevId: string | null;
  nextId: string | null;
  projectId: string;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm transition-colors duration-150 ease-out";
  const enabledCls = "hover:border-[var(--color-primary)]/60 hover:text-[var(--color-primary)]";
  const disabledCls = "cursor-not-allowed opacity-50";

  return (
    <nav aria-label="Idea navigation" className="mt-6 flex items-center justify-between gap-3">
      {prevId ? (
        <Link
          href={projectHref(`/dashboard/opportunities/${prevId}`, projectId)}
          className={`${base} ${enabledCls}`}
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </Link>
      ) : (
        <button type="button" disabled className={`${base} ${disabledCls}`}>
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>
      )}
      {nextId ? (
        <Link
          href={projectHref(`/dashboard/opportunities/${nextId}`, projectId)}
          className={`${base} ${enabledCls}`}
        >
          Next <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <button type="button" disabled className={`${base} ${disabledCls}`}>
          Next <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </nav>
  );
}
