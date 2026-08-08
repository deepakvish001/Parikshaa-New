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
    <div className="p-1 mb-0 flex items-center gap-4">
      <div className="flex flex-col items-end gap-1.5">
        <Badge 
          variant="outline" 
          className={cn(
            "h-7 gap-2 font-black tracking-widest uppercase text-[10px] px-3 rounded-2xl border transition-all duration-500", 
            statusClass
          )}
        >
          <StatusIcon className={cn("h-3.5 w-3.5", isSolved && "animate-pulse")} />
          {status}
        </Badge>
        <div className="flex items-center gap-3 px-1">
          <span className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
            <Activity className="h-3 w-3 opacity-50" />
            {attempts} Attempts
          </span>
          {solvedAt && (
            <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500/50 uppercase tracking-[0.2em]">
              <CalendarCheck className="h-3 w-3" />
              {new Date(solvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      
      <div className="w-px h-10 bg-border/20 self-center" />
      
      <Button
        variant={isBookmarked ? "default" : "ghost"}
        size="icon"
        onClick={onToggleBookmark}
        className={cn(
          "h-11 w-11 rounded-[1.25rem] transition-all duration-500 hover:scale-110 active:scale-90 shadow-xl", 
          isBookmarked 
            ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/30 border-t border-amber-300/50" 
            : "text-muted-foreground/30 hover:text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/20"
        )}
      >
        <Star className={cn("h-5 w-5 transition-transform duration-500", isBookmarked && "fill-current scale-110")} />
      </Button>
    </div>
  );
};
