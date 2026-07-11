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
 */
export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <LandingNav />
      <main id="main-content" className="flex-1">
        <Container className="py-16">
          <article className="mx-auto max-w-2xl space-y-8 text-sm leading-6">
            <header>
              <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
              <p className="mt-2 text-[var(--color-muted-foreground)]">
                Last updated: July 5, 2026
              </p>
            </header>

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
              <h2 className="text-lg font-semibold">Deleting your data</h2>
              <p>
                Deleting a project permanently removes its complaints, ideas,
                and history. To delete your whole account and its data, send us
                a message through the in-app feedback button (or reply to your
                beta invite) and we&apos;ll take care of it.
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
