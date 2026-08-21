import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { SectionEyebrow } from "./SectionEyebrow";
import { trackEvent } from "@/lib/analytics";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is Parikshaa really free for students?",
    a: "Yes. DSA studio, SQL library, interview prep, daily arena and progress tracking are free forever. No credit card required.",
  },
  {
    q: "How does AI proctoring work?",
    a: "We combine webcam + optional side-eye phone camera, tab-lock, keystroke telemetry and a trust score. Recruiters get a full audit trail per session.",
  },
  {
    q: "Can colleges run campus placements on Parikshaa?",
    a: "Yes. Book a demo and we onboard your batch with contest allocation, coding rounds, live invigilation and a downloadable report.",
  },
  {
    q: "What languages and topics are covered?",
    a: "C++, Java, Python, JavaScript, Go and SQL across DSA, System Design, DBMS, OS, Networks, aptitude and role-specific interview banks.",
  },
  {
    q: "Do you support spaced repetition?",
    a: "Yes — every problem, quiz and interview question runs on an SM-2 SRS engine so you revise only what you're forgetting.",
  },
];

export function FAQ() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const scrollToFinalCta = (source: string) => {
    trackEvent("faq_jump_to_cta", { source });
    const el = document.getElementById("final-cta");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="faq" aria-labelledby="faq-heading" className="relative isolate overflow-hidden border-t border-border/50 px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      {/* faint diagonal streaks — matches hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <SectionEyebrow kicker="05" label="The Intel Layer / Resolving Queries" />
          </div>

          <motion.h2
            id="faq-heading"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            className="mx-auto max-w-[18ch] text-[38px] font-bold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-5xl md:text-6xl lg:text-[64px]"
          >
            Questions,{" "}
            <span className="relative inline-block px-2 py-0.5">
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/25"
              />
              answered
            </span>{" "}
            <span
              className="bg-gradient-to-r from-primary via-primary-bright to-primary bg-clip-text text-transparent"
              style={{ backgroundSize: "200% auto", animation: "apex-shimmer 6s linear infinite" }}
            >
              honestly.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Everything students, TPOs and recruiters ask before getting started.
          </motion.p>
        </div>

        {/* Accordion list — bordered rows like hub grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-14 border-t border-border/60"
        >
          <Accordion type="single" collapsible defaultValue="faq-0" className="w-full">
            {faqs.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`faq-${i}`}
                className="group border-b border-border/60 transition-colors hover:bg-card/40"
              >
                <AccordionTrigger className="focus-parikshaa px-2 py-6 text-left hover:no-underline sm:px-4">
                  <span className="flex flex-1 items-center gap-5">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80 group-hover:text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3
                      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                      className="m-0 text-lg font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary sm:text-xl"
                    >
                      {item.q}
                    </h3>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-[52px] pr-4 text-[15px] leading-relaxed text-muted-foreground sm:pl-[68px]">
                  <p className="m-0">{item.a}</p>
                  {i === 2 && (
                    <button
                      type="button"
                      onClick={() => scrollToFinalCta("faq_mid_list")}
                      className="focus-parikshaa mt-4 inline-flex items-center gap-1.5 rounded-md text-[13px] font-semibold uppercase tracking-[0.14em] text-primary transition-colors hover:text-primary/80"
                    >
                      Ready to start? Jump to signup
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

        </motion.div>

        {/* Footer CTA */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Still curious? Talk to us about your batch or team.
          </p>
          <Link
            to="/signup"
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-lg bg-primary px-8 text-sm font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary)/0.7)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_60px_-6px_hsl(var(--primary)/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
            />
            <span className="relative z-10 inline-flex items-center">
              Book a Demo
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FAQ;
