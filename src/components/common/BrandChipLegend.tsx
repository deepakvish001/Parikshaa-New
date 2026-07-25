import { Info, CalendarClock, CalendarCheck2, CheckCircle2, AlertCircle, type LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionIcon } from "@/components/common/ActionIcon";
import { cn } from "@/lib/utils";

export type BrandLegendRow = {
  /** Tailwind classes for the swatch: must include border, bg and text classes */
  swatch: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Default chip color legend matching the Parikshaa amber/orange brand palette.
 * Used across the app so the same color combos always mean the same thing.
 *
 * Rule: state colors (emerald=completed, rose=missed) are kept because they
 * convey universal semantic meaning, but ALWAYS pair with an icon (WCAG 1.4.1).
 */
export const BRAND_CHIP_LEGEND: readonly BrandLegendRow[] = [
  {
    swatch: "border-amber-400/50 bg-amber-500/15 text-amber-200",
    label: "Start date / Today / Recurring",
    icon: CalendarClock,
  },
  {
    swatch: "border-orange-400/50 bg-orange-500/15 text-orange-200",
    label: "End date / History count",
    icon: CalendarCheck2,
  },
  {
    swatch: "border-emerald-400/50 bg-emerald-500/15 text-emerald-200",
    label: "Completed",
    icon: CheckCircle2,
  },
  {
    swatch: "border-rose-400/50 bg-rose-500/15 text-rose-200",
    label: "Missed / Overdue",
    icon: AlertCircle,
  },
] as const;

export interface BrandChipLegendProps {
  /** Optional custom rows; falls back to BRAND_CHIP_LEGEND */
  rows?: readonly BrandLegendRow[];
  /** Popover heading */
  title?: string;
  /** Trailing footnote */
  footnote?: string;
  /** Side the popover aligns to */
  align?: "start" | "center" | "end";
  /** Tooltip + aria label for the trigger */
  tooltip?: string;
  /** Class for the trigger ActionIcon */
  triggerClassName?: string;
  /** Size for the trigger ActionIcon */
  size?: 7 | 8 | 9 | 10;
  iconSize?: 3.5 | 4 | 5;
}

/**
 * Reusable Parikshaa-brand chip color legend, surfaced behind an Info ActionIcon.
 * Default rows match the global brand palette — pass `rows` to extend per-page.
 */
export function BrandChipLegend({
  rows = BRAND_CHIP_LEGEND,
  title = "Chip colors",
  footnote = "Colors follow the Parikshaa amber/orange brand. Icons always accompany state.",
  align = "end",
  tooltip = "Color legend",
  triggerClassName,
  size = 7,
  iconSize = 3.5,
}: BrandChipLegendProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <ActionIcon
          icon={Info}
          label="Chip color legend"
          tooltip={tooltip}
          size={size}
          iconSize={iconSize}
          className={cn(
            "border-border/60 bg-background/40 text-muted-foreground hover:text-amber-300 hover:border-amber-400/40 hover:bg-amber-500/10",
            triggerClassName,
          )}
        />
      </PopoverTrigger>
      <PopoverContent align={align} sideOffset={6} className="w-60 p-3 space-y-2 text-[11px]">
        <p className="font-semibold text-foreground antialiased">{title}</p>
        {rows.map((row) => {
          const RowIcon = row.icon;
          return (
            <div key={row.label} className="flex items-center gap-2">
              <span className={cn("inline-flex items-center justify-center h-5 w-5 rounded-full border shrink-0", row.swatch)}>
                <RowIcon className="h-2.5 w-2.5" />
              </span>
              <span className="text-muted-foreground antialiased">{row.label}</span>
            </div>
          );
        })}
        {footnote && (
          <p className="pt-1 text-[10px] text-muted-foreground/70 antialiased border-t border-border/40">
            {footnote}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default BrandChipLegend;
