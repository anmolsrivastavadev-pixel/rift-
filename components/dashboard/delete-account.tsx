"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, fieldClass } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { PasswordInput } from "@/components/auth/password-input";

/* Audit response (founder-authorized): self-serve account deletion.
 * Two-step confirmation — type your email, then your password (the server
 * requires it) — because this permanently removes every project, complaint,
 * idea, and share link. On success Better Auth ends the session server-side
 * and we hard-navigate home.
 */
export function DeleteAccountCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailMatches = confirmEmail.trim().toLowerCase() === email.toLowerCase();

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!emailMatches || loading) return;
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await authClient.deleteUser({ password });
      if (authError) {
        setError(
          authError.message ||
            "Deletion failed. Check your password and try again."
        );
        setLoading(false);
        return;
      }
      // Session is gone; leave the dashboard entirely.
      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--color-danger)]/40 bg-[var(--color-card)] p-6">
      <h2 className="text-sm font-semibold text-[var(--color-danger)]">
        Danger zone
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Deleting your account permanently removes all your projects,
        complaints, ideas, saved ideas, and share links. There is no undo. If
        you want a copy of your reports, export them first.
      </p>

      {!open ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="mt-4 border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
        >
          Delete my account…
        </Button>
      ) : (
        <form onSubmit={handleDelete} className="mt-4 space-y-4">
          <div>
            <label htmlFor="confirm-email" className="block text-sm font-medium">
              Type your email to confirm
            </label>
            <Input
              id="confirm-email"
              name="confirmEmail"
              type="email"
              autoComplete="off"
              placeholder={email}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="delete-password" className="block text-sm font-medium">
              Your password
            </label>
            <PasswordInput
              id="delete-password"
              name="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${fieldClass} mt-1`}
            />
          </div>

          {error && <Notice variant="danger">{error}</Notice>}

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={!emailMatches || password.length === 0 || loading}
              className="bg-[var(--color-danger)] text-white hover:brightness-110"
            >
              {loading ? "Deleting…" : "Permanently delete my account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setConfirmEmail("");
                setPassword("");
                setError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
