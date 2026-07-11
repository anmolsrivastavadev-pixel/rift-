import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { DeleteAccountCard } from "@/components/dashboard/delete-account";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your Rift account.",
};

/* Audit response (founder-authorized): account page with self-serve
 * deletion. Everything else account-related still lives in the sidebar
 * footer (plan link, feedback, sign out); this page exists so deleting
 * your account and data no longer requires emailing support.
 */
export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Your sign-in details and account controls.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="text-sm font-semibold">Sign-in details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-baseline gap-3">
            <dt className="w-16 shrink-0 text-[var(--color-muted-foreground)]">
              Email
            </dt>
            <dd className="min-w-0 truncate">{user.email}</dd>
          </div>
          {user.name && (
            <div className="flex items-baseline gap-3">
              <dt className="w-16 shrink-0 text-[var(--color-muted-foreground)]">
                Name
              </dt>
              <dd className="min-w-0 truncate">{user.name}</dd>
            </div>
          )}
        </dl>
      </section>

      <DeleteAccountCard email={user.email} />
    </div>
  );
}
