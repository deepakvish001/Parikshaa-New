import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  hints: string[];
  /** Optional slug — when provided, revealed-progress persists across reloads. */
  slug?: string;
}

const KEY = "parikshaa:coding-hints-revealed:v1";

const readMap = (): Record<string, number> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

const writeMap = (map: Record<string, number>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
};

/**
 * Progressive hint disclosure — hints stay locked until the user explicitly
 * reveals them, one by one. When `slug` is provided the revealed count is
 * persisted to localStorage so it restores on reload.
 */
export const ProgressiveHints = ({ hints, slug }: Props) => {
  const [revealed, setRevealed] = useState<number>(() => {
    if (!slug) return 0;
    const v = readMap()[slug] ?? 0;
    return Math.min(hints.length, Math.max(0, v));
  });

  // Reload from storage when slug changes (navigation between problems).
  useEffect(() => {
    if (!slug) {
      setRevealed(0);
      return;
    }
    const v = readMap()[slug] ?? 0;
    setRevealed(Math.min(hints.length, Math.max(0, v)));
  }, [slug, hints.length]);

  // Persist whenever revealed count changes.
  useEffect(() => {
    if (!slug) return;
    const map = readMap();
    if (revealed > 0) map[slug] = revealed;
    else delete map[slug];
    writeMap(map);
  }, [slug, revealed]);

  if (hints.length === 0) return null;

  const pct = Math.round((revealed / hints.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 p-4 rounded-[1.5rem] bg-[#0a0a0c]/40 border border-border/20 shadow-lg shadow-black/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground/90">
              Progressive Hints
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 tabular-nums">
              {revealed} / {hints.length} Disclosed
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {revealed < hints.length && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevealed(hints.length)}
              className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/10 hover:text-amber-500 transition-all"
            >
              Show All
            </Button>
          )}
          {revealed > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevealed(0)}
              className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-all"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <div
        className="h-2 w-full rounded-full bg-[#0a0a0c] border border-border/20 overflow-hidden shadow-inner"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Hints revealed"
      >
        <div
          className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(245,158,11,0.5)]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid gap-3">
        {hints.map((h, i) => {
          const isOpen = i < revealed;
          return (
            <div
              key={i}
              className={cn(
                "group relative overflow-hidden rounded-[1.5rem] border p-5 transition-all duration-500",
                isOpen 
                  ? "bg-[#0a0a0c]/60 border-amber-500/30 shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)]" 
                  : "bg-[#0a0a0c]/20 border-border/10",
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-500",
                  isOpen ? "bg-amber-500/20 text-amber-500 scale-110" : "bg-muted/10 text-muted-foreground/30"
                )}>
                  {isOpen ? (
                    <Lightbulb className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
                  isOpen ? "text-amber-500" : "text-muted-foreground/30"
                )}>
                  Module {i + 1}
                </span>
              </div>
              
              <div className="relative">
                {isOpen ? (
                  <p className="text-[14px] text-foreground/80 leading-relaxed font-sans animate-in fade-in slide-in-from-top-2 duration-500 selection:bg-amber-500/20">
                    {h}
                  </p>
                ) : (
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/20 italic">
                    Locked · Disclosure Required
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {revealed < hints.length && (
        <Button
          variant="default"
          size="lg"
          onClick={() => setRevealed((r) => Math.min(hints.length, r + 1))}
          className="w-full h-14 rounded-[1.5rem] gap-3 text-[12px] font-black uppercase tracking-[0.2em] bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] border-t border-amber-300/50"
        >
          <Lightbulb className="h-5 w-5" />
          Unlock Next Insight
        </Button>
      )}
    </div>
  );
};
