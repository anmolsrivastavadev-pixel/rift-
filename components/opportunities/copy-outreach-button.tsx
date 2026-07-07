"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

/* "Copy a polite reply" — clipboard button for the complainer outreach
 * message (built server-side in lib/complainer-outreach.ts and passed in as
 * plain text). Same clipboard pattern as components/reports/export-buttons.
 */
export function CopyOutreachButton({ message }: { message: string }) {
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(
    null
  );

  async function handleCopy() {
    setNotice(null);
    try {
      await navigator.clipboard.writeText(message);
      setNotice({ ok: true, text: "Reply copied — adapt it before posting." });
    } catch {
      setNotice({ ok: false, text: "Could not copy. Select and copy it manually." });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        {notice?.ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        Copy a polite reply
      </Button>
      {notice && (
        <span
          role="status"
          className={`text-xs ${notice.ok ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}
        >
          {notice.text}
        </span>
      )}
    </div>
  );
}
