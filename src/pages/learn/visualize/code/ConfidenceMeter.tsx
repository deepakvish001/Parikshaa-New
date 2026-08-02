import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ConfidenceResult } from "./confidence";

export function ConfidenceMeter({
  result,
  compact = false,
  className,
}: {
  result: ConfidenceResult;
  compact?: boolean;
  className?: string;
}) {
  const Icon =
    result.level === "high" ? ShieldCheck : result.level === "medium" ? ShieldQuestion : ShieldAlert;

  const bar = (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${result.score}%`, background: result.color }}
      />
    </div>
  );

  if (compact) {
    return (
      <Tooltip delayDuration={120}>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "flex cursor-help items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px]",
              className,
            )}
            style={{ borderLeft: `3px solid ${result.color}` }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: result.color }} />
            <span className="text-muted-foreground">confidence</span>
            <span className="font-mono text-foreground">{result.score}%</span>
            <span className="hidden w-16 sm:block">{bar}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] space-y-1 text-xs">
          <div className="font-medium" style={{ color: result.color }}>
            {result.label}
          </div>
          {result.positives.slice(0, 3).map((p, i) => (
            <div key={`p${i}`} className="text-muted-foreground">✓ {p}</div>
          ))}
          {result.concerns.slice(0, 3).map((c, i) => (
            <div key={`c${i}`} className="text-muted-foreground">! {c}</div>
          ))}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/40 p-3", className)}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: result.color }} />
        <span className="text-xs font-medium" style={{ color: result.color }}>
          {result.label}
        </span>
        <span className="ml-auto font-mono text-sm text-foreground">{result.score}%</span>
      </div>
      <div className="mt-2">{bar}</div>
      <div className="mt-2 space-y-1">
        {result.positives.map((p, i) => (
          <div key={`p${i}`} className="text-[11px] leading-relaxed text-emerald-300/90">✓ {p}</div>
        ))}
        {result.concerns.map((c, i) => (
          <div key={`c${i}`} className="text-[11px] leading-relaxed text-amber-300/90">! {c}</div>
        ))}
      </div>
    </div>
  );
}

export default ConfidenceMeter;
