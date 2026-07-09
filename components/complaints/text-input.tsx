"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  ClipboardPaste,
  FileText,
  Loader2,
  Upload,
  AlertTriangle,
} from "lucide-react";

import { importTextComplaints } from "@/actions/complaints";
import type { UploadResult } from "@/lib/schemas";
import { SOURCE_TYPES, type SourceType } from "@/lib/text-import";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { TextImportSummary } from "@/components/complaints/import-summary";

const inputCls =
  "h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20";

/* One component powers both the Paste Text and Upload Text File tabs. They
 * share the same source-type / source-label UI and the same server action
 * (importTextComplaints), so parsing + dedup + insertion logic is reused.
 */
export function TextInput({
  mode,
  projectId,
}: {
  mode: "paste" | "file";
  projectId: string;
}) {
  const [sourceType, setSourceType] = React.useState<SourceType>(SOURCE_TYPES[0]);
  const [sourceLabel, setSourceLabel] = React.useState("");
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [state, action, pending] = useActionState<UploadResult | null, FormData>(
    importTextComplaints,
    null
  );

  function loadFile(file: File) {
    setFileError(null);
    const okByName = /\.(txt|md)$/i.test(file.name);
    const okByType =
      file.type === "" ||
      file.type === "text/plain" ||
      file.type === "text/markdown";
    if (!okByName || !okByType) {
      setFileName(null);
      // Clear any previously staged text so a stale submit can't happen.
      const hidden = document.getElementById("rift-text-data") as HTMLInputElement | null;
      if (hidden) hidden.value = "";
      setFileError(
        /\.csv$/i.test(file.name)
          ? "For .csv files, use the Upload spreadsheet tab — this tab takes .txt or .md files."
          : `“${file.name}” is not a supported file type. This tab takes .txt or .md files.`
      );
      return;
    }
    setFileName(file.name);
    file
      .text()
      .then((text) => {
        const hidden = document.getElementById("rift-text-data") as HTMLInputElement | null;
        if (hidden) hidden.value = text;
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setFileError(`Could not read file: ${msg}`);
      });
  }

  const summaryLabel = sourceLabel.trim()
    ? sourceLabel.trim()
    : sourceType;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="text" id="rift-text-data" />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs text-[var(--color-muted-foreground)]">
          <span className="font-medium uppercase tracking-wide">Source type</span>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceType)}
            aria-label="Source type of the text"
            className={inputCls}
          >
            {SOURCE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-[var(--color-muted-foreground)]">
          <span className="font-medium uppercase tracking-wide">
            Source label (optional)
          </span>
          <input
            type="text"
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            placeholder="e.g. Notion Reddit comments"
            aria-label="Optional source label for your reference"
            className={inputCls}
          />
        </label>
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        The source label is only for this import.
      </p>

      {mode === "paste" ? (
        <label className="flex flex-col gap-1.5 text-xs text-[var(--color-muted-foreground)]">
          <span className="font-medium uppercase tracking-wide">
            Paste complaints / reviews
          </span>
          <Textarea
            name="__textarea"
            required
            aria-label="Paste complaints, one per line or separated by blank lines"
            placeholder={
              "One complaint per line, or one paragraph per complaint separated by a blank line.\n\n- The onboarding takes way too long.\n- Pricing is confusing and hidden behind too many pages.\n- I can’t tell which plan I should choose."
            }
            rows={10}
            onInput={(e) => {
              const t = e.currentTarget;
              const hidden = document.getElementById("rift-text-data") as HTMLInputElement | null;
              if (hidden) hidden.value = t.value;
            }}
          />
          <span className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
            Short entries and exact duplicates are skipped.
          </span>
        </label>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center shadow-sm transition-colors hover:border-[var(--color-primary)]/60 focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">
              Drag a .txt or .md file here, or click to browse
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Rift reads it like pasted text.
            </p>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadFile(f);
            }}
          />
          {fileName && (
            <p className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
              <FileText className="h-3.5 w-3.5" />
              {fileName}
            </p>
          )}
          {fileError && (
            <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={pending || (mode === "file" && !fileName)}
        className="min-w-32"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Importing…
          </>
        ) : mode === "paste" ? (
          <>
            <ClipboardPaste className="h-4 w-4" /> Import pasted text
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" /> Import text file
          </>
        )}
      </Button>

      {state && (
        <TextImportSummary
          result={state}
          sourceLabel={summaryLabel}
          projectId={projectId}
        />
      )}
    </form>
  );
}
