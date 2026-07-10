"use client";

import * as React from "react";
import { Link2, Check, AlertCircle, Loader2, X } from "lucide-react";

import { createShareLink, revokeShareLink } from "@/actions/share";
import { Button } from "@/components/ui/button";

/* M29 — create / revoke a public share link, next to the export buttons.
 * Creating copies the URL to the clipboard; while a link is live it stays
 * visible here with a Revoke button. initialLink is seeded server-side so
 * the live state survives refreshes.
 */
export function ShareButton({
  kind,
  targetId,
  initialLink,
}: {
  kind: "project" | "idea";
  targetId: string;
  initialLink: { linkId: string; url: string } | null;
}) {
  const [link, setLink] = React.useState(initialLink);
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null);

  async function copyUrl(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  async function handleShare() {
    setBusy(true);
    setNotice(null);
    try {
      const result = await createShareLink(kind, targetId);
      if (!result.ok) {
        setNotice({ ok: false, text: result.error });
        return;
      }
      setLink({ linkId: result.linkId, url: result.url });
      const copied = await copyUrl(result.url);
      setNotice({
        ok: true,
        text: copied ? "Public link copied to clipboard." : "Public link created.",
      });
    } catch {
      setNotice({ ok: false, text: "Could not create the link. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyExisting() {
    if (!link) return;
    const copied = await copyUrl(link.url);
    setNotice(
      copied
        ? { ok: true, text: "Public link copied to clipboard." }
        : { ok: false, text: "Could not copy. Select the URL manually." }
    );
  }

  async function handleRevoke() {
    if (!link) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await revokeShareLink(link.linkId);
      if (!result.ok) {
        setNotice({ ok: false, text: result.error });
        return;
      }
      setLink(null);
      setNotice({ ok: true, text: "Link revoked. The public page is gone." });
    } catch {
      setNotice({ ok: false, text: "Could not revoke. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {link ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyExisting}
            disabled={busy}
          >
            <Link2 className="h-3.5 w-3.5" /> Copy public link
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRevoke}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            Revoke
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
          Share link
        </Button>
      )}
      {notice && (
        <span
          className={`flex items-center gap-1 text-xs ${
            notice.ok ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
          }`}
          aria-live="polite"
        >
          {notice.ok ? (
            <Check className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {notice.text}
        </span>
      )}
    </div>
  );
}
