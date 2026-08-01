import { useMemo, useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Loader2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Frame {
  name: string;
  isGlobal?: boolean;
  vars?: { name: string; value: string }[];
  returned?: string | null;
}
interface Step {
  line: number;
  code?: string;
  event?: "call" | "line" | "return" | "output";
  frames?: Frame[];
  callArgs?: string[];
  returnValue?: string | null;
  stdout?: string;
  explanation?: string;
}
interface Trace {
  language?: string;
  truncated?: boolean;
  steps: Step[];
}

const LANGUAGES = ["python", "javascript", "typescript", "java", "c++", "c"];

const SAMPLE = `def factorial(x):
    """This is a recursive function
    to find the factorial of an integer"""

    if x == 1:
        return 1
    else:
        return (x * factorial(x-1))


num = 4
print("The factorial of", num, "is", factorial(num))`;

export default function CodeVisualizer() {
  const [code, setCode] = useState(SAMPLE);
  const [language, setLanguage] = useState("python");
  const [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const lineRef = useRef<HTMLDivElement>(null);

  const steps = trace?.steps ?? [];
  const step = steps[idx];
  const lines = useMemo(() => code.replace(/\t/g, "    ").split("\n"), [code]);

  useEffect(() => {
    if (!playing || steps.length === 0) return;
    if (idx >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIdx((i) => Math.min(i + 1, steps.length - 1)), 1400 / speed);
    return () => clearTimeout(t);
  }, [playing, idx, steps.length, speed]);

  useEffect(() => {
    lineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [idx]);

  const runTrace = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setTrace(null);
    setPlaying(false);
    setIdx(0);
    try {
      const { data, error } = await supabase.functions.invoke("code-trace", {
        body: { code, language },
      });
      if (error) throw error;
      const t = data as Trace;
      if (!t?.steps?.length) throw new Error("No steps returned");
      setTrace(t);
    } catch (e) {
      toast.error("Could not visualize this code", {
        description: (e as Error)?.message ?? "Try a smaller snippet.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 overflow-y-auto bg-transparent text-foreground">
      <Helmet>
        <title>Code Visualizer — Step Through Any Code | Parikshaa</title>
        <meta
          name="description"
          content="Paste any code and watch it execute step by step: call stack, variables, and a plain-English explanation of every line."
        />
      </Helmet>

      <div className="mx-auto max-w-[1500px] px-4 md:px-6 py-4 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-3 py-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button size="sm" variant="secondary" onClick={runTrace} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Visualize
          </Button>

          <div className="flex items-center gap-1 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              disabled={!steps.length || idx === 0}
              onClick={() => {
                setPlaying(false);
                setIdx((i) => Math.max(0, i - 1));
              }}
            >
              <SkipBack className="h-4 w-4" /> Prev Step
            </Button>

            <div className="min-w-[130px] rounded-md bg-pink-500/10 border border-pink-500/30 px-3 py-1.5 text-xs">
              <div className="text-muted-foreground">
                Step{" "}
                <span className="text-foreground font-semibold">
                  {steps.length ? idx + 1 : 0}
                </span>{" "}
                of {steps.length}
              </div>
              <div className="mt-1 h-1 rounded bg-border/60 overflow-hidden">
                <motion.div
                  className="h-full bg-pink-500"
                  animate={{
                    width: steps.length ? `${((idx + 1) / steps.length) * 100}%` : "0%",
                  }}
                  transition={{ duration: 0.25 }}
                />
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              disabled={!steps.length}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 0.5 : 1))}
            >
              {speed}x
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!steps.length || idx >= steps.length - 1}
              onClick={() => {
                setPlaying(false);
                setIdx((i) => Math.min(steps.length - 1, i + 1));
              }}
            >
              Next Step <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={!steps.length}
              onClick={() => {
                setPlaying(false);
                setIdx(0);
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-4">
          {/* Code panel */}
          <div className="rounded-xl border border-border/50 bg-[#0d1117]/80 overflow-hidden">
            {trace ? (
              <div className="font-mono text-[13px] leading-6 py-3 max-h-[70vh] overflow-auto">
                {lines.map((l, i) => {
                  const active = step?.line === i + 1;
                  return (
                    <div
                      key={i}
                      ref={active ? lineRef : undefined}
                      className={cn(
                        "flex items-start gap-3 px-3 transition-colors",
                        active && "bg-emerald-500/10 border-y border-emerald-500/40",
                      )}
                    >
                      <span className="w-6 shrink-0 text-right text-muted-foreground/60 select-none">
                        {i + 1}
                      </span>
                      <span
                        className={cn(
                          "whitespace-pre-wrap break-words flex-1",
                          active ? "text-emerald-300" : "text-slate-300",
                        )}
                      >
                        {l || " "}
                      </span>
                      {active && <span className="text-emerald-400 shrink-0">◀</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                placeholder="Paste any code here…"
                className="w-full h-[70vh] resize-none bg-transparent p-4 font-mono text-[13px] leading-6 text-slate-200 outline-none"
              />
            )}
            {trace && (
              <div className="border-t border-border/50 p-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => {
                    setTrace(null);
                    setIdx(0);
                    setPlaying(false);
                  }}
                >
                  Edit code
                </Button>
              </div>
            )}
          </div>

          {/* Visualization panel */}
          <div className="space-y-4">
            {loading && (
              <div className="rounded-xl border border-border/50 bg-card/40 p-10 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" />
                Reading your code and building the execution trace…
              </div>
            )}

            {!loading && !trace && (
              <div className="rounded-xl border border-dashed border-border/50 bg-card/30 p-10 text-center space-y-2">
                <div className="text-lg font-semibold">Paste code, hit Visualize</div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Every step shows the call stack, each frame's variables, and a
                  plain-English explanation of the highlighted line.
                </p>
              </div>
            )}

            {step && (
              <>
                <div className="flex flex-wrap gap-6 items-start">
                  {(step.frames ?? []).map((f, i) => {
                    const top = i === (step.frames?.length ?? 0) - 1;
                    return (
                      <motion.div
                        key={`${f.name}-${i}`}
                        layout
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", damping: 20, stiffness: 220 }}
                        className={cn(
                          "min-w-[230px] rounded-lg border border-dashed p-3 space-y-2 bg-card/40",
                          top ? "border-sky-400/70" : "border-border/50",
                        )}
                      >
                        <div className="text-xs font-mono text-muted-foreground">
                          {f.isGlobal ? "" : "function "}
                          <span className="text-foreground">{f.name}</span>
                        </div>
                        {(f.vars ?? []).length > 0 && (
                          <div className="rounded-md border border-border/50 overflow-hidden">
                            {(f.vars ?? []).map((v) => (
                              <div
                                key={v.name}
                                className="grid grid-cols-2 text-sm font-mono divide-x divide-border/50 border-b border-border/50 last:border-b-0"
                              >
                                <div className="px-3 py-1.5 text-muted-foreground truncate">
                                  {v.name}
                                </div>
                                <div className="px-3 py-1.5 truncate">{v.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {f.returned != null && (
                          <div className="text-xs text-emerald-400 font-mono">
                            returns {f.returned}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {step.callArgs?.length ? (
                  <div className="text-xs text-sky-400 font-mono">
                    Calls function with arguments {step.callArgs.join(", ")}
                  </div>
                ) : null}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-0"
                  >
                    <div className="inline-block rounded-t-lg border border-b-0 border-dashed border-border/60 bg-card/40 px-3 py-2">
                      <div className="text-[11px] text-rose-400/80">
                        Explanation of this code:
                      </div>
                      <div className="font-mono text-sm">{step.code ?? lines[step.line - 1]}</div>
                    </div>
                    <div className="rounded-lg rounded-tl-none border border-border/60 bg-card/60 p-4 text-sm leading-relaxed">
                      {step.explanation ?? "—"}
                      {step.returnValue != null && (
                        <div className="mt-2 font-mono text-emerald-400">
                          returns {step.returnValue}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {step.stdout ? (
                  <div className="rounded-lg border border-border/50 bg-[#0d1117]/70 p-3">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      Output
                    </div>
                    <pre className="font-mono text-sm text-emerald-300 whitespace-pre-wrap">
                      {step.stdout}
                    </pre>
                  </div>
                ) : null}

                {trace?.truncated && idx === steps.length - 1 && (
                  <div className="text-xs text-amber-400">
                    Trace truncated — this program runs longer than the step limit.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
