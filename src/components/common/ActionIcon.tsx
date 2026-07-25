import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";

type Tone = "default" | "amber" | "rose" | "violet" | "sky" | "emerald";

const TONE: Record<Tone, { base: string; active: string }> = {
  default: {
    base: "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-border",
    active: "border-amber-400/60 bg-amber-500/15 text-amber-300",
  },
  amber: {
    base: "border-amber-400/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400/70",
    active: "border-amber-400/70 bg-amber-500/25 text-amber-200",
  },
  rose: {
    base: "border-rose-400/50 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-400/70",
    active: "border-rose-400/70 bg-rose-500/25 text-rose-200",
  },
  violet: {
    base: "border-orange-400/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-400/70",
    active: "border-orange-400/70 bg-orange-500/25 text-orange-200",
  },
  sky: {
    base: "border-amber-400/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400/70",
    active: "border-amber-400/70 bg-amber-500/25 text-amber-200",
  },
  emerald: {
    base: "border-emerald-400/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/70",
    active: "border-emerald-400/70 bg-emerald-500/25 text-emerald-200",
  },
};

export interface ActionIconProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  icon: LucideIcon;
  label: string;            // required for a11y
  tooltip?: string;         // visual hint; falls back to label
  tone?: Tone;
  active?: boolean;
  size?: 7 | 8 | 9 | 10;    // square size in tw units
  iconSize?: 3.5 | 4 | 5;
  strokeWidth?: number;
}

/**
 * Reusable circular icon button with consistent border, hover/active states,
 * tooltip and aria-label. Use everywhere instead of ad-hoc <button><Icon/></button>.
 */
export const ActionIcon = React.forwardRef<HTMLButtonElement, ActionIconProps>(
  (
    {
      icon: Icon,
      label,
      tooltip,
      tone = "default",
      active = false,
      size = 8,
      iconSize = 4,
      strokeWidth,
      className,
      ...rest
    },
    ref,
  ) => {
    const sizeCls =
      size === 7 ? "h-7 w-7" :
      size === 9 ? "h-9 w-9" :
      size === 10 ? "h-10 w-10" : "h-8 w-8";
    const iconCls =
      iconSize === 3.5 ? "h-3.5 w-3.5" :
      iconSize === 5 ? "h-5 w-5" : "h-4 w-4";
    const palette = TONE[tone];
    const button = (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={active || undefined}
        className={cn(
          "rounded-full flex items-center justify-center border transition-all active:scale-95 focus-parikshaa disabled:opacity-50 disabled:pointer-events-none",
          sizeCls,
          active ? palette.active : palette.base,
          className,
        )}
        {...rest}
      >
        <Icon className={iconCls} strokeWidth={strokeWidth} />
      </button>
    );
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="bottom">{tooltip ?? label}</TooltipContent>
      </Tooltip>
    );
  },
);
ActionIcon.displayName = "ActionIcon";

export default ActionIcon;
