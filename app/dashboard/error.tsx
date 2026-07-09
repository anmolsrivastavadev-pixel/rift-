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

  const stale = isStaleDeployError(error);

  return (
    <ErrorPanel
      title={stale ? STALE_DEPLOY_TITLE : "We couldn't load your dashboard."}
      message={stale ? STALE_DEPLOY_MESSAGE : "This is usually temporary."}
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
