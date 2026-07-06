"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

/* M27 — request a password-reset email. Always shows the same neutral
 * success message whether or not the email has an account (no account
 * enumeration). Better Auth emails a link that lands on /reset-password.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.3),0_1px_2px_-1px_rgb(0_0_0_/_0.2)]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Rift
            </Link>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Reset your password
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm">
              If that email has an account, a reset link is on its way. Check
              your inbox (and spam folder) — the link expires in 1 hour.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-[10px] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]"
              >
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-[var(--color-muted-foreground)]">
          Remembered it?{" "}
          <Link href="/sign-in" className="text-[var(--color-primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
