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
  Loader2,
  Download,
  Sparkles,
} from "lucide-react";

import { uploadComplaints, loadDemoComplaints } from "@/actions/complaints";
import type { UploadResult } from "@/lib/schemas";
import { Button } from "@/components/ui/button";

export function CsvUploader() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [state, action, pending] = useActionState<UploadResult | null, FormData>(
    uploadComplaints,
    null
  );
  const [demoState, demoAction, demoPending] = useActionState<
    UploadResult | null,
    FormData
  >(loadDemoComplaints, null);

  function handleFile(file: File) {
    const okTypes = ["text/csv", "application/csv", "text/plain"];
    const isCsvByName = /\.csv$/i.test(file.name);
    if (!okTypes.includes(file.type) && !isCsvByName) {
      setParseError(
        `"${file.name}" is not a CSV file. Please upload a .csv file (you selected a ${file.type || "binary"} file).`
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
        if (hidden) {
          hidden.value = JSON.stringify(res.data);
          const form = document.getElementById(
            "rift-upload-form"
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }
      },
      error: (err) => setParseError(err.message),
    });
  }

  return (
    <div className="space-y-4">
      <form id="rift-upload-form" action={action} className="space-y-4">
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
          className={`flex w-full flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed p-10 text-center transition-colors ${
            dragOver
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
              : "border-[var(--color-border)] bg-[var(--color-card)]"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Drag &amp; drop a CSV here, or click to browse
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Required column: <code className="font-mono">body</code>. Optional:{" "}
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

        <Button type="submit" disabled={pending} className="min-w-32">
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
          <span>Could not parse the CSV: {parseError}</span>
        </div>
      )}

      {state && <UploadSummary result={state} />}

      {/* Onboarding helpers — beside the uploader, consistent with existing UI */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-4">
        <Button asChild variant="secondary" size="md">
          <Link href="/sample_complaints.csv" download>
            <Download className="h-4 w-4" /> Download sample CSV
          </Link>
        </Button>

        <form action={demoAction}>
          <Button type="submit" variant="outline" disabled={demoPending}>
            {demoPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading demo…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Use demo data
              </>
            )}
          </Button>
        </form>
      </div>

      {demoState && <DemoSummary result={demoState} />}
    </div>
  );
}

function DemoSummary({ result }: { result: UploadResult }) {
  // Demo data validation can't realistically fail (rows are hardcoded and
  // validated), so inserted === 0 means every demo row was already in the
  // database. Surface an informational "already loaded" message rather than
  // an error.
  if (result.inserted === 0) {
    return (
      <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-4 text-sm text-[var(--color-primary)]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">
            Demo complaints are already loaded. You can run AI clustering now.
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Demo data is fake and safe to test with. Head to{" "}
            <Link
              href="/dashboard/opportunities"
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Opportunities → Run AI clustering
            </Link>{" "}
            to generate scored opportunities.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">
          Demo complaints added ({result.inserted}). Now run AI clustering to
          generate opportunities.
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          This is fake demo data, safe to test with. Next:{" "}
          <Link
            href="/dashboard/opportunities"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Opportunities → Run AI clustering
          </Link>{" "}
          to turn the complaints into scored startup opportunities.
        </p>
      </div>
    </div>
  );
}

function UploadSummary({ result }: { result: UploadResult }) {
  if (result.inserted === 0 && result.errors.length > 0) {
    return (
      <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">No rows were imported.</p>
          {result.errors.slice(0, 5).map((e, i) => (
            <p key={i} className="text-xs">
              Row {e.row}: {e.reason}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-[12px] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">
          Imported {result.inserted} complaint{result.inserted === 1 ? "" : "s"}.
        </p>
        {result.skipped > 0 && (
          <p className="text-xs">Skipped {result.skipped} invalid row(s).</p>
        )}
      </div>
    </div>
  );
}