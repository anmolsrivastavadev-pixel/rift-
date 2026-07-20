import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { Container } from "@/components/container";
import { DoodleNav } from "@/components/landing/doodle";
import { Footer } from "@/components/landing/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { FREE_BETA, PLANS, PRO_PRICE_LABEL } from "@/lib/plans";
import { getEffectivePlan } from "@/lib/quotas";
import { isBillingEnabled } from "@/lib/stripe";
import {
  ManageSubscriptionButton,
  UpgradeButton,
} from "@/components/billing/billing-buttons";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Rift is free to start. Pro is £9/month for more projects, idea runs, and Complaint Finder searches.",
};

/* M25 — Public pricing page. Honest copy, no fake urgency: the free plan is a
 * real free plan, and until Stripe keys are configured (M28) the Pro card
 * says payments aren't live yet instead of showing a dead button.
 */

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ProCta({ signedIn, plan }: { signedIn: boolean; plan: "free" | "pro" }) {
  // Free beta: both plans stay visible, but nothing on this page can start a
  // payment. Every account already has the Pro limits.
  if (FREE_BETA) {
    return (
      <div className="mt-6 space-y-3">
        <Badge variant="success">Included free during the beta</Badge>
        {!signedIn && (
          <Button asChild className="w-full">
            <Link href="/sign-up">Start free</Link>
          </Button>
        )}
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Every beta account gets the Pro limits at no cost. Paid plans start
          only after the beta ends.
        </p>
      </div>
    );
  }
  if (!signedIn) {
    return (
      <Button asChild className="mt-6 w-full">
        <Link href="/sign-up">Start free, upgrade anytime</Link>
      </Button>
    );
  }
  // M28 — real buttons only when Stripe keys are configured; honest
  // "coming soon" copy otherwise.
  if (isBillingEnabled()) {
    if (plan === "pro") {
      return (
        <div className="mt-6 space-y-3">
          <Badge variant="success">You&apos;re on Pro</Badge>
          <ManageSubscriptionButton />
        </div>
      );
    }
    return (
      <div className="mt-6">
        <UpgradeButton />
      </div>
    );
  }
  if (plan === "pro") {
    return (
      <div className="mt-6">
        <Badge variant="success">You&apos;re on Pro</Badge>
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-2">
      <Button className="w-full" disabled>
        Upgrade to Pro
      </Button>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Payments aren&apos;t available right now. Please check back soon.
      </p>
    </div>
  );
}

export default async function PricingPage() {
  const user = await getCurrentUser();
  const effective = user
    ? await getEffectivePlan({ id: user.id, email: user.email })
    : null;
  const free = PLANS.free;
  const pro = PLANS.pro;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <DoodleNav />
      <main id="main-content" className="flex-1">
        <Container className="py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple, honest pricing
            </h1>
            <p className="mt-4 text-sm text-[var(--color-muted-foreground)] sm:text-base">
              {FREE_BETA ? (
                <>
                  Rift is completely free during the beta — every account gets
                  the Pro limits. These are the plans that will exist after the
                  beta ends.
                </>
              ) : (
                <>
                  Start free and validate your first ideas. Upgrade when
                  you&apos;re running more market tests than the free plan
                  covers.
                </>
              )}
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>
                  Everything you need to test your first market.
                </CardDescription>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  £0
                  <span className="text-sm font-normal text-[var(--color-muted-foreground)]">
                    {" "}
                    / month
                  </span>
                </p>
              </CardHeader>
              <CardContent>
                <FeatureList
                  items={[
                    `${free.maxActiveProjects} active projects`,
                    `${free.ideaRunsPerMonth} AI idea runs per month`,
                    `${free.finderSearchesPerMonth} Complaint Finder searches per month`,
                    `${free.complaintsPerProject.toLocaleString("en-US")} complaints per project`,
                    `${free.maxActiveWatches} weekly niche watch`,
                    "CSV, paste, and starter-pack imports",
                    "Markdown report exports",
                  ]}
                />
                {user ? (
                  <Button asChild variant="outline" className="mt-6 w-full">
                    <Link href="/dashboard">Go to dashboard</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="mt-6 w-full">
                    <Link href="/sign-up">Start free</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]">
              <CardHeader className="rounded-t-2xl border-b border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)]">
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge variant="primary">For serious builders</Badge>
                </div>
                <CardDescription>
                  Room to run many market tests side by side.
                </CardDescription>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  £9
                  <span className="text-sm font-normal text-[var(--color-muted-foreground)]">
                    {" "}
                    / month
                  </span>
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm font-medium">Everything in Free, plus:</p>
                <FeatureList
                  items={[
                    `${pro.maxActiveProjects} active projects (vs ${free.maxActiveProjects})`,
                    `${pro.ideaRunsPerMonth} AI idea runs per month (vs ${free.ideaRunsPerMonth})`,
                    `${pro.finderSearchesPerMonth.toLocaleString("en-US")} Complaint Finder searches per month (vs ${free.finderSearchesPerMonth})`,
                    `${pro.complaintsPerProject.toLocaleString("en-US")} complaints per project (vs ${free.complaintsPerProject.toLocaleString("en-US")})`,
                    `${pro.maxActiveWatches} weekly niche watches (vs ${free.maxActiveWatches})`,
                    "Cancel anytime, no lock-in",
                  ]}
                />
                <ProCta signedIn={!!user} plan={effective?.plan ?? "free"} />
              </CardContent>
            </Card>
          </div>

          <p className="mx-auto mt-10 max-w-xl text-center text-xs text-[var(--color-muted-foreground)]">
            {FREE_BETA
              ? "No payments during the beta. After the beta, Pro will be "
              : "Pro is "}
            {PRO_PRICE_LABEL}, billed through Stripe. Prices in GBP.{" "}
            {user ? (
              <>Questions? Use the feedback button inside the app.</>
            ) : (
              <>
                Questions? See the{" "}
                <Link
                  href="/#faq"
                  className="underline hover:text-[var(--color-foreground)]"
                >
                  FAQ on the homepage
                </Link>
                .
              </>
            )}
          </p>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
