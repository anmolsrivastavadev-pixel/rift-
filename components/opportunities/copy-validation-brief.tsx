"use client";

import * as React from "react";
import { ClipboardCopy, CheckCircle2, AlertTriangle } from "lucide-react";

import { buildValidationBrief, type ValidationPlanInput } from "@/lib/validation-plan";
import { Button } from "@/components/ui/button";

/* Copies a concise plain-text validation brief to the clipboard. No personal
 * data, no complaint bodies, no external service — just the browser clipboard
 * API. Shows a success or failure message.
 */
export function CopyValidationBrief({ input }: { input: ValidationPlanInput }) {
  const [status, setStatus] = React.useState<"idle" | "ok" | "fail">("idle");

  async function handleCopy() {
    const text = buildValidationBrief(input);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setStatus("ok");
        return;
      }
      // Fallback: temporary textarea + execCommand for older browsers.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      setStatus(ok ? "ok" : "fail");
    } catch {
      setStatus("fail");
    }
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        aria-label="Copy validation brief to clipboard"
      >
        <ClipboardCopy className="h-4 w-4" /> Copy validation brief
      </Button>
      {status === "ok" && (
        <span className="flex items-center gap-1 text-xs text-[var(--color-success)]">
          <CheckCircle2 className="h-3.5 w-3.5" /> Copied validation brief.
        </span>
      )}
      {status === "fail" && (
        <span className="flex items-center gap-1 text-xs text-[var(--color-danger)]">
          <AlertTriangle className="h-3.5 w-3.5" /> Copy failed. Select the text manually.
        </span>
      )}
    </div>
  );
}
