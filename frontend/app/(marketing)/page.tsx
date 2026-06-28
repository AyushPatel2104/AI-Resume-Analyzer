import { AIInsights } from "@/components/landing/AIInsights";
import { CTA } from "@/components/landing/CTA";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ResumePreview } from "@/components/landing/ResumePreview";
import { TrustedBy } from "@/components/landing/TrustedBy";

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <ResumePreview />
      <AIInsights />
      <CTA />
    </>
  );
}
