import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Map as MapIcon, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Leetcode-Patterns style hero used at the top of /library/problems.
 * Pixel-style wordmark + tagline + three roadmap tabs + progress rail.
 * Keeps everything on our amber + Space Grotesk brand — no new fonts.
 */
export type PatternsRoadmap = "all" | "beginner" | "experienced";

interface PatternsHeroProps {
  total: number;
  solved: number;
  activeRoadmap: PatternsRoadmap;
  onRoadmapChange: (next: PatternsRoadmap) => void;
  totalLoading?: boolean;
}

function Shimmer({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <span className="relative inline-block px-3 py-0.5 align-baseline">
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/25"
      />
      <span
        className="bg-gradient-to-r from-primary via-primary-bright to-primary bg-clip-text text-transparent"
        style={{
          backgroundSize: "200% auto",
          animation: reduced ? "none" : "apex-shimmer 6s linear infinite",
        }}
      >
        {children}
      </span>
    </span>
  );
}

const TABS: { id: PatternsRoadmap; label: string; icon: typeof BookOpen }[] = [
  { id: "all", label: "All Problems", icon: BookOpen },
  { id: "beginner", label: "Beginner Roadmap", icon: MapIcon },
  { id: "experienced", label: "Experienced Roadmap", icon: Trophy },
];

export function PatternsHero({ total, solved, activeRoadmap, onRoadmapChange, totalLoading = false }: PatternsHeroProps) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const TotalNum = () =>
    totalLoading ? (
      <span
        aria-label="Loading total"
        role="status"
        className="inline-block h-[1em] w-10 align-[-0.15em] rounded bg-primary/15 animate-pulse"
      />
    ) : (
      <>{total}</>
    );
  return (
    <section aria-label="Coding problems overview" className="mb-6 space-y-6">
      {/* Wordmark */}
      <div className="flex flex-col gap-2">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", textWrap: "balance" }}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] text-foreground leading-[0.95]"
        >
          Coding <Shimmer>Problems.</Shimmer>
        </motion.h1>
        <p className="text-[13px] sm:text-sm text-muted-foreground">
          by <span className="text-primary font-semibold">Parikshaa</span>
          <span className="mx-1.5 text-muted-foreground/50">·</span>
          <span className="italic">Est. 2026</span>
        </p>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          A collection of <span className="font-bold text-foreground tabular-nums"><TotalNum /></span>{" "}
          problems grouped by pattern to help you crack coding interviews.
        </p>
      </div>

      {/* Roadmap tabs */}
      <div
        role="tablist"
        aria-label="Roadmap"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))]/40 p-1.5"
      >
        {TABS.map((tab) => {
          const active = activeRoadmap === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => onRoadmapChange(tab.id)}
              className={cn(
                "relative inline-flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-bold uppercase tracking-[0.08em] transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
                active
                  ? "bg-gradient-to-r from-primary/25 via-primary/15 to-orange-500/10 text-primary border border-primary/40 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.55)]"
                  : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-white/[0.03]",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Progress rail */}
      <div className="rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))]/40 px-4 sm:px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            className="text-[13px] font-semibold tabular-nums text-foreground"
          >
            <span className="text-primary">{solved}</span>
            <span className="text-muted-foreground">/<TotalNum /></span>{" "}
            <span className="text-muted-foreground">completed</span>{" "}
            <span className="text-muted-foreground/70">({pct}%)</span>
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.05]"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-primary-bright to-primary shadow-[0_0_16px_-2px_hsl(var(--primary)/0.6)]"
            style={{ backgroundSize: "200% auto", animation: "apex-shimmer 6s linear infinite" }}
          />
        </div>
      </div>
    </section>
  );
}

export default PatternsHero;
