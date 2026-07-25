import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  TOPIC_BADGE_BASE_CLASSNAME,
  colorForTopic,
} from "@/config/topicBadgePalette";

interface TopicBadgesWithOverflowProps {
  topics: string[];
  visibleCount?: number;
  badgeClassName?: string;
  overflowBadgeClassName?: string;
  className?: string;
  popoverClassName?: string;
  popoverMaxHeightClassName?: string;
  stopPropagation?: boolean;
}

export const TopicBadgesWithOverflow = ({
  topics,
  visibleCount = 3,
  badgeClassName = TOPIC_BADGE_BASE_CLASSNAME,
  overflowBadgeClassName = cn(
    TOPIC_BADGE_BASE_CLASSNAME,
    "cursor-pointer border-amber-500/40 text-amber-200 hover:bg-amber-500/20 hover:border-amber-400/70",
  ),
  className = "flex flex-wrap gap-1.5",
  popoverClassName = "w-auto max-w-xs p-2",
  popoverMaxHeightClassName = "max-h-48",
  stopPropagation = true,
}: TopicBadgesWithOverflowProps) => {
  if (!topics || topics.length === 0) return null;

  const visible = topics.slice(0, visibleCount);
  const overflow = topics.slice(visibleCount);
  const stop = (e: React.SyntheticEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  return (
    <div className={className}>
      {visible.map((t) => (
        <Badge
          key={t}
          variant="outline"
          className={cn(badgeClassName, colorForTopic(t))}
        >
          {t}
        </Badge>
      ))}
      {overflow.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={stop}
              className="inline-flex"
              aria-label={`Show ${overflow.length} more ${overflow.length === 1 ? "topic" : "topics"} (${topics.length} total)`}
              title={`+${overflow.length} more`}
            >
              <Badge variant="outline" className={overflowBadgeClassName}>
                +{overflow.length}
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className={popoverClassName}
            onClick={stop}
          >
            <div className={cn(popoverMaxHeightClassName, "overflow-y-auto pr-1")}>
              <div className="flex flex-wrap gap-1.5">
                {overflow.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className={cn(badgeClassName, colorForTopic(t))}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
