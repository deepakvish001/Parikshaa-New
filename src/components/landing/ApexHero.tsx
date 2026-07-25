import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionEyebrow } from "./SectionEyebrow";

const programs = [
  "DSA Sheet · 500+ problems",
  "SQL for Interviews",
  "System Design Roadmap",
  "Company Wise Prep",
  "Mock Interview Studio",
  "Aptitude & Reasoning",
  "Coding Contests · Weekly",
  "Resume + Portfolio Review",
];

export function ApexHero() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Respect prefers-reduced-motion: freeze the marquee at its start position.
    const mql =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (mql?.matches) {
      setOffset(0);
      return;
    }

    const id = setInterval(() => {
      setOffset((o) => {
        const track = marqueeRef.current;
        // One set = 1/3 of total width (we render programs × 3).
        const setWidth = track ? track.scrollWidth / 3 : 0;
        const next = o - 1;
        // Once we've scrolled a full set, snap back by exactly one set —
        // the duplicate immediately behind takes over, so the loop is seamless.
        return setWidth > 0 && -next >= setWidth ? next + setWidth : next;
      });
    }, 30);

    const onChange = () => {
      if (mql?.matches) {
        clearInterval(id);
        setOffset(0);
      }
    };
    mql?.addEventListener?.("change", onChange);
    return () => {
      clearInterval(id);
      mql?.removeEventListener?.("change", onChange);
    };
  }, []);



  return (
    <section id="hero" className="relative isolate overflow-hidden px-4 pb-10 pt-24 sm:px-6 sm:pt-28 md:pt-28 lg:pb-12 lg:pt-24">
      {/* Radial rays backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 0%, hsl(var(--primary)/0.28), transparent 65%)",
        }}
      />
      {/* faint diagonal streaks */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
          maskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
        {/* Eyebrow chip */}
        <div className="mb-4 lg:mb-3">
          <SectionEyebrow kicker="00" label="The Placement Protocol" />
        </div>



        {/* Mega headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          className="max-w-[16ch] text-[46px] font-bold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-6xl md:text-7xl lg:max-w-[18ch] lg:text-[96px] xl:text-[110px]"
        >
          <span className="block">Become the Engineer</span>
          <span className="block">
            <span className="relative inline-block px-3 py-1">
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/25"
              />
              India
            </span>{" "}
            is <span className="text-foreground/60">actually</span>
          </span>
          <span className="block">
            <span
              className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent"
              style={{ backgroundSize: "200% auto", animation: "apex-shimmer 6s linear infinite" }}
            >
              Hiring
            </span>{" "}
            <span className="text-foreground">right now.</span>
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:mt-4 lg:text-base"
        >
          <span className="block font-semibold text-foreground">
            Free forever. Prep that actually converts.
          </span>
          <span className="hidden sm:inline">
            Structured DSA & SQL, spaced-repetition mastery, and a public profile recruiters can
            open in one click.
          </span>
        </motion.p>

        {/* Programs marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-6 w-full lg:mt-5"

        >
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border/70" />
            <SectionEyebrow dot label="Unified Flow // 8 Specialized Tracks" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border/70" />
          </div>
          <div
            className="relative overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            }}
          >
            <div
              ref={marqueeRef}
              className="flex w-max items-center gap-3 will-change-transform"
              style={{ transform: `translateX(${offset}px)` }}
            >
              {[...programs, ...programs, ...programs].map((p, i) => (
                <span
                  key={`${p}-${i}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-foreground/85 backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {p}
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="mt-6 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row lg:mt-5"
        >
          <Button
            asChild
            size="lg"
            className="learn-primary-cta group relative h-12 overflow-hidden rounded-lg bg-primary px-8 text-sm font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary)/0.7)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_60px_-6px_hsl(var(--primary)/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
          >
            <Link to="/learn">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
              />
              <span className="relative z-10 inline-flex items-center">
                Start Learning Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
              </span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-lg border-border bg-transparent px-8 text-sm font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Link to="/library/problems">Explore Problems</Link>
          </Button>
        </motion.div>

        {/* Trust footer bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="mt-6 flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-border/50 pt-4 text-xs text-muted-foreground lg:mt-5"
        >
          <span>
            <span className="font-bold text-foreground">10,000+</span> learners
          </span>
          <span className="h-3 w-px bg-border/70" />
          <span>
            <span className="font-bold text-foreground">500+</span> curated problems
          </span>
          <span className="h-3 w-px bg-border/70" />
          <span>
            <span className="font-bold text-foreground">1.4M</span> submissions run
          </span>
          <span className="h-3 w-px bg-border/70" />
          <span>
            <span className="font-bold text-foreground">200+</span> partner colleges
          </span>
        </motion.div>
      </div>
    </section>
  );
}

export default ApexHero;
