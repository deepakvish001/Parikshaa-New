import { ProfileCard, EmptyCard } from "./ProfileCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Code2, RefreshCw, Sparkles, X, BookOpen, GraduationCap, Trophy } from "lucide-react";
import { formatRelative } from "@/lib/formatRelative";

export interface Subject { label: string; percent: number }

const SUBJECT_META: Record<string, { color: string; short: string }> = {
  DBMS:    { color: "#f59e0b", short: "DB" },
  OS:      { color: "#22d3ee", short: "OS" },
  CN:      { color: "#a78bfa", short: "CN" },
  DSA:     { color: "#34d399", short: "DS" },
  OOP:     { color: "#f472b6", short: "OO" },
  OOPS:    { color: "#f472b6", short: "OO" },
  SYSTEM:  { color: "#fb7185", short: "SD" },
  APTITUDE:{ color: "#facc15", short: "AP" },
  SQL:     { color: "#38bdf8", short: "SQ" },
  WEB:     { color: "#fb923c", short: "WB" },
  CLOUD:   { color: "#60a5fa", short: "CL" },
};

function metaFor(label: string) {
  const key = label.trim().toUpperCase();
  for (const k of Object.keys(SUBJECT_META)) {
    if (key.includes(k)) return SUBJECT_META[k];
  }
  // Fallback: hash to amber tint
  return { color: "#f59e0b", short: label.slice(0, 2).toUpperCase() };
}

function levelFor(pct: number): { label: string; tone: string } {
  if (pct >= 90) return { label: "Mastered", tone: "text-emerald-300" };
  if (pct >= 70) return { label: "Strong",   tone: "text-amber-300" };
  if (pct >= 40) return { label: "Building", tone: "text-orange-300" };
  return { label: "Starting", tone: "text-muted-foreground" };
}

