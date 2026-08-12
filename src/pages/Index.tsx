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
        <title>Parikshaa — Master DSA & Competitive Programming</title>
        <meta
          name="description"
          content="Track your progress. Master DSA. Compete with your network. Parikshaa brings problem solving, visual analytics, and community-driven learning into one platform."
        />
        <link rel="canonical" href="https://www.parikshaa.org/" />
        <meta property="og:title" content="Parikshaa — Master DSA & Competitive Programming" />
        <meta
          property="og:description"
          content="Transform your coding journey. Monitor solved problems, streaks, and ranks in real-time with Parikshaa."
        />
        <meta property="og:url" content="https://www.parikshaa.org/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Parikshaa" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Parikshaa — Master DSA & Competitive Programming" />
        <meta
          name="twitter:description"
          content="Master DSA. Track progress. Compete with friends. Build your future."
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
