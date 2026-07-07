import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { TagRibbon } from "@/components/landing/tag-ribbon";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { EvidenceMap } from "@/components/landing/evidence-map";
import { OutputWall } from "@/components/landing/output-wall";
import { ChatgptCompare } from "@/components/landing/chatgpt-compare";
import { WhyComplaints } from "@/components/landing/why-complaints";
import { Faq } from "@/components/landing/faq";
import { CtaBand } from "@/components/landing/cta-band";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main className="flex-1 bg-grid-faint">
      <LandingNav />
      <Hero />
      <TagRibbon />
      <HowItWorks />
      <Features />
      <EvidenceMap />
      <OutputWall />
      <ChatgptCompare />
      <WhyComplaints />
      <Faq />
      <CtaBand />
      <Footer />
    </main>
  );
}
