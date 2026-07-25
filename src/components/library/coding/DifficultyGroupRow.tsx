import { ChevronDown } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/data/codingProblemsData";

interface Props {
  difficulty: Difficulty;
  total: number;
  solved: number;
  isOpen: boolean;
  onToggle: () => void;
  colSpan: number;
}

const styles: Record<Difficulty, { text: string; bar: string; dot: string; bg: string }> = {
  Easy: {
    text: "text-emerald-400",
    bar: "before:bg-emerald-500",
    dot: "bg-emerald-500",
    bg: "from-emerald-500/[0.08] to-transparent",
  },
  Medium: {
    text: "text-amber-400",
    bar: "before:bg-amber-500",
    dot: "bg-amber-500",
    bg: "from-amber-500/[0.08] to-transparent",
  },
  Hard: {
    text: "text-rose-400",
    bar: "before:bg-rose-500",
    dot: "bg-rose-500",
    bg: "from-rose-500/[0.08] to-transparent",
  },
};

export function DifficultyGroupRow({
  difficulty,
  total,
  solved,
  isOpen,
  onToggle,
  colSpan,
}: Props) {
  const s = styles[difficulty];
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  return (
    <TableRow
      className={cn(
        "border-y border-zinc-800/80 hover:bg-transparent",
        "relative",
      )}
    >
      <TableCell colSpan={colSpan} className="p-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className={cn(
            "group relative w-full flex items-center gap-3 px-4 py-2.5 text-left",
            "bg-gradient-to-r",
            s.bg,
            "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px]",
            s.bar,
          )}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              !isOpen && "-rotate-90",
            )}
          />
          <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.12em]",
              s.text,
            )}
          >
            {difficulty}
          </span>
          <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
            {solved}/{total}
            <span className="ml-1 text-muted-foreground/60">({pct}%)</span>
          </span>
          <div className="ml-auto hidden sm:flex items-center gap-2 min-w-[120px]">
            <div className="h-1 flex-1 rounded-full bg-white/[0.05] overflow-hidden">
              <div
                className={cn("h-full rounded-full", s.dot)}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
          </div>
        </button>
      </TableCell>
    </TableRow>
  );
}

export default DifficultyGroupRow;
