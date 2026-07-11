import type { Metadata } from "next";

import { Container } from "@/components/container";
import { LandingNav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Rift handles your account data and the complaints you import.",
};

/* M27 — plain-English privacy policy. Static page, no data reads. Honest and
 * specific to what Rift actually does; updated whenever data handling changes.
 * Extended July 2026 (audit response): operator identity, retention, hosting,
 * subprocessors, rights, cookies, age. The support address comes from
 * NEXT_PUBLIC_SUPPORT_EMAIL (same convention as the beta-access page) and the
 * copy falls back to the feedback button until that mailbox exists.
 */
export default function PrivacyPage() {
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
              <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
              <p className="mt-2 text-[var(--color-muted-foreground)]">
                Last updated: July 11, 2026
              </p>
            </header>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Who runs Rift</h2>
              <p>
                Rift is operated by Anmol Srivastava, an independent founder
                based in the United Kingdom. For anything about your data —
                questions, corrections, exports, or deletion — {contactRoute}.
                That route works even if you can&apos;t sign in anymore.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">The short version</h2>
              <p>
                Rift stores the data you give it so the product works: your
                account, your projects, the complaints you import, and the
                ideas Rift generates from them. We don&apos;t sell your data,
                and we don&apos;t show your data to other users unless you
                create a public share link yourself.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">What we store</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Account data</strong>: your email, name, and a
                  securely hashed password (we never store the password
                  itself).
                </li>
                <li>
                  <strong>Your content</strong>: projects, imported
                  complaints, generated ideas, saved ideas, validation notes,
                  and feedback you send through the in-app feedback button.
                </li>
                <li>
                  <strong>Usage records</strong>: import history, AI run
                  history, and product events (counts and metadata only, never
                  the text of your complaints).
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">AI processing</h2>
              <p>
                When you run &quot;Find ideas&quot;, the complaints in that
                project are sent to Google&apos;s Gemini API to be grouped into
                themes. That processing is what turns complaints into ideas.
                It doesn&apos;t happen until you click the button, and the
                results come back to your project only.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Payments</h2>
              <p>
                If you upgrade to Pro, payment is handled by Stripe. Your card
                number never touches Rift&apos;s servers. We only store the
                identifiers Stripe gives us to know which plan you&apos;re on.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Share links</h2>
              <p>
                Reports are private by default. If you create a share link,
                anyone with that exact URL can view that one report until you
                revoke the link. Search engines are told not to index shared
                reports.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Emails</h2>
              <p>
                We send transactional emails only, such as a password
                reset link when you ask for one. No marketing lists, no
                newsletters you didn&apos;t sign up for.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Where your data lives</h2>
              <p>
                Rift runs on Vercel, and your data is stored in a Neon
                PostgreSQL database hosted in London (AWS eu-west-2). Some of
                the services below process data in the United States; where
                that happens, it&apos;s covered by those providers&apos;
                standard data-protection terms for international transfers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Who else touches your data</h2>
              <p>
                Rift uses a small set of service providers, each only for the
                job named here:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Vercel</strong> — hosts and serves the app.
                </li>
                <li>
                  <strong>Neon</strong> — the PostgreSQL database (London).
                </li>
                <li>
                  <strong>Google (Gemini API)</strong> — groups your complaints
                  into ideas when you click &quot;Find ideas&quot;.
                </li>
                <li>
                  <strong>Stripe</strong> — payments, if you ever upgrade.
                </li>
                <li>
                  <strong>Resend</strong> — sends the transactional emails.
                </li>
              </ul>
              <p>
                No advertising networks, no data brokers, and we never sell
                your data.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Cookies and analytics</h2>
              <p>
                Rift sets one cookie: the session cookie that keeps you signed
                in. There are no third-party analytics scripts, ad trackers, or
                social pixels. We record first-party usage events (things like
                &quot;a CSV was imported&quot; — counts and metadata only,
                never the text of your complaints) to understand what&apos;s
                working.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">How long we keep things</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Your account and content are kept for as long as your account
                  exists.
                </li>
                <li>
                  Deleting a project removes its complaints, ideas, and history
                  immediately.
                </li>
                <li>
                  When you ask us to delete your account, we remove your data
                  within 30 days. Short-lived database backups age out on their
                  own within about a week after that.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Your rights</h2>
              <p>
                It&apos;s your data. You can ask to see what we hold about you,
                fix anything that&apos;s wrong, export your reports (Markdown
                export is built into the app), or have everything deleted. To
                exercise any of these, {contactRoute}. If you&apos;re in the UK
                or EU, these are your legal rights under data-protection law,
                and you can also complain to your local supervisory authority
                (in the UK, the ICO) — though we&apos;d appreciate the chance
                to fix things first.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Age</h2>
              <p>
                Rift isn&apos;t for children. You need to be at least 16 to
                have an account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Deleting your data</h2>
              <p>
                Deleting a project permanently removes its complaints, ideas,
                and history. To delete your whole account and everything in
                it, use the &quot;Delete my account&quot; button on the
                Account page in the dashboard — it works immediately, no email
                needed. If you can&apos;t sign in anymore, {contactRoute} and
                we&apos;ll take care of it.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Beta caveat</h2>
              <p>
                Rift is in beta. If anything about how we handle data changes,
                this page changes with it, and the date at the top tells you
                when.
              </p>
            </section>
          </article>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
