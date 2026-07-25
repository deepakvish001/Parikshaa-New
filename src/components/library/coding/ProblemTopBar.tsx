import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Info, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ProblemTopBarProps {
  /** Folder solved/total used for the central progress bar. */
  folderSolved: number;
  folderTotal: number;
  /** User study streak / goal for the trophy chip. */
  streakDay: number;
  streakGoal?: number;
  onAiClick?: () => void;
  className?: string;
}

/**
 * Sticky page header: back, brand mark, central progress bar, day streak chip,
 * info, and AI shortcut. Matches the reference screenshot.
 */
export function ProblemTopBar({
  folderSolved,
  folderTotal,
  streakDay,
  streakGoal = 180,
  onAiClick,
  className,
}: ProblemTopBarProps) {
  const navigate = useNavigate();
  const pct = folderTotal > 0 ? Math.min(100, (folderSolved / folderTotal) * 100) : 0;

  return (
    <TooltipProvider>
      <header
        className={cn(
          "flex items-center gap-3 px-3 sm:px-4 py-2 border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-30",
          className,
        )}
      >
        {/* Left: brand + back */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Link to="/library/problems" className="hidden sm:flex items-center gap-2">
            <div className="h-8 w-8 grid place-items-center rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40">
              <span className="text-sm font-bold bg-gradient-to-br from-primary to-amber-300 bg-clip-text text-transparent">
                P
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted/50 text-muted-foreground"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Search problems</TooltipContent>
            </Tooltip>
          </Link>
        </div>

        {/* Center: progress + day chip */}
        <div className="flex-1 flex items-center gap-3 sm:gap-6 justify-center min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-xl flex-1">
            <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Progress</span>
            <div className="relative flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-amber-300 transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums shrink-0">
              {folderSolved}/{folderTotal}
            </span>
          </div>

        </div>

        {/* Right: info + AI */}
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-amber-300 hover:bg-amber-500/10"
                onClick={onAiClick}
                aria-label="AI assistant"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ask AI</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
