import { Layers, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export type RevisionView = "topics" | "weeks";

interface RevisionViewToggleProps {
  value: RevisionView;
  onChange: (next: RevisionView) => void;
  className?: string;
}

const OPTIONS: { value: RevisionView; label: string; icon: typeof Layers }[] = [
  { value: "topics", label: "Topics-wise", icon: Layers },
  { value: "weeks", label: "Week-wise", icon: CalendarDays },
];

export function RevisionViewToggle({ value, onChange, className }: RevisionViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Revision view"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 backdrop-blur-sm p-1",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-[11px] font-medium transition-all focus-parikshaa",
              active
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default RevisionViewToggle;
