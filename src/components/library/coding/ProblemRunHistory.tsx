// Per-problem run history. Renders a sortable list of recent Run attempts
// with input, status, exec time and memory. Designed to make scanning
// across attempts easy. Each row is collapsible to reveal stdin / stdout /
// stderr / compile output.
import { useMemo, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, CheckCircle2, XCircle, AlertTriangle, Clock, HelpCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodeRunRow } from "@/hooks/useCodeRuns";

type SortMode = "newest" | "oldest" | "fastest";
type Verdict = "accepted" | "wrong" | "error" | "pending" | "unknown";

interface VerdictMeta {
  verdict: Verdict;
  label: string;
  icon: LucideIcon;
  className: string;
  description: string;
  hint: string;
}

// Maps a raw status string from the runner into a normalized verdict bucket
// with its display metadata (label, icon, color, screen-reader description).
function getVerdictMeta(status: string | null): VerdictMeta {
  const s = (status ?? "").toLowerCase().trim();

  // Accepted: solution matched expected output
  if (/(accepted|^ac$|\bac\b|successful|^ok$|passed|correct)/.test(s)) {
    return {
      verdict: "accepted",
      label: "Accepted",
      icon: CheckCircle2,
      className:
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      description: "Accepted — output matched expected results",
      hint: "Your solution passed all test cases. Try to optimize time or memory next.",
    };
  }

  // Wrong Answer: ran successfully but output didn't match
  if (/(wrong|^wa$|mismatch|incorrect|failed test)/.test(s)) {
    return {
      verdict: "wrong",
      label: "Wrong Answer",
      icon: XCircle,
      className:
        "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      description: "Wrong answer — output did not match expected",
      hint: "Compare your output with the expected output in the diff view. Check edge cases (empty input, duplicates, ordering, off-by-one).",
    };
  }

  // Pending / running
  if (/(pending|queued|running|in[_\s-]?progress)/.test(s)) {
    return {
      verdict: "pending",
      label: "Pending",
      icon: Clock,
      className:
        "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      description: "Run is still in progress",
      hint: "The runner is still processing this attempt. Refresh in a moment to see the verdict.",
    };
  }

  // Error: compile, runtime, timeout, MLE, generic failure
  if (
    /(error|compil|runtime|timeout|^tle$|\btle\b|^mle$|\bmle$|exceeded|abort|crash|failed)/.test(s)
  ) {
    const isTimeout = /timeout|tle/.test(s);
    const isCompile = /compil/.test(s);
    const isRuntime = /runtime/.test(s);
    const isMemory = /mle|memory/.test(s);
    return {
      verdict: "error",
      label: isTimeout
        ? "Time Limit Exceeded"
        : isCompile
          ? "Compile Error"
          : isRuntime
            ? "Runtime Error"
            : isMemory
              ? "Memory Limit Exceeded"
              : "Error",
      icon: AlertTriangle,
      className: "border-destructive/40 bg-destructive/10 text-destructive",
      description: "Execution error",
      hint: isTimeout
        ? "Your code took too long. Look for nested loops, unnecessary recomputation, or a more efficient algorithm."
        : isCompile
          ? "The code didn't compile. Check syntax errors, missing semicolons, imports, or type mismatches in the compile output."
          : isRuntime
            ? "Crashed during execution. Common causes: null/undefined access, division by zero, index out of bounds, stack overflow."
            : isMemory
              ? "Used too much memory. Avoid storing redundant data, free large structures, or use streaming over buffering."
              : "Execution failed. Inspect stderr and compile output for details.",
    };
  }

  return {
    verdict: "unknown",
    label: status ?? "Unknown",
    icon: HelpCircle,
    className: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
    description: "Unknown verdict",
    hint: "We couldn't classify this verdict. Open the run details to inspect the raw output.",
  };
}

interface ProblemRunHistoryProps {
  runs: CodeRunRow[];
}

