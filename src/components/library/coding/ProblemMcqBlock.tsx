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
    <div className={cn("mt-6 p-5 rounded-2xl bg-muted/5 border border-border/40 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 bg-amber-500 rounded-full" />
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-foreground/80">
            Check your understanding
          </h3>
        </div>
        
        <div className={cn(
          "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-all",
          submitted 
            ? mcq.options[attempt!.selected_index]?.correct
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
        )}>
          {submitted
            ? mcq.options[attempt!.selected_index]?.correct
              ? "Correct"
              : "Incorrect"
            : "Optional"}
        </div>
      </div>

      {mcq.question && (
        <p className="text-[13px] text-muted-foreground font-sans leading-relaxed px-1">
          {mcq.question}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2">
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
                "group relative flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all duration-200",
                !submitted && "bg-muted/20 border-border/40 hover:bg-muted/40 hover:border-border/60",
                isSelected && !submitted && "border-amber-500/40 bg-amber-500/5",
                isCorrect && "border-emerald-500/40 bg-emerald-500/10",
                isWrongPick && "border-rose-500/40 bg-rose-500/10",
                submitted && "cursor-default",
              )}
            >
              <div className={cn(
                "h-4 w-4 rounded-full border grid place-items-center shrink-0 transition-all",
                isSelected ? "border-amber-500" : "border-muted-foreground/20",
                isCorrect && "border-emerald-500 bg-emerald-500/20",
                isWrongPick && "border-rose-500 bg-rose-500/20",
              )}>
                {isSelected && !submitted && (
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                )}
                {isCorrect && <Check className="h-2.5 w-2.5 text-emerald-500" />}
                {isWrongPick && <X className="h-2.5 w-2.5 text-rose-500" />}
              </div>
              <span className={cn(
                "text-[13px] font-medium transition-colors",
                isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                isCorrect && "text-emerald-500",
                isWrongPick && "text-rose-500"
              )}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
