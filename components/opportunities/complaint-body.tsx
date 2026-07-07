"use client";

import * as React from "react";

const MAX = 500;

/* Complaint text with client-side Show more / Show less.
 * Truncates only if the body is longer than MAX characters.
 * Uses CSS transitions only (no Framer Motion).
 */
export function ComplaintBody({ body }: { body: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const long = body.length > MAX;

  if (!long) {
    return (
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]/90">
        {body}
      </p>
    );
  }

  const shown = expanded ? body : body.slice(0, MAX) + "…";

  return (
    <div>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]/90">
        {shown}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-xs font-medium text-[var(--color-primary)] transition-colors duration-150 ease-out hover:opacity-80"
        aria-expanded={expanded}
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}