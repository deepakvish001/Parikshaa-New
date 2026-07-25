import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Lightbulb, Heart, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Leetcode-Patterns style left rail: About / Tips / Acknowledgements.
 * Sticky vertical tabs on lg+, collapsed accordion on mobile.
 */
type SectionId = "about" | "tips" | "ack";

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: typeof Info;
  body: React.ReactNode;
}[] = [
  {
    id: "about",
    label: "About",
    icon: Info,
    body: (
      <div className="space-y-2.5 text-[13px] leading-relaxed text-muted-foreground">
        <p>
          A hand-curated collection of coding problems grouped by{" "}
          <span className="text-foreground font-semibold">pattern</span> and{" "}
          <span className="text-foreground font-semibold">difficulty</span> to
          help you crack technical interviews.
        </p>
        <p>
          Track your progress, bookmark favorites, run code in-browser across 7
          languages, and spaced-repeat what you learn.
        </p>
      </div>
    ),
  },
  {
    id: "tips",
    label: "Helpful Tips",
    icon: Lightbulb,
    body: (
      <ul className="space-y-2 text-[13px] leading-relaxed text-muted-foreground list-disc pl-4 marker:text-primary/70">
        <li>Start with <b className="text-foreground">Beginner Roadmap</b> if you're new — one pattern at a time.</li>
        <li>Press <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-foreground">/</kbd> to jump to search, <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-foreground">?</kbd> for shortcuts.</li>
        <li>Star problems you struggle with — filter with <b className="text-foreground">Bookmarked</b>.</li>
        <li>After solving, revisit via <b className="text-foreground">Due for review</b> using SRS.</li>
      </ul>
    ),
  },
  {
    id: "ack",
    label: "Acknowledgements",
    icon: Heart,
    body: (
      <div className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
        <p>
          Inspired by the wonderful{" "}
          <a
            href="https://seanprashad.com/leetcode-patterns/"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            Leetcode-Patterns
          </a>{" "}
          by Parikshaa.
        </p>
        <p>
          Built with love by the{" "}
          <span className="text-primary font-semibold">Parikshaa</span> team for
          every student chasing their dream offer.
        </p>
      </div>
    ),
  },
];

export function LeftRail() {
  const [openMobile, setOpenMobile] = useState<SectionId | null>("about");

  return (
    <aside aria-label="About this collection" className="w-full">
      {/* Desktop: 3-up horizontal cards */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))]/40 p-4"
            >
              <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-primary">
                <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                {s.label}
              </div>
              {s.body}
            </motion.div>
          );
        })}
      </div>

      {/* Mobile: stacked accordion */}
      <div className="lg:hidden space-y-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isOpen = openMobile === s.id;
          return (
            <div
              key={s.id}
              className="rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))]/40 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenMobile(isOpen ? null : s.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} />
                  {s.label}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4">{s.body}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default LeftRail;
