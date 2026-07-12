import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ExampleWalkthrough } from "@/components/landing/example-walkthrough";
import { EvidenceMap } from "@/components/landing/evidence-map";
import { Trust } from "@/components/landing/trust";
import { ChatgptCompare } from "@/components/landing/chatgpt-compare";
import { Faq } from "@/components/landing/faq";
import { CtaBand } from "@/components/landing/cta-band";
import { Footer } from "@/components/landing/footer";

/* Landing page (July 2026 beginner-first redesign). Reading order is the
 * visitor's question order: what is this and what do I type (Hero) → how
 * does it work → show me one real result (Example) → where does the
 * evidence come from → can I trust the method → why not just ChatGPT →
 * remaining questions → sign up.
 */
export default function HomePage() {
  return (
    <main id="main-content" className="flex-1 bg-grid-faint">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <ExampleWalkthrough />
      <EvidenceMap />
      <Trust />
      <ChatgptCompare />
      <Faq />
      <CtaBand />
      <Footer />
    </main>
  );
}