export function SubjectProgressCard({ subjects, isPublic }: { subjects: Subject[]; isPublic?: boolean }) {
  const sorted = [...subjects].sort((a, b) => b.percent - a.percent);
  const avg = sorted.length ? Math.round(sorted.reduce((s, x) => s + x.percent, 0) / sorted.length) : 0;
  const mastered = sorted.filter((s) => s.percent >= 90).length;

  const header = sorted.length > 0 && (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-amber-200 tabular-nums">
        <GraduationCap className="h-3 w-3" /> {avg}% avg
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-emerald-200 tabular-nums">
        <Trophy className="h-3 w-3" /> {mastered}
      </span>
    </div>
  );

  return (
    <ProfileCard title="Subject Progress" rightSlot={header || undefined}>
      {sorted.length === 0 ? (
        <EmptyCard message={isPublic ? "No subject progress shared" : "Edit profile to show subject progress"} />
      ) : (
        <TooltipProvider delayDuration={150}>
          <ul className="space-y-2">
            {sorted.map((s, i) => {
              const meta = metaFor(s.label);
              const lvl = levelFor(s.percent);
              const pct = Math.max(0, Math.min(100, s.percent));
              return (
                <li key={i}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="group rounded-lg border border-amber-400/10 bg-amber-500/[0.03] hover:bg-amber-500/[0.07] hover:border-amber-400/25 transition-colors px-2.5 py-2 flex items-center gap-2.5"
                      >
                        <span
                          className="grid place-items-center h-7 w-7 rounded-md text-[10px] font-bold shrink-0 ring-1"
                          style={{
                            color: meta.color,
                            backgroundColor: `${meta.color}1a`,
                            boxShadow: `inset 0 0 8px ${meta.color}22`,
                            borderColor: `${meta.color}40`,
                          }}
                        >
                          {meta.short}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="truncate text-[12.5px] font-medium text-foreground/90">{s.label}</span>
                            <span className="tabular-nums text-[11px] text-muted-foreground shrink-0">
                              {Math.round(pct)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-[width] duration-500"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${meta.color}cc, ${meta.color})`,
                                boxShadow: `0 0 8px ${meta.color}66`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="font-semibold" style={{ color: meta.color }}>{s.label}</div>
                      <div className={`mt-0.5 ${lvl.tone}`}>{lvl.label} · {Math.round(pct)}%</div>
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <BookOpen className="h-3 w-3 text-amber-400/70" />
            {sorted.length} subject{sorted.length === 1 ? "" : "s"} tracked
          </p>
        </TooltipProvider>
      )}
    </ProfileCard>
  );
}


export interface ColoredSkill { name: string; color: string; hint?: string; count?: number; percent?: number }

export function SkillsCard({
  skills,
  isPublic,
  languages,
  selectedLanguage,
  onSelectLanguage,
  lastUpdated,
  onRefresh,
  isRefreshing,
}: {
  skills: string[];
  isPublic?: boolean;
  languages?: ColoredSkill[];
  selectedLanguage?: string | null;
  onSelectLanguage?: (name: string | null) => void;
  lastUpdated?: number | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  const sortedLangs = (languages ?? []).slice().sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
  const hasAny = skills.length > 0 || sortedLangs.length > 0;
  const totalRepos = sortedLangs.reduce((s, l) => s + (l.count ?? 0), 0);
  const clickable = !!onSelectLanguage;

  const header = (
    <div className="flex items-center gap-1.5">
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh skills data"
          className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-amber-400/25 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors disabled:opacity-60 focus-parikshaa"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      )}
    </div>
  );

  return (
    <ProfileCard title="Skills" rightSlot={header}>
      {!hasAny ? (
        <EmptyCard message={isPublic ? "No skills listed" : "Edit profile to add skills"} />
      ) : (
        <TooltipProvider delayDuration={150}>
          <div className="space-y-4">
            {sortedLangs.length > 0 && (
              <section>
                {/* Section head */}
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1.5">
                    <Code2 className="h-3 w-3 text-amber-400/80" />
                    Top languages
                  </p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {sortedLangs.length} lang{sortedLangs.length === 1 ? "" : "s"}
                    {totalRepos > 0 && <> · {totalRepos} repo{totalRepos === 1 ? "" : "s"}</>}
                  </p>
                </div>

                {/* Segmented language bar */}
                <div
                  className="flex h-2 w-full overflow-hidden rounded-full bg-muted/30 ring-1 ring-amber-400/10"
                  role="img"
                  aria-label="Language distribution"
                >
                  {sortedLangs.map((l) => (
                    <Tooltip key={l.name}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={clickable ? () => onSelectLanguage!(selectedLanguage === l.name ? null : l.name) : undefined}
                          disabled={!clickable}
                          aria-label={`${l.name} ${l.percent ?? 0}%`}
                          className={`h-full transition-opacity ${clickable ? "cursor-pointer hover:opacity-90" : "cursor-default"} ${
                            selectedLanguage && selectedLanguage !== l.name ? "opacity-30" : "opacity-100"
                          }`}
                          style={{ width: `${l.percent ?? 0}%`, backgroundColor: l.color }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <span className="font-semibold" style={{ color: l.color }}>{l.name}</span>
                        <span className="text-muted-foreground"> · {l.percent ?? 0}%</span>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                {/* Legend list */}
                <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                  {sortedLangs.map((l) => {
                    const active = selectedLanguage === l.name;
                    return (
                      <li key={l.name}>
                        <button
                          type="button"
                          onClick={clickable ? () => onSelectLanguage!(active ? null : l.name) : undefined}
                          disabled={!clickable}
                          aria-pressed={active}
                          className={`group flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-[12px] transition-colors focus-parikshaa ${
                            clickable ? "hover:bg-amber-500/[0.06]" : "cursor-default"
                          } ${active ? "bg-amber-500/[0.10]" : ""} ${
                            selectedLanguage && !active ? "opacity-60" : ""
                          }`}
                        >
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: l.color, boxShadow: `0 0 6px ${l.color}80` }}
                          />
                          <span className="truncate flex-1 text-left text-foreground/90">{l.name}</span>
                          {l.percent != null && (
                            <span className="tabular-nums text-muted-foreground shrink-0">{l.percent}%</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {selectedLanguage && clickable && (
                  <button
                    onClick={() => onSelectLanguage!(null)}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-200 focus-parikshaa rounded px-1.5 py-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                    Clear filter
                  </button>
                )}
              </section>
            )}

            {skills.length > 0 && (
              <section>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 inline-flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-400/70" />
                  Other skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => (
                    <span
                      key={i}
                      title={s}
                      className="inline-flex items-center h-6 max-w-full px-2.5 rounded-full text-[11px] leading-4 border border-amber-400/25 bg-amber-500/[0.06] text-foreground/90 hover:border-amber-400/40 hover:bg-amber-500/[0.10] transition-colors truncate"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {lastUpdated && (
              <p className="pt-2 border-t border-amber-400/10 text-[10.5px] text-muted-foreground">
                Updated {formatRelative(new Date(lastUpdated).toISOString())}
              </p>
            )}
          </div>
        </TooltipProvider>
      )}
    </ProfileCard>
  );
}

