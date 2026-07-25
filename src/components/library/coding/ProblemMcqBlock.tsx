import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { McqData } from "@/hooks/useProblemMcq";
import { useProblemMcqAttempt } from "@/hooks/useProblemMcq";

export interface ProblemMcqBlockProps {
  problemSlug: string;
  mcq: McqData;
  className?: string;
}

/** "Now your turn!" MCQ panel rendered inside the description tab. */
export function ProblemMcqBlock({ problemSlug, mcq, className }: ProblemMcqBlockProps) {
  const { attempt, submit } = useProblemMcqAttempt(problemSlug);
  const [pending, setPending] = useState<number | null>(null);

  const selected = attempt?.selected_index ?? pending;
  const submitted = attempt != null;

  const handlePick = async (idx: number) => {
    if (submitted) return;
    setPending(idx);
    const correct = !!mcq.options[idx]?.correct;
    await submit(idx, correct);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-baseline gap-2">
        <h3 className="text-base font-semibold text-foreground">Now your turn!</h3>
      </div>
      {mcq.question && (
        <p className="text-sm text-muted-foreground whitespace-pre-line">{mcq.question}</p>
      )}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Output:</span>
        <span className="font-medium text-amber-300">
          {submitted
            ? mcq.options[attempt!.selected_index]?.correct
              ? "Correct!"
              : "Try again next time"
            : "Pick your answer"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mcq.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect = submitted && opt.correct;
          const isWrongPick = submitted && isSelected && !opt.correct;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handlePick(idx)}
              disabled={submitted}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all",
                "bg-card/60 border-border/60 hover:bg-card/80 hover:border-border",
                isSelected && !submitted && "border-amber-400/60 bg-amber-500/5",
                isCorrect && "border-emerald-500/60 bg-emerald-500/10",
                isWrongPick && "border-rose-500/60 bg-rose-500/10",
                submitted && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "h-4 w-4 rounded-full border-2 grid place-items-center shrink-0",
                  isSelected ? "border-amber-300" : "border-muted-foreground/40",
                  isCorrect && "border-emerald-400 bg-emerald-400/30",
                  isWrongPick && "border-rose-400 bg-rose-400/30",
                )}
              >
                {isSelected && !submitted && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                )}
                {isCorrect && <Check className="h-2.5 w-2.5 text-emerald-200" />}
                {isWrongPick && <X className="h-2.5 w-2.5 text-rose-200" />}
              </span>
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
