import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Branded card surface matching the /learn + profile aesthetic.
 * Use instead of shadcn `Card` when you want the amber/orange glass surface.
 */
export const SurfaceCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "amber" | "muted";
  padded?: boolean;
}>(({ className, tone = "default", padded = true, ...props }, ref) => {
  const toneCls =
    tone === "amber"
      ? "border-amber-400/25 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.04]"
      : tone === "muted"
      ? "border-border/40 bg-card/40"
      : "border-border/60 bg-card/60";

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border backdrop-blur-sm transition-colors",
        toneCls,
        padded && "p-4 sm:p-5",
        className,
      )}
      {...props}
    />
  );
});
SurfaceCard.displayName = "SurfaceCard";

export default SurfaceCard;
