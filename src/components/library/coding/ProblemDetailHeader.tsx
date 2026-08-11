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
    <div className="flex items-center gap-3">
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-colors",
        isSolved ? "text-emerald-500" : "text-muted-foreground/40"
      )}>
        {isSolved && <CheckCircle2 className="h-4 w-4" />}
        {status}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleBookmark}
          className={cn(
            "h-8 w-8 text-muted-foreground/60 hover:text-amber-500 hover:bg-transparent",
            isBookmarked && "text-amber-500"
          )}
        >
          <Star className={cn("h-4 w-4", isBookmarked && "fill-current")} />
        </Button>
      </div>
    </div>
  );
};
