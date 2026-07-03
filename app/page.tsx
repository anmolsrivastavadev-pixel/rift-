import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { WhyComplaints } from "@/components/landing/why-complaints";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="landing-dark flex min-h-screen flex-col">
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <WhyComplaints />
        <Footer />
      </main>
    </div>
  );
}
