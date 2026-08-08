import { useEffect, useMemo, useState } from "react";
import { Plus, X, Play, Loader2, FlaskConical, Check, XCircle, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const KEY = "parikshaa:coding-custom-tests:v1";

type CustomTest = { id: string; input: string };
type StoredMap = Record<string, CustomTest[]>;

const readMap = (): StoredMap => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as StoredMap) : {};
  } catch {
    return {};
  }
};

const writeMap = (map: StoredMap) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

interface SampleTest {
  input: string;
  output?: string;
  expected?: string;
}

export interface SampleCaseStatusEntry {
  status: "passed" | "failed";
  input?: string;
  expected?: string;
  got?: string;
}

export interface CustomCaseStatusEntry {
  status: "ok" | "error";
  input?: string;
  got?: string;
  stderr?: string;
}

interface Props {
  slug: string;
  sampleTests: SampleTest[];
  stdin: string;
  onStdinChange: (v: string) => void;
  onRun: () => void;
  isRunning: boolean;
  sampleCaseStatus?: Record<number, SampleCaseStatusEntry>;
  customCaseStatus?: Record<string, CustomCaseStatusEntry>;
  onActiveSampleChange?: (index: number | null) => void;
  onActiveCustomChange?: (id: string | null) => void;
  onResetResults?: () => void;
}

type TabKey = `s-${number}` | `c-${string}`;

