import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { SectionEyebrow } from "./SectionEyebrow";

/**
 * Shared hero-styled section heading used across landing blocks
 * (Signal Feed, Mentor Desk, and future sections). Enforces the same
 * eyebrow, typography scale, muted color hierarchy, and subhead pattern
 * as ApexHero so headings stay visually consistent.
 *
 * Compose the heading body with the exported <Highlight> and <Shimmer>
 * helpers to reuse the hero's box-highlight and gradient shimmer tokens.
 */
export interface HeroStyleHeadingProps {
  eyebrowKicker: string;
  eyebrowLabel: string;
  headingId: string;
  as?: "h2" | "h3";
  /** Composed heading children — wrap each visual line in <span className="block">…</span>. */
  children: ReactNode;
  /** Bold foreground primary subhead line. */
  subheadPrimary: ReactNode;
  /** Optional secondary line, hidden on mobile to keep hero density. */
  subheadSecondary?: ReactNode;
  /** Optional trailing slot (form, ctas, meta strip). */
  footer?: ReactNode;
  /** Override the heading max-width (in chars) so lines break consistently across sections. */
  headingMaxWidthClass?: string;
  /** Override the responsive heading type scale. */
  headingSizeClass?: string;
  /** Override the subhead paragraph max-width. */
  subheadMaxWidthClass?: string;
  /** Override the subhead responsive type scale. */
  subheadSizeClass?: string;
  /** Vertical gap between eyebrow and heading. */
  eyebrowGapClass?: string;
  /** Vertical gap between heading and subhead. */
  subheadGapClass?: string;
}

export function Highlight({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap px-3 py-1">
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/25"
      />
      {children}
    </span>
  );
}

export function Shimmer({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <span
      className="whitespace-nowrap bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent motion-reduce:animate-none"
      style={{
        backgroundSize: "200% auto",
        animation: prefersReducedMotion ? "none" : "apex-shimmer 6s linear infinite",
      }}
    >
      {children}
    </span>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <span className="text-foreground/60">{children}</span>;
}

// Shared defaults keep both sections pixel-aligned across breakpoints.
const DEFAULT_HEADING_MAX_WIDTH = "max-w-[17ch] sm:max-w-[18ch]";
const DEFAULT_HEADING_SIZE =
  "text-[40px] sm:text-6xl md:text-7xl lg:text-[80px]";
const DEFAULT_SUBHEAD_MAX_WIDTH = "max-w-xl";
const DEFAULT_SUBHEAD_SIZE = "text-[15px] sm:text-base md:text-lg";
const DEFAULT_EYEBROW_GAP = "mb-5 sm:mb-6";
const DEFAULT_SUBHEAD_GAP = "mt-5 sm:mt-6";

export function HeroStyleHeading({
  eyebrowKicker,
  eyebrowLabel,
  headingId,
  as = "h2",
  children,
  subheadPrimary,
  subheadSecondary,
  footer,
  headingMaxWidthClass = DEFAULT_HEADING_MAX_WIDTH,
  headingSizeClass = DEFAULT_HEADING_SIZE,
  subheadMaxWidthClass = DEFAULT_SUBHEAD_MAX_WIDTH,
  subheadSizeClass = DEFAULT_SUBHEAD_SIZE,
  eyebrowGapClass = DEFAULT_EYEBROW_GAP,
  subheadGapClass = DEFAULT_SUBHEAD_GAP,
}: HeroStyleHeadingProps) {
  const HeadingTag = motion[as] as typeof motion.h2;

  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className={`flex justify-center ${eyebrowGapClass}`}>
        <SectionEyebrow kicker={eyebrowKicker} label={eyebrowLabel} />
      </div>

      <HeadingTag
        id={headingId}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay: 0.05 }}
        style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", textWrap: "balance" }}
        className={`mx-auto font-bold leading-[0.98] tracking-[-0.035em] text-foreground ${headingMaxWidthClass} ${headingSizeClass}`}
      >
        {children}
      </HeadingTag>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className={`mx-auto leading-relaxed text-muted-foreground ${subheadGapClass} ${subheadMaxWidthClass} ${subheadSizeClass}`}
      >
        <span className="block font-semibold text-foreground">{subheadPrimary}</span>
        {subheadSecondary && (
          <span className="mt-1 hidden sm:inline-block">{subheadSecondary}</span>
        )}
      </motion.p>

      {footer}
    </div>
  );
}

export default HeroStyleHeading;
