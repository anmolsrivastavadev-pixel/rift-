import {
  ChevronRight,
  Compass,
  UserRound,
  Wrench,
  AlertTriangle,
  Rocket,
  Split,
  Sparkles,
} from "lucide-react";

/* Market Gap Hypothesis section for the opportunity detail page.
 *
 * Renders the M9 complaint-grounded hypothesis fields (marketGap,
 * targetCustomer, likelyCurrentWorkarounds, whyWorkaroundsFallShort,
 * productAngle, differentiationAngle) as compact labelled rows.
 *
 * If none of the M9 fields are present (i.e. the opportunity was generated
 * before M9), show a subtle rerun hint instead of fake placeholder analysis.
 * Never crashes; every field is optional.
 */

export interface MarketGapData {
  marketGap?: string | null;
  targetCustomer?: string | null;
  likelyCurrentWorkarounds?: string | null;
  whyWorkaroundsFallShort?: string | null;
  productAngle?: string | null;
  differentiationAngle?: string | null;
  reason?: string | null;
}

export function MarketGapHypothesis({ data }: { data: MarketGapData }) {
  const hasM9 =
    Boolean(data.marketGap) ||
    Boolean(data.targetCustomer) ||
    Boolean(data.likelyCurrentWorkarounds) ||
    Boolean(data.whyWorkaroundsFallShort) ||
    Boolean(data.productAngle) ||
    Boolean(data.differentiationAngle);

  if (!hasM9) {
    // Legacy opportunity (pre-M9). Keep any existing AI reasoning visible as
    // a "Why This Matters" note, then prompt a re-run for the full hypothesis.
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Compass className="h-4 w-4 text-[var(--color-primary)]" /> Why this might matter
        </h2>
        {data.reason ? (
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-foreground)]/90">
            {data.reason}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
          This idea was created before Rift added deeper analysis. Run
          &ldquo;Find ideas&rdquo; on this project again to fill in the market
          gap, target customer, and product angle.
        </p>
      </section>
    );
  }

  return (
    <details
      open
      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]"
    >
      <summary className="flex cursor-pointer select-none items-center gap-2 text-base font-semibold transition-colors duration-150 ease-out hover:text-[var(--color-primary)] marker:content-none [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 ease-out group-open:rotate-90" />
        <Compass className="h-4 w-4 text-[var(--color-primary)]" /> Why this
        might matter
      </summary>
      <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
        Supporting context for the idea, inferred only from the complaints.
      </p>

      <div className="mt-4 space-y-4">
        <Field icon={Compass} label="Market Gap" text={data.marketGap} />
        <Field icon={UserRound} label="Target Customer" text={data.targetCustomer} />
        <Field
          icon={Wrench}
          label="Likely Current Workarounds"
          text={data.likelyCurrentWorkarounds}
        />
        <Field
          icon={AlertTriangle}
          label="Why Workarounds Fall Short"
          text={data.whyWorkaroundsFallShort}
        />
        <Field icon={Rocket} label="Product Angle" text={data.productAngle} />
        <Field
          icon={Split}
          label="Differentiation Angle"
          text={data.differentiationAngle}
        />
      </div>

      {/* Keep the stored AI reasoning as supporting context, but framed as
          part of the hypothesis (not a duplicate section) to avoid two
          same-purpose blocks. */}
      {data.reason && (
        <div className="mt-5 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
            <Sparkles className="h-3.5 w-3.5" /> AI reasoning
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed whitespace-normal break-words text-[var(--color-foreground)]/90">
            {data.reason}
          </p>
        </div>
      )}
    </details>
  );
}

function Field({
  icon: Icon,
  label,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text?: string | null;
}) {
  if (!text) return null;
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {label}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed whitespace-normal break-words text-[var(--color-foreground)]/90">
          {text}
        </p>
      </div>
    </div>
  );
}
