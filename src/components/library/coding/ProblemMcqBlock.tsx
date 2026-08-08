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
    <div className={cn("mt-10 p-6 rounded-[2.5rem] bg-[#0a0a0c]/60 border border-border/20 backdrop-blur-2xl shadow-2xl shadow-black/40 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          <h3 className="text-xl font-black uppercase tracking-tighter text-foreground/90 leading-none">
            Now your turn!
          </h3>
        </div>
        
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-500",
          submitted 
            ? mcq.options[attempt!.selected_index]?.correct
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]"
              : "bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-[0_0_15px_-5px_rgba(244,63,94,0.3)]"
            : "bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse"
        )}>
          {submitted
            ? mcq.options[attempt!.selected_index]?.correct
              ? "Correct Answer"
              : "Incorrect Pick"
            : "Awaiting Input"}
        </div>
      </div>

      {mcq.question && (
        <p className="text-[15px] text-foreground/70 font-sans leading-relaxed selection:bg-primary/20 bg-foreground/5 p-4 rounded-2xl border border-border/10">
          {mcq.question}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                "group relative flex items-center gap-4 px-5 py-4 rounded-[1.5rem] border text-left transition-all duration-500 overflow-hidden",
                !submitted && "bg-[#0a0a0c]/40 border-border/20 hover:bg-foreground/5 hover:border-border/40 hover:scale-[1.02] active:scale-[0.98]",
                isSelected && !submitted && "border-amber-500/40 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]",
                isCorrect && "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
                isWrongPick && "border-rose-500/40 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.1)]",
                submitted && "cursor-default",
              )}
            >
              <div className={cn(
                "h-6 w-6 rounded-[0.75rem] border-2 grid place-items-center shrink-0 transition-all duration-500",
                isSelected ? "border-amber-400 scale-110" : "border-muted-foreground/20 group-hover:border-muted-foreground/40",
                isCorrect && "border-emerald-400 bg-emerald-400/20",
                isWrongPick && "border-rose-400 bg-rose-400/20",
              )}>
                {isSelected && !submitted && (
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                )}
                {isCorrect && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                {isWrongPick && <X className="h-3.5 w-3.5 text-rose-400" />}
              </div>
              <span className={cn(
                "text-[14px] font-black tracking-tight transition-colors duration-300",
                isSelected ? "text-foreground" : "text-foreground/60 group-hover:text-foreground",
                isCorrect && "text-emerald-400",
                isWrongPick && "text-rose-400"
              )}>
                {opt.label}
              </span>
              
              {isSelected && !submitted && (
                <div className="absolute inset-0 bg-amber-500/5 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
