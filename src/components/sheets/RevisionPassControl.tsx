import { useMemo } from "react";
import { RotateCcw, History, Trash2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ActionIcon } from "@/components/common/ActionIcon";
import { cn } from "@/lib/utils";

export interface RevisionPassControlProps {
  topicId: string;
  count: number;
  history: string[]; // ISO strings, oldest -> newest
  lastRevisedAt: string | null;
  target?: number;
  onMark: (topicId: string) => void;
  onUndo: (topicId: string) => void;
  onReset: (topicId: string) => void;
  size?: "sm" | "md";
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function RevisionPassControl({
  topicId,
  count,
  history,
  lastRevisedAt,
  target = 3,
  onMark,
  onUndo,
  onReset,
  size = "md",
}: RevisionPassControlProps) {
  const mastered = count >= target;
  const tone = mastered
    ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
    : count > 0
    ? "border-orange-400/50 bg-orange-500/15 text-orange-200"
    : "border-amber-400/40 bg-amber-500/10 text-amber-300";

  const newestFirst = useMemo(() => [...history].slice(-10).reverse(), [history]);
  const lastLabel = lastRevisedAt ? formatDate(lastRevisedAt) : null;

  const badgePadding = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";

  return (
    <div className="inline-flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Revision passes: ${count}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border font-medium tabular-nums transition-all hover:brightness-110 focus-parikshaa",
              tone,
              badgePadding,
            )}
          >
            <RotateCcw className="h-2.5 w-2.5" />
            <span>{count}</span>
            {mastered && <span className="hidden sm:inline">·★</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={6} className="w-64 p-3 space-y-2 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground antialiased flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-amber-300" />
              Revision history
            </p>
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5", tone)}>
              {count}/{target}
            </span>
          </div>

          {newestFirst.length === 0 ? (
            <p className="text-muted-foreground antialiased">
              No revision passes yet. Hit "Mark revised" after each review to track passes.
            </p>
          ) : (
            <ul className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {newestFirst.map((iso, i) => {
                const passNum = count - i;
                return (
                  <li
                    key={`${iso}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/30 px-2 py-1"
                  >
                    <span className="text-foreground antialiased">
                      Pass {passNum} · <span className="text-muted-foreground">{formatDate(iso)}</span>
                    </span>
                    {i === 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Undo last pass"
                            onClick={() => onUndo(topicId)}
                            className="rounded-full p-0.5 text-muted-foreground hover:text-rose-300 hover:bg-rose-500/10 focus-parikshaa"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Undo last pass</TooltipContent>
                      </Tooltip>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {history.length > 0 && (
            <div className="pt-1 border-t border-border/40 flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground antialiased">
                {lastLabel ? `Last: ${lastLabel}` : ""}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onReset(topicId)}
                className="h-6 px-2 text-[10px] gap-1 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
              >
                <Trash2 className="h-3 w-3" />
                Reset
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <ActionIcon
        icon={RotateCcw}
        label="Mark revised"
        tooltip={count === 0 ? "Mark revised (start tracking passes)" : `Mark revised · pass ${count + 1}`}
        tone="amber"
        size={7}
        iconSize={3.5}
        onClick={() => onMark(topicId)}
      />
    </div>
  );
}

export default RevisionPassControl;
