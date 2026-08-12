import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { ApexNavbar } from "@/components/landing/ApexNavbar";
import { ApexHero } from "@/components/landing/ApexHero";
import { AllInOneHub } from "@/components/landing/AllInOneHub";
import { WhyParikshaa } from "@/components/landing/WhyParikshaa";
import { ParikshaaVsOthers } from "@/components/landing/ParikshaaVsOthers";
import { Testimonials } from "@/components/landing/Testimonials";

import { ApexFinalCTA } from "@/components/landing/ApexFinalCTA";
import { ApexFooter } from "@/components/landing/ApexFooter";
import { HeroAmbientBackdrop } from "@/components/landing/HeroAmbientBackdrop";
import { DelayedLoginPrompt } from "@/components/DelayedLoginPrompt";
import { captureUtm, trackLeadEvent } from "@/lib/leadTracking";


const Index = () => {
  useEffect(() => {
    const utm = captureUtm();
    void trackLeadEvent("landing_page_view", { utm });
  }, []);

  return (
    <>
      <Helmet>
        <title>Parikshaa — Visualize. Learn. Succeed.</title>
        <meta
          name="description"
          content="Visualize logic. Master the pattern. Succeed at scale. Parikshaa brings problem solving, visual learning, interview library, and real-time coding tracking together in one platform."
        />
        <link rel="canonical" href="https://www.parikshaa.org/" />
        <meta property="og:title" content="Parikshaa — Visualize. Learn. Succeed." />
        <meta
          property="og:description"
          content="Visualize logic. Master the pattern. Succeed at scale. Parikshaa is your ultimate edge."
        />
        <meta property="og:url" content="https://www.parikshaa.org/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Parikshaa" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Parikshaa — Visualize. Learn. Succeed." />
        <meta
          name="twitter:description"
          content="Visualize logic. Master the pattern. Succeed at scale."
        />
      </Helmet>
      <div className="noise-overlay" aria-hidden />
      <DelayedLoginPrompt />
      <HeroAmbientBackdrop>
        <ApexNavbar />
        <ApexHero />
        <AllInOneHub />
        <WhyParikshaa />
        <ParikshaaVsOthers />
        <Testimonials />
        
        <ApexFinalCTA />
        <ApexFooter />
      </HeroAmbientBackdrop>
    </>
  );
};


export default Index;
