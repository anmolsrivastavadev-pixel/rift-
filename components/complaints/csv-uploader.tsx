"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react";

import { uploadComplaints } from "@/actions/complaints";
import type { UploadResult } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { ImportNextStepLink } from "@/components/complaints/import-summary";

export function CsvUploader({ projectId }: { projectId: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [state, action, pending] = useActionState<UploadResult | null, FormData>(
    uploadComplaints,
    null
  );

  function handleFile(file: File) {
    const okTypes = ["text/csv", "application/csv", "text/plain"];
    const isCsvByName = /\.csv$/i.test(file.name);
    if (!okTypes.includes(file.type) && !isCsvByName) {
      setParseError(
        `"${file.name}" is not a spreadsheet file. Please upload a .csv file (you selected a ${file.type || "binary"} file).`
      );
      setFileName(null);
      return;
    }
    setParseError(null);
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hidden = document.getElementById(
          "rift-upload-data"
        ) as HTMLInputElement | null;
        // Stage the parsed rows; the user reviews and clicks Upload themselves.
        if (hidden) hidden.value = JSON.stringify(res.data);
      },
      error: (err) => setParseError(err.message),
    });
  }

  return (
    <div className="space-y-4">
      <form id="rift-upload-form" action={action} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="data" id="rift-upload-data" />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-10 text-center shadow-sm transition-colors focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)] ${
            dragOver
              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
              : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/60"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Drag &amp; drop a spreadsheet here, or click to browse
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Required: <code className="font-mono">body</code>. Optional:{" "}
              <code className="font-mono">title</code>,{" "}
              <code className="font-mono">sourceDate</code>
            </p>
          </div>
          {fileName && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
              <FileText className="h-3.5 w-3.5" />
              {fileName}
            </div>
          )}
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <span>Not sure about the format?</span>
          <Button asChild variant="secondary" size="sm">
            <Link href="/sample_complaints.csv" download>
              <Download className="h-4 w-4" /> Download a sample file
            </Link>
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <Button type="submit" disabled={pending || !fileName} className="min-w-32">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Upload complaints
            </>
          )}
        </Button>
      </form>

      {parseError && (
        <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not parse the spreadsheet: {parseError}</span>
        </div>
      )}

      {state && <UploadSummary result={state} projectId={projectId} />}
    </div>
  );
}

function UploadSummary({
  result,
  projectId,
}: {
  result: UploadResult;
  projectId: string;
}) {
  if (result.inserted === 0 && result.errors.length > 0) {
    // Quota/plan errors come through as row 0 — offer the upgrade path.
    const needsUpgrade = result.errors.some(
      (e) => e.reason.includes("Upgrade") || e.reason.includes("Pricing")
    );
    return (
      <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">No rows were imported.</p>
          {result.errors.slice(0, 5).map((e, i) => (
            <p key={i} className="text-xs">
              {e.row > 0 ? `Row ${e.row}: ${e.reason}` : e.reason}
            </p>
          ))}
          {needsUpgrade && (
            <div className="mt-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/pricing">See plans</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">
          Imported {result.inserted} complaint{result.inserted === 1 ? "" : "s"}
          {" "}from spreadsheet. Now find ideas.
        </p>
        {result.skipped > 0 && (
          <p className="text-xs">Skipped {result.skipped} invalid row(s).</p>
        )}
        <ImportNextStepLink projectId={projectId} />
      </div>
    </div>
  );
}
