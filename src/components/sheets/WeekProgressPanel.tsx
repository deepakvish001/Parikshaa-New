import { CheckCircle2, Clock, Info, CheckSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionIcon } from "@/components/common/ActionIcon";
import { cn } from "@/lib/utils";

export interface WeekProgressItem {
  weekNum: number;
  done: number;
  total: number;
  topicIds: string[]; // ids of incomplete topics (for quick complete)
}

interface WeekProgressPanelProps {
  weeks: WeekProgressItem[];
  selectedWeek: string;
  onQuickComplete?: (topicIds: string[]) => void;
  className?: string;
}

export function WeekProgressPanel({
  weeks,
  selectedWeek,
  onQuickComplete,
  className,
}: WeekProgressPanelProps) {
  const visible =
    selectedWeek === "all" ? weeks : weeks.filter((w) => String(w.weekNum) === selectedWeek);
  if (visible.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-background/40 backdrop-blur-sm p-3 sm:p-4 space-y-3",
        className,
      )}
    >
      {/* Header + legend */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground antialiased">
            Weekly progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LegendChip
            color="border-amber-400/50 bg-amber-500/15 text-amber-200"
            icon={Clock}
            label="Planned"
            description="Scheduled for this week. Not yet fully completed."
          />
          <LegendChip
            color="border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
            icon={CheckCircle2}
            label="Completed"
            description="All items in this week are marked done."
          />
          <Popover>
            <PopoverTrigger asChild>
              <ActionIcon
                icon={Info}
                label="Status legend"
                tooltip="What do these statuses mean?"
                size={7}
                iconSize={3.5}
                className="border-border/60 bg-background/40 text-muted-foreground hover:text-amber-300 hover:border-amber-400/40 hover:bg-amber-500/10"
              />
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={6} className="w-64 p-3 space-y-2 text-[11px]">
              <p className="font-semibold text-foreground antialiased">Status legend</p>
              <LegendRow
                color="border-amber-400/50 bg-amber-500/15 text-amber-200"
                icon={Clock}
                label="Planned"
                text="Week has items remaining to solve / revise."
              />
              <LegendRow
                color="border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                icon={CheckCircle2}
                label="Completed"
                text="Every item in this week is marked done."
              />
              <p className="pt-1 text-[10px] text-muted-foreground/70 antialiased border-t border-border/40">
                Progress bars show completed ÷ planned for the week.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {visible.map((w) => {
          const pct = w.total === 0 ? 0 : Math.round((w.done / w.total) * 100);
          const completed = w.total > 0 && w.done === w.total;
          const Status = completed ? CheckCircle2 : Clock;
          const statusCls = completed
            ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
            : "border-amber-400/50 bg-amber-500/15 text-amber-200";
          return (
            <div
              key={w.weekNum}
              className="rounded-lg border border-border/50 bg-background/30 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-foreground antialiased truncate">
                    Week {w.weekNum}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                      statusCls,
                    )}
                  >
                    <Status className="h-2.5 w-2.5" />
                    {completed ? "Completed" : "Planned"}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {w.done}/{w.total} · {pct}%
                </span>
              </div>
              <Progress
                value={pct}
                className="h-1.5 bg-muted/40"
                indicatorClassName={cn(
                  "transition-all",
                  completed
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : "bg-gradient-to-r from-amber-500 to-orange-400",
                )}
              />
              {onQuickComplete && w.topicIds.length > 0 && (
                <div className="flex items-center justify-end pt-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] gap-1 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                        onClick={() => onQuickComplete(w.topicIds)}
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        Mark week done
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Mark all {w.topicIds.length} remaining item
                      {w.topicIds.length === 1 ? "" : "s"} as completed
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LegendChip({
  color,
  icon: Icon,
  label,
  description,
}: {
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium cursor-help",
            color,
          )}
        >
          <Icon className="h-2.5 w-2.5" />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{description}</TooltipContent>
    </Tooltip>
  );
}

function LegendRow({
  color,
  icon: Icon,
  label,
  text,
}: {
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={cn(
          "inline-flex items-center justify-center h-5 w-5 rounded-full border shrink-0 mt-0.5",
          color,
        )}
      >
        <Icon className="h-2.5 w-2.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-foreground antialiased leading-tight">
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground antialiased leading-snug">{text}</p>
      </div>
    </div>
  );
}

export default WeekProgressPanel;
