import {
  ThumbsUp,
  ThumbsDown,
  Flag,
  MessageSquare,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { findCurriculumLocation } from "@/data/codingCurriculum";

export interface ProblemFooterBarProps {
  slug: string;
  likeCount?: number;
  solved?: boolean;
  onLike?: () => void;
  onDislike?: () => void;
  onReport?: () => void;
  onDiscuss?: () => void;
  className?: string;
}

/** Slim glass footer pinned under the description column. */
export function ProblemFooterBar({
  slug,
  likeCount = 0,
  solved,
  onLike,
  onDislike,
  onReport,
  onDiscuss,
  className,
}: ProblemFooterBarProps) {
  const navigate = useNavigate();
  const loc = findCurriculumLocation(slug);
  const prev = loc && loc.index > 0 ? loc.folder.problems[loc.index - 1] : null;
  const next =
    loc && loc.index < loc.folder.problems.length - 1
      ? loc.folder.problems[loc.index + 1]
      : null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-1.5 border-t border-border/40 bg-muted/5 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-muted-foreground/60 hover:text-foreground" onClick={onLike}>
          <ThumbsUp className="h-3 w-3" />
          <span className="text-[11px] tabular-nums">{likeCount}</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-foreground" onClick={onDislike}>
          <ThumbsDown className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-foreground" onClick={onReport}>
          <Flag className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-foreground" onClick={onDiscuss}>
          <MessageSquare className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex items-center gap-0.5">
        <CheckCircle2
          className={cn(
            "h-3.5 w-3.5 mr-1.5",
            solved ? "text-emerald-500" : "text-muted-foreground/20",
          )}
          aria-label={solved ? "Solved" : "Not solved"}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground/60 hover:text-foreground"
          disabled={!prev}
          onClick={() => prev && navigate(`/library/problems/${prev.slug}`)}
          aria-label="Previous problem"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground/60 hover:text-foreground"
          disabled={!next}
          onClick={() => next && navigate(`/library/problems/${next.slug}`)}
          aria-label="Next problem"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
