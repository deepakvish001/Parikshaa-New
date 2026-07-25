import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Subtle accent border on hover. */
  interactive?: boolean;
  /** Remove default padding. */
  flush?: boolean;
}

/**
 * Flat sales-ops style card. Clean `bg-card border-border rounded-xl`
 * surface with a soft accent border on hover — replaces the old
 * glassmorphism look.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, interactive, flush, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "admin-glass-card group relative overflow-hidden rounded-xl border border-border bg-card transition-colors duration-300",
        !flush && "p-5",
        interactive && "hover:border-accent/50",
        className,
      )}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";
