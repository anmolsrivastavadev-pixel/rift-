import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";

import { requireUser } from "@/lib/auth/current-user";
import { hasBetaAccess } from "@/lib/beta-access";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/contact";

/* M20 — Landing spot for signed-in users without beta access. If beta mode is
 * off or the user already has access (or is an admin), this page just sends
 * them to the dashboard. No email is sent from here; access is granted by the
 * founder adding the email in Beta insights.
 */

export const dynamic = "force-dynamic";

export default async function BetaAccessPage() {
  const user = await requireUser();
  if (await hasBetaAccess(user)) redirect("/dashboard");

  const supportEmail = SUPPORT_EMAIL;

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center">
      <Container className="max-w-md py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] ring-1 ring-[var(--color-primary)]/10">
          <Lock className="h-6 w-6 text-[var(--color-primary)]" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Rift private beta
        </h1>
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          Your account is signed in, but this beta is invite-only right now.
        </p>
        <p className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm">
          Signed in as{" "}
          <span className="font-medium text-[var(--color-foreground)]">
            {user.email}
          </span>
        </p>
        {supportEmail ? (
          <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
            We usually reply within a day. Once your email is added, just
            reload this page.
          </p>
        ) : (
          <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
            Invites are approved by the founder — check back soon, or reply to
            any Rift email you&apos;ve received. Once your email is added, just
            reload this page.
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {supportEmail ? (
            <>
              <Button asChild>
                <a
                  href={`mailto:${supportEmail}?subject=Rift beta invite request`}
                >
                  Request an invite
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Check again</Link>
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link href="/dashboard">Check again</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
          Signed up with the wrong email?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Use a different account
          </Link>
        </p>
      </Container>
    </main>
  );
}
