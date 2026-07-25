import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScrollableChipStripProps {
  children: ReactNode;
  /** Optional trailing slot (e.g. legend icon) that stays pinned outside the scroll area */
  trailing?: ReactNode;
  /** Optional leading slot pinned outside the scroll area */
  leading?: ReactNode;
  className?: string;
  /** Pixels to scroll per arrow click. Defaults to 160. */
  scrollStep?: number;
  ariaLabel?: string;
}

/**
 * Horizontal chip strip with arrow-icon scroll affordances that only appear
 * when the content overflows. Used in the planner quick-filter row and any
 * other place where many chips need to fit a narrow rail without wrapping.
 */
export function ScrollableChipStrip({
  children,
  trailing,
  leading,
  className,
  scrollStep = 160,
  ariaLabel,
}: ScrollableChipStripProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * scrollStep, behavior: "smooth" });
  };

  const ArrowBtn = ({ dir, disabled }: { dir: 1 | -1; disabled: boolean }) => (
    <button
      type="button"
      onClick={() => scrollBy(dir)}
      disabled={disabled}
      aria-label={dir === -1 ? "Scroll left" : "Scroll right"}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "shrink-0 inline-flex items-center justify-center h-7 w-6 rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
        disabled
          ? "opacity-0 pointer-events-none border-transparent"
          : "opacity-100 border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/70 active:scale-95",
      )}
    >
      {dir === -1 ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
    </button>
  );

  return (
    <div className={cn("relative flex items-center gap-1.5", className)}>
      {leading}
      <ArrowBtn dir={-1} disabled={!canLeft} />
      <div className="relative flex-1 min-w-0">
        <div
          ref={scrollerRef}
          role="group"
          aria-label={ariaLabel}
          className="flex items-center gap-1.5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x"
        >
          {children}
        </div>
        {/* Edge fades hint that content scrolls */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent transition-opacity",
            canLeft ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent transition-opacity",
            canRight ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
      <ArrowBtn dir={1} disabled={!canRight} />
      {trailing}
    </div>
  );
}

export default ScrollableChipStrip;
