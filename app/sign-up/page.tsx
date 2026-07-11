"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input, fieldClass } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { PasswordInput } from "@/components/auth/password-input";

const DUPLICATE_ERROR = "That email already has an account.";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (authError) {
        // Better Auth answers a taken email with "User already exists" (or
        // similar). Map that to a friendly message with a sign-in link; keep
        // the raw message only as a last resort.
        const raw = authError.message ?? "";
        const isDuplicate = /exist|already/i.test(raw);
        setError(isDuplicate ? DUPLICATE_ERROR : raw || "Sign up failed");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Rift"
      subtitle={
        <>
          Create your account
          <span className="mt-2 block text-xs">
            Rift is in private beta — new accounts may need founder approval
            before the dashboard opens.
          </span>
        </>
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-[var(--color-primary)] transition-colors hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--color-foreground)]"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--color-foreground)]"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${fieldClass} mt-1`}
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            At least 8 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-[var(--color-foreground)]"
          >
            Name{" "}
            <span className="font-normal text-[var(--color-muted-foreground)]">
              (optional)
            </span>
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>

        {error && (
          <Notice variant="danger">
            <p>
              {error}
              {error === DUPLICATE_ERROR && (
                <>
                  {" "}
                  <Link
                    href="/sign-in"
                    className="font-medium text-[var(--color-primary)] hover:underline"
                  >
                    Sign in instead
                  </Link>
                </>
              )}
            </p>
          </Notice>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-xs text-[var(--color-muted-foreground)]">
        By creating an account you agree to the{" "}
        <Link
          href="/terms"
          className="underline hover:text-[var(--color-foreground)]"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline hover:text-[var(--color-foreground)]"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </AuthCard>
  );
}
