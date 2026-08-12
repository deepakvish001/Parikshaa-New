import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Layers,
  Trophy,
  Swords,
  Briefcase,
  GraduationCap,
  CalendarDays,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionEyebrow } from "./SectionEyebrow";


type Tile = {
  id: string;
  title: string;
  tagline: string;
  meta: string;
  href: string;
  icon: React.ElementType;
  tag: string;
};

const tiles: Tile[] = [
  {
    id: "01",
    title: "DSA Studio",
    tagline: "Visualize logic and master data structures with our interactive player.",
    meta: "Visual · Interactive · Patterns",
    href: "/learn/visualize",
    icon: Sparkles,
    tag: "Studio",
  },
  {
    id: "02",
    title: "Interview Library",
    tagline: "Comprehensive prep across companies, roles, and technical domains.",
    meta: "10k+ problems · 50+ roles",
    href: "/library/problems",
    icon: Briefcase,
    tag: "Library",
  },
  {
    id: "03",
    title: "Pattern DSA Sheets",
    tagline: "Curated sheets grouping problems by pattern for structured mastery.",
    meta: "40+ sheets · 3.5k problems",
    href: "/learn",
    icon: Layers,
    tag: "Learn",
  },
  {
    id: "04",
    title: "League Ranks",
    tagline: "Compete on global leaderboards and track your growth live.",
    meta: "Global · Real-time · Stats",
    href: "/league/ranks",
    icon: Trophy,
    tag: "Rank",
  },
  {
    id: "05",
    title: "Coding Clans",
    tagline: "Build coding communities and level up with your peers.",
    meta: "Social · Multi-platform",
    href: "/league/clans",
    icon: GraduationCap,
    tag: "Clan",
  },
  {
    id: "06",
    title: "Job Portals",
    tagline: "Verified internships and fresher openings updated daily.",
    meta: "Freshers · Internships",
    href: "/jobs",
    icon: Briefcase,
    tag: "Jobs",
  },
];

export function AllInOneHub() {
  return (
    <section
      id="all-in-one"
      aria-labelledby="all-in-one-title"
      className="relative isolate overflow-hidden border-t border-border/50 px-4 py-20 sm:px-6 sm:py-24 lg:py-28"
    >
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

      <div className="relative mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <SectionEyebrow kicker="01" label="The Parikshaa Protocol / Interview Mastery at Scale" />
          </div>

          <motion.h2
            id="all-in-one-title"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            className="mx-auto max-w-[18ch] text-[38px] font-bold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-5xl md:text-6xl lg:text-[72px]"
          >
            Everything for your{" "}
            <span className="relative inline-block px-2 py-0.5">
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/25"
              />
              coding
            </span>{" "}
            <span className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent"
              style={{ backgroundSize: "200% auto", animation: "apex-shimmer 6s linear infinite" }}
            >
              journey.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Track, analyze, compete, and level up — without stitching together six
            different platforms. Structured end-to-end.
          </motion.p>
        </div>

        {/* Programs grid — borders form the layout */}
        <div className="mt-16 grid grid-cols-1 border-t border-border/60 sm:grid-cols-2 lg:grid-cols-3 lg:mt-20">
          {tiles.map((t, i) => {
            const Icon = t.icon;
            const isLastRow = i >= tiles.length - (tiles.length % 3 || 3);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
                className={cn(
                  "group relative",
                  "border-b border-border/60",
                  // right borders except last col
                  "sm:[&:nth-child(2n)]:border-r-0 sm:border-r sm:border-r-border/60",
                  "lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0",
                )}
              >
                <Link
                  to={t.href}
                  aria-label={`${t.title} — ${t.tagline}`}
                  className="relative flex h-full min-h-[240px] flex-col justify-between overflow-hidden p-8 transition-colors duration-300 hover:bg-card/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/70 sm:p-10"
                >
                  {/* hover wash */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/[0.14] blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />

                  {/* top row: number + tag */}
                  <div className="relative flex items-start justify-between">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/70">
                      {t.id} / {t.tag}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background/60 transition-all duration-300 group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary">
                      <Icon className="h-4.5 w-4.5 text-foreground/80 transition-colors group-hover:text-primary" strokeWidth={1.75} />
                    </div>
                  </div>

                  {/* body */}
                  <div className="relative mt-10">
                    <h3
                      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                      className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary sm:text-3xl"
                    >
                      {t.title}
                    </h3>
                    <p className="mt-2 max-w-[38ch] text-[14px] leading-relaxed text-muted-foreground">
                      {t.tagline}
                    </p>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground/80">
                        {t.meta}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-primary">
                        Explore
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer CTAs */}
        <div className="mt-14 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            to="/league"
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-lg bg-primary px-8 text-sm font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary)/0.7)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_60px_-6px_hsl(var(--primary)/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
            />
            <span className="relative z-10 inline-flex items-center">
              Open League Overview
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
          <Link
            to="/league/ranks"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-transparent px-8 text-sm font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            View Leaderboards
          </Link>
        </div>
      </div>
    </section>
  );
}

export default AllInOneHub;
