/* Pure deterministic helpers for the "Talk to the people behind the
 * complaints" section. No Gemini, no DB, no side effects.
 *
 * Built on M31a receipts: finder-sourced complaints carry the URL of the
 * original public post, so an idea can list the actual threads where real
 * people described the problem — and give the founder a polite, non-spammy
 * reply to start a conversation. The reply template embeds the idea's own
 * interview questions (lib/validation-plan.ts).
 */

import type { ComplaintSourceKind } from "@/lib/complaint-sources";

export const THREAD_SOURCE_LABELS: Record<ComplaintSourceKind, string> = {
  reddit: "Reddit thread",
  hackernews: "Hacker News thread",
  appstore: "App Store reviews page",
  web: "Web page",
  youtube: "YouTube comment",
  stackexchange: "Stack Exchange question",
  github: "GitHub issue",
};

export const OUTREACH_ETIQUETTE =
  "These are real posts by real people. Reply only where you can genuinely add something, and never paste the same message everywhere.";

/**
 * A short, honest reply the founder can adapt. No links, no pitch, no
 * pretending to be a customer — it says plainly that they're researching
 * the problem.
 */
export function buildOutreachMessage(input: {
  problemTitle: string;
  questions: string[];
}): string {
  const questionLines = input.questions
    .slice(0, 3)
    .map((q) => `- ${q}`)
    .join("\n");
  return [
    `Hi — I came across your post about ${input.problemTitle}. I'm researching this exact frustration (not selling anything), and your post really matched what I keep hearing from others.`,
    "",
    "If you have a minute, I'd love to know:",
    questionLines,
    "",
    "Any detail helps me figure out whether this problem is worth solving properly. Thanks either way!",
  ].join("\n");
}
