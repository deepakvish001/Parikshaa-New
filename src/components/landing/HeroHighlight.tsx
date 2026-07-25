import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * HeroHighlight
 * Reusable inline emphasis used in landing / Jobs hero headlines.
 * Matches the "India" treatment on the home ApexHero: soft primary tint
 * with an inset ring.
 *
 * Uses `text-foreground` on top of `bg-primary/15` — the deep-black theme
 * keeps this ≥ 7:1 contrast (AAA). The token pair inherits from the
 * design system so light / dark theme swaps stay compliant.
 *
 * Wrapping: the outer span is `inline` (not inline-block) so the browser
 * can break between words on narrow screens; the visual pill is drawn
 * with `box-decoration-clone` so the tint + ring wrap onto each line.
 */
export function HeroHighlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        // inline so it wraps with the surrounding text
        "relative inline rounded-lg bg-primary/15 px-2 py-0.5 text-foreground ring-1 ring-inset ring-primary/25",
        // ensure the background/ring repeats on every wrapped line
        "[box-decoration-break:clone] [-webkit-box-decoration-break:clone]",
        // let long emphasized words break instead of overflowing
        "break-words",
        className,
      )}
    >
      {children}
    </span>
  );
}

export default HeroHighlight;
