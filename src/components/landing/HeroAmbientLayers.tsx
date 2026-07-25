/**
 * HeroAmbientLayers
 * The visual chrome shared by the home hero and any surface that wants
 * an identical look: two primary orbs + radial-masked grid. Renders as
 * `aria-hidden` absolutely-positioned layers, so drop it inside any
 * `relative isolate overflow-hidden` container.
 *
 * Variants:
 *  - "hero"  : full-page proportions (matches ApexHero backdrop)
 *  - "rail"  : compact proportions tuned for the 340px right rail
 */
import { cn } from "@/lib/utils";

type Variant = "hero" | "rail";

interface HeroAmbientLayersProps {
  variant?: Variant;
  className?: string;
}

export function HeroAmbientLayers({
  variant = "hero",
  className,
}: HeroAmbientLayersProps) {
  const isRail = variant === "rail";
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden
    >
      {isRail ? (
        <>
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-56 w-56 -translate-x-1/3 translate-y-1/3 rounded-full bg-primary/[0.08] blur-[110px]" />
        </>
      ) : (
        <>
          <div className="absolute -top-40 left-1/3 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
          <div className="absolute right-0 top-[40%] h-[440px] w-[440px] translate-x-1/4 rounded-full bg-primary/[0.08] blur-[130px]" />
        </>
      )}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--border) / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.4) 1px, transparent 1px)",
          backgroundSize: isRail ? "40px 40px" : "56px 56px",
          maskImage: isRail
            ? "radial-gradient(ellipse at top, hsl(var(--background)) 30%, transparent 75%)"
            : "radial-gradient(ellipse at center, hsl(var(--background)) 40%, transparent 75%)",
        }}
      />
    </div>
  );
}

export default HeroAmbientLayers;
