"use client";

import { RotateCcw } from "lucide-react";

export type SortKey =
  | "score-desc"
  | "score-asc"
  | "severity-desc"
  | "mentions-desc"
  | "newest";

export interface FilterState {
  query: string;
  industry: string; // "All" or specific
  minScore: number; // 0..100
  minSeverity: number; // 0..10
  minComplaints: number; // 0..N
  sort: SortKey;
}

export const DEFAULT_FILTERS: FilterState = {
  query: "",
  industry: "All",
  minScore: 0,
  minSeverity: 0,
  minComplaints: 0,
  sort: "score-desc",
};

const sortLabels: { key: SortKey; label: string }[] = [
  { key: "score-desc", label: "Highest Opportunity Score" },
  { key: "score-asc", label: "Lowest Opportunity Score" },
  { key: "severity-desc", label: "Highest Severity" },
  { key: "mentions-desc", label: "Most Complaints" },
  { key: "newest", label: "Newest" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-[var(--color-muted-foreground)]">
      <span className="font-medium uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "h-9 w-full rounded-xl border border-[var(--color-border)] bg-white px-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20";

export function OpportunityFilters({
  state,
  setState,
  industries,
  onReset,
}: {
  state: FilterState;
  setState: (
    patch: Partial<FilterState> | ((prev: FilterState) => Partial<FilterState>)
  ) => void;
  industries: string[];
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto_auto] lg:items-end">
        <Field label="Search">
          <input
            type="search"
            value={state.query}
            onChange={(e) => setState({ query: e.target.value })}
            placeholder="Title, summary, keyword, software…"
            aria-label="Search opportunities"
            className={`${inputCls} lg:w-72 focus-visible:border-[var(--color-primary)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]`}
          />
        </Field>

        <Field label="Industry">
          <select
            value={state.industry}
            onChange={(e) => setState({ industry: e.target.value })}
            aria-label="Filter by industry"
            className={`${inputCls} focus-visible:border-[var(--color-primary)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]`}
          >
            <option value="All">All industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Min score">
          <Slider
            value={state.minScore}
            min={0}
            max={100}
            step={5}
            onChange={(v) => setState({ minScore: v })}
            suffix={`${state.minScore}`}
            ariaLabel="Minimum opportunity score"
          />
        </Field>

        <Field label="Min severity">
          <Slider
            value={state.minSeverity}
            min={0}
            max={10}
            step={1}
            onChange={(v) => setState({ minSeverity: v })}
            suffix={`${state.minSeverity}`}
            ariaLabel="Minimum severity"
          />
        </Field>

        <Field label="Min complaints">
          <Slider
            value={state.minComplaints}
            min={0}
            max={20}
            step={1}
            onChange={(v) => setState({ minComplaints: v })}
            suffix={`${state.minComplaints}`}
            ariaLabel="Minimum complaint count"
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
        <Field label="Sort by">
          <select
            value={state.sort}
            onChange={(e) => setState({ sort: e.target.value as SortKey })}
            aria-label="Sort opportunities"
            className={`${inputCls} focus-visible:border-[var(--color-primary)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]`}
          >
            {sortLabels.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset all filters"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs text-[var(--color-muted-foreground)] transition-colors duration-150 ease-out hover:text-[var(--color-foreground)] focus-visible:border-[var(--color-primary)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]"
        >
          <RotateCcw className="h-3 w-3" /> Reset filters
        </button>
      </div>
    </div>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  suffix,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-28 cursor-pointer accent-[var(--color-primary)]"
        aria-label={ariaLabel}
      />
      <span className="min-w-[2rem] text-xs text-[var(--color-foreground)]" aria-hidden="true">
        {suffix ?? value}
      </span>
    </div>
  );
}