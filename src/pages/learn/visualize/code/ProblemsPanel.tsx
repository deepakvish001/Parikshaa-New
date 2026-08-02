import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CodeProblem {
  id: string;
  kind: "syntax" | "runtime" | "analysis";
  severity: "error" | "warning";
  message: string;
  line?: number;
  column?: number;
  snippet?: string;
  fileName?: string;
}

interface ProblemsPanelProps {
  problems: CodeProblem[];
  collapsed: boolean;
  onToggle: () => void;
  onSelect?: (problem: CodeProblem) => void;
}

const KIND_LABEL: Record<CodeProblem["kind"], string> = {
  syntax: "Syntax",
  runtime: "Runtime",
  analysis: "Analysis",
};

/** VS Code-style Problems panel listing syntax, runtime and analysis errors. */
export const ProblemsPanel = ({ problems, collapsed, onToggle, onSelect }: ProblemsPanelProps) => {
  const errors = problems.filter((p) => p.severity === "error").length;
  const warnings = problems.length - errors;

  return (
    <div className="shrink-0 border-t border-border/50 bg-[#0b0f16]/80">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-white/[0.03]"
      >
        <span className="uppercase tracking-wide">Problems</span>
        {problems.length === 0 ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> No issues
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-destructive">
              <XCircle className="h-3.5 w-3.5" /> {errors}
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> {warnings}
            </span>
          </span>
        )}
        {collapsed ? (
          <ChevronUp className="ml-auto h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="ml-auto h-3.5 w-3.5" />
        )}
      </button>

      {!collapsed && problems.length > 0 && (
        <ul className="max-h-40 overflow-auto border-t border-border/40">
          {problems.map((p) => (
            <li key={p.id}>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-2 rounded-none px-3 py-1.5 text-left"
                onClick={() => onSelect?.(p)}
              >
                {p.severity === "error" ? (
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-foreground">{p.message}</span>
                  {p.snippet && (
                    <code className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                      {p.snippet}
                    </code>
                  )}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded border border-border/60 px-1.5 text-[10px] text-muted-foreground",
                  )}
                >
                  {KIND_LABEL[p.kind]}
                  {p.line ? ` · L${p.line}${p.column ? `:${p.column}` : ""}` : ""}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProblemsPanel;
