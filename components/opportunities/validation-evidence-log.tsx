"use client";

import * as React from "react";
import {
  ClipboardList,
  Signal,
  MessageSquareText,
  Info,
  RotateCcw,
} from "lucide-react";

import {
  type EvidenceState,
  DEFAULT_EVIDENCE,
  EVIDENCE_SUMMARY_MAX,
  STRONGEST_SIGNALS,
  BIGGEST_CONCERNS,
  EVIDENCE_SIGNAL_LABELS,
  EVIDENCE_SIGNAL_HELPER,
  evidenceStorageKey,
  clampCount,
  clampDependentCounts,
  parseEvidenceState,
  computeEvidenceSignal,
  computeSuggestedNextStep,
} from "@/lib/validation-evidence";
import { Button } from "@/components/ui/button";

const inputCls =
  "h-9 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]";

/* Full-width Validation Evidence Log for the opportunity detail page.
 * Local-only (localStorage), no DB, no auth. Uses useState + useEffect
 * (no useSyncExternalStore) to avoid hydration issues.
 */
export function ValidationEvidenceLog({
  opportunityId,
}: {
  opportunityId: string;
}) {
  const storageKey = evidenceStorageKey(opportunityId);
  const [state, setState] = React.useState<EvidenceState>(DEFAULT_EVIDENCE);
  const [hydrated, setHydrated] = React.useState(false);

  // Read from localStorage after mount.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = parseEvidenceState(raw);
      setState(parsed); // eslint-disable-line react-hooks/set-state-in-effect
    } catch {
      // ignore bad localStorage
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  // Write to localStorage after hydration.
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // private mode / quota — fail silently
    }
  }, [state, hydrated, storageKey]);

  function updateCount(field: keyof EvidenceState, raw: string) {
    const n = clampCount(raw);
    setState((prev) => {
      const next = { ...prev, [field]: n };
      if (field === "interviewsCompleted") {
        return clampDependentCounts(next);
      }
      return clampDependentCounts(next);
    });
  }

  function updateSelect(
    field: "strongestSignal" | "biggestConcern",
    value: string
  ) {
    setState((prev) => ({ ...prev, [field]: value }));
  }

  function updateSummary(value: string) {
    setState((prev) => ({
      ...prev,
      evidenceSummary: value.slice(0, EVIDENCE_SUMMARY_MAX),
    }));
  }

  function resetEvidence() {
    setState({ ...DEFAULT_EVIDENCE });
  }

  const signal = computeEvidenceSignal(state);
  const nextStep = computeSuggestedNextStep(state);
  const hasNoEvidence = state.interviewsCompleted === 0 && !hydrated;

  return (
    <section
      id="validation-evidence-log"
      className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 space-y-6 scroll-mt-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-base font-semibold">Validation Evidence Log</h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
            Track what you learn from real conversations before deciding
            whether to pursue, park, or reject this opportunity.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetEvidence}
          aria-label="Reset all evidence for this opportunity"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset evidence
        </Button>
      </div>

      {/* Privacy + local notes */}
      <p className="flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
        <Info className="h-3 w-3" /> Store patterns, not personal details. Do
        not enter names, emails, phone numbers, or private interview notes.
      </p>

      {/* Three grouped cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 1. Conversation counts */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4 text-[var(--color-primary)]" />
            Conversation counts
          </h3>
          <CountField
            label="Interviews completed"
            value={state.interviewsCompleted}
            hydrated={hydrated}
            onChange={(v) => updateCount("interviewsCompleted", v)}
          />
          <CountField
            label="People reporting the same pain"
            value={state.peopleReportingSamePain}
            hydrated={hydrated}
            onChange={(v) => updateCount("peopleReportingSamePain", v)}
          />
          <CountField
            label="People already using a workaround"
            value={state.peopleUsingWorkaround}
            hydrated={hydrated}
            onChange={(v) => updateCount("peopleUsingWorkaround", v)}
          />
          <CountField
            label="People willing to try a solution"
            value={state.peopleWillingToTry}
            hydrated={hydrated}
            onChange={(v) => updateCount("peopleWillingToTry", v)}
          />
          <CountField
            label="People showing willingness to pay"
            value={state.peopleWillingToPay}
            hydrated={hydrated}
            onChange={(v) => updateCount("peopleWillingToPay", v)}
          />
        </div>

        {/* 2. Signal quality */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Signal className="h-4 w-4 text-[var(--color-primary)]" />
            Signal quality
          </h3>
          <SelectField
            label="Strongest signal"
            value={state.strongestSignal}
            options={STRONGEST_SIGNALS}
            onChange={(v) => updateSelect("strongestSignal", v)}
          />
          <SelectField
            label="Biggest concern"
            value={state.biggestConcern}
            options={BIGGEST_CONCERNS}
            onChange={(v) => updateSelect("biggestConcern", v)}
          />

          {/* Evidence Signal label */}
          <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Evidence signal
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              {hydrated ? EVIDENCE_SIGNAL_LABELS[signal] : "—"}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {EVIDENCE_SIGNAL_HELPER}
            </p>
          </div>

          {/* Suggested next step */}
          <div className="rounded-[8px] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-3">
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-primary)]">
              Suggested next step
            </p>
            <p className="mt-0.5 text-sm text-[var(--color-foreground)]/90">
              {hydrated ? nextStep : "—"}
            </p>
          </div>
        </div>

        {/* 3. Evidence summary */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquareText className="h-4 w-4 text-[var(--color-primary)]" />
            Evidence summary
          </h3>
          {hasNoEvidence ? (
            <div className="rounded-[8px] border border-dashed border-[var(--color-border)] p-4 text-center">
              <p className="text-xs text-[var(--color-muted-foreground)]">
                No validation evidence recorded yet.
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Start by interviewing a few target users and recording
                aggregate signals here.
              </p>
            </div>
          ) : null}
          <label className="flex flex-col gap-1.5 text-xs text-[var(--color-muted-foreground)]">
            <span className="font-medium">Notes (optional)</span>
            <textarea
              value={state.evidenceSummary}
              onChange={(e) => updateSummary(e.target.value)}
              maxLength={EVIDENCE_SUMMARY_MAX}
              rows={5}
              aria-label="Evidence summary — patterns only, no personal details"
              placeholder="Example: 4/5 users mentioned this problem during onboarding. Most use spreadsheets or manual checking. Two said they would try a simple prototype."
              className="w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]"
            />
            <span className="text-[11px] text-[var(--color-muted-foreground)]">
              {state.evidenceSummary.length}/{EVIDENCE_SUMMARY_MAX} characters.
              Do not enter names, emails, phone numbers, or private interview
              notes.
            </span>
          </label>
        </div>
      </div>

      <p className="flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
        <Info className="h-3 w-3" /> Saved only in this browser.
      </p>
    </section>
  );
}

function CountField({
  label,
  value,
  hydrated,
  onChange,
}: {
  label: string;
  value: number;
  hydrated: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]">
      <span className="flex-1">{label}</span>
      <input
        type="number"
        min={0}
        max={20}
        value={hydrated ? value : 0}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`${inputCls} w-16 text-center`}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[var(--color-muted-foreground)]">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
