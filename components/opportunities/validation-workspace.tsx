import {
  Compass,
  Users,
  HelpCircle,
  ClipboardList,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";

import {
  buildHypothesis,
  buildTargetCustomer,
  buildInterviewQuestions,
  buildRisksToTest,
  EVIDENCE_CHECKLIST,
  SUCCESS_SIGNALS,
  INTERVIEW_HELPER,
  type ValidationPlanInput,
} from "@/lib/validation-plan";
import { ValidationChecklist } from "@/components/opportunities/validation-checklist";
import { CopyValidationBrief } from "@/components/opportunities/copy-validation-brief";

/* Validation Workspace — a lightweight, deterministic validation guide
 * rendered on the opportunity detail page. Uses only existing M9 fields +
 * deterministic fallback copy. No Gemini, no DB writes, no auth.
 *
 * This component owns the rendering of validation questions and risk flags so
 * the detail page does NOT render them separately (avoiding duplicates).
 */
export function ValidationWorkspace({ input }: { input: ValidationPlanInput }) {
  const hypothesis = buildHypothesis(input);
  const targetCustomer = buildTargetCustomer(input);
  const questions = buildInterviewQuestions(input);
  const risks = buildRisksToTest(input);

  return (
    <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--card)] p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-base font-semibold">Validation Workspace</h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
            A simple checklist for testing the idea with real people.
          </p>
        </div>
        <CopyValidationBrief input={input} />
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {/* LEFT side */}
        <div className="space-y-6">
          {/* 1. Hypothesis To Test */}
          <Sub icon={Compass} title="Hypothesis To Test">
            <p className="text-sm leading-relaxed text-[var(--color-foreground)]/90">
              {hypothesis}
            </p>
          </Sub>

          {/* 2. Who To Interview */}
          <Sub icon={Users} title="Who To Interview">
            <p className="text-sm text-[var(--color-foreground)]/90">{targetCustomer}</p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {INTERVIEW_HELPER}
            </p>
          </Sub>

          {/* 3. Interview Questions */}
          <Sub icon={HelpCircle} title="Interview Questions">
            <ol className="mt-1 space-y-1.5">
              {questions.map((q, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--color-foreground)]/90">
                  <span className="text-[var(--color-muted-foreground)]">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </Sub>
        </div>

        {/* RIGHT side */}
        <div className="space-y-6">
          {/* 4. Evidence To Collect */}
          <Sub icon={ClipboardList} title="Evidence To Collect">
            <ul className="mt-1 space-y-1.5">
              {EVIDENCE_CHECKLIST.map((e, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--color-foreground)]/90">
                  <span className="text-[var(--color-muted-foreground)]">•</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </Sub>

          {/* 5. Signs This May Be Worth Pursuing */}
          <Sub icon={TrendingUp} title="Signs This May Be Worth Pursuing">
            <ul className="mt-1 space-y-1.5">
              {SUCCESS_SIGNALS.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--color-foreground)]/90">
                  <span className="text-[var(--color-muted-foreground)]">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Sub>

          {/* 6. Risks To Test */}
          <Sub icon={ShieldAlert} title="Risks To Test Before Building">
            <ul className="mt-1 space-y-1.5">
              {risks.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--color-foreground)]/90">
                  <span className="text-[var(--color-muted-foreground)]">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Sub>

          {/* 7. Validation Checklist (interactive, localStorage) */}
          <ValidationChecklist opportunityId={input.id} />
        </div>
      </div>
    </section>
  );
}

function Sub({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}