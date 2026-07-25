import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionEyebrowProps {
  /** Label copy. Use " / " or " // " to split into slash-separated segments. */
  label: string;
  /** Optional numeric/mono kicker like "00", "01". Ignored if `dot` is set. */
  kicker?: string;
  /** Renders a pulsing amber dot in the left cap instead of a kicker. */
  dot?: boolean;
  className?: string;
}

/**
 * Segmented eyebrow used across the landing page.
 * Left cap = mono kicker (or pulsing dot). Right cap = uppercase label with muted slash separators.
 * Amber-on-black, hover lifts 1px, focus-visible outline.
 */
export function SectionEyebrow({ label, kicker, dot, className }: SectionEyebrowProps) {
  // Split on " // " first, then " / " — preserve delimiter so we can style it muted.
  const parts = label.split(/(\s\/\/\s|\s\/\s)/g);

  // Accessible name: readable label for screen readers ("Section 02: Why Parikshaa").
  const readableLabel = label.replace(/\s\/\/?\s/g, " — ");
  const ariaLabel = dot
    ? `Section marker: ${readableLabel}`
    : kicker
      ? `Section ${kicker}: ${readableLabel}`
      : readableLabel;

  return (
    <motion.div
      role="group"
      aria-label={ariaLabel}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1 }}
      className={cn(
        "group inline-flex items-stretch align-middle transition-all duration-300 ease-out active:scale-[0.98]",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
    >
      {/* Left cap: kicker or dot */}
      <div
        className={cn(
          "flex h-7 items-center rounded-l-sm border border-r-0 border-primary/50 bg-primary/15 px-2.5",
          "transition-colors duration-300 group-hover:border-primary/70 group-hover:bg-primary/20",
        )}
      >
        {dot ? (
          <span
            className="relative flex h-1.5 w-1.5 items-center justify-center"
            aria-hidden="true"
          >
            <span className="absolute inset-0 rounded-full bg-primary/60 animate-ping motion-reduce:hidden" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.7)]" />
          </span>
        ) : (
          <span
            aria-hidden="true"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            className="text-[10px] font-bold uppercase leading-none tracking-tighter text-primary"
          >
            {kicker ?? "00"}
          </span>
        )}
      </div>

      {/* Right cap: label — brighter foreground for AA contrast on deep-black bg. */}
      <div
        className={cn(
          "flex h-7 items-center rounded-r-sm border border-primary/40 bg-background/60 px-3 backdrop-blur-sm",
          "transition-colors duration-300 group-hover:border-primary/60 group-hover:bg-background/70",
        )}
      >
        <span
          aria-hidden="true"
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          className="text-[11px] font-semibold uppercase leading-none tracking-[0.15em] text-foreground"
        >
          {parts.map((part, i) => {
            if (part === " / " || part === " // ") {
              return (
                <span key={i} className="px-1.5 text-muted-foreground">
                  {part.trim()}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </span>
      </div>
    </motion.div>
  );
}

export default SectionEyebrow;

