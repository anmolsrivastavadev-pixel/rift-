"use client";

import { useEffect } from "react";

import {
  isStaleDeployError,
  STALE_DEPLOY_MESSAGE,
  STALE_DEPLOY_TITLE,
} from "@/lib/stale-deploy";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // A deploy replaced the app while this tab was open — retry can never
  // work; only a full reload picks up the new version.
  const stale = isStaleDeployError(error);

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-[12px] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-8">
      <h2 className="text-lg font-semibold text-[var(--color-danger)]">
        {stale ? STALE_DEPLOY_TITLE : "Something went wrong"}
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {stale
          ? STALE_DEPLOY_MESSAGE
          : "An unexpected error occurred. Please try again in a moment."}
      </p>
      <button
        onClick={() => (stale ? window.location.reload() : reset())}
        className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm hover:opacity-80"
      >
        {stale ? "Reload page" : "Try again"}
      </button>
    </div>
  );
}
