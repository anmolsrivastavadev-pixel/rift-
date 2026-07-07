"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    <div className="mx-auto max-w-md space-y-6 py-24 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {stale ? STALE_DEPLOY_TITLE : "Something went wrong"}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {stale ? STALE_DEPLOY_MESSAGE : "An unexpected error occurred. Please try again."}
        </p>
      </div>
      {stale ? (
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" /> Reload page
        </Button>
      ) : (
        <Button onClick={reset}>Try again</Button>
      )}
    </div>
  );
}
