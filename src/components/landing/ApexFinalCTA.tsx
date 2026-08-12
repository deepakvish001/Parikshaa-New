import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

function markFinalCtaSource(cta: string) {
  try { sessionStorage.setItem("signup_source", `final_cta:${cta}`); } catch { /* ignore */ }
  trackEvent("final_cta_click", { cta });
}

export function ApexFinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="final-cta" aria-labelledby="final-cta-heading" className="relative isolate overflow-hidden border-t border-border/50 px-4 py-24 sm:px-6 sm:py-28 lg:py-32">

      {/* Radial rays backdrop — matches hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[800px] opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 100%, hsl(var(--primary)/0.28), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
          maskImage:
            "radial-gradient(ellipse 65% 60% at 50% 80%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 60% at 50% 80%, black, transparent 75%)",
        }}
      />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto flex max-w-6xl flex-col items-center text-center"
      >
        {/* Eyebrow */}
        <div className="mb-8">
          <SectionEyebrow kicker="06" label="Open Access / Competitive Programming for All" />
        </div>

        {/* Mega headline */}
        <h2
          id="final-cta-heading"
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          className="max-w-[16ch] text-[46px] font-bold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-6xl md:text-7xl lg:max-w-[18ch] lg:text-[96px]"
        >
          <span className="block">Your coding</span>
          <span className="block">
            <span className="relative inline-block px-3 py-1">
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/25"
              />
              journey
            </span>{" "}
            levels up
          </span>
          <span className="block">
            <span
              className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent"
              style={{ backgroundSize: "200% auto", animation: "apex-shimmer 6s linear infinite" }}
            >
              tonight.
            </span>
          </span>
        </h2>

        {/* Subhead */}
        <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          <span className="block font-semibold text-foreground">
            10,000+ coders. 200+ clans. Zero excuses.
          </span>
          Sign up in 30 seconds and start tracking your coding progress with the community.
        </p>

        {/* Avatar strip */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {["PS", "RV", "AP", "MK", "JS"].map((a, i) => (
              <div
                key={a}
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-background bg-primary/15 text-[10px] font-bold text-primary"
                style={{ zIndex: 5 - i }}
              >
                {a}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">10,000+ learners</span> shipping this week
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            to="/learn"
            onClick={() => markFinalCtaSource("start_free")}
            data-analytics="final-cta-start-free"
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-lg bg-primary px-8 text-sm font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary)/0.7)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_60px_-6px_hsl(var(--primary)/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
            />
            <span className="relative z-10 inline-flex items-center">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
          <Link
            to="/league/ranks"
            onClick={() => markFinalCtaSource("explore_ranks")}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-transparent px-8 text-sm font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Explore Ranks
          </Link>

        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          No credit card · Free forever · Made for the global coding community
        </p>
      </motion.div>
    </section>
  );
}

export default ApexFinalCTA;
