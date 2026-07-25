import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronsRight,
  Bookmark,
  X,
  Download,
  Upload,
  Pencil,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VISUALIZE_ALGOS } from "./_data";
import {
  buildFrames,
  AlgoFrame,
  CODE_LINES,
  CODE_LANGUAGE,
  CODE_TOPIC,
  CallScene,
} from "./algos";

export default function VisualizePlayer() {
  const { algoId } = useParams();
  const navigate = useNavigate();
  const algo = VISUALIZE_ALGOS.find((a) => a.id === algoId);
  const frames = useMemo(() => (algo ? buildFrames(algo.id) : []), [algo]);
  const codeLines = algo ? CODE_LINES[algo.id] ?? [] : [];
  const language = algo ? CODE_LANGUAGE[algo.id] ?? "Python" : "Python";
  const topic = algo ? CODE_TOPIC[algo.id] ?? algo.title : "";

  // Per-algo persisted step + globally persisted speed.
  const stepKey = algo ? `viz:step:${algo.id}` : "";
  const SPEED_KEY = "viz:speed";
  // Saved step from a previous session; used to offer a Resume banner.
  const [resumeStep] = useState<number>(() => {
    if (!algo) return 0;
    const v = Number(localStorage.getItem(`viz:step:${algo.id}`));
    return Number.isFinite(v) && v > 0 ? v : 0;
  });
  const [i, setI] = useState<number>(0);
  const [showResume, setShowResume] = useState<boolean>(() => resumeStep > 0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(() => {
    const v = Number(localStorage.getItem("viz:speed"));
    return [400, 900, 1600].includes(v) ? v : 900;
  });
  const timerRef = useRef<number | null>(null);

  // Clamp step to valid range for this algo's frames.
  useEffect(() => {
    if (frames.length === 0) return;
    setI((n) => Math.min(Math.max(0, n), frames.length - 1));
  }, [frames.length]);

  // Persist step per algo.
  useEffect(() => {
    if (!stepKey) return;
    localStorage.setItem(stepKey, String(i));
  }, [i, stepKey]);

  // Persist speed globally.
  useEffect(() => {
    localStorage.setItem(SPEED_KEY, String(speed));
  }, [speed]);

  const resumeSession = () => {
    if (frames.length === 0) return;
    setI(Math.min(resumeStep, frames.length - 1));
    setShowResume(false);
  };
  const discardSession = () => {
    if (stepKey) localStorage.removeItem(stepKey);
    setI(0);
    setShowResume(false);
    setDiscardOpen(false);
    toast.success("Session discarded — starting from step 1");
  };

  // ---- Checkpoints: named {step, speed} snapshots per algo ----
  type Checkpoint = { id: string; label: string; step: number; speed: number; at: number };
  const cpKey = algo ? `viz:cp:${algo.id}` : "";
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => {
    if (!algo) return [];
    try {
      const raw = localStorage.getItem(`viz:cp:${algo.id}`);
      return raw ? (JSON.parse(raw) as Checkpoint[]) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (!cpKey) return;
    localStorage.setItem(cpKey, JSON.stringify(checkpoints));
  }, [checkpoints, cpKey]);

  // Dialogs
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameLabel, setRenameLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openSaveDialog = () => {
    setPlaying(false);
    setSaveLabel(`Step ${i + 1}`);
    setSaveOpen(true);
  };
  const confirmSaveCheckpoint = () => {
    const label = saveLabel.trim() || `Step ${i + 1}`;
    setCheckpoints((cs) =>
      [...cs, { id: `${Date.now()}`, label, step: i, speed, at: Date.now() }].slice(-20),
    );
    setSaveOpen(false);
    toast.success(`Checkpoint “${label}” saved`);
  };
  const loadCheckpoint = (cp: Checkpoint) => {
    setPlaying(false);
    setI(Math.min(cp.step, Math.max(0, frames.length - 1)));
    setSpeed(cp.speed);
  };
  const removeCheckpoint = (id: string) =>
    setCheckpoints((cs) => cs.filter((c) => c.id !== id));
  const openRename = (cp: Checkpoint) => {
    setRenameId(cp.id);
    setRenameLabel(cp.label);
  };
  const confirmRename = () => {
    if (!renameId) return;
    const label = renameLabel.trim();
    if (!label) return;
    setCheckpoints((cs) => cs.map((c) => (c.id === renameId ? { ...c, label } : c)));
    setRenameId(null);
  };

  // Export / Import
  const exportCheckpoints = () => {
    if (checkpoints.length === 0) {
      toast.info("No checkpoints to export");
      return;
    }
    const blob = new Blob(
      [JSON.stringify({ algoId: algo?.id, checkpoints, exportedAt: Date.now() }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visualize-checkpoints-${algo?.id ?? "algo"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Checkpoints exported");
  };
  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list: Checkpoint[] = Array.isArray(parsed) ? parsed : parsed.checkpoints;
        if (!Array.isArray(list)) throw new Error("bad format");
        const cleaned = list
          .filter((c) => c && typeof c.step === "number" && typeof c.speed === "number")
          .map((c) => ({
            id: String(c.id ?? Date.now() + Math.random()),
            label: String(c.label ?? `Step ${c.step + 1}`),
            step: c.step,
            speed: c.speed,
            at: Number(c.at ?? Date.now()),
          }));
        setCheckpoints((cs) => [...cs, ...cleaned].slice(-20));
        toast.success(`Imported ${cleaned.length} checkpoint${cleaned.length === 1 ? "" : "s"}`);
      } catch {
        toast.error("Invalid checkpoint file");
      }
    };
    reader.readAsText(file);
  };

  // Drag-to-reorder
  const dragIdRef = useRef<string | null>(null);
  const onDragStartChip = (id: string) => (e: React.DragEvent) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOverChip = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDropChip = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIdRef.current;
    dragIdRef.current = null;
    if (!from || from === targetId) return;
    setCheckpoints((cs) => {
      const fromIdx = cs.findIndex((c) => c.id === from);
      const toIdx = cs.findIndex((c) => c.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return cs;
      const next = [...cs];
      const [m] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, m);
      return next;
    });
  };





  useEffect(() => {
    if (!playing || frames.length === 0) return;
    timerRef.current = window.setInterval(() => {
      setI((n) => {
        if (n >= frames.length - 1) {
          setPlaying(false);
          return n;
        }
        return n + 1;
      });
    }, speed);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [playing, speed, frames.length]);

  const frame = frames[i];
  const progress = frames.length > 1 ? ((i + 1) / frames.length) * 100 : 100;
  const speedLabel = speed >= 1600 ? "0.5×" : speed >= 900 ? "1×" : "2×";
  const cycleSpeed = () => {
    const opts = [1600, 900, 400];
    const idx = opts.indexOf(speed);
    setSpeed(opts[(idx + 1) % opts.length] ?? 900);
  };

  const goPrev = () => {
    setPlaying(false);
    setI((n) => Math.max(0, n - 1));
  };
  const goNext = () => {
    setPlaying(false);
    setI((n) => Math.min(frames.length - 1, n + 1));
  };
  const doReset = () => {
    setPlaying(false);
    setI(0);
  };
  const togglePlay = () => {
    if (i >= frames.length - 1) setI(0);
    setPlaying((p) => !p);
  };

  // Keyboard shortcuts: Space=play/pause, ←/→=prev/next, Home/End=jump,
  // digits 1-9 & 0 jump to relative step %, S=speed, R=reset.
  useEffect(() => {
    if (frames.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
        case "j":
        case "J":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "h":
        case "H":
          e.preventDefault();
          goPrev();
          break;
        case "Home":
          e.preventDefault();
          setPlaying(false);
          setI(0);
          break;
        case "End":
          e.preventDefault();
          setPlaying(false);
          setI(frames.length - 1);
          break;
        case "r":
        case "R":
          e.preventDefault();
          doReset();
          break;
        case "s":
        case "S":
          e.preventDefault();
          cycleSpeed();
          break;
        default:
          if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            const pct = e.key === "0" ? 1 : Number(e.key) / 10;
            setPlaying(false);
            setI(Math.min(frames.length - 1, Math.max(0, Math.round((frames.length - 1) * pct))));
          }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames.length, i, speed, playing]);

  if (!algo) return <Navigate to="/learn/visualize" replace />;

  const trackAlgos = VISUALIZE_ALGOS.filter((a) => a.track === algo.track);

  return (
    <div className="flex flex-col bg-transparent text-foreground overflow-hidden h-[100dvh] max-h-[100dvh] w-full min-w-0 min-h-0">


      <Helmet>
        <title>{algo.title} — Visualize | Parikshaa</title>
        <meta name="description" content={algo.blurb} />
      </Helmet>

      {/* Screen-reader step announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Step {i + 1} of {frames.length}. {frame?.explain ?? ""}
      </div>


      {/* TOP TOOLBAR */}
      <div className="shrink-0 px-3 md:px-4 pt-3">
        <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-md p-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Left — Language / Topic */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 h-9 rounded-lg border border-border/60 bg-background/60 text-[12px] font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {language}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
              </div>
              <span className="text-muted-foreground/50 text-sm">/</span>
              <label className="relative">
                <span className="sr-only">Switch topic</span>
                <select
                  value={algo.id}
                  onChange={(e) => navigate(`/learn/visualize/algo/${e.target.value}`)}
                  className="appearance-none h-9 pl-2.5 pr-7 rounded-lg border border-border/60 bg-background/60 text-[12px] font-medium cursor-pointer focus-parikshaa"
                >
                  {trackAlgos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {CODE_TOPIC[a.id] ?? a.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              </label>
            </div>

            {/* Center — Prev · Step pill · Speed · Next */}
            <div className="flex items-center gap-1.5 mx-auto flex-wrap justify-center">
              <button
                onClick={goPrev}
                disabled={i === 0}
                aria-label="Previous step"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border/60 bg-background/60 text-[12px] font-medium hover:border-amber-500/50 transition disabled:opacity-40 disabled:cursor-not-allowed focus-parikshaa"
              >
                <SkipBack className="h-3.5 w-3.5" />
                Prev Step
              </button>

              <button
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="relative overflow-hidden inline-flex items-center gap-2 h-9 pl-2.5 pr-3 rounded-lg border border-pink-500/50 bg-gradient-to-r from-pink-600/40 to-rose-500/40 text-[12px] font-semibold text-pink-50 hover:from-pink-600/50 hover:to-rose-500/50 transition focus-parikshaa min-w-[150px]"
              >
                {playing ? (
                  <Pause className="h-3.5 w-3.5 relative z-10" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current relative z-10" />
                )}
                <span className="relative z-10">
                  Step {i + 1} of {frames.length}
                </span>
                <span
                  aria-hidden
                  className="absolute left-0 bottom-0 h-[3px] bg-pink-300 transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </button>

              <button
                onClick={cycleSpeed}
                aria-label={`Playback speed ${speedLabel}`}
                title="Click to cycle 0.5× → 1× → 2×"
                className="inline-flex items-center justify-center h-9 min-w-[46px] px-2 rounded-lg border border-border/60 bg-background/60 text-[12px] font-mono font-semibold hover:border-amber-500/50 transition focus-parikshaa"
              >
                {speedLabel}
              </button>

              <button
                onClick={goNext}
                disabled={i >= frames.length - 1}
                aria-label="Next step"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border/60 bg-background/60 text-[12px] font-medium hover:border-amber-500/50 transition disabled:opacity-40 disabled:cursor-not-allowed focus-parikshaa"
              >
                Next Step
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Right — Save + Export/Import + Reset */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <button
                onClick={openSaveDialog}
                aria-label="Save checkpoint at current step and speed"
                title="Save checkpoint"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-200 text-[12px] font-medium hover:bg-amber-500/20 transition focus-parikshaa"
              >
                <Bookmark className="h-3.5 w-3.5" />
                Save
              </button>
              <button
                onClick={exportCheckpoints}
                aria-label="Export checkpoints as JSON"
                title="Export checkpoints"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20 transition focus-parikshaa"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Import checkpoints from JSON"
                title="Import checkpoints"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20 transition focus-parikshaa"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={onImportFile}
              />
              <button
                onClick={doReset}
                aria-label="Reset to start"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-rose-500/50 bg-rose-500/10 text-rose-300 text-[12px] font-medium hover:bg-rose-500/20 transition focus-parikshaa"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Timeline scrubber — drag to jump to any step, synced with playback */}
          {frames.length > 1 && (
            <div className="mt-2 flex items-center gap-3 px-1">
              <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums w-8 text-right">
                1
              </span>
              <input
                type="range"
                min={0}
                max={frames.length - 1}
                step={1}
                value={i}
                onChange={(e) => {
                  setPlaying(false);
                  setI(Number(e.target.value));
                }}
                aria-label="Step timeline"
                aria-valuemin={1}
                aria-valuemax={frames.length}
                aria-valuenow={i + 1}
                className="flex-1 h-1.5 accent-amber-500 cursor-pointer focus-parikshaa rounded-full"
                style={{
                  background: `linear-gradient(to right, hsl(38 92% 55%) 0%, hsl(24 95% 55%) ${progress}%, hsl(var(--border)) ${progress}%, hsl(var(--border)) 100%)`,
                }}
              />
              <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums w-8">
                {frames.length}
              </span>
            </div>
          )}

          {/* Checkpoints strip — drag to reorder, click to load, pencil to rename */}
          {checkpoints.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-amber-400/80 shrink-0 mr-1">
                Checkpoints
              </span>
              {checkpoints.map((cp) => {
                const active = cp.step === i && cp.speed === speed;
                const speedTag =
                  cp.speed >= 1600 ? "0.5×" : cp.speed >= 900 ? "1×" : "2×";
                return (
                  <span
                    key={cp.id}
                    draggable
                    onDragStart={onDragStartChip(cp.id)}
                    onDragOver={onDragOverChip}
                    onDrop={onDropChip(cp.id)}
                    className={`group inline-flex items-center gap-0.5 h-7 pl-1 pr-1 rounded-full border text-[11px] font-mono shrink-0 transition cursor-grab active:cursor-grabbing ${
                      active
                        ? "border-amber-500/70 bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-100 shadow-sm shadow-amber-500/10"
                        : "border-amber-500/25 bg-background/60 text-foreground/85 hover:border-amber-500/60 hover:bg-amber-500/5"
                    }`}
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" aria-hidden />
                    <button
                      onClick={() => loadCheckpoint(cp)}
                      aria-label={`Jump to ${cp.label} at ${speedTag}`}
                      className="focus-parikshaa rounded-full px-1"
                    >
                      {cp.label}
                      <span className="ml-1 text-orange-300/80">{speedTag}</span>
                    </button>
                    <button
                      onClick={() => openRename(cp)}
                      aria-label={`Rename checkpoint ${cp.label}`}
                      className="h-5 w-5 inline-flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-amber-300 hover:bg-amber-500/10 focus-parikshaa"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeCheckpoint(cp.id)}
                      aria-label={`Delete checkpoint ${cp.label}`}
                      className="h-5 w-5 inline-flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 focus-parikshaa"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Resume banner — offers to jump back to the saved step */}
      {showResume && (
        <div className="shrink-0 mx-3 md:mx-4 mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 flex items-center gap-3 animate-fade-in">
          <span className="text-[12px] text-amber-100">
            Resume from step <span className="font-mono font-semibold">{Math.min(resumeStep, Math.max(0, frames.length - 1)) + 1}</span> of {frames.length}?
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={resumeSession}
              className="h-7 px-2.5 rounded-md border border-amber-500/50 bg-amber-500/20 text-[11px] font-medium text-amber-100 hover:bg-amber-500/30 transition focus-parikshaa"
            >
              Continue
            </button>
            <button
              onClick={() => setDiscardOpen(true)}
              className="h-7 px-2.5 rounded-md border border-border/50 bg-background/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-rose-500/40 transition focus-parikshaa"
            >
              Start over
            </button>
          </div>
        </div>
      )}

      {/* WORKSPACE — fills remaining viewport, no page scroll */}
      <div className="flex-1 min-h-0 px-3 md:px-4 py-3">

        <div className="h-full grid gap-3 grid-cols-1 lg:grid-cols-[minmax(280px,38%)_minmax(0,1fr)]">
          {/* LEFT — code */}
          <div className="rounded-2xl border border-border/50 bg-[#0e1420]/85 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-background/40 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-[10px] font-mono text-amber-400/90">
                line {(frame?.pcLine ?? 0) + 1}
              </span>
            </div>
            <div className="flex-1 overflow-auto py-2">
              {codeLines.map((line, idx) => {
                const active = frame?.pcLine === idx;
                return (
                  <div
                    key={idx}
                    className={`relative flex items-start pl-3 pr-7 py-[3px] font-mono text-[13px] leading-relaxed transition-colors ${
                      active ? "bg-emerald-500/15" : "hover:bg-background/30"
                    }`}
                  >
                    <span
                      className={`w-7 pr-2 text-right select-none tabular-nums ${
                        active ? "text-emerald-300/80" : "text-muted-foreground/40"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className={`whitespace-pre flex-1 min-w-0 ${
                        active ? "text-emerald-100" : "text-foreground/85"
                      }`}
                    >
                      {line || "\u00A0"}
                    </span>
                    {active && (
                      <ChevronsRight
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400"
                        aria-hidden
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — stage + explanation, splits vertical space */}
          <div className="grid grid-rows-[minmax(0,1fr)_auto] gap-3 min-h-0">
            <div className="rounded-2xl border border-border/50 bg-card/40 p-4 md:p-6 min-h-0 overflow-auto">
              {frame?.scene ? (
                <CallStackStage scene={frame.scene} />
              ) : (
                frame && <FrameStage frame={frame} />
              )}
            </div>

            {frame && (
              <div
                key={i}
                className="rounded-xl border border-border/40 bg-card/40 p-3 md:p-4 max-h-[38vh] overflow-auto animate-fade-in"
                role="region"
                aria-label="Step explanation"
              >
                <div className="text-[10px] tracking-[0.2em] uppercase text-rose-400/90 mb-1.5">
                  Explanation of this code:
                </div>
                {frame.codeSnippet && (
                  <pre className="font-mono text-[12.5px] text-amber-200/95 bg-background/50 border border-border/40 rounded-md px-2.5 py-1.5 mb-2 overflow-x-auto whitespace-pre-wrap">
                    {frame.codeSnippet}
                  </pre>
                )}
                <p className="text-sm text-foreground/85 leading-relaxed">
                  {renderExplain(frame.explain)}
                </p>
                {i === frames.length - 1 && (
                  <p className="mt-2 text-[11px] font-mono text-emerald-400/90">
                    All {frames.length} steps executed.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----- Discard confirmation dialog ----- */}
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard saved session?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  You'll lose your saved progress on{" "}
                  <span className="text-amber-300 font-medium">{topic || algo.title}</span>{" "}
                  and restart from step 1.
                </p>
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
                  <div className="text-[11px] uppercase tracking-widest text-amber-400/80 mb-0.5">
                    Current session
                  </div>
                  <div className="font-mono text-foreground">
                    Step <span className="text-amber-200 font-semibold">{i + 1}</span> of{" "}
                    {frames.length} · Speed{" "}
                    <span className="text-orange-300 font-semibold">{speedLabel}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your saved checkpoints will not be affected.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep session</AlertDialogCancel>
            <AlertDialogAction
              onClick={discardSession}
              className="bg-rose-500 hover:bg-rose-500/90 text-white"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ----- Save checkpoint dialog ----- */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-amber-400" />
              Save checkpoint
            </DialogTitle>
            <DialogDescription>
              Capturing step{" "}
              <span className="text-amber-300 font-semibold">{i + 1}</span> of{" "}
              {frames.length} at{" "}
              <span className="text-orange-300 font-semibold">{speedLabel}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cp-label">Checkpoint name</Label>
            <Input
              id="cp-label"
              autoFocus
              value={saveLabel}
              onChange={(e) => setSaveLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmSaveCheckpoint();
                }
              }}
              placeholder={`Step ${i + 1}`}
              maxLength={40}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmSaveCheckpoint}
              className="bg-amber-500 hover:bg-amber-500/90 text-black"
            >
              Save checkpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----- Rename checkpoint dialog ----- */}
      <Dialog open={!!renameId} onOpenChange={(o) => !o && setRenameId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-amber-400" />
              Rename checkpoint
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cp-rename">New name</Label>
            <Input
              id="cp-rename"
              autoFocus
              value={renameLabel}
              onChange={(e) => setRenameLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmRename();
                }
              }}
              maxLength={40}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameId(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmRename}
              className="bg-amber-500 hover:bg-amber-500/90 text-black"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------- Explanation helper: highlight inline code tokens -------- */

function renderExplain(text: string): ReactNode {
  const parts = text.split(
    /(`[^`]+`|"[^"]+"|\bfactorial\(\)|\bprint\(\)|\bTrue\b|\bFalse\b|\bx == 1\b|\bx: \d+|\bnum\b|\b\d+\b)/g,
  );
  return parts.map((p, idx) => {
    if (!p) return null;
    const isCode =
      /^`.+`$/.test(p) ||
      /^".+"$/.test(p) ||
      /factorial\(\)|print\(\)/.test(p) ||
      /^(True|False|num)$/.test(p) ||
      /^x == 1$/.test(p) ||
      /^x: \d+$/.test(p) ||
      /^\d+$/.test(p);
    if (isCode) {
      const clean = p.replace(/^`|`$/g, "");
      return (
        <code
          key={idx}
          className="mx-0.5 px-1.5 py-[1px] rounded border border-amber-500/30 bg-amber-500/10 text-amber-200 font-mono text-[12px] whitespace-nowrap"
        >
          {clean}
        </code>
      );
    }
    return <span key={idx}>{p}</span>;
  });
}

/* -------- Call-stack stage (Python-Tutor style) -------- */

function CallStackStage({ scene }: { scene: CallScene }) {
  return (
    <div className="space-y-5 h-full">
      {scene.output && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 md:p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-emerald-400/90 mb-1.5">
            Output
          </div>
          <div className="font-mono text-base md:text-lg text-emerald-100">
            {scene.output}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(200px,260px)_minmax(0,1fr)] gap-4 md:gap-8">
        <div>
          <FrameCard title="Main Block" tone="main">
            {scene.mainBlock && scene.mainBlock.vars.length > 0 && (
              <VarsTable vars={scene.mainBlock.vars} />
            )}
          </FrameCard>
        </div>

        <div className="flex flex-col relative">
          {scene.frames.length === 0 && (
            <div className="text-[11px] text-muted-foreground/60 italic pt-2">
              (no active function calls)
            </div>
          )}
          {scene.frames.map((cf, idx) => (
            <div key={cf.id + idx} className="flex flex-col">
              {idx > 0 && (
                <ConnectorArrow
                  returnLabel={
                    scene.returnFromChild?.childIndex === idx
                      ? scene.returnFromChild.label
                      : undefined
                  }
                />
              )}
              <FrameCard
                title={cf.title}
                tone={
                  cf.state === "active"
                    ? "active"
                    : cf.state === "returned"
                    ? "returned"
                    : "idle"
                }
                returns={cf.returns}
              >
                {cf.vars && cf.vars.length > 0 && <VarsTable vars={cf.vars} />}
              </FrameCard>
            </div>
          ))}

          {scene.entryArrow && scene.frames.length > 0 && (
            <div
              aria-hidden
              className="hidden sm:block pointer-events-none absolute -left-8 top-3 h-6 w-8 border-t-2 border-l-2 border-dashed border-sky-500/50 rounded-tl-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FrameCard({
  title,
  tone,
  returns,
  children,
}: {
  title: string;
  tone: "main" | "active" | "idle" | "returned";
  returns?: string | number;
  children?: ReactNode;
}) {
  const border =
    tone === "active"
      ? "border-sky-400/70"
      : tone === "returned"
      ? "border-border/40"
      : "border-border/50";
  const bg =
    tone === "active"
      ? "bg-sky-500/5"
      : tone === "returned"
      ? "bg-background/30"
      : "bg-background/40";
  const opacity = tone === "returned" ? "opacity-70" : "";
  return (
    <div
      className={`rounded-lg border-2 border-dashed ${border} ${bg} ${opacity} p-3 md:p-4 transition-all duration-300 ease-out animate-fade-in will-change-transform`}
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="text-[11px] text-muted-foreground">
          function
          <div className="font-mono text-[14px] md:text-[15px] text-foreground">{title}</div>
        </div>
        {returns !== undefined && (
          <span
            key={String(returns)}
            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300 animate-scale-in"
          >
            ↩ {String(returns)}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function VarsTable({ vars }: { vars: { name: string; value: string | number }[] }) {
  return (
    <div className="rounded-md border border-border/50 bg-background/40 p-2">
      <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/80 mb-1.5">
        Variables
      </div>
      <div className="space-y-1">
        {vars.map((v) => (
          <div key={v.name} className="flex items-center gap-2 text-[13px] font-mono">
            <span className="min-w-[54px] px-2 py-0.5 rounded border border-border/50 bg-background/60 text-muted-foreground text-[11px]">
              {v.name}
            </span>
            <span className="flex-1 px-2 py-0.5 rounded border border-border/50 bg-background/60 text-foreground text-right">
              {String(v.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectorArrow({ returnLabel }: { returnLabel?: string }) {
  return (
    <div className="relative flex justify-center h-7 my-0.5 animate-fade-in" aria-hidden>
      <div className="w-px h-full border-l-2 border-dashed border-muted-foreground/40 transition-colors duration-300" />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "6px solid hsl(var(--muted-foreground) / 0.5)",
        }}
      />
      {returnLabel && (
        <span
          key={returnLabel}
          className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300 whitespace-nowrap animate-scale-in"
        >
          {returnLabel}
        </span>
      )}
    </div>
  );
}

/* -------- Array stage (existing algos, bigger cells) -------- */

function FrameStage({ frame }: { frame: AlgoFrame }) {
  return (
    <div className="h-full flex flex-col justify-center gap-8">
      <div className="flex justify-center flex-wrap gap-2 md:gap-3">
        {frame.cells.map((c, idx) => {
          const bg =
            c.state === "found"
              ? "bg-emerald-500/20 border-emerald-500"
              : c.state === "active"
              ? "bg-amber-500/20 border-amber-500"
              : c.state === "window"
              ? "bg-orange-500/10 border-orange-500/60"
              : c.state === "compare"
              ? "bg-sky-500/10 border-sky-500/60"
              : c.state === "sorted"
              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
              : c.state === "eliminated"
              ? "bg-background/40 border-border/40 text-muted-foreground/40"
              : "bg-background/60 border-border/60";
          return (
            <div
              key={idx}
              className={`relative h-14 w-14 md:h-20 md:w-20 rounded-lg border-2 flex items-center justify-center font-mono text-lg md:text-2xl font-semibold transition-colors ${bg}`}
            >
              {c.value}
              {c.label && (
                <span className="absolute -bottom-5 text-[10px] font-sans font-normal text-muted-foreground whitespace-nowrap">
                  {c.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {frame.pointers.length > 0 && (
        <div className="flex justify-center gap-8">
          {frame.pointers.map((p) => (
            <div key={p.name} className="text-center" style={{ color: p.color }}>
              <div className="text-sm font-mono font-semibold">{p.name}</div>
              <div className="text-[11px] text-muted-foreground">idx {p.index}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
