import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { Container } from "@/components/container";
import { LandingNav } from "@/components/landing/nav";
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
import { PLANS, PRO_PRICE_LABEL } from "@/lib/plans";
import { getEffectivePlan } from "@/lib/quotas";
import { isBillingEnabled } from "@/lib/stripe";
import {
  ManageSubscriptionButton,
  UpgradeButton,
} from "@/components/billing/billing-buttons";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Rift is free to start. Pro is $9/month for more projects, idea runs, and Complaint Finder searches.",
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
  if (!signedIn) {
    return (
      <Button asChild className="mt-6 w-full">
        <Link href="/sign-up">Create a free account</Link>
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
        Payments coming soon — Rift is free during the private beta.
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
      <LandingNav />
      <main className="flex-1">
        <Container className="py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple, honest pricing
            </h1>
            <p className="mt-4 text-sm text-[var(--color-muted-foreground)] sm:text-base">
              Start free and validate your first ideas. Upgrade when you&apos;re
              running more market tests than the free plan covers.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            {/* Card's default bg-white is a landing-era leftover — force the
                dark theme card color so text stays readable. */}
            <Card className="bg-[var(--color-card)]">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>
                  Everything you need to test your first market.
                </CardDescription>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  $0
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

            <Card className="bg-[var(--color-card)] border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]">
              <CardHeader className="rounded-t-2xl bg-[var(--color-primary-soft)]">
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge variant="primary">For serious builders</Badge>
                </div>
                <CardDescription>
                  Room to run many market tests side by side.
                </CardDescription>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  $9
                  <span className="text-sm font-normal text-[var(--color-muted-foreground)]">
                    {" "}
                    / month
                  </span>
                </p>
              </CardHeader>
              <CardContent>
                <FeatureList
                  items={[
                    `${pro.maxActiveProjects} active projects`,
                    `${pro.ideaRunsPerMonth} AI idea runs per month`,
                    `${pro.finderSearchesPerMonth.toLocaleString("en-US")} Complaint Finder searches per month`,
                    `${pro.complaintsPerProject.toLocaleString("en-US")} complaints per project`,
                    "Everything in Free",
                    "Cancel anytime — no lock-in",
                  ]}
                />
                <ProCta signedIn={!!user} plan={effective?.plan ?? "free"} />
              </CardContent>
            </Card>
          </div>

          <p className="mx-auto mt-10 max-w-xl text-center text-xs text-[var(--color-muted-foreground)]">
            Pro is {PRO_PRICE_LABEL}, billed through Stripe. Prices in USD.
            Questions? Use the feedback button inside the app.
          </p>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
