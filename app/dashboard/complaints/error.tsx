"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/error-panel";
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
    <ErrorPanel
      title={stale ? STALE_DEPLOY_TITLE : "Something went wrong"}
      message={
        stale
          ? STALE_DEPLOY_MESSAGE
          : "An unexpected error occurred. Please try again in a moment."
      }
    >
      {stale ? (
        <Button onClick={() => window.location.reload()} className="mx-auto">
          <RefreshCw className="h-4 w-4" /> Reload page
        </Button>
      ) : (
        <Button onClick={reset} className="mx-auto">
          Try again
        </Button>
      )}
    </ErrorPanel>
  );
}