import type { Metadata } from "next";

import { Container } from "@/components/container";
import { LandingNav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The plain-English terms for using Rift.",
};

/* M27 — plain-English terms of service. Static page, no data reads.
 * Extended July 2026 (audit response): operator identity, governing law,
 * disputes, refunds, suspension and post-termination handling. Support
 * address via NEXT_PUBLIC_SUPPORT_EMAIL, falling back to the feedback button.
 */
export default function TermsPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const contactRoute = supportEmail ? (
    <>
      email{" "}
      <a href={`mailto:${supportEmail}`} className="underline">
        {supportEmail}
      </a>
    </>
  ) : (
    <>use the in-app feedback button</>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <LandingNav />
      <main id="main-content" className="flex-1">
        <Container className="py-16">
          <article className="mx-auto max-w-2xl space-y-8 text-sm leading-6">
            <header>
              <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
              <p className="mt-2 text-[var(--color-muted-foreground)]">
                Last updated: July 11, 2026
              </p>
            </header>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">What Rift is</h2>
              <p>
                Rift turns customer complaints into business idea suggestions.
                You import complaints, Rift groups them with AI and scores the
                ideas it finds. It&apos;s a research tool. The ideas
                are starting points to validate, not guarantees that a business
                will work.
              </p>
              <p>
                Rift is operated by Anmol Srivastava, an independent founder
                based in the United Kingdom. Questions about these terms?{" "}
                {contactRoute}.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Your account</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>You need an account to use the app, and you&apos;re responsible for what happens under it.</li>
                <li>Keep your password to yourself. If you think someone else has it, reset it.</li>
                <li>One person per account. Don&apos;t share logins.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Your content</h2>
              <p>
                The complaints you import and the ideas Rift generates in your
                projects are yours. Only import data you have the right to use.
                Don&apos;t import anything illegal, or personal data you have
                no business holding.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Plans and payment</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>The free plan is genuinely free, with the limits shown on the Pricing page.</li>
                <li>Pro is a monthly subscription billed through Stripe. Cancel anytime, and you keep Pro until the end of the period you paid for.</li>
                <li>If a payment fails repeatedly, your account drops back to the free plan; your data stays.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Refunds and cancellation</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Cancelling stops future charges; you keep Pro until the end
                  of the period you already paid for. We don&apos;t prorate
                  partial months.
                </li>
                <li>
                  If something on our side went clearly wrong — say you were
                  charged after cancelling — {contactRoute} and we&apos;ll put
                  it right.
                </li>
                <li>
                  Nothing here takes away refund rights the law gives you (for
                  UK customers, the Consumer Rights Act 2015).
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Fair use</h2>
              <p>
                Don&apos;t abuse the service: no scraping the app itself, no
                trying to get around plan limits, no using Rift to spam or harm
                others. We can suspend accounts that do.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">No warranties</h2>
              <p>
                Rift is provided as-is, and it&apos;s in beta, so things may
                break or change. AI-generated ideas can be wrong, incomplete,
                or already taken. Do your own validation before betting money
                on one. To the extent the law allows, we&apos;re not liable for
                business decisions made based on Rift&apos;s output.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Ending things</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  You can stop using Rift and ask us to delete your account at
                  any time — {contactRoute} or use the in-app feedback button.
                </li>
                <li>
                  Before your account is deleted, you can export your reports
                  with the built-in Markdown export. After deletion, your data
                  is removed as described in the Privacy Policy.
                </li>
                <li>
                  We can suspend or terminate accounts that break these terms.
                  For anything short of clear abuse, we&apos;ll warn you first
                  and give you a chance to export your data.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Age</h2>
              <p>You need to be at least 16 to use Rift.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Governing law and disputes</h2>
              <p>
                These terms are governed by the law of England and Wales, and
                the courts of England and Wales have jurisdiction — though if
                you&apos;re a consumer elsewhere, you keep any protections your
                local law says you can&apos;t sign away. If something goes
                wrong, {contactRoute} first: almost everything can be sorted
                out with a conversation before anyone involves a court.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Changes</h2>
              <p>
                If these terms change in a way that matters, the date at the
                top changes and continued use means you accept the new
                version. Questions? Use the feedback button in the app.
              </p>
            </section>
          </article>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
