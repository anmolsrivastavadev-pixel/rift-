import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { WhyComplaints } from "@/components/landing/why-complaints";
import { BeginnerGuide } from "@/components/landing/beginner-guide";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main className="flex-1">
      <Hero />
      <BeginnerGuide />
      <Features />
      <HowItWorks />
      <WhyComplaints />
      <Footer />
    </main>
  );
}
