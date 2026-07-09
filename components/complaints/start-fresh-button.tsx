"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { clearWorkspace, type WorkspaceResult } from "@/actions/workspace";
import { Button } from "@/components/ui/button";

export function StartFreshButton({ projectId }: { projectId: string }) {
  const [pending, setPending] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [result, setResult] = React.useState<WorkspaceResult | null>(null);
  const revertTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearRevertTimer() {
    if (revertTimerRef.current) {
      clearTimeout(revertTimerRef.current);
      revertTimerRef.current = null;
    }
  }

  React.useEffect(() => clearRevertTimer, []);

  // Two-step inline confirm — first click arms; it disarms itself after 8s
  // so an abandoned confirm can't be triggered accidentally later.
  function arm() {
    setConfirming(true);
    clearRevertTimer();
    revertTimerRef.current = setTimeout(() => setConfirming(false), 8000);
  }

  function cancel() {
    clearRevertTimer();
    setConfirming(false);
  }

  async function handleConfirm() {
    cancel();
    setPending(true);
    setResult(null);
    try {
      const res = await clearWorkspace(projectId);
      setResult(res);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      {confirming ? (
        <div className="space-y-2">
          <p className="text-sm text-[var(--color-foreground)]">
            This deletes all complaints and ideas in this project.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirm}
            >
              <Trash2 className="h-4 w-4" /> Yes, clear everything
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={arm}
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Clearing…
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" /> Start fresh test
            </>
          )}
        </Button>
      )}
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Clears current complaints, generated ideas, and saved ideas from this
        project so you can test a new niche cleanly.
      </p>
      {result?.cleared && (
        <p className="text-xs text-[var(--color-success)]">
          {result.projectName ?? "Project"} cleared. Add complaints for one niche,
          then generate business ideas.
        </p>
      )}
      {result?.error && (
        <p className="text-xs text-[var(--color-danger)]">
          {result.error}
        </p>
      )}
    </div>
  );
}
