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
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
    : isAttempted
      ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
      : "text-muted-foreground bg-muted/40 border-border";

  return (
    <div className="p-1 mb-0">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className={cn("gap-1.5 font-bold tracking-tighter uppercase text-[10px] py-0.5 px-2", statusClass)}>
            <StatusIcon className="h-3 w-3" />
            {status}
          </Badge>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tighter">
              <Activity className="h-3 w-3" />
              {attempts} attempts
            </span>
            {solvedAt && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500/70 uppercase tracking-tighter">
                <CalendarCheck className="h-3 w-3" />
                {new Date(solvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        <div className="w-px h-8 bg-border/50" />
        <Button
          variant={isBookmarked ? "default" : "ghost"}
          size="icon"
          onClick={onToggleBookmark}
          className={cn("h-9 w-9 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95", isBookmarked ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20" : "text-muted-foreground/60 hover:text-amber-500 hover:bg-amber-500/10")}
        >
          <Star className={cn("h-4 w-4", isBookmarked && "fill-current")} />
        </Button>
      </div>
    </div>
  );
};
