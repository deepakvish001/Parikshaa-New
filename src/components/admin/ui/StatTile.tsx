import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  hint?: ReactNode;
  tone?: "default" | "primary" | "success" | "danger";
  /** 0–100. Renders as amber progress rail at the bottom of the tile. */
  progress?: number;
  className?: string;
}

const hintTone: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-emerald-500",
  danger: "text-destructive",
};

/**
 * Tactical KPI tile — subtle card, uppercase micro-label, mono numeric
 * value, optional amber progress rail at the base. Matches the
 * "Modern tactical dark" admin direction.
 */
export const StatTile = ({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  progress,
  className,
}: StatTileProps) => (
  <div
    className={cn(
      "group relative overflow-hidden rounded-xl border border-border/70 bg-card/40 p-5 transition-colors duration-300 hover:border-primary/40",
      className,
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      {Icon && (
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary" />
      )}
    </div>
    <div className="mt-3 flex items-baseline gap-2">
      <span className="font-mono text-2xl font-bold tracking-tight text-foreground lg:text-[26px]">
        {value}
      </span>
      {hint && (
        <span className={cn("text-xs font-medium", hintTone[tone])}>{hint}</span>
      )}
    </div>
    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          tone === "danger"
            ? "bg-destructive/70"
            : tone === "success"
            ? "bg-emerald-500"
            : "bg-primary",
        )}
        style={{
          width: `${Math.max(4, Math.min(100, progress ?? (tone === "primary" ? 65 : 42)))}%`,
        }}
      />
    </div>
  </div>
);