export const ProblemRunHistory = ({ runs }: ProblemRunHistoryProps) => {
  const [sort, setSort] = useState<SortMode>("newest");

  // Aggregate counts and find the latest verdict (by created_at, regardless of sort)
  const summary = useMemo(() => {
    const counts: Record<Verdict, number> = {
      accepted: 0,
      wrong: 0,
      error: 0,
      pending: 0,
      unknown: 0,
    };
    let latest: { run: CodeRunRow; meta: VerdictMeta } | null = null;
    for (const r of runs) {
      const meta = getVerdictMeta(r.status);
      counts[meta.verdict] += 1;
      if (
        !latest ||
        new Date(r.created_at).getTime() > new Date(latest.run.created_at).getTime()
      ) {
        latest = { run: r, meta };
      }
    }
    return { counts, latest };
  }, [runs]);

  const sorted = useMemo(() => {
    const list = [...runs];
    switch (sort) {
      case "oldest":
        return list.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      case "fastest":
        return list.sort(
          (a, b) =>
            (a.time_ms ?? Number.POSITIVE_INFINITY) -
            (b.time_ms ?? Number.POSITIVE_INFINITY),
        );
      case "newest":
      default:
        return list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }
  }, [runs, sort]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        {runs.length > 0 && (
          <Card
            className="p-6 bg-[#0a0a0c]/60 border-border/20 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-black/20"
            aria-label="Run history summary"
          >
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div
                className="flex items-center gap-3 flex-wrap"
                role="group"
                aria-label="Verdict counts"
              >
                <SummaryChip
                  meta={getVerdictMeta("accepted")}
                  count={summary.counts.accepted}
                />
                <SummaryChip
                  meta={getVerdictMeta("wrong")}
                  count={summary.counts.wrong}
                />
                <SummaryChip
                  meta={getVerdictMeta("error")}
                  count={summary.counts.error}
                />
                {summary.counts.pending > 0 && (
                  <SummaryChip
                    meta={getVerdictMeta("pending")}
                    count={summary.counts.pending}
                  />
                )}
              </div>
              {summary.latest && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap justify-end">
                  <span>Latest:</span>
                  <span
                    className="font-mono text-[11px]"
                    aria-label={`Attempt number ${runs.length}`}
                  >
                    #{runs.length}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] gap-1 inline-flex items-center cursor-help",
                          summary.latest.meta.className,
                        )}
                        aria-label={`Latest verdict: ${summary.latest.meta.label}`}
                      >
                        {(() => {
                          const Icon = summary.latest.meta.icon;
                          return <Icon className="h-3 w-3" aria-hidden="true" />;
                        })()}
                        <span>{summary.latest.meta.label}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <VerdictTooltipBody
                        meta={summary.latest.meta}
                        rawStatus={summary.latest.run.status}
                        attemptNumber={runs.length}
                        timestamp={summary.latest.run.created_at}
                      />
                    </TooltipContent>
                  </Tooltip>
                  <time
                    dateTime={new Date(summary.latest.run.created_at).toISOString()}
                    className="tabular-nums"
                    title={new Date(summary.latest.run.created_at).toLocaleString()}
                  >
                    <span className="hidden sm:inline">
                      {new Date(summary.latest.run.created_at).toLocaleString()}
                    </span>
                    <span className="sm:hidden">
                      {new Date(summary.latest.run.created_at).toLocaleDateString()}
                    </span>
                  </time>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Showing {runs.length} recent run{runs.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <label
              htmlFor="run-history-sort"
              className="text-xs text-muted-foreground"
            >
              Sort
            </label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
              <SelectTrigger
                id="run-history-sort"
                className="h-7 w-[140px] text-xs"
                aria-label="Sort run history"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="fastest">Fastest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      <ol className="space-y-2 list-none p-0 m-0" aria-label="Run history">
        {sorted.map((r, idx) => {
          const meta = getVerdictMeta(r.status);
          const VerdictIcon = meta.icon;
          const panelId = `run-${r.id}-panel`;
          return (
            <li key={r.id}>
              <Collapsible>
                <Card className="p-4 bg-[#0a0a0c]/40 border-border/10 hover:border-border/40 hover:bg-[#0a0a0c]/60 transition-all duration-500 rounded-[1.5rem] shadow-lg group/row">
                  <CollapsibleTrigger
                    className="w-full text-left group"
                    aria-controls={panelId}
                    aria-label={`Run #${runs.length - idx} from ${new Date(r.created_at).toLocaleString()} — ${meta.description}${r.status && r.status.toLowerCase() !== meta.label.toLowerCase() ? ` (${r.status})` : ""}`}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-foreground/5 flex items-center justify-center text-[10px] font-black font-mono text-muted-foreground/60 border border-border/10 group-hover:border-border/40 transition-all">
                          #{runs.length - idx}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-7 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 cursor-help transition-all duration-500",
                                meta.className,
                              )}
                              data-verdict={meta.verdict}
                            >
                              <VerdictIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{meta.label}</span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs rounded-xl border-border/40">
                            <VerdictTooltipBody meta={meta} rawStatus={r.status} />
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 truncate">
                          {r.language}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 tabular-nums">
                        {r.time_ms !== null && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-foreground/5 border border-border/5 group-hover:border-border/20 transition-all">
                            <Clock className="h-3 w-3 opacity-50" />
                            <span>{r.time_ms} ms</span>
                          </div>
                        )}
                        {r.memory_kb !== null && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-foreground/5 border border-border/5 group-hover:border-border/20 transition-all">
                            <Cpu className="h-3 w-3 opacity-50" />
                            <span>{(r.memory_kb / 1024).toFixed(1)} MB</span>
                          </div>
                        )}
                        <span className="hidden sm:inline opacity-30 group-hover:opacity-60 transition-opacity">
                          {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <ChevronDown
                          className="h-4 w-4 text-muted-foreground/20 transition-all duration-500 group-data-[state=open]:rotate-180 group-data-[state=open]:text-foreground"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    id={panelId}
                    className="mt-6 space-y-6 text-xs animate-in fade-in slide-in-from-top-2 duration-500"
                  >
                    <div className="grid gap-6">
                      {r.stdin && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">Input Stream (Stdin)</p>
                          <pre className="bg-black/60 p-4 rounded-[1.25rem] border border-border/20 overflow-x-auto whitespace-pre-wrap font-mono text-[12px] text-foreground/80 selection:bg-primary/20">
                            {r.stdin}
                          </pre>
                        </div>
                      )}
                      {r.stdout && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/40 px-1">Standard Output (Stdout)</p>
                          <pre className="bg-emerald-500/5 p-4 rounded-[1.25rem] border border-emerald-500/20 overflow-x-auto whitespace-pre-wrap font-mono text-[12px] text-emerald-400/80 selection:bg-emerald-500/20">
                            {r.stdout}
                          </pre>
                        </div>
                      )}
                      {r.stderr && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/40 px-1">Error Stream (Stderr)</p>
                          <pre className="bg-rose-500/5 p-4 rounded-[1.25rem] border border-rose-500/20 overflow-x-auto whitespace-pre-wrap font-mono text-[12px] text-rose-400/80 selection:bg-rose-500/20">
                            {r.stderr}
                          </pre>
                        </div>
                      )}
                      {r.compile_output && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/40 px-1">Compilation Log</p>
                          <pre className="bg-amber-500/5 p-4 rounded-[1.25rem] border border-amber-500/20 overflow-x-auto whitespace-pre-wrap font-mono text-[12px] text-amber-400/80 selection:bg-amber-500/20">
                            {r.compile_output}
                          </pre>
                        </div>
                      )}
                    </div>
                    {!r.stdin && !r.stdout && !r.stderr && !r.compile_output && (
                      <div className="flex items-center justify-center py-6 text-muted-foreground/30 text-[10px] font-black uppercase tracking-[0.2em]">
                        No Artifacts Captured
                      </div>
                    )}
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </li>
          );
        })}
        </ol>
      </div>
    </TooltipProvider>
  );
};

