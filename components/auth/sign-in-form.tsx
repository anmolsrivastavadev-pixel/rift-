"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input, fieldClass } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { PasswordInput } from "@/components/auth/password-input";

/* M27 — the sign-in form moved verbatim out of app/sign-in/page.tsx so the
 * page can be a server component that key-gates the "Forgot password?" link
 * (resetEnabled = RESEND_API_KEY is set; without it the link would lead to a
 * flow that can't send the email).
 */

const CREDENTIALS_ERROR =
  "That email or password doesn't match. Check for typos, or reset your password below.";

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
        // Better Auth answers bad credentials with "Invalid email or
        // password" (or similar). Map anything credential-shaped to a
        // friendly message; keep the raw message only as a last resort.
        const raw = authError.message ?? "";
        const isCredentials =
          raw === "" || /invalid|credential|password|not found/i.test(raw);
        setError(isCredentials ? CREDENTIALS_ERROR : raw);
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
    <AuthCard
      title="Rift"
      subtitle="Sign in to your account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-[var(--color-primary)] hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${fieldClass} mt-1`}
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
          <Notice variant="danger">
            <p>
              {error}
              {resetEnabled && error === CREDENTIALS_ERROR && (
                <>
                  {" "}
                  <Link
                    href="/forgot-password"
                    className="font-medium text-[var(--color-primary)] hover:underline"
                  >
                    Reset password
                  </Link>
                </>
              )}
            </p>
          </Notice>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
