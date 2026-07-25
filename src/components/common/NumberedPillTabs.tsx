import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useId } from "react";

export interface NumberedPillTab {
  id: string;
  label: string;
  kicker: string;
  icon?: LucideIcon;
}

interface NumberedPillTabsProps {
  tabs: NumberedPillTab[];
  value: string;
  onValueChange: (id: string) => void;
  /** Optional extra classes on the outer segmented rail. */
  className?: string;
}

/**
 * Segmented, numbered pill tabs — same visual language as the landing-page
 * ApexNavbar. Animated active indicator uses framer-motion `layoutId`, mono
 * kicker + Space Grotesk label. Wraps to icons only on mobile so the rail
 * never overflows on narrow screens.
 *
 * Reuse this wherever a top-of-page tab strip needs to match the home page.
 */
export function NumberedPillTabs({
  tabs,
  value,
  onValueChange,
  className,
}: NumberedPillTabsProps) {
  const layoutId = useId();

  return (
    <div
      role="tablist"
      aria-label="Section tabs"
      className={cn(
        "relative inline-flex w-full items-center gap-1 rounded-full border border-border/50 bg-background/40 p-1 backdrop-blur-md overflow-x-auto no-scrollbar",
        "sm:w-auto sm:overflow-visible",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = value === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onValueChange(tab.id)}
            className={cn(
              "relative flex-1 sm:flex-none whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors sm:px-3.5 sm:text-[11.5px] xl:px-4 xl:text-[12px] focus-visible:outline-none focus-parikshaa",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`${layoutId}-active`}
                aria-hidden
                className="absolute inset-0 rounded-full border border-primary/50 bg-primary/[0.12] shadow-[inset_0_1px_0_hsl(var(--primary)/0.25),0_0_18px_-6px_hsl(var(--primary)/0.7)]"
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
              />
            )}
            <span
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              className="relative z-10 inline-flex items-center gap-1.5 uppercase tracking-[0.12em]"
            >
              <span
                aria-hidden
                className={cn(
                  "font-mono text-[9.5px] tracking-[0.14em]",
                  active ? "text-primary/80" : "text-muted-foreground/60",
                )}
              >
                {tab.kicker}
              </span>
              {Icon && <Icon className="h-3.5 w-3.5 sm:hidden" aria-hidden />}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default NumberedPillTabs;
