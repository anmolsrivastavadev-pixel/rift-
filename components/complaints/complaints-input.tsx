"use client";

import * as React from "react";
import Link from "next/link";
import { Upload, ClipboardPaste, FileText, Download, Sparkles, Loader2 } from "lucide-react";
import { useActionState } from "react";

import { loadDemoComplaints } from "@/actions/complaints";
import type { UploadResult } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { CsvUploader } from "@/components/complaints/csv-uploader";
import { TextInput } from "@/components/complaints/text-input";
import { DemoSummary } from "@/components/complaints/import-summary";

type Tab = "csv" | "paste" | "file";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "paste", label: "Paste text", icon: ClipboardPaste },
  { id: "csv", label: "Upload spreadsheet", icon: Upload },
  { id: "file", label: "Upload text file", icon: FileText },
];

export function ComplaintsInput() {
  const [tab, setTab] = React.useState<Tab>("paste");
  const [demoState, demoAction, demoPending] = useActionState<
    UploadResult | null,
    FormData
  >(loadDemoComplaints, null);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Input method"
        className="flex flex-wrap gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 shadow-sm"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`rift-input-panel-${id}`}
              id={`rift-input-tab-${id}`}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors duration-150 ease-out focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)] ${
                active
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div
        role="tabpanel"
        id={`rift-input-panel-${tab}`}
        aria-labelledby={`rift-input-tab-${tab}`}
      >
        {tab === "csv" && <CsvUploader />}
        {tab === "paste" && <TextInput mode="paste" />}
        {tab === "file" && <TextInput mode="file" />}
      </div>

      {/* Onboarding helpers — shared across all tabs */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-4">
        <Button asChild variant="secondary" size="md">
          <Link href="/sample_complaints.csv" download>
            <Download className="h-4 w-4" /> Download sample spreadsheet
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