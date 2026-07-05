"use client";

import * as React from "react";
import { Download, Copy, Check, AlertCircle, Loader2 } from "lucide-react";

import { getProjectReport, getIdeaReport, type ExportResult } from "@/actions/reports";
import { Button } from "@/components/ui/button";

/* M18 — small "Export report" / "Copy report" buttons. The Markdown is
 * generated server-side (ownership-checked); the download is a client-side
 * Blob, the copy uses the clipboard API. No file storage, nothing saved.
 */
export function ExportButtons({
  kind,
  targetId,
  exportLabel,
  copyLabel,
}: {
  kind: "project" | "idea";
  targetId: string;
  exportLabel: string;
  copyLabel: string;
}) {
  const [busy, setBusy] = React.useState<"download" | "copy" | null>(null);
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null);

  async function fetchReport(): Promise<ExportResult> {
    return kind === "project" ? getProjectReport(targetId) : getIdeaReport(targetId);
  }

  async function handleDownload() {
    setBusy("download");
    setNotice(null);
    try {
      const result = await fetchReport();
      if (!result.ok) {
        setNotice({ ok: false, text: result.error });
        return;
      }
      const blob = new Blob([result.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNotice({ ok: true, text: "Report downloaded." });
    } catch {
      setNotice({ ok: false, text: "Could not export. Try again." });
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    setBusy("copy");
    setNotice(null);
    try {
      const result = await fetchReport();
      if (!result.ok) {
        setNotice({ ok: false, text: result.error });
        return;
      }
      await navigator.clipboard.writeText(result.markdown);
      setNotice({ ok: true, text: "Report copied." });
    } catch {
      setNotice({ ok: false, text: "Could not copy. Try downloading instead." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={busy !== null}
      >
        {busy === "download" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {exportLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        disabled={busy !== null}
      >
        {busy === "copy" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copyLabel}
      </Button>
      {notice && (
        <span
          className={`flex items-center gap-1 text-[11px] ${
            notice.ok ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
          }`}
          aria-live="polite"
        >
          {notice.ok ? (
            <Check className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {notice.text}
        </span>
      )}
    </div>
  );
}
