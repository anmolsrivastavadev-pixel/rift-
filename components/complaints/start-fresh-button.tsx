"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { clearWorkspace, type WorkspaceResult } from "@/actions/workspace";
import { Button } from "@/components/ui/button";

const CONFIRM_TEXT =
  "This will delete this project's complaints, generated ideas, and saved ideas. Other projects will not be changed.";

export function StartFreshButton({ projectId }: { projectId: string }) {
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<WorkspaceResult | null>(null);

  async function handleClick() {
    const confirmed = window.confirm(CONFIRM_TEXT);
    if (!confirmed) return;

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
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={handleClick}
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
