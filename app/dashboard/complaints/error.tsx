"use client";

import { useEffect } from "react";

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

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-[12px] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-8">
      <h2 className="text-lg font-semibold text-[var(--color-danger)]">
        Something went wrong
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {error.message}
      </p>
      <button
        onClick={reset}
        className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm hover:opacity-80"
      >
        Try again
      </button>
    </div>
  );
}