import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Lightbulb,
  Sparkles,
  Compass,
  Star,
  ExternalLink,
  Check,
  X,
  Filter,
  EyeOff,
  Palette,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,

} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SectionEyebrow } from "@/components/landing/SectionEyebrow";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BEGINNER_GUIDANCE,
  BEGINNER_NEXT_STEPS,
  BEGINNER_ROADMAP,
  type RoadmapDifficulty,
  type RoadmapProblem,
} from "@/data/beginnerRoadmap";
import { PROBLEM_HINTS } from "@/data/problemHints";
import {
  TOPIC_BADGE_BASE_CLASSNAME,
  colorForTopic,
} from "@/config/topicBadgePalette";
import {
  companiesForSlug,
  type CompanyRef,
} from "@/data/problemCompaniesMap";
import { useProblemCompaniesContext } from "@/hooks/useProblemCompanies";
import { CODING_PROBLEMS } from "@/data/codingProblemsData";
import { ROADMAP_PROBLEM_TOPICS } from "@/data/roadmapProblemTopics";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCodingProblemBookmarks } from "@/hooks/useCodingProblemBookmarks";
import { ProblemNoteQuickEdit } from "@/components/library/coding/ProblemNoteQuickEdit";
import { useProblemNotes } from "@/hooks/useProblemNotes";
import { CompanyLogos } from "@/components/library/coding/CompanyLogos";

// Namespace for the revision store — beginner and experienced stay separate.
const RevisionNsContext = createContext<string | undefined>(undefined);


interface Props {
  isSolved: (slug: string) => boolean;
  problemExists?: (slug: string) => boolean;
  eyebrow?: string;
  title?: string;
  guidance?: string[];
  nextSteps?: string[];
  data?: RoadmapDifficulty[];
  /** localStorage namespace, e.g. "beginner" or "experienced". */
  storageKey?: string;
}

// ---------- Difficulty tokens ----------
type DiffKey = "Easy" | "Medium" | "Hard";
const DIFF_STYLES: Record<
  DiffKey,
  { pillBg: string; pillText: string; cardBorder: string; cardGlow: string; bar: string }
> = {
  Easy: {
    pillBg: "bg-emerald-500/20",
    pillText: "text-emerald-400",
    cardBorder: "border-emerald-500/30",
    cardGlow: "shadow-[0_0_40px_-10px_rgba(16,185,129,0.35)]",
    bar: "bg-emerald-500",
  },
  Medium: {
    pillBg: "bg-amber-500/20",
    pillText: "text-amber-400",
    cardBorder: "border-amber-500/30",
    cardGlow: "shadow-[0_0_40px_-10px_rgba(245,158,11,0.35)]",
    bar: "bg-amber-500",
  },
  Hard: {
    pillBg: "bg-rose-500/20",
    pillText: "text-rose-400",
    cardBorder: "border-rose-500/30",
    cardGlow: "shadow-[0_0_40px_-10px_rgba(244,63,94,0.35)]",
    bar: "bg-rose-500",
  },
};

// ---------- localStorage helpers ----------
// Shared keys — completion/hint state is global (Beginner and Experienced share
// it) so marking a problem done in one roadmap updates the other instantly.
const COMPLETION_KEY = "roadmap-completion-v1";
const HINTS_OPEN_KEY = "roadmap-hints-open-v1";
const HINT_CACHE_KEY = "roadmap-hint-cache-v1";
const COMPANY_FILTER_KEY = "roadmap-company-filter-v1";

function useLocalSet(key: string): [Set<string>, (slug: string) => void, (slug: string) => boolean] {
  const readSet = (): Set<string> => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  };
  const [set, setSet] = useState<Set<string>>(readSet);

  // Cross-tab / cross-instance sync via the browser's storage event.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setSet(readSet());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(Array.from(set)));
      // Notify same-tab listeners (storage event only fires cross-tab).
      window.dispatchEvent(new CustomEvent(`local-set:${key}`));
    } catch {
      /* ignore quota */
    }
  }, [key, set]);

  useEffect(() => {
    const onLocal = () => setSet(readSet());
    window.addEventListener(`local-set:${key}`, onLocal as EventListener);
    return () =>
      window.removeEventListener(`local-set:${key}`, onLocal as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const toggle = useCallback((slug: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);
  const has = useCallback((slug: string) => set.has(slug), [set]);
  return [set, toggle, has];
}

// Persisted JSON value.
function useLocalJson<T>(key: string, initial: T): [T, (v: T) => void] {
  const read = (): T => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  };
  const [value, setValue] = useState<T>(read);
  useEffect(() => {
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      /* ignore */
    }
  }, [key, value]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, setValue];
}

// Cached AI-generated hints: slug -> hint string.
function useHintCache(): [Record<string, string>, (slug: string, hint: string) => void] {
  const read = (): Record<string, string> => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(HINT_CACHE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  };
  const [cache, setCache] = useState<Record<string, string>>(read);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === HINT_CACHE_KEY) setCache(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const set = useCallback((slug: string, hint: string) => {
    setCache((prev) => {
      const next = { ...prev, [slug]: hint };
      try {
        window.localStorage.setItem(HINT_CACHE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  return [cache, set];
}

// ---------- Company logos (clickable) ----------
const LOGO_DEV_TOKEN = import.meta.env
  .VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as string | undefined;

const logoSrc = (domain: string, size = 20): string => {
  const px = Math.max(32, size * 2);
  return LOGO_DEV_TOKEN
    ? `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=${px}&format=png&retina=true`
    : `https://www.google.com/s2/favicons?sz=${px}&domain=${domain}`;
};

function CompanyChip({
  c,
  active,
  onClick,
}: {
  c: CompanyRef;
  active: boolean;
  onClick: (c: CompanyRef) => void;
}) {
  const [failed, setFailed] = useState(false);
  const initial = c.name.charAt(0).toUpperCase();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick(c);
          }}
          aria-label={`Filter by ${c.name}`}
          className={cn(
            "relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-white ring-1 transition",
            active
              ? "ring-2 ring-amber-400"
              : "ring-zinc-800 hover:ring-amber-500/60",
          )}
        >
          {failed ? (
            <span
              className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white"
              style={{ background: `hsl(${(c.name.charCodeAt(0) * 47) % 360} 55% 40%)` }}
              aria-hidden
            >
              {initial}
            </span>
          ) : (
            <img
              src={logoSrc(c.domain)}
              alt=""
              className="h-full w-full object-contain p-[2px]"
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <span className="block font-medium">{c.name}</span>
        <span className="block text-muted-foreground">
          asked {c.frequency} times in the last 6 months
        </span>
        <span className="mt-1 block text-[10px] text-amber-400">
          Click to filter
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

// ---------- Topic pills ----------
function TopicTags({ slug }: { slug: string }) {
  const topics = useMemo(() => {
    const p = CODING_PROBLEMS.find((x) => x.slug === slug);
    const fromCp = p?.topics ?? [];
    if (fromCp.length) return fromCp;
    return ROADMAP_PROBLEM_TOPICS[slug] ?? [];
  }, [slug]);
  if (!topics.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {topics.map((t) => (
        <span
          key={t}
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
            TOPIC_BADGE_BASE_CLASSNAME,
            colorForTopic(t),
          )}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

// ---------- Topic color legend ----------
function TopicColorLegend({ topics }: { topics: string[] }) {
  if (!topics.length) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Show topic color legend"
          title="Topic color legend"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/70 bg-zinc-900/40 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:text-zinc-200"
        >
          <Palette className="h-3.5 w-3.5" />
          Legend
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-72 max-h-80 overflow-y-auto p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Topic colors ({topics.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <span
              key={t}
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                TOPIC_BADGE_BASE_CLASSNAME,
                colorForTopic(t),
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-2 border-t border-zinc-800/60 pt-2 text-[10px] text-zinc-500">
          Each topic maps to a fixed color across the app.
        </p>
      </PopoverContent>
    </Popover>
  );
}

// Merge real + fallback companies for a slug.
function useCompanies(slug: string, count = 8): CompanyRef[] {
  const realMap = useProblemCompaniesContext();
  return useMemo(() => {
    const real = realMap?.get(slug) ?? [];
    const seen = new Set<string>();
    const out: CompanyRef[] = [];
    for (const c of real) {
      if (seen.has(c.domain)) continue;
      seen.add(c.domain);
      out.push(c);
      if (out.length >= count) return out;
    }
    for (const c of companiesForSlug(slug, count + 4)) {
      if (seen.has(c.domain)) continue;
      seen.add(c.domain);
      out.push(c);
      if (out.length >= count) break;
    }
    return out;
  }, [realMap, slug, count]);
}

// ---------- Problem row (table row) ----------
function ProblemRow({
  problem,
  index,
  solved,
  exists,
  onToggleComplete,
  hintOpen,
  onToggleHint,
  companyFilter,
  onCompanyClick,
}: {
  problem: RoadmapProblem;
  index: number;
  difficulty: string;
  solved: boolean;
  exists: boolean;
  onToggleComplete: (slug: string) => void;
  hintOpen: boolean;
  onToggleHint: (slug: string) => void;
  companyFilter: string | null;
  onCompanyClick: (c: CompanyRef) => void;
  cachedHint: string | undefined;
  onCachedHint: (slug: string, hint: string) => void;
}) {
  const companies = useCompanies(problem.slug, 8);
  const ns = useContext(RevisionNsContext);
  const { isBookmarked, toggle: toggleRevision } = useCodingProblemBookmarks(ns);
  const { note } = useProblemNotes(problem.slug);
  const bookmarked = isBookmarked(problem.slug);
  const hasNote = note.trim().length > 0;
  const displayHint = problem.hint ?? PROBLEM_HINTS[problem.slug];

  const titleColor = solved
    ? "text-emerald-400"
    : exists
    ? "text-sky-400 group-hover:text-sky-300"
    : "text-zinc-400";

  return (
    <>
      <tr className="group border-b border-zinc-800/40 align-middle transition-colors hover:bg-zinc-900/40">
        {/* Status */}
        <td className="px-3 py-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleComplete(problem.slug);
            }}
            aria-label={solved ? "Mark as not completed" : "Mark as completed"}
            title={solved ? "Mark as not completed" : "Mark as completed"}
            className={cn(
              "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition",
              solved
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                : "border-zinc-600 bg-transparent hover:border-emerald-400",
            )}
          >
            {solved && <Check className="h-3 w-3" strokeWidth={3} />}
          </button>
        </td>
        {/* # */}
        <td className="hidden sm:table-cell px-2 py-3 text-center text-xs tabular-nums text-zinc-500">{index}</td>
        {/* Title */}
        <td className="px-3 py-3 min-w-[180px] max-w-[280px]">
          {exists ? (
            <Link
              to={`/library/problems/${problem.slug}`}
              className={cn("block truncate text-sm font-semibold hover:underline", titleColor)}
            >
              {problem.title}
            </Link>
          ) : (
            <span className={cn("block truncate text-sm font-semibold", titleColor)}>{problem.title}</span>
          )}
          {/* Compact topics preview on mobile only, since Topics column is hidden */}
          <div className="mt-1 md:hidden">
            <TopicTags slug={problem.slug} />
          </div>
        </td>
        {/* Topics */}
        <td className="hidden md:table-cell px-3 py-3">
          <TopicTags slug={problem.slug} />
        </td>
        {/* Companies — identical rendering to All Problems tab */}
        <td className="hidden md:table-cell px-3 py-3">
          <CompanyLogos slug={problem.slug} min={2} max={10} size={20} />
        </td>


        {/* Hint */}
        <td className="px-3 py-3">
          <button
            type="button"
            onClick={() => onToggleHint(problem.slug)}
            aria-expanded={hintOpen}
            className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-400 hover:bg-amber-500/15"
          >
            <Lightbulb className="h-3 w-3" />
            {hintOpen ? "Hide" : "Hint"}
            <ChevronDown className={cn("h-3 w-3 transition-transform", hintOpen && "rotate-180")} />
          </button>
        </td>
        {/* Revision */}
        <td className="px-2 py-3 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleRevision(problem.slug);
            }}
            className={cn(
              "rounded-md p-1 text-zinc-500 hover:bg-zinc-800/60 hover:text-amber-400",
              bookmarked && "text-amber-400",
            )}
            aria-label={bookmarked ? "Remove from Revision" : "Mark for Revision"}
            title={bookmarked ? "Click star again to remove from Revision" : "Mark for Revision"}
          >
            <Star className={cn("h-4 w-4", bookmarked && "fill-amber-400")} />
          </button>
        </td>
        {/* Note */}
        <td className="hidden sm:table-cell px-2 py-3 text-center">
          <span
            className={cn(
              "inline-flex items-center text-zinc-500",
              hasNote && "[&_svg]:text-amber-400",
            )}
          >
            <ProblemNoteQuickEdit slug={problem.slug} title={problem.title} />
          </span>
        </td>
        {/* Open */}
        <td className="px-2 py-3 text-center">
          <Link
            to={`/library/problems/${problem.slug}`}
            className="inline-flex rounded-md p-1 text-zinc-500 hover:bg-zinc-800/60 hover:text-amber-400"
            aria-label="Open problem"
            title="Open problem"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </td>
      </tr>
      {hintOpen && (
        <tr className="border-b border-zinc-800/40 bg-amber-500/[0.03]">
          <td colSpan={9} className="px-3 pb-3">
            <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-100/90">
              {displayHint ? (
                <span>{displayHint}</span>
              ) : (
                <span className="text-amber-300/70">No hint available.</span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}





// ---------- Phase block ----------
function PhaseBlock({
  phase,
  difficulty,
  problems,
  isCompleted,
  onToggleComplete,
  problemExists,
  hintOpenSet,
  onToggleHint,
  companyFilter,
  onCompanyClick,
  hintCache,
  onCachedHint,
}: {
  phase: (typeof BEGINNER_ROADMAP)[number]["phases"][number];
  difficulty: string;
  problems: RoadmapProblem[];
  isCompleted: (s: string) => boolean;
  onToggleComplete: (s: string) => void;
  problemExists: (s: string) => boolean;
  hintOpenSet: Set<string>;
  onToggleHint: (s: string) => void;
  companyFilter: string | null;
  onCompanyClick: (c: CompanyRef) => void;
  hintCache: Record<string, string>;
  onCachedHint: (slug: string, hint: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<
    { key: "index" | "status"; dir: "asc" | "desc" } | null
  >(null);
  const solvedCount = phase.problems.filter((p) => isCompleted(p.slug)).length;
  const cleanTitle = phase.title.replace(/^Phase\s+\d+\s*:\s*/i, "");

  // When a filter is active, force-open phases that still have visible rows.
  const effectiveOpen = open || (companyFilter !== null && problems.length > 0);

  const sortedProblems = useMemo(() => {
    if (!sort) return problems;
    const arr = problems.map((p, i) => ({ p, i }));
    arr.sort((a, b) => {
      let cmp = 0;
      if (sort.key === "index") cmp = a.i - b.i;
      else {
        const sa = isCompleted(a.p.slug) ? 1 : 0;
        const sb = isCompleted(b.p.slug) ? 1 : 0;
        cmp = sa - sb;
        if (cmp === 0) cmp = a.i - b.i;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr.map((x) => x.p);
  }, [problems, sort, isCompleted]);

  const toggleSort = (key: "index" | "status") => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const SortIcon = ({ colKey }: { colKey: "index" | "status" }) => {
    if (!sort || sort.key !== colKey)
      return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sort.dir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-amber-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-amber-400" />
    );
  };

  if (problems.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))]/40 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={effectiveOpen}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03]"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
          {phase.index}
        </span>
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <h4 className="truncate text-[15px] font-semibold text-foreground">
            {cleanTitle}
          </h4>
          <span className="text-xs text-muted-foreground">
            {solvedCount}/{phase.problems.length}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            effectiveOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {effectiveOpen && (
        <div className="border-t border-white/[0.06]">
          {phase.description && (
            <p className="px-4 pb-2 pt-3 text-xs text-muted-foreground">
              {phase.description}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.03] text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium w-10">
                    <button
                      type="button"
                      onClick={() => toggleSort("status")}
                      className="inline-flex items-center gap-1 hover:text-zinc-200"
                      aria-label="Sort by status"
                    >
                      Status <SortIcon colKey="status" />
                    </button>
                  </th>
                  <th className="hidden sm:table-cell px-2 py-2 text-center font-medium w-10">
                    <button
                      type="button"
                      onClick={() => toggleSort("index")}
                      className="inline-flex items-center gap-1 hover:text-zinc-200"
                      aria-label="Sort by number"
                    >
                      # <SortIcon colKey="index" />
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Title</th>
                  <th className="hidden md:table-cell px-3 py-2 text-left font-medium">Topics</th>
                  <th className="hidden md:table-cell px-3 py-2 text-left font-medium">Companies</th>
                  <th className="px-3 py-2 text-left font-medium w-20">Hint</th>
                  <th className="px-2 py-2 text-center font-medium w-16">Revision</th>
                  <th className="hidden sm:table-cell px-2 py-2 text-center font-medium w-12">Note</th>
                  <th className="px-2 py-2 text-center font-medium w-12">Open</th>
                </tr>
              </thead>
              <tbody>
                {sortedProblems.map((p, i) => (
                  <ProblemRow
                    key={p.slug}
                    problem={p}
                    index={i + 1}
                    difficulty={difficulty}
                    solved={isCompleted(p.slug)}
                    exists={problemExists(p.slug)}
                    onToggleComplete={onToggleComplete}
                    hintOpen={hintOpenSet.has(p.slug)}
                    onToggleHint={onToggleHint}
                    companyFilter={companyFilter}
                    onCompanyClick={onCompanyClick}
                    cachedHint={hintCache[p.slug]}
                    onCachedHint={onCachedHint}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


    </section>
  );
}

// ---------- Revision flat table (all bookmarked problems across phases) ----------
function RevisionFlatTable({
  rows,
  isCompleted,
  onToggleComplete,
  problemExists,
  hintOpenSet,
  onToggleHint,
  companyFilter,
  onCompanyClick,
  hintCache,
  onCachedHint,
  onClearRevision,
}: {
  rows: { problem: RoadmapProblem; difficulty: string; phaseTitle: string; phaseIndex: number }[];
  isCompleted: (s: string) => boolean;
  onToggleComplete: (s: string) => void;
  problemExists: (s: string) => boolean;
  hintOpenSet: Set<string>;
  onToggleHint: (s: string) => void;
  companyFilter: string | null;
  onCompanyClick: (c: CompanyRef) => void;
  hintCache: Record<string, string>;
  onCachedHint: (slug: string, hint: string) => void;
  onClearRevision: () => void;
}) {
  // Group by difficulty → phase (same layout language as sheets Revision tab)
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, typeof rows>>();
    for (const r of rows) {
      if (!map.has(r.difficulty)) map.set(r.difficulty, new Map());
      const phaseMap = map.get(r.difficulty)!;
      const key = `${r.phaseIndex}::${r.phaseTitle}`;
      if (!phaseMap.has(key)) phaseMap.set(key, []);
      phaseMap.get(key)!.push(r);
    }
    return map;
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.08] bg-[hsl(var(--card))]/40 backdrop-blur-sm px-6 py-16 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Star className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No problems in Revision yet</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Click the star icon next to any problem to add it here. Great for problems you want to revisit before an interview.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-2 text-amber-200">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <strong className="font-semibold">{rows.length}</strong> problem{rows.length === 1 ? "" : "s"} marked for revision
        </span>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Remove all problems from Revision?")) onClearRevision();
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10"
        >
          <X className="h-3.5 w-3.5" /> Clear all
        </button>
      </div>

      {[...grouped.entries()].map(([diff, phaseMap]) => {
        const styles = DIFF_STYLES[diff as DiffKey];
        const total = [...phaseMap.values()].reduce((n, arr) => n + arr.length, 0);
        return (
          <section key={diff} className="space-y-3">
            <div className={cn("flex items-center gap-3 rounded-xl border bg-[hsl(var(--card))]/40 backdrop-blur-sm px-4 py-2.5", styles.cardBorder)}>
              <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", styles.pillBg, styles.pillText)}>
                {diff}
              </span>
              <span className="text-xs text-muted-foreground">{total} problem{total === 1 ? "" : "s"}</span>
            </div>

            {[...phaseMap.entries()].map(([key, phaseRows]) => {
              const [, phaseTitle] = key.split("::");
              const cleanTitle = phaseTitle.replace(/^Phase\s+\d+\s*:\s*/i, "");
              return (
                <div key={key} className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))]/40 backdrop-blur-sm">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
                    <h4 className="truncate text-[13px] font-semibold text-foreground">{cleanTitle}</h4>
                    <span className="text-xs text-muted-foreground">({phaseRows.length})</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.03] text-[11px] uppercase tracking-wider text-muted-foreground">
                          <th className="px-3 py-2 text-left font-medium w-10">Status</th>
                          <th className="hidden sm:table-cell px-2 py-2 text-center font-medium w-10">#</th>
                          <th className="px-3 py-2 text-left font-medium">Title</th>
                          <th className="hidden md:table-cell px-3 py-2 text-left font-medium">Topics</th>
                          <th className="hidden md:table-cell px-3 py-2 text-left font-medium">Companies</th>
                          <th className="px-3 py-2 text-left font-medium w-20">Hint</th>
                          <th className="px-2 py-2 text-center font-medium w-16">Revision</th>
                          <th className="hidden sm:table-cell px-2 py-2 text-center font-medium w-12">Note</th>
                          <th className="px-2 py-2 text-center font-medium w-12">Open</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phaseRows.map((r, i) => (
                          <ProblemRow
                            key={r.problem.slug}
                            problem={r.problem}
                            index={i + 1}
                            difficulty={r.difficulty}
                            solved={isCompleted(r.problem.slug)}
                            exists={problemExists(r.problem.slug)}
                            onToggleComplete={onToggleComplete}
                            hintOpen={hintOpenSet.has(r.problem.slug)}
                            onToggleHint={onToggleHint}
                            companyFilter={companyFilter}
                            onCompanyClick={onCompanyClick}
                            cachedHint={hintCache[r.problem.slug]}
                            onCachedHint={onCachedHint}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

// ---------- Hero-styled roadmap header (mirrors landing ApexHero) ----------
function Shimmer({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <span className="relative inline-block px-3 py-0.5 align-baseline">
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/25"
      />
      <span
        className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent"
        style={{
          backgroundSize: "200% auto",
          animation: reduced ? "none" : "apex-shimmer 6s linear infinite",
        }}
      >
        {children}
      </span>
    </span>
  );
}

interface HeroStyleRoadmapHeaderProps {
  eyebrow: string;
  title: string;
  revisionCount: number;
  allTopics: string[];
  incompleteOnly: boolean;
  setIncompleteOnly: (v: boolean) => void;
  companyFilter: { domain: string; name: string } | null;
  clearFilter: () => void;
  guidance: string[];
  guidanceOpen: boolean;
  setGuidanceOpen: (fn: (o: boolean) => boolean) => void;
}

function HeroStyleRoadmapHeader({
  eyebrow,
  title,
  revisionCount,
  allTopics,
  incompleteOnly,
  setIncompleteOnly,
  companyFilter,
  clearFilter,
  guidance,
  guidanceOpen,
  setGuidanceOpen,
}: HeroStyleRoadmapHeaderProps) {
  // Split the sentence so we can shimmer the emphatic word, matching the hero.
  const words = title.trim().split(/\s+/);
  const lastWord = words.pop() ?? "";
  const leading = words.join(" ");

  return (
    <header className="relative isolate overflow-hidden rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))]/40 px-5 pb-6 pt-8 sm:px-8 sm:pt-10">
      {/* Radial rays backdrop — identical recipe to ApexHero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 0%, hsl(var(--primary)/0.28), transparent 65%)",
        }}
      />
      {/* Faint diagonal streaks — identical recipe to ApexHero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
          maskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
        }}
      />

      {/* Eyebrow + headline — centered like the hero */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="mb-3">
          <SectionEyebrow kicker="01" label={eyebrow} />
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", textWrap: "balance" }}
          className="text-3xl font-black leading-[1.02] tracking-[-0.03em] text-foreground sm:text-4xl md:text-5xl"
        >
          {leading}{" "}
          <Shimmer>{lastWord}</Shimmer>
        </motion.h2>

        {/* Control chips — styled like the hero marquee pills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-2"
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur-sm"
            title={`${revisionCount} problem${revisionCount === 1 ? "" : "s"} marked for revision in this roadmap`}
          >
            <Star className={cn("h-3.5 w-3.5", revisionCount > 0 && "fill-primary")} />
            Revision <span className="tabular-nums">{revisionCount}</span>
          </span>
          <TopicColorLegend topics={allTopics} />
          <button
            type="button"
            onClick={() => setIncompleteOnly(!incompleteOnly)}
            role="switch"
            aria-checked={incompleteOnly}
            aria-label="Show only incomplete problems"
            title="Show only incomplete problems"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors",
              incompleteOnly
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border/60 bg-card/40 text-foreground/85 hover:border-primary/40 hover:text-primary",
            )}
          >
            <EyeOff className="h-3.5 w-3.5" />
            Show only incomplete
            <span
              className={cn(
                "ml-1 inline-flex h-3.5 w-6 items-center rounded-full p-[2px] transition",
                incompleteOnly ? "bg-primary" : "bg-muted",
              )}
              aria-hidden
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full bg-white transition-transform",
                  incompleteOnly ? "translate-x-2.5" : "translate-x-0",
                )}
              />
            </span>
          </button>
          {companyFilter && (
            <button
              type="button"
              onClick={clearFilter}
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
              aria-label="Reset company filter"
              title="Reset filter"
            >
              <X className="h-3.5 w-3.5" /> Reset filter
            </button>
          )}
        </motion.div>
      </div>

      {/* Trust-bar style divider, then the Parikshaa Guidance panel */}
      <div className="relative z-10 mt-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border/70" />
        <SectionEyebrow dot label="Parikshaa Guidance" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border/70" />
      </div>
      <div className="relative z-10 mt-3 rounded-xl border border-white/[0.06] bg-[hsl(var(--card))]/60 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setGuidanceOpen((o) => !o)}
          aria-expanded={guidanceOpen}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">How to use this roadmap</span>
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 text-muted-foreground transition-transform",
              guidanceOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {guidanceOpen && (
          <ol className="list-decimal space-y-2 border-t border-white/[0.06] px-8 py-3 text-sm text-muted-foreground">
            {guidance.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ol>
        )}
      </div>
    </header>
  );
}

// ---------- Main view ----------
export default function BeginnerRoadmapView({
  isSolved,
  problemExists = () => true,
  eyebrow = "Beginner Roadmap",
  title = "A structured path for those new to coding interviews.",
  guidance = BEGINNER_GUIDANCE,
  nextSteps = BEGINNER_NEXT_STEPS,
  data = BEGINNER_ROADMAP,
  storageKey = "beginner",
}: Props) {
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  // Shared keys so Beginner and Experienced stay in lock-step.
  const [, toggleLocal, hasLocal] = useLocalSet(COMPLETION_KEY);
  const [hintSet, onToggleHint] = useLocalSet(HINTS_OPEN_KEY);
  const [hintCache, setCachedHint] = useHintCache();
  const [incompleteOnly, setIncompleteOnly] = useLocalJson<boolean>(
    `roadmap-incomplete-only-v1:${storageKey}`,
    false,
  );

  // Persisted company filter — survives refresh.
  const [companyFilter, setCompanyFilter] = useLocalJson<{
    domain: string;
    name: string;
  } | null>(COMPANY_FILTER_KEY, null);

  const isCompleted = useCallback(
    (slug: string) => hasLocal(slug) || isSolved(slug),
    [hasLocal, isSolved],
  );
  const onToggleComplete = useCallback(
    (slug: string) => toggleLocal(slug),
    [toggleLocal],
  );

  const realMap = useProblemCompaniesContext();
  const companyMatches = useCallback(
    (slug: string, domain: string): boolean => {
      const real = realMap?.get(slug) ?? [];
      if (real.some((c) => c.domain === domain)) return true;
      return companiesForSlug(slug, 8).some((c) => c.domain === domain);
    },
    [realMap],
  );

  const onCompanyClick = useCallback(
    (c: CompanyRef) => {
      setCompanyFilter(
        companyFilter?.domain === c.domain
          ? null
          : { domain: c.domain, name: c.name },
      );
    },
    [companyFilter, setCompanyFilter],
  );
  const clearFilter = useCallback(() => setCompanyFilter(null), [setCompanyFilter]);

  // Filtered problems per phase.
  const filterProblems = useCallback(
    (probs: RoadmapProblem[]) => {
      let out = probs;
      if (companyFilter)
        out = out.filter((p) => companyMatches(p.slug, companyFilter.domain));
      if (incompleteOnly) out = out.filter((p) => !isCompleted(p.slug));
      return out;
    },
    [companyFilter, companyMatches, incompleteOnly, isCompleted],
  );

  // Unique sorted topics across every problem in the roadmap → legend content.
  const allTopics = useMemo(() => {
    const set = new Set<string>();
    for (const diff of data) {
      for (const phase of diff.phases) {
        for (const p of phase.problems) {
          const cp = CODING_PROBLEMS.find((x) => x.slug === p.slug);
          const topics = cp?.topics?.length ? cp.topics : ROADMAP_PROBLEM_TOPICS[p.slug] ?? [];
          topics.forEach((t) => t && set.add(t));
        }
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const { count: revisionCount, bookmarks, isBookmarked, toggle: toggleRevision } = useCodingProblemBookmarks(storageKey);
  const [activeTab, setActiveTab] = useState<"all" | "revision">("all");

  // Flat list of bookmarked problems across all phases (for Revision tab)
  const revisionProblems = useMemo(() => {
    const rows: { problem: RoadmapProblem; difficulty: string; phaseTitle: string; phaseIndex: number }[] = [];
    for (const diff of data) {
      for (const phase of diff.phases) {
        for (const p of phase.problems) {
          if (bookmarks.has(p.slug)) {
            rows.push({ problem: p, difficulty: diff.difficulty, phaseTitle: phase.title, phaseIndex: phase.index });
          }
        }
      }
    }
    return rows;
  }, [data, bookmarks]);

  return (
    <RevisionNsContext.Provider value={storageKey}>
    <TooltipProvider delayDuration={100}>
      <div className="space-y-8">
        {/* Header */}
        <HeroStyleRoadmapHeader
          eyebrow={eyebrow}
          title={title}
          revisionCount={revisionCount}
          allTopics={allTopics}
          incompleteOnly={incompleteOnly}
          setIncompleteOnly={setIncompleteOnly}
          companyFilter={companyFilter}
          clearFilter={clearFilter}
          guidance={guidance}
          guidanceOpen={guidanceOpen}
          setGuidanceOpen={setGuidanceOpen}
        />

        {/* Active filter chip */}
        {companyFilter && (
          <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-200">
            <span className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtered by{" "}
              <strong className="font-semibold">{companyFilter.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => setCompanyFilter(null)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
        )}

        {/* Tabs: All / Revision (matches sheets style) */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-[hsl(var(--card))]/40 backdrop-blur-sm p-1 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
              activeTab === "all"
                ? "bg-gradient-to-r from-primary via-orange-400 to-primary text-primary-foreground shadow-[0_0_24px_-6px_hsl(var(--primary)/0.55)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Compass className="h-3.5 w-3.5" /> All
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("revision")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
              activeTab === "revision"
                ? "bg-gradient-to-r from-primary via-orange-400 to-primary text-primary-foreground shadow-[0_0_24px_-6px_hsl(var(--primary)/0.55)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Star className={cn("h-3.5 w-3.5", activeTab === "revision" && "fill-current")} />
            Revision
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  role="status"
                  aria-live="polite"
                  aria-label={`${revisionCount} problem${revisionCount === 1 ? "" : "s"} marked for revision`}
                  className={cn(
                    "ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                    activeTab === "revision"
                      ? "bg-white/20 text-white"
                      : revisionCount > 0
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-zinc-800 text-zinc-500",
                  )}
                >
                  {revisionCount}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {revisionCount} problem{revisionCount === 1 ? "" : "s"} marked for revision
              </TooltipContent>
            </Tooltip>
          </button>
          {revisionCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Remove all ${revisionCount} problem${revisionCount === 1 ? "" : "s"} from Revision?`)) {
                      bookmarks.forEach((s) => toggleRevision(s));
                    }
                  }}
                  aria-label="Clear all marked problems"
                  className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-rose-300"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear all</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Clear all marked problems
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {activeTab === "revision" ? (
          <RevisionFlatTable
            rows={revisionProblems}
            isCompleted={isCompleted}
            onToggleComplete={onToggleComplete}
            problemExists={problemExists}
            hintOpenSet={hintSet}
            onToggleHint={onToggleHint}
            companyFilter={companyFilter?.domain ?? null}
            onCompanyClick={onCompanyClick}
            hintCache={hintCache}
            onCachedHint={setCachedHint}
            onClearRevision={() => bookmarks.forEach((s) => toggleRevision(s))}
          />
        ) : (
        <>
        {/* Difficulty sections */}
        {data.map((d) => {
          const allProbs = d.phases.flatMap((p) => p.problems);
          const t = allProbs.length;
          const done = allProbs.filter((p) => isCompleted(p.slug)).length;
          const pctD = t ? Math.round((done / t) * 100) : 0;
          const styles = DIFF_STYLES[d.difficulty as DiffKey];

          return (
            <section key={d.difficulty} className="space-y-4">
              <div
                className={cn(
                  "rounded-2xl border bg-[hsl(var(--card))]/40 backdrop-blur-sm px-4 py-3.5",
                  styles.cardBorder,
                  styles.cardGlow,
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                      styles.pillBg,
                      styles.pillText,
                    )}
                  >
                    {d.difficulty}
                  </span>
                  <span className="text-sm text-foreground/80">
                    {done}/{t} completed{" "}
                    <span className="text-muted-foreground">({pctD}%)</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={cn("h-full transition-all", styles.bar)}
                    style={{ width: `${pctD}%` }}
                  />
                </div>
              </div>

              {d.blurb && (
                <p className="px-1 text-xs text-muted-foreground">{d.blurb}</p>
              )}

              <div className="space-y-3">
                {d.phases.map((p, i) => (
                  <PhaseBlock
                    key={`${d.difficulty}-${p.index}-${i}`}
                    phase={p}
                    difficulty={d.difficulty}
                    problems={filterProblems(p.problems)}
                    isCompleted={isCompleted}
                    onToggleComplete={onToggleComplete}
                    problemExists={problemExists}
                    hintOpenSet={hintSet}
                    onToggleHint={onToggleHint}
                    companyFilter={companyFilter?.domain ?? null}
                    onCompanyClick={onCompanyClick}
                    hintCache={hintCache}
                    onCachedHint={setCachedHint}
                  />
                ))}
              </div>
            </section>
          );
        })}
        </>
        )}



        {/* Next Steps */}
        <section className="relative isolate overflow-hidden rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))]/40 backdrop-blur-sm p-5">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 opacity-[0.25]"
            style={{
              background:
                "radial-gradient(ellipse 60% 55% at 50% 0%, hsl(var(--primary)/0.28), transparent 65%)",
            }}
          />
          <h3 className="text-lg font-bold text-foreground">Next Steps</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            What to do after completing this roadmap
          </p>
          <ol className="mt-3 space-y-2">
            {nextSteps.map((s, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-white/[0.06] bg-[hsl(var(--card))]/60 backdrop-blur-sm p-3 text-sm text-foreground/85"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </TooltipProvider>
    </RevisionNsContext.Provider>
  );
}