// Compact summary chip used in the aggregate row above run history.
function SummaryChip({ meta, count }: { meta: VerdictMeta; count: number }) {
  const Icon = meta.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "h-8 px-4 rounded-[1.25rem] gap-2 border-2 transition-all duration-500 shadow-xl",
            meta.className,
            count === 0 && "opacity-30",
          )}
          aria-label={`${count} ${meta.label}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="font-black text-[11px] tabular-nums">{count}</span>
          <span className="font-black text-[10px] uppercase tracking-widest">{meta.label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <VerdictTooltipBody meta={meta} />
      </TooltipContent>
    </Tooltip>
  );
}

// Tooltip body explaining a verdict and offering troubleshooting hints.
function VerdictTooltipBody({
  meta,
  rawStatus,
  attemptNumber,
  timestamp,
}: {
  meta: VerdictMeta;
  rawStatus?: string | null;
  attemptNumber?: number;
  timestamp?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-xs">{meta.label}</p>
        {attemptNumber !== undefined && (
          <span className="text-[10px] font-mono text-muted-foreground">
            Attempt #{attemptNumber}
          </span>
        )}
      </div>
      {timestamp && (
        <p className="text-[10px] text-muted-foreground/80 tabular-nums">
          {new Date(timestamp).toLocaleString()}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground leading-snug">
        {meta.description}
      </p>
      <div className="pt-1 border-t border-border/50">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80 mb-0.5">
          Troubleshooting
        </p>
        <p className="text-[11px] leading-snug">{meta.hint}</p>
      </div>
      {rawStatus &&
        rawStatus.toLowerCase() !== meta.label.toLowerCase() && (
          <p className="text-[10px] text-muted-foreground/70 pt-1 border-t border-border/50">
            Raw status: <span className="font-mono">{rawStatus}</span>
          </p>
        )}
    </div>
  );
}