export const TestCaseWorkbench = ({
  slug,
  sampleTests,
  stdin,
  onStdinChange,
  onRun,
  isRunning,
  sampleCaseStatus,
  customCaseStatus,
  onActiveSampleChange,
  onActiveCustomChange,
  onResetResults,
}: Props) => {
  const [customs, setCustoms] = useState<CustomTest[]>(() => readMap()[slug] ?? []);
  const [active, setActive] = useState<TabKey>(sampleTests.length > 0 ? "s-0" : "c-new");

  // Reload custom tests + reset active tab when slug changes.
  useEffect(() => {
    const next = readMap()[slug] ?? [];
    setCustoms(next);
    setActive(sampleTests.length > 0 ? "s-0" : next[0] ? `c-${next[0].id}` : "c-new");
  }, [slug, sampleTests.length]);

  // Persist customs.
  useEffect(() => {
    const map = readMap();
    if (customs.length === 0) delete map[slug];
    else map[slug] = customs;
    writeMap(map);
  }, [slug, customs]);

  const activeInput = useMemo(() => {
    if (active.startsWith("s-")) {
      const i = Number(active.slice(2));
      return sampleTests[i]?.input ?? "";
    }
    if (active === "c-new") return "";
    const id = active.slice(2);
    return customs.find((c) => c.id === id)?.input ?? "";
  }, [active, sampleTests, customs]);

  // When the active tab changes, push input upstream + notify which kind is active.
  useEffect(() => {
    onStdinChange(activeInput);
    if (active.startsWith("s-")) {
      onActiveSampleChange?.(Number(active.slice(2)));
      onActiveCustomChange?.(null);
    } else if (active.startsWith("c-") && active !== "c-new") {
      onActiveSampleChange?.(null);
      onActiveCustomChange?.(active.slice(2));
    } else {
      onActiveSampleChange?.(null);
      onActiveCustomChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const updateActiveInput = (v: string) => {
    onStdinChange(v);
    if (active.startsWith("c-") && active !== "c-new") {
      const id = active.slice(2);
      setCustoms((prev) => prev.map((c) => (c.id === id ? { ...c, input: v } : c)));
    } else if (active === "c-new" && v.length > 0) {
      const id = `${Date.now()}`;
      setCustoms((prev) => [...prev, { id, input: v }]);
      setActive(`c-${id}` as TabKey);
    }
  };

  const addCustom = () => {
    const id = `${Date.now()}`;
    setCustoms((prev) => [...prev, { id, input: "" }]);
    setActive(`c-${id}` as TabKey);
    onStdinChange("");
  };

  const removeCustom = (id: string) => {
    setCustoms((prev) => prev.filter((c) => c.id !== id));
    if (active === `c-${id}`) {
      const remaining = customs.filter((c) => c.id !== id);
      const fallback: TabKey =
        sampleTests.length > 0
          ? "s-0"
          : remaining[0]
            ? (`c-${remaining[0].id}` as TabKey)
            : "c-new";
      setActive(fallback);
    }
  };

  // Reusable status chip — green check for passed, red X for failed/error.
  const StatusBadge = ({
    kind,
  }: {
    kind: "passed" | "failed" | "ok" | "error";
  }) => {
    if (kind === "passed" || kind === "ok") {
      return (
        <span
          aria-label={kind === "passed" ? "Passed" : "Ran"}
          className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm bg-emerald-500 text-white"
        >
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      );
    }
    return (
      <span
        aria-label={kind === "failed" ? "Failed" : "Error"}
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white"
      >
        <X className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Tab strip */}
        <div className="flex items-center gap-2 flex-wrap">
          {sampleTests.map((_, i) => {
            const key: TabKey = `s-${i}`;
            const isActive = active === key;
            const entry = sampleCaseStatus?.[i];
            const statusValue = entry?.status;
            const isPassStatus = statusValue === "passed";
            
            const chipButton = (
              <button
                type="button"
                onClick={() => setActive(key)}
                className={cn(
                  "h-9 pl-2.5 pr-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all duration-300 inline-flex items-center gap-2.5",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                    : "bg-muted/30 border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 hover:border-border/80",
                )}
              >
                {statusValue ? (
                  <StatusBadge kind={statusValue} />
                ) : (
                  <div className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-primary-foreground/40" : "bg-muted-foreground/30")} />
                )}
                <span>Case {i + 1}</span>
              </button>
            );
            if (!entry) {
              return <div key={key}>{chipButton}</div>;
            }
            const isPassTip = statusValue === "passed";
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>{chipButton}</TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="max-w-[340px] p-2.5 text-[11px] font-mono whitespace-pre-wrap space-y-1.5"
                >
                  <div className="flex items-center gap-1.5 font-sans">
                    <StatusBadge kind={statusValue!} />
                    <span className={cn("text-xs font-semibold", isPassTip ? "text-emerald-400" : "text-rose-400")}>
                      Case {i + 1} {isPassTip ? "Accepted" : "Wrong Answer"}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-sans">Input</div>
                    <div className="text-foreground">{entry.input || "(empty)"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-sans">Expected</div>
                    <div className="text-emerald-400">{entry.expected || "(empty)"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-sans">Got</div>
                    <div className={isPassTip ? "text-emerald-400" : "text-rose-400"}>
                      {entry.got || "(empty)"}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
          {customs.map((c, i) => {
            const key: TabKey = `c-${c.id}` as TabKey;
            const isActive = active === key;
            const entry = customCaseStatus?.[c.id];
            const statusValue = entry?.status;
            const tabBtn = (
              <button
                type="button"
                onClick={() => setActive(key)}
                className="flex items-center gap-1.5 leading-none"
              >
                {statusValue ? (
                  <StatusBadge kind={statusValue} />
                ) : (
                  <FlaskConical className="h-3 w-3 shrink-0" />
                )}
                <span>Custom {i + 1}</span>
              </button>
            );
            return (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center gap-1.5 h-9 pl-3 pr-1.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                    : "bg-muted/30 border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 hover:border-border/80",
                )}
              >
                {entry ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{tabBtn}</TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      className="max-w-[340px] p-2.5 text-[11px] font-mono whitespace-pre-wrap space-y-1.5"
                    >
                      <div className="flex items-center gap-1.5 font-sans">
                        <StatusBadge kind={statusValue!} />
                        <span className={cn("text-xs font-semibold", statusValue === "ok" ? "text-emerald-400" : "text-rose-400")}>
                          Custom {i + 1} {statusValue === "ok" ? "Ran" : "Runtime Error"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Input</div>
                          <div className="text-foreground bg-foreground/5 p-2 rounded-lg text-[10px] border border-border/20">{entry.input || "(empty)"}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Got</div>
                          <div className="text-foreground bg-foreground/5 p-2 rounded-lg text-[10px] border border-border/20">{entry.got || "(empty)"}</div>
                        </div>
                        {entry.stderr && (
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-rose-500/50 mb-1">Error Log</div>
                            <div className="text-rose-400 bg-rose-500/5 p-2 rounded-lg text-[10px] border border-rose-500/20">{entry.stderr}</div>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  tabBtn
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustom(c.id);
                      }}
                      className="h-4 w-4 inline-flex items-center justify-center rounded hover:bg-muted-foreground/20"
                      aria-label={`Remove custom test ${i + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Remove</TooltipContent>
                </Tooltip>
              </div>
            );
          })}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-4 gap-2 text-[10px] font-black uppercase tracking-widest rounded-2xl border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all duration-300" onClick={addCustom}>
                <Plus className="h-3.5 w-3.5" />
                Custom
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a custom test (saved per problem)</TooltipContent>
          </Tooltip>
          <div className="ml-auto flex items-center gap-2">
            {onResetResults && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={onResetResults}
                title="Clear all case results for this problem"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              className="h-9 gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl px-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-xl shadow-emerald-500/20 border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              onClick={onRun}
              disabled={isRunning}
              title="Run only the active test"
            >
              {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
              Run Test
            </Button>
          </div>
        </div>

        {active.startsWith("c-") && active !== "c-new" && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>
              Custom case (id <span className="font-mono">{active.slice(2)}</span>) — runs separately
              from Case 1 / Case 2; no expected output is compared.
            </span>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-0.5 bg-primary/40 rounded-full" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
              Input Stdin
            </p>
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <Textarea
              value={stdin}
              onChange={(e) => updateActiveInput(e.target.value)}
              className="relative font-mono text-[13px] min-h-[140px] resize-none rounded-2xl border-border/40 bg-[#0a0a0c]/90 backdrop-blur-xl focus:ring-2 focus:ring-primary/20 transition-all selection:bg-primary/30 shadow-inner"
              placeholder="Enter your test input..."
            />
          </div>
        </div>

        {active.startsWith("s-") && (() => {
          const i = Number(active.slice(2));
          const expected = sampleTests[i]?.expected ?? sampleTests[i]?.output;
          if (!expected) return null;
          return (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-0.5 bg-emerald-500/40 rounded-full" />
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                  Expected Output
                </p>
              </div>
              <pre className="font-mono text-[13px] bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 text-emerald-500/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {expected}
              </pre>
            </div>
          );
        })()}
      </div>
    </TooltipProvider>
  );
};
