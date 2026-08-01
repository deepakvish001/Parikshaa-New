import { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
  History,
  Sparkles,
  Trash2,
  GitCompare,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { detectLanguage } from "@/lib/blog/detectLang";
import { CODE_EXAMPLES } from "./code/examples";
import { inferVar, TYPE_COLOR } from "./code/inferVarType";
import { useTraceHistory, titleFromCode, type TraceHistoryEntry } from "./code/useTraceHistory";
import { useAutoFitFont } from "./code/useAutoFit";


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

const LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "java",
  "c++",
  "c",
  "c#",
  "go",
  "rust",
  "kotlin",
  "swift",
  "php",
  "ruby",
  "sql",
  "bash",
  "r",
  "scala",
  "dart",
  "perl",
  "haskell",
  "matlab",
];

/** Map the generic snippet detector's ids onto visualizer language names. */
const DETECT_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  java: "java",
  cpp: "c++",
  c: "c",
  cs: "c#",
  go: "go",
  rust: "rust",
  php: "php",
  ruby: "ruby",
  kotlin: "kotlin",
  swift: "swift",
  sql: "sql",
  bash: "bash",
};

const detectVisualizerLanguage = (code: string): string | null => {
  const d = detectLanguage(code);
  return (d && DETECT_MAP[d]) || null;
};

const SAMPLE = CODE_EXAMPLES[0].code;

/* ------------------------------------------------------------------ */

const VarRow = ({
  name,
  value,
  scope,
}: {
  name: string;
  value: string;
  scope: string;
}) => {
  const info = inferVar(value);
  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>
        <div className="grid grid-cols-[1fr_auto_1.2fr] items-center gap-2 px-2.5 py-[0.35em] font-mono border-b border-border/50 last:border-b-0 hover:bg-muted/30 cursor-help">
          <span className="text-muted-foreground truncate">{name}</span>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 text-[0.75em] font-sans leading-none",
              TYPE_COLOR[info.type],
            )}
          >
            {info.label}
          </span>
          <span className="truncate text-right">{value}</span>
        </div>

      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[260px] space-y-1">
        <div className="font-mono text-xs">
          {name} = {value}
        </div>
        <div className="text-xs text-muted-foreground">{info.hint}</div>
        <div className="text-[11px] text-muted-foreground">
          Scope: <span className="text-foreground">{scope}</span>
          {info.size != null ? ` · length ${info.size}` : ""}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

type FitPrefs = {
  codeAuto: boolean;
  codeZoom: number;
  stackAuto: boolean;
  stackZoom: number;
};

const FIT_PREFS_KEY = "visualizer:fit-prefs:v1";
const DEFAULT_FIT_PREFS: FitPrefs = {
  codeAuto: true,
  codeZoom: 1,
  stackAuto: true,
  stackZoom: 1,
};

const loadFitPrefs = (): FitPrefs => {
  try {
    const raw = localStorage.getItem(FIT_PREFS_KEY);
    if (!raw) return DEFAULT_FIT_PREFS;
    return { ...DEFAULT_FIT_PREFS, ...(JSON.parse(raw) as Partial<FitPrefs>) };
  } catch {
    return DEFAULT_FIT_PREFS;
  }
};

const ZoomControl = ({
  label,
  autoFit,
  zoom,
  onToggleAuto,
  onZoom,
}: {
  label: string;
  autoFit: boolean;
  zoom: number;
  onToggleAuto: () => void;
  onZoom: (next: number) => void;
}) => (
  <div className="flex items-center gap-0.5 rounded-md border border-border/50 px-1">
    <span className="px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
    <Button
      size="sm"
      variant="ghost"
      className="h-7 w-7 p-0"
      title={`Zoom out ${label}`}
      onClick={() => onZoom(Math.max(0.6, +(zoom - 0.1).toFixed(2)))}
    >
      <ZoomOut className="h-3.5 w-3.5" />
    </Button>
    <button
      onClick={onToggleAuto}
      title={`Toggle auto fit for ${label}`}
      className={cn(
        "px-1.5 text-[11px] rounded transition-colors",
        autoFit ? "text-emerald-400" : "text-muted-foreground",
      )}
    >
      <Maximize2 className="h-3.5 w-3.5 inline mr-1" />
      {autoFit ? "Auto" : "Manual"} · {Math.round(zoom * 100)}%
    </button>
    <Button
      size="sm"
      variant="ghost"
      className="h-7 w-7 p-0"
      title={`Zoom in ${label}`}
      onClick={() => onZoom(Math.min(1.8, +(zoom + 0.1).toFixed(2)))}
    >
      <ZoomIn className="h-3.5 w-3.5" />
    </Button>
  </div>
);

const MiniTrace = ({
  entry,
  idx,
  style,
}: {
  entry: TraceHistoryEntry;
  idx: number;
  style?: React.CSSProperties;
}) => {
  const steps = ((entry.trace as Trace)?.steps ?? []) as Step[];
  const s = steps[Math.min(idx, steps.length - 1)];
  return (
    <div
      className="rounded-lg border border-border/50 bg-card/40 p-3 space-y-2"
      style={style}
    >

      <div className="flex items-center justify-between gap-2">
        <div className="font-medium truncate">{entry.title}</div>
        <Badge variant="secondary" className="shrink-0 text-[0.75em]">
          {entry.language}
        </Badge>
      </div>
      <div className="text-[0.8em] text-muted-foreground">
        {steps.length} steps · {new Date(entry.createdAt).toLocaleString()}
      </div>
      {s ? (
        <>
          <div className="rounded bg-[#0d1117]/70 p-2 font-mono text-[0.85em] text-emerald-300">
            L{s.line}: {s.code ?? "—"}
          </div>
          <div className="text-[0.85em] text-muted-foreground">{s.explanation ?? "—"}</div>
          <div className="space-y-1">
            {(s.frames ?? []).map((f, i) => (
              <div key={i} className="rounded border border-border/50 px-2 py-1 text-[0.85em] font-mono">
                <span className="text-sky-300">{f.name}</span>
                {(f.vars ?? []).length > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    {(f.vars ?? []).map((v) => `${v.name}=${v.value}`).join(", ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-[0.85em] text-muted-foreground">No step at this index.</div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

export default function CodeVisualizer() {
  const [code, setCode] = useState(SAMPLE);
  const [language, setLanguage] = useState("auto");
  const [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const lineRef = useRef<HTMLDivElement>(null);

  const [examplesOpen, setExamplesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareIdx, setCompareIdx] = useState(0);

  const { entries, save, remove, clear } = useTraceHistory();

  const detected = useMemo(() => detectVisualizerLanguage(code), [code]);
  const effectiveLanguage = language === "auto" ? detected ?? "python" : language;

  const steps = trace?.steps ?? [];
  const step = steps[idx];
  const lines = useMemo(() => code.replace(/\t/g, "    ").split("\n"), [code]);

  /* ---- auto font / zoom fit (persisted) ---- */
  const [fitPrefs, setFitPrefs] = useState<FitPrefs>(loadFitPrefs);
  useEffect(() => {
    try {
      localStorage.setItem(FIT_PREFS_KEY, JSON.stringify(fitPrefs));
    } catch {
      /* ignore */
    }
  }, [fitPrefs]);
  const setPref = useCallback(
    (patch: Partial<FitPrefs>) => setFitPrefs((p) => ({ ...p, ...patch })),
    [],
  );

  const maxCols = useMemo(
    () => lines.reduce((m, l) => Math.max(m, l.length), 0),
    [lines],
  );
  const codeFit = useAutoFitFont({
    rows: Math.max(lines.length, 1),
    cols: maxCols + 4,
    lineHeight: 1.55,
    min: 8,
    max: 15,
    padY: 28,
    padX: 60,
    zoom: fitPrefs.codeZoom,
    enabled: fitPrefs.codeAuto,
  });

  const frames = step?.frames ?? [];
  const stackRows = useMemo(() => {
    const total = frames.reduce(
      (s, f) => s + 2.4 + (f.vars?.length ?? 0) + (f.returned != null ? 1 : 0),
      0,
    );
    const columns = Math.min(3, Math.max(1, frames.length));
    return Math.max(4, Math.ceil(total / columns));
  }, [frames]);
  const stackFit = useAutoFitFont({
    rows: stackRows,
    cols: 0,
    lineHeight: 2.1,
    min: 9,
    max: 14,
    padY: 36,
    zoom: fitPrefs.stackZoom,
    enabled: fitPrefs.stackAuto,
  });




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

  const runTrace = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true);
    setTrace(null);
    setPlaying(false);
    setIdx(0);
    try {
      const { data, error } = await supabase.functions.invoke("code-trace", {
        body: { code, language: effectiveLanguage },
      });
      if (error) throw error;
      const t = data as Trace;
      if (!t?.steps?.length) throw new Error("No steps returned");
      setTrace(t);
      save({
        title: titleFromCode(code),
        language: effectiveLanguage,
        code,
        trace: t,
        stepCount: t.steps.length,
      });
    } catch (e) {
      toast.error("Could not visualize this code", {
        description: (e as Error)?.message ?? "Try a smaller snippet.",
      });
    } finally {
      setLoading(false);
    }
  }, [code, effectiveLanguage, save]);

  const loadEntry = (entry: TraceHistoryEntry) => {
    setCode(entry.code);
    setLanguage(entry.language);
    setTrace(entry.trace as Trace);
    setIdx(0);
    setPlaying(false);
    setHistoryOpen(false);
    toast.success("Loaded previous run");
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2),
    );
    setCompareIdx(0);
  };

  const compareEntries = compareIds
    .map((id) => entries.find((e) => e.id === id))
    .filter(Boolean) as TraceHistoryEntry[];
  const compareMax = Math.max(
    0,
    ...compareEntries.map((e) => ((e.trace as Trace)?.steps?.length ?? 1) - 1),
  );

  // One shared fit for both compare cards → identical scale, never mismatched.
  const compareRows = useMemo(() => {
    const rowsFor = (e: TraceHistoryEntry) => {
      const st = ((e.trace as Trace)?.steps ?? []) as Step[];
      const s = st[Math.min(compareIdx, st.length - 1)];
      return 5 + (s?.frames?.length ?? 0);
    };
    return Math.max(6, ...compareEntries.map(rowsFor));
  }, [compareEntries, compareIdx]);
  const compareFit = useAutoFitFont({
    rows: compareRows,
    cols: 0,
    lineHeight: 2.2,
    min: 9,
    max: 14,
    padY: 40,
    zoom: fitPrefs.stackZoom,
    enabled: fitPrefs.stackAuto,
  });


  return (
    <TooltipProvider>
      <div className="relative flex h-[calc(100dvh-4rem)] min-h-[560px] flex-col overflow-hidden bg-transparent text-foreground">
        <Helmet>
          <title>Code Visualizer — Step Through Any Code | Parikshaa</title>
          <meta
            name="description"
            content="Paste any code and watch it execute step by step: call stack, typed variables, and a plain-English explanation of every line."
          />
        </Helmet>

        <div className="mx-auto w-full max-w-[1500px] flex-1 min-h-0 flex flex-col gap-3 px-4 md:px-6 py-3">
          {/* Toolbar */}
          <div className="shrink-0 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border border-border/50 bg-card/50 px-3 py-2">

            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                <SelectItem value="auto">
                  Auto-detect{detected ? ` (${detected})` : ""}
                </SelectItem>
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

            <ZoomControl
              label="Code"
              autoFit={fitPrefs.codeAuto}
              zoom={fitPrefs.codeZoom}
              onToggleAuto={() =>
                setPref({ codeAuto: !fitPrefs.codeAuto, codeZoom: 1 })
              }
              onZoom={(z) => setPref({ codeZoom: z })}
            />
            <ZoomControl
              label="Vars"
              autoFit={fitPrefs.stackAuto}
              zoom={fitPrefs.stackZoom}
              onToggleAuto={() =>
                setPref({ stackAuto: !fitPrefs.stackAuto, stackZoom: 1 })
              }
              onZoom={(z) => setPref({ stackZoom: z })}
            />



            <Button size="sm" variant="ghost" onClick={() => setExamplesOpen(true)}>
              <Sparkles className="h-4 w-4" /> Examples
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4" /> History
              {entries.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {entries.length}
                </Badge>
              )}
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

          {/* Compare strip */}
          {compareEntries.length === 2 && (
            <div
              ref={compareFit.ref}
              className="shrink-0 max-h-[38vh] overflow-auto rounded-xl border border-border/50 bg-card/40 p-3 space-y-3"
            >

              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-sky-400" />
                <div className="text-sm font-semibold">Comparing two runs</div>
                <input
                  type="range"
                  min={0}
                  max={compareMax}
                  value={compareIdx}
                  onChange={(e) => setCompareIdx(Number(e.target.value))}
                  className="ml-auto w-56 accent-sky-500"
                />
                <span className="text-xs text-muted-foreground w-24 text-right">
                  step {compareIdx + 1} / {compareMax + 1}
                </span>
                <Button size="sm" variant="ghost" onClick={() => setCompareIds([])}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {compareEntries.map((e) => (
                  <MiniTrace
                    key={e.id}
                    entry={e}
                    idx={compareIdx}
                    style={{
                      fontSize: `${compareFit.fontSize}px`,
                      transition: "font-size 260ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-4">
            {/* Code panel */}
            <div className="flex flex-col min-h-0 rounded-xl border border-border/50 bg-[#0d1117]/80 overflow-hidden">
              {trace ? (
                <div
                  ref={codeFit.ref}
                  className="font-mono py-3 flex-1 min-h-0 overflow-auto"
                  style={codeFit.style}
                >
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
                        <span className="w-[2.4em] shrink-0 text-right text-muted-foreground/60 select-none">
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
                <div ref={codeFit.ref} className="flex-1 min-h-0 flex">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    placeholder="Paste any code here…"
                    className="w-full flex-1 min-h-0 resize-none bg-transparent p-4 font-mono text-slate-200 outline-none"
                    style={codeFit.style}
                  />
                </div>
              )}


              <div className="border-t border-border/50 p-2 flex items-center gap-2">
                {trace ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setTrace(null);
                      setIdx(0);
                      setPlaying(false);
                    }}
                  >
                    Edit code
                  </Button>
                ) : (
                  <span className="px-2 text-[11px] text-muted-foreground">
                    {detected
                      ? `Detected ${detected}${language === "auto" ? " (auto)" : ""}`
                      : "Language will be auto-detected"}
                  </span>
                )}
              </div>
            </div>

            {/* Visualization panel */}
            <div className="flex flex-col min-h-0 gap-3">
              {loading && (
                <div className="rounded-xl border border-border/50 bg-card/40 p-10 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" />
                  Reading your code and building the execution trace…
                </div>
              )}

              {!loading && !trace && (
                <div className="rounded-xl border border-dashed border-border/50 bg-card/30 p-6 space-y-4 overflow-auto">

                  <div className="text-center space-y-2">
                    <div className="text-lg font-semibold">Paste code, hit Visualize</div>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Every step shows the call stack, each frame's typed variables, and a
                      plain-English explanation of the highlighted line.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {CODE_EXAMPLES.slice(0, 4).map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => {
                          setCode(ex.code);
                          setLanguage(ex.language);
                        }}
                        className="text-left rounded-lg border border-border/50 bg-card/40 px-3 py-2 hover:border-sky-400/60 transition-colors"
                      >
                        <div className="text-sm font-medium">{ex.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {ex.category} · {ex.language}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="text-center">
                    <Button size="sm" variant="ghost" onClick={() => setExamplesOpen(true)}>
                      <Sparkles className="h-4 w-4" /> Browse all examples
                    </Button>
                  </div>
                </div>
              )}

              {step && (
                <>
                  <div
                    ref={stackFit.ref}
                    className="flex-1 min-h-0 overflow-auto rounded-xl border border-border/50 bg-card/20 p-3"
                    style={{
                      fontSize: `${stackFit.fontSize}px`,
                      transition: "font-size 260ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <div className="flex flex-wrap gap-3 items-start">
                      {(step.frames ?? []).map((f, i) => {
                        const top = i === (step.frames?.length ?? 0) - 1;
                        const scope = f.isGlobal ? "global" : `local → ${f.name}`;
                        return (
                          <motion.div
                            key={`${f.name}-${i}`}
                            layout
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", damping: 20, stiffness: 220 }}
                            className={cn(
                              "min-w-[16em] max-w-full rounded-lg border border-dashed p-[0.7em] space-y-[0.5em] bg-card/40",
                              top ? "border-sky-400/70" : "border-border/50",
                            )}
                          >
                            <div className="flex items-center gap-2 text-[0.9em] font-mono text-muted-foreground">
                              {f.isGlobal ? "" : "function "}
                              <span className="text-foreground">{f.name}</span>
                              <Badge
                                variant="outline"
                                className="ml-auto text-[0.75em] font-sans"
                              >
                                {f.isGlobal ? "global scope" : "local scope"}
                              </Badge>
                            </div>

                            {(f.vars ?? []).length > 0 && (
                              <div className="rounded-md border border-border/50 overflow-hidden">
                                {(f.vars ?? []).map((v) => (
                                  <VarRow
                                    key={v.name}
                                    name={v.name}
                                    value={v.value}
                                    scope={scope}
                                  />
                                ))}
                              </div>
                            )}
                            {f.returned != null && (
                              <div className="text-[0.9em] text-emerald-400 font-mono">
                                returns {f.returned}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {step.callArgs?.length ? (
                      <div className="mt-3 text-[0.9em] text-sky-400 font-mono">
                        Calls function with arguments {step.callArgs.join(", ")}
                      </div>
                    ) : null}
                  </div>


                  <AnimatePresence mode="wait">
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="shrink-0 space-y-0"
                    >
                      <div className="inline-block rounded-t-lg border border-b-0 border-dashed border-border/60 bg-card/40 px-3 py-2">
                        <div className="text-[11px] text-rose-400/80">
                          Explanation of this code:
                        </div>
                        <div className="font-mono text-sm">
                          {step.code ?? lines[step.line - 1]}
                        </div>
                      </div>
                      <div className="rounded-lg rounded-tl-none border border-border/60 bg-card/60 p-3 text-sm leading-relaxed max-h-32 overflow-auto">
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
                    <div className="shrink-0 rounded-lg border border-border/50 bg-[#0d1117]/70 p-3">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                        Output
                      </div>
                      <pre className="font-mono text-sm text-emerald-300 whitespace-pre-wrap max-h-24 overflow-auto">
                        {step.stdout}
                      </pre>
                    </div>
                  ) : null}

                  {trace?.truncated && idx === steps.length - 1 && (
                    <div className="shrink-0 text-xs text-amber-400">
                      Trace truncated — this program runs longer than the step limit.
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>

        {/* Examples gallery */}
        <Dialog open={examplesOpen} onOpenChange={setExamplesOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Example gallery</DialogTitle>
              <DialogDescription>
                Pick a snippet to load it into the editor, then hit Visualize.
              </DialogDescription>
            </DialogHeader>
            <div className="grid sm:grid-cols-2 gap-3">
              {CODE_EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setCode(ex.code);
                    setLanguage(ex.language);
                    setTrace(null);
                    setIdx(0);
                    setExamplesOpen(false);
                  }}
                  className="text-left rounded-lg border border-border/50 bg-card/40 p-3 space-y-2 hover:border-sky-400/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{ex.title}</div>
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {ex.language}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{ex.category}</div>
                  <pre className="rounded bg-[#0d1117]/70 p-2 font-mono text-[11px] leading-5 text-slate-300 max-h-28 overflow-hidden">
                    {ex.code.split("\n").slice(0, 6).join("\n")}
                  </pre>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* History */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visualization history</DialogTitle>
              <DialogDescription>
                Reload a saved run, or tick two runs to compare them side by side.
              </DialogDescription>
            </DialogHeader>
            {entries.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No saved runs yet — visualize some code first.
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((e) => {
                  const checked = compareIds.includes(e.id);
                  return (
                    <div
                      key={e.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-3 py-2",
                        checked && "border-sky-400/60",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCompare(e.id)}
                        className="accent-sky-500"
                        aria-label={`Compare ${e.title}`}
                      />
                      <button
                        className="flex-1 text-left min-w-0"
                        onClick={() => loadEntry(e)}
                      >
                        <div className="text-sm font-medium truncate">{e.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {e.language} · {e.stepCount} steps ·{" "}
                          {new Date(e.createdAt).toLocaleString()}
                        </div>
                      </button>
                      <Button size="sm" variant="ghost" onClick={() => loadEntry(e)}>
                        Reload
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => remove(e.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={compareIds.length !== 2}
                    onClick={() => setHistoryOpen(false)}
                  >
                    <GitCompare className="h-4 w-4" /> Compare selected
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={clear}>
                    Clear all
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
