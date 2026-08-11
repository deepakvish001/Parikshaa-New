import { CheckCircle2, CircleDot, Circle, Star, Activity, CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  isSolved: boolean;
  isAttempted: boolean;
  attempts: number;
  solvedAt: string | null;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const ProblemDetailHeader = ({
  isSolved,
  isAttempted,
  attempts,
  solvedAt,
  isBookmarked,
  onToggleBookmark,
}: Props) => {
  const status = isSolved ? "Solved" : isAttempted ? "Attempted" : "Not started";
  const StatusIcon = isSolved ? CheckCircle2 : isAttempted ? CircleDot : Circle;
  const statusClass = isSolved
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]"
    : isAttempted
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]"
      : "text-muted-foreground bg-muted/20 border-border/50";

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all border",
        isSolved 
          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
          : "bg-muted/30 text-muted-foreground/40 border-border/40"
      )}>
        <StatusIcon className={cn("h-3 w-3", isSolved && "animate-pulse")} />
        {status}
      </div>
      
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleBookmark}
          className={cn(
            "h-7 w-7 text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-500/5 transition-colors",
            isBookmarked && "text-amber-500"
          )}
        >
          <Star className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
        </Button>
      </div>
    </div>
  );
};
