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
        <title>Parikshaa — Learn to Code & Hire with AI Proctoring</title>
        <meta
          name="description"
          content="Free structured learning for students plus secure AI-proctored hiring assessments for colleges and recruiters. One platform, two outcomes."
        />
        <link rel="canonical" href="https://www.parikshaa.org/" />
        <meta property="og:title" content="Parikshaa — Learn to Code & Hire with AI Proctoring" />
        <meta
          property="og:description"
          content="Free DSA, SQL and interview prep for students. Secure AI-proctored coding rounds for colleges and recruiters."
        />
        <meta property="og:url" content="https://www.parikshaa.org/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Parikshaa" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Parikshaa — Learn to Code & Hire with AI Proctoring" />
        <meta
          name="twitter:description"
          content="Free structured learning for students. AI-proctored hiring assessments for colleges and recruiters."
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
