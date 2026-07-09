"use client";

import * as React from "react";
import { Upload, ClipboardPaste, FileText, Globe } from "lucide-react";

import { CsvUploader } from "@/components/complaints/csv-uploader";
import { TextInput } from "@/components/complaints/text-input";
import { ComplaintFinder } from "@/components/complaints/complaint-finder";

type Tab = "find" | "csv" | "paste" | "file";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "find", label: "Find online", icon: Globe },
  { id: "paste", label: "Paste text", icon: ClipboardPaste },
  { id: "csv", label: "Upload spreadsheet", icon: Upload },
  { id: "file", label: "Upload text file", icon: FileText },
];

export function ComplaintsInput({
  projectId,
  finderUsageLine,
}: {
  projectId: string;
  finderUsageLine?: string;
}) {
  const [tab, setTab] = React.useState<Tab>("find");

  function handleTablistKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const current = TABS.findIndex((t) => t.id === tab);
    const nextIndex =
      e.key === "ArrowRight"
        ? (current + 1) % TABS.length
        : (current - 1 + TABS.length) % TABS.length;
    const nextId = TABS[nextIndex].id;
    setTab(nextId);
    document.getElementById(`rift-input-tab-${nextId}`)?.focus();
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Input method"
        onKeyDown={handleTablistKeyDown}
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
                  ? "bg-[var(--color-primary-fill)] text-[var(--color-primary-foreground)]"
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
        {tab === "find" && (
          <ComplaintFinder projectId={projectId} usageLine={finderUsageLine} />
        )}
        {tab === "csv" && <CsvUploader projectId={projectId} />}
        {tab === "paste" && <TextInput mode="paste" projectId={projectId} />}
        {tab === "file" && <TextInput mode="file" projectId={projectId} />}
      </div>
    </div>
  );
}
