"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { PasswordInput } from "@/components/auth/password-input";

/* M27 — set a new password. Better Auth's emailed link goes through
 * /api/auth/reset-password/:token and redirects here with ?token=... on
 * success or ?error=INVALID_TOKEN when the link is expired/used. Wrapped in
 * Suspense because useSearchParams requires it during prerender. Both fields
 * are password fields, so the shared field styling arrives via fieldClass
 * (the class the shared Input uses) passed into PasswordInput.
 */

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const invalidLink = !token || Boolean(linkError);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await authClient.resetPassword({
        newPassword: password,
        token: token ?? "",
      });
      if (authError) {
        setError(
          authError.message ||
            "This reset link is no longer valid. Request a new one."
        );
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (invalidLink) {
    return (
      <div className="space-y-4">
        <Notice variant="danger">
          This reset link is invalid or has expired. Request a fresh one — it
          only takes a moment.
        </Notice>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Notice variant="success">
          Your password has been updated. Sign in with the new one.
        </Notice>
        <Button asChild className="w-full">
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          New password
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${fieldClass} mt-1`}
        />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-medium">
          Confirm new password
        </label>
        <PasswordInput
          id="confirm"
          name="confirmPassword"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={`${fieldClass} mt-1`}
        />
      </div>

      {error && <Notice variant="danger">{error}</Notice>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}

function ResetPasswordSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div>
        <div className="h-4 w-28 animate-pulse rounded-lg bg-[var(--color-surface)]" />
        <div className="mt-1 h-10 w-full animate-pulse rounded-lg bg-[var(--color-surface)]" />
      </div>
      <div>
        <div className="h-4 w-40 animate-pulse rounded-lg bg-[var(--color-surface)]" />
        <div className="mt-1 h-10 w-full animate-pulse rounded-lg bg-[var(--color-surface)]" />
      </div>
      <div className="h-10 w-full animate-pulse rounded-lg bg-[var(--color-surface)]" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Rift" subtitle="Choose a new password">
      <Suspense fallback={<ResetPasswordSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
