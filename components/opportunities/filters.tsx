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
  "h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-2 text-sm text-[var(--color-foreground)] outline-none transition-all duration-150 ease-out focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]";

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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)]">
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
            suffix={state.minScore === 0 ? "Any" : `${state.minScore}`}
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
            suffix={state.minSeverity === 0 ? "Any" : `${state.minSeverity}`}
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
            suffix={state.minComplaints === 0 ? "Any" : `${state.minComplaints}`}
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
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs text-[var(--color-muted-foreground)] transition-colors duration-150 ease-out hover:text-[var(--color-foreground)] focus-visible:border-[var(--color-primary)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]"
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
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-28">
        <div className="absolute inset-0 rounded-full bg-[var(--color-border)]" />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-primary)] transition-all duration-150 ease-out"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-primary)] [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:ease-out hover:[&::-webkit-slider-thumb]:scale-110 focus-visible:[&::-webkit-slider-thumb]:scale-110 focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
          aria-label={ariaLabel}
        />
      </div>
      <span className="min-w-[2rem] text-xs text-[var(--color-foreground)] font-medium tabular-nums" aria-hidden="true">
        {suffix ?? value}
      </span>
    </div>
  );
}