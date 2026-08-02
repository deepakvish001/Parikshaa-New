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
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Settings2,
  Zap,
  BarChart3,
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
import { MonacoEditor, type MonacoDiagnostic } from "@/components/coding/MonacoEditor";
import { HighlightedLine } from "./code/highlight";
import { frameColor, eventStyle } from "./code/frameColors";
import ComplexityDrawer, { ComplexityChart } from "./code/ComplexityDrawer";
import { COMPLEXITY_CASE_COLORS } from "./code/complexityMath";
import {
  traceCacheKey,
  getCachedTrace,
  setCachedTrace,
  clearTraceCache,
  loadDebounceMs,
  saveDebounceMs,
  DEBOUNCE_MIN,
  DEBOUNCE_MAX,
} from "./code/traceCache";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


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
interface Complexity {
  time?: string;
  space?: string;
  timeReason?: string;
  spaceReason?: string;
  recurrence?: string | null;
  best?: string;
  average?: string;
  worst?: string;
  notes?: string[];
}
interface Trace {
  valid?: true;
  language?: string;
  truncated?: boolean;
  steps: Step[];
  complexity?: Complexity;
}

interface TraceValidationError {
  line: number;
  column?: number;
  message: string;
  code?: string;
}

interface InvalidTraceResponse {
  valid: false;
  error: TraceValidationError;
}

const QUICK_LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JS" },
  { value: "typescript", label: "TS" },
] as const;

const ALL_LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "c++", label: "C++" },
  { value: "c#", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "scala", label: "Scala" },
  { value: "dart", label: "Dart" },
  { value: "r", label: "R" },
  { value: "sql", label: "SQL" },
] as const;

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
  const [language, setLanguage] = useState("python");
  const [trace, setTrace] = useState<Trace | null>(null);
  const [validationError, setValidationError] = useState<TraceValidationError | null>(null);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const lineRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const initialRenderRef = useRef(true);

  const [examplesOpen, setExamplesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [complexityOpen, setComplexityOpen] = useState(false);
  const [cacheHit, setCacheHit] = useState(false);
  const [debounceMs, setDebounceMs] = useState<number>(() => loadDebounceMs());
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareIdx, setCompareIdx] = useState(0);

  useEffect(() => {
    saveDebounceMs(debounceMs);
  }, [debounceMs]);

  const { entries, save, remove, clear } = useTraceHistory();

  const detected = useMemo(() => detectVisualizerLanguage(code), [code]);
  const effectiveLanguage = language;
  const diagnostics = useMemo<MonacoDiagnostic[]>(
    () => validationError ? [{ ...validationError, severity: "error" }] : [],
    [validationError],
  );

  const steps = trace?.steps ?? [];
  const step = steps[idx];
  const lines = useMemo(() => code.replace(/\t/g, "    ").split("\n"), [code]);
  const visitedLines = useMemo(
    () => new Set(steps.slice(0, idx + 1).map((st) => st.line)),
    [steps, idx],
  );

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

  const applyTrace = useCallback((t: Trace) => {
    setTrace(t);
    setValidationError(null);
    setIdx(0);
    setPlaying(false);
  }, []);

  const runTrace = useCallback(
    async (
      source = code,
      selectedLanguage = effectiveLanguage,
      opts: { force?: boolean } = {},
    ) => {
      if (!source.trim()) {
        setTrace(null);
        setValidationError(null);
        setLoading(false);
        return;
      }
      const key = traceCacheKey(source, selectedLanguage);
      if (!opts.force) {
        const cached = getCachedTrace<Trace>(key);
        if (cached?.steps?.length) {
          requestIdRef.current += 1;
          applyTrace(cached);
          setLoading(false);
          setCacheHit(true);
          return;
        }
      }
      const requestId = ++requestIdRef.current;
      setCacheHit(false);
      setLoading(true);
      setValidationError(null);
      setPlaying(false);
      setIdx(0);
      try {
        const { data, error } = await supabase.functions.invoke("code-trace", {
          body: { code: source, language: selectedLanguage },
        });
        if (requestId !== requestIdRef.current) return;
        if (error) throw error;
        const invalid = data as InvalidTraceResponse;
        if (invalid?.valid === false && invalid.error) {
          setTrace(null);
          setValidationError({
            line: Math.max(1, Number(invalid.error.line) || 1),
            column: Math.max(1, Number(invalid.error.column) || 1),
            message: invalid.error.message || "Syntax error",
            code: invalid.error.code,
          });
          return;
        }
        const t = data as Trace;
        if (!t?.steps?.length) throw new Error("No steps returned");
        setCachedTrace(key, t);
        setTrace(t);
        setValidationError(null);
        save({
          title: titleFromCode(source),
          language: selectedLanguage,
          code: source,
          trace: t,
          stepCount: t.steps.length,
        });
      } catch (e) {
        if (requestId !== requestIdRef.current) return;
        setTrace(null);
        toast.error("Could not visualize this code", {
          description: (e as Error)?.message ?? "Try a smaller snippet.",
        });
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [code, effectiveLanguage, save, applyTrace],
  );

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    // Instant path — unchanged code already analysed before.
    const cached = getCachedTrace<Trace>(traceCacheKey(code, effectiveLanguage));
    if (cached?.steps?.length) {
      requestIdRef.current += 1;
      applyTrace(cached);
      setLoading(false);
      setCacheHit(true);
      return;
    }
    setTrace(null);
    setValidationError(null);
    setPlaying(false);
    setCacheHit(false);
    const timer = window.setTimeout(() => void runTrace(code, effectiveLanguage), debounceMs);
    return () => window.clearTimeout(timer);
  }, [code, effectiveLanguage, runTrace, debounceMs, applyTrace]);


  const loadEntry = (entry: TraceHistoryEntry) => {
    setCode(entry.code);
    setLanguage(entry.language);
    setTrace(entry.trace as Trace);
    setValidationError(null);
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

            <div className="flex h-9 items-center rounded-md border border-border/60 bg-background/40 p-1" aria-label="Code language">
              {QUICK_LANGUAGES.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  size="sm"
                  variant={language === item.value ? "secondary" : "ghost"}
                  className="h-7 px-3 text-xs"
                  onClick={() => setLanguage(item.value)}
                  aria-pressed={language === item.value}
                >
                  {item.label}
                </Button>
              ))}
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-7 w-[118px] border-0 bg-transparent text-xs focus:ring-0">
                  {QUICK_LANGUAGES.some((q) => q.value === language)
                    ? "More…"
                    : (ALL_LANGUAGES.find((l) => l.value === language)?.label ?? "More…")}
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {ALL_LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value} className="text-xs">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => void runTrace(code, effectiveLanguage, { force: true })}
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {loading ? "Analyzing" : "Visualize now"}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" title="Re-run settings">
                  <Settings2 className="h-4 w-4" /> {debounceMs}ms
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-3" align="start">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>Auto-run delay</span>
                    <span className="font-mono text-muted-foreground">{debounceMs}ms</span>
                  </div>
                  <Slider
                    className="mt-2"
                    value={[debounceMs]}
                    min={DEBOUNCE_MIN}
                    max={DEBOUNCE_MAX}
                    step={100}
                    onValueChange={(v) => setDebounceMs(v[0])}
                  />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    How long to wait after you stop typing before re-analyzing.
                  </p>
                </div>
                <div className="border-t border-border/50 pt-2">
                  <p className="text-[11px] text-muted-foreground">
                    Identical code + language is served from cache instantly — no AI call.
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1 h-7 px-2 text-xs"
                    onClick={() => {
                      clearTraceCache();
                      setCacheHit(false);
                      toast.success("Trace cache cleared");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear cache
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground" aria-live="polite">
              {loading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Auto-visualizing…</>
              ) : validationError ? (
                <><AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Fix line {validationError.line}</>
              ) : trace ? (
                cacheHit ? (
                  <><Zap className="h-3.5 w-3.5 text-amber-400" /> Cached · instant</>
                ) : (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Trace ready</>
                )
              ) : (
                <>Runs automatically after you stop typing</>
              )}
            </div>


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

            <div className="flex flex-wrap items-center gap-1 w-full lg:w-auto lg:ml-auto justify-end">
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
                    const visited = visitedLines.has(i + 1);
                    const ev = eventStyle(step?.event);
                    return (
                      <div
                        key={i}
                        ref={active ? lineRef : undefined}
                        className={cn(
                          "relative flex items-start gap-3 px-3 transition-colors duration-200",
                          active && cn("border-y", ev.line),
                          !active && visited && "bg-white/[0.03]",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="active-gutter"
                            className={cn("absolute left-0 top-0 h-full w-[3px]", ev.gutter)}
                          />
                        )}
                        <span
                          className={cn(
                            "w-[2.4em] shrink-0 text-right select-none",
                            active ? "text-foreground" : visited ? "text-slate-500" : "text-muted-foreground/40",
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="whitespace-pre-wrap break-words flex-1">
                          {l ? <HighlightedLine line={l} /> : " "}
                        </span>
                        {active && (
                          <span
                            className={cn(
                              "shrink-0 rounded border px-1.5 text-[0.7em] font-sans leading-[1.6em]",
                              ev.chip,
                            )}
                          >
                            {ev.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div ref={codeFit.ref} className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 min-h-0">
                    <MonacoEditor
                    value={code}
                    onChange={setCode}
                    language={effectiveLanguage}
                    fontSize={codeFit.fontSize}
                    diagnostics={diagnostics}
                  />
                  </div>
                  {validationError && (
                    <div className="shrink-0 border-t border-destructive/40 bg-destructive/10 px-3 py-2" role="alert">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-destructive">
                            Line {validationError.line}{validationError.column ? `, column ${validationError.column}` : ""}
                          </div>
                          <div className="text-xs text-foreground">{validationError.message}</div>
                          {validationError.code && (
                            <code className="mt-1 block truncate text-[11px] text-muted-foreground">{validationError.code}</code>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                    Selected {effectiveLanguage}{detected && detected !== effectiveLanguage ? ` · code looks like ${detected}` : ""}
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
                    <div className="text-lg font-semibold">Paste code to visualize automatically</div>
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

              {trace?.complexity && (
                <div className="shrink-0 rounded-xl border border-border/50 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-amber-500/10 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Gauge className="h-4 w-4 text-fuchsia-400" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Complexity
                    </span>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <span className="cursor-help rounded-md border border-indigo-400/40 bg-indigo-500/15 px-2 py-1 font-mono text-sm text-indigo-200">
                          Time {trace.complexity.time ?? "—"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] text-xs">
                        {trace.complexity.timeReason ?? "No reasoning provided."}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <span className="cursor-help rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 font-mono text-sm text-emerald-200">
                          Space {trace.complexity.space ?? "—"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] text-xs">
                        {trace.complexity.spaceReason ?? "No reasoning provided."}
                      </TooltipContent>
                    </Tooltip>
                    {(["best", "average", "worst"] as const).map((k) =>
                      trace.complexity?.[k] ? (
                        <span
                          key={k}
                          className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px] text-muted-foreground"
                          style={{ borderLeft: `3px solid ${COMPLEXITY_CASE_COLORS[k]}` }}
                        >
                          {k} <span className="font-mono text-foreground">{trace.complexity[k]}</span>
                        </span>
                      ) : null,
                    )}
                    {trace.complexity.recurrence && (
                      <span className="rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-1 font-mono text-[11px] text-amber-200">
                        {trace.complexity.recurrence}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-7 px-2 text-xs"
                      onClick={() => setComplexityOpen(true)}
                    >
                      <BarChart3 className="h-3.5 w-3.5" /> Explain
                    </Button>
                  </div>

                  <div className="mt-2 rounded-lg border border-border/40 bg-background/30 p-2">
                    <ComplexityChart
                      height={130}
                      series={[
                        { key: "best", expr: trace.complexity.best, color: COMPLEXITY_CASE_COLORS.best },
                        {
                          key: "average",
                          expr: trace.complexity.average ?? trace.complexity.time,
                          color: COMPLEXITY_CASE_COLORS.average,
                        },
                        { key: "worst", expr: trace.complexity.worst, color: COMPLEXITY_CASE_COLORS.worst },
                      ]}
                    />
                  </div>

                  {trace.complexity.notes?.length ? (
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      {trace.complexity.notes.slice(0, 4).map((n, i) => (
                        <li key={i}>• {n}</li>
                      ))}
                    </ul>
                  ) : null}
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
                        const c = frameColor(i);
                        return (
                          <motion.div
                            key={`${f.name}-${i}`}
                            layout
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", damping: 20, stiffness: 220 }}
                            className={cn(
                              "relative min-w-[16em] max-w-full overflow-hidden rounded-lg border p-[0.7em] space-y-[0.5em] bg-card/40",
                              c.ring,
                              top && c.glow,
                            )}
                          >
                            <span className={cn("absolute inset-x-0 top-0 h-[3px]", c.bar)} />
                            <div className="flex items-center gap-2 text-[0.9em] font-mono text-muted-foreground">
                              <span className={cn("rounded border px-1.5 text-[0.75em] font-sans", c.chip)}>
                                #{i}
                              </span>
                              <span className={cn("font-semibold", c.text)}>{f.name}</span>
                              <Badge
                                variant="outline"
                                className={cn("ml-auto text-[0.75em] font-sans", c.chip)}
                              >
                                {f.isGlobal ? "global" : "local"}
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
                          <HighlightedLine line={step.code ?? lines[step.line - 1] ?? ""} />
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
                Pick a snippet to load it into the editor. Visualization starts automatically.
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
      <ComplexityDrawer
        open={complexityOpen}
        onOpenChange={setComplexityOpen}
        complexity={trace?.complexity}
      />
    </TooltipProvider>
  );
}
