/**
 * HeroAmbientBackdrop
 * Shared ambient background used by the home hero (Index) and other
 * "hero-styled" surfaces (e.g. Coding Problems). Renders:
 *  - noise overlay
 *  - two primary orbs (top-left + right)
 *  - subtle radial-masked grid
 * Wrap page content inside <HeroAmbientBackdrop>...</HeroAmbientBackdrop>.
 * The children are rendered inside a `relative z-10` layer so they sit
 * above the ambient layers.
 */
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HeroAmbientLayers } from "@/components/landing/HeroAmbientLayers";


interface HeroAmbientBackdropProps {
  children: ReactNode;
  className?: string;
  /** Extra classes for the inner z-10 content wrapper */
  contentClassName?: string;
}

export function HeroAmbientBackdrop({
  children,
  className,
  contentClassName,
}: HeroAmbientBackdropProps) {
  return (
    <>
      <div className="noise-overlay" aria-hidden />
      <main
        className={cn(
          "relative isolate min-h-screen overflow-x-clip learn-dark-surface bg-background text-foreground font-apex-sans antialiased",
          className
        )}
      >
        <HeroAmbientLayers variant="hero" />
        <div className={cn("relative z-10", contentClassName)}>{children}</div>

      </main>
    </>
  );
}

export default HeroAmbientBackdrop;
