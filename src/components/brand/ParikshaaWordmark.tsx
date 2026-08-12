import { CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Canonical font stack for the Parikshaa wordmark. Kept in one place so the
 * navbar, footer, mobile menu, hero, and auth surfaces render the brand text
 * with identical fallbacks and text-rendering hints.
 */
export const PARIKSHAA_FONT_STACK =
  "'Space Grotesk', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const PARIKSHAA_TEXT_RENDERING: CSSProperties = {
  fontFamily: PARIKSHAA_FONT_STACK,
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
  textRendering: "optimizeLegibility",
  fontFeatureSettings: '"ss01", "cv11"',
};

type Size = "sm" | "md" | "lg";

/**
 * Size-locked tracking / text-size classes. Keeps letter-spacing, line-height,
 * and underline offset visually consistent from mobile → desktop.
 */
const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-[17px] tracking-[0.14em] sm:text-[18px] sm:tracking-[0.15em] md:text-[19px] md:tracking-[0.16em]",
  md: "text-[19px] tracking-[0.15em] sm:text-[21px] sm:tracking-[0.16em] md:text-[23px] md:tracking-[0.17em]",
  lg: "text-[24px] tracking-[0.16em] sm:text-[27px] sm:tracking-[0.17em] md:text-[30px] md:tracking-[0.18em]",
};

interface Props {
  size?: Size;
  /** Show the shimmering underline + trailing glow-dot. */
  showAccents?: boolean;
  /** Wrap the wordmark in the brand highlight box (bg-primary/15 + amber ring). Default on. */
  highlight?: boolean;
  className?: string;
}

export function ParikshaaWordmark({
  size = "md",
  showAccents = true,
  highlight = true,
  className,
}: Props) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span
      style={PARIKSHAA_TEXT_RENDERING}
      className={cn(
        "relative inline-flex items-center gap-2",
        highlight && "rounded-md bg-primary/15 px-2.5 py-1 leading-none ring-1 ring-inset ring-primary/25 sm:px-3",
        className,
      )}
    >
      <span className="relative inline-flex flex-col leading-[1]">
        <span className="relative inline-flex items-baseline">
          {/* Soft ambient halo behind the wordmark (dimmer in light mode for contrast) */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-x-3 -inset-y-1 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%)] blur-md motion-reduce:opacity-60 dark:bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.24),transparent_70%)]"
          />
          <span
            className={cn(
              // Light mode: darker orange→primary→amber for AA contrast on bright surfaces.
              // Dark mode: lifted amber→orange→primary for luminosity on deep-black.
              "bg-gradient-to-r from-orange-600 via-primary to-amber-600 bg-clip-text font-black uppercase leading-[1] text-transparent drop-shadow-[0_1px_6px_hsl(var(--primary)/0.2)] motion-reduce:animate-none dark:from-amber-100 dark:via-orange-300 dark:to-primary dark:drop-shadow-[0_1px_10px_hsl(var(--primary)/0.4)]",
              SIZE_CLASSES[size],
            )}
            style={{
              backgroundSize: "220% auto",
              animation: prefersReducedMotion ? "none" : "apex-shimmer 6s linear infinite",
            }}
          >
            LeetLeague
          </span>
          {/* Serif-style accent dot after the wordmark */}
          {showAccents && (
            <span
              aria-hidden
              className="ml-[3px] h-[3px] w-[3px] translate-y-[-1px] rounded-full bg-primary shadow-[0_0_4px_hsl(var(--primary)/0.55)] motion-reduce:shadow-none dark:shadow-[0_0_6px_hsl(var(--primary)/0.9)]"
            />
          )}
        </span>
        {showAccents && (
          <span
            aria-hidden
            className="mt-[6px] h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent motion-reduce:opacity-70 dark:via-primary/70 sm:mt-2"
            style={{
              backgroundSize: "200% auto",
              animation: prefersReducedMotion ? "none" : "apex-shimmer 6s linear infinite",
            }}
          />
        )}
      </span>
      {showAccents && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.55)] motion-reduce:shadow-none dark:shadow-[0_0_10px_hsl(var(--primary)/0.85)] dark:md:shadow-[0_0_14px_hsl(var(--primary)/0.95)]"
          style={{
            animation: prefersReducedMotion ? "none" : "apex-pulse-glow 2.4s ease-in-out infinite",
          }}
        />
      )}

    </span>
  );
}

