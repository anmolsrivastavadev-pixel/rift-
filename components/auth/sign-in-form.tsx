"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

/* M27 — the sign-in form moved verbatim out of app/sign-in/page.tsx so the
 * page can be a server component that key-gates the "Forgot password?" link
 * (resetEnabled = RESEND_API_KEY is set; without it the link would lead to a
 * flow that can't send the email).
 */
export function SignInForm({ resetEnabled }: { resetEnabled: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await authClient.signIn.email({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Sign in failed");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
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
            Sign in to your account
          </p>
        </div>

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            {resetEnabled && (
              <p className="mt-1.5 text-right text-xs">
                <Link
                  href="/forgot-password"
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:underline"
                >
                  Forgot password?
                </Link>
              </p>
            )}
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
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-muted-foreground)]">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-[var(--color-primary)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
