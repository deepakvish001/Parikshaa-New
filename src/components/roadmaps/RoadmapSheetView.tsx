import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Search,
  ListChecks,
  Sparkles,
  CheckCircle2,
  Circle,
  Filter,
  Target,
  Flame,
  Trophy,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RoadmapSection } from "@/lib/roadmaps/parseSections";

interface Props {
  slug: string;
  sections: RoadmapSection[];
  isLoading?: boolean;
}

type StatusFilter = "all" | "pending" | "completed";

const storageKey = (slug: string) => `roadmap:progress:${slug}`;
const uiStateKey = (slug: string) => `roadmap:ui:${slug}`;
const resourceKey = (sec: string, idx: number, name: string) => `${sec}::${idx}::${name}`;

const resourceWord = (count: number) => (count === 1 ? "resource" : "resources");

const completionLabel = ({
  completed,
  total,
  hasCompletionData,
}: {
  completed: number;
  total: number;
  hasCompletionData: boolean;
}) => {
  if (total === 0) return "No resources yet";
  if (!hasCompletionData) return `${total} ${resourceWord(total)} ready`;
  return `${completed}/${total} ${resourceWord(total)} complete`;
};

// Rotating amber/orange section accents (brand palette)
const SECTION_TONES = [
  { chip: "text-amber-300 border-amber-400/30 bg-amber-500/10", bar: "from-amber-400/80 to-orange-500/60" },
  { chip: "text-orange-300 border-orange-400/30 bg-orange-500/10", bar: "from-orange-400/80 to-amber-500/60" },
  { chip: "text-amber-200 border-amber-300/30 bg-amber-400/10", bar: "from-amber-300/80 to-orange-400/60" },
];

interface PersistedUI {
  status?: StatusFilter;
  openMap?: Record<string, boolean>;
  overviewMap?: Record<string, boolean>;
}

export function RoadmapSheetView({ slug, sections, isLoading = false }: Props) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.slice(0, 1).map((s) => [s.id, true])),
  );
  const [overviewMap, setOverviewMap] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  // Hydrate progress + UI state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(slug));
      if (raw) setDone(JSON.parse(raw));
      const uiRaw = localStorage.getItem(uiStateKey(slug));
      if (uiRaw) {
        const ui = JSON.parse(uiRaw) as PersistedUI;
        if (ui.status) setStatus(ui.status);
        if (ui.openMap) setOpenMap(ui.openMap);
        if (ui.overviewMap) setOverviewMap(ui.overviewMap);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(done));
    } catch {
      /* ignore */
    }
  }, [done, slug, hydrated]);

  // Persist pill filter + expanded sections + overview toggles
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        uiStateKey(slug),
        JSON.stringify({ status, openMap, overviewMap } satisfies PersistedUI),
      );
    } catch {
      /* ignore */
    }
  }, [status, openMap, overviewMap, slug, hydrated]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sections
      .map((s) => {
        const filtered = s.resources.filter((r, i) => {
          const isDone = !!done[resourceKey(s.id, i, r.name)];
          if (status === "completed" && !isDone) return false;
          if (status === "pending" && isDone) return false;
          if (!q) return true;
          return (
            r.name.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            s.title.toLowerCase().includes(q)
          );
        });
        return { ...s, resources: filtered };
      })
      .filter((s) => s.resources.length > 0);
  }, [sections, query, status, done]);

  const totals = useMemo(() => {
    const total = sections.reduce((n, s) => n + s.resources.length, 0);
    const completed = sections.reduce(
      (n, s) =>
        n + s.resources.reduce((m, r, i) => m + (done[resourceKey(s.id, i, r.name)] ? 1 : 0), 0),
      0,
    );
    const sectionsDone = sections.filter(
      (s) =>
        s.resources.length > 0 &&
        s.resources.every((r, i) => done[resourceKey(s.id, i, r.name)]),
    ).length;
    return {
      total,
      completed,
      remaining: total - completed,
      sectionsDone,
      pct: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [sections, done]);

  const toggleAll = (expanded: boolean) => {
    setOpenMap(Object.fromEntries(filteredSections.map((s) => [s.id, expanded])));
  };

  const stats = [
    { icon: ListChecks, label: "Resources", value: totals.total, tone: "text-amber-300" },
    { icon: CheckCircle2, label: "Done", value: totals.completed, tone: "text-emerald-400" },
    { icon: Target, label: "Remaining", value: totals.remaining, tone: "text-orange-300" },
    { icon: Trophy, label: "Sections", value: `${totals.sectionsDone}/${sections.length}`, tone: "text-amber-200" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1 max-w-md rounded-md" />
          <Skeleton className="h-9 w-64 rounded-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* DSA-sheet style Overall Progress panel */}
      <section className="rounded-2xl border border-border/50 bg-card/50 p-5 sm:p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          {/* Ring + label */}
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke="url(#roadmap-ring)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${(totals.pct / 100) * 97.4} 97.4`}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id="roadmap-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(45 96% 60%)" />
                    <stop offset="100%" stopColor="hsl(24 96% 55%)" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
                {totals.pct}%
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">Overall Progress</p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {totals.completed}/{totals.total} resources
              </p>
            </div>
          </div>

          {/* Legend dots — DSA-sheet style */}
          <div className="flex items-center gap-5 sm:gap-7 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm">Done</span>
              <span className="text-sm text-muted-foreground tabular-nums">{totals.completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-sm">Pending</span>
              <span className="text-sm text-muted-foreground tabular-nums">{totals.remaining}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="text-sm">Sections</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {totals.sectionsDone}/{sections.length}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Progress
            value={totals.pct}
            className={cn(
              "h-2 bg-muted/50",
              "[&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500",
            )}
          />
        </div>
      </section>


      {/* Toolbar: search + status filters + expand controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources…"
            className="pl-9 bg-card/40 border-border/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-0.5 rounded-full border border-border/50 bg-card/40 p-0.5">
            {([
              { k: "all", label: "All", icon: Filter },
              { k: "pending", label: "Pending", icon: Circle },
              { k: "completed", label: "Done", icon: CheckCircle2 },
            ] as const).map((f) => {
              const active = status === f.k;
              return (
                <button
                  key={f.k}
                  type="button"
                  onClick={() => setStatus(f.k)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                    active
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 ring-1 ring-amber-400/30"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <f.icon className="h-3.5 w-3.5" />
                  {f.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => toggleAll(true)}
            className="rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:border-amber-400/50 hover:text-amber-300 transition"
          >
            Expand
          </button>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            className="rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:border-amber-400/50 hover:text-amber-300 transition"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* One outer card — every section lives inside it, DSA-sheet style */}
      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
        {filteredSections.length === 0 && (
          <div className="p-10 text-center">
            <Sparkles className="mx-auto mb-2 h-5 w-5 text-amber-300/70" />
            <p className="text-sm text-muted-foreground">No resources match your filters.</p>
          </div>
        )}


        {filteredSections.map((section, secIdx) => {
          const open = openMap[section.id] ?? false;
          const tone = SECTION_TONES[secIdx % SECTION_TONES.length];
          const secCompleted = section.resources.reduce(
            (n, r, i) => n + (done[resourceKey(section.id, i, r.name)] ? 1 : 0),
            0,
          );
          const secPct = section.resources.length
            ? Math.round((secCompleted / section.resources.length) * 100)
            : 0;
          const fullyDone = secPct === 100;
          const progressText = completionLabel({
            completed: secCompleted,
            total: section.resources.length,
            hasCompletionData: hydrated,
          });

          return (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: secIdx * 0.02 }}
              className="border-b border-border/30 last:border-b-0"
            >
              <h2 className="m-0">
                <button
                  type="button"
                  id={`roadmap-section-trigger-${section.id}`}
                  onClick={() => setOpenMap((m) => ({ ...m, [section.id]: !open }))}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setOpenMap((m) => ({ ...m, [section.id]: !open }));
                    }
                  }}
                  aria-expanded={open}
                  aria-controls={`roadmap-section-panel-${section.id}`}
                  aria-label={`${section.title}, ${open ? "expanded" : "collapsed"}, ${progressText}`}
                  className="w-full flex items-start justify-between gap-3 sm:gap-4 py-3.5 sm:py-4 px-3 sm:px-5 text-left hover:bg-muted/30 transition-colors focus-parikshaa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-inset"
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <motion.div
                      animate={{ rotate: open ? 90 : 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground break-words">
                          {section.title}
                        </span>
                        {fullyDone && (
                          <Sparkles className="h-4 w-4 text-primary shrink-0" aria-label="Section complete" />
                        )}
                      </div>
                      {section.intro && (
                        <p className="mt-0.5 text-xs text-muted-foreground leading-snug break-words line-clamp-2 sm:line-clamp-1">
                          {section.intro}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0 pt-0.5">
                    <div className="hidden sm:block w-24" aria-hidden="true">
                      <Progress
                        value={secPct}
                        className={cn(
                          "h-1.5 bg-muted/50",
                          fullyDone
                            ? "[&>div]:bg-emerald-500"
                            : "[&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500",
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs sm:text-sm min-w-[44px] sm:min-w-[50px] text-right tabular-nums transition-colors whitespace-nowrap",
                        fullyDone ? "text-primary font-medium" : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    >
                      {section.resources.length > 0 && hydrated ? `${secCompleted}/${section.resources.length}` : "—"}
                    </span>
                  </div>
                </button>
              </h2>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={`roadmap-section-panel-${section.id}`}
                    role="region"
                    aria-labelledby={`roadmap-section-trigger-${section.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >

                    <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                      {/* Overview */}
                      <div className="rounded-lg border border-border/40 bg-muted/20 p-3 sm:p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[11px] uppercase tracking-[0.1em] font-semibold text-foreground m-0 break-words">
                              Overview
                            </h3>
                            <p className="text-[11px] text-muted-foreground/80 leading-snug break-words">
                              What this section covers and why it matters.
                            </p>
                          </div>
                        </div>
                        <OverviewText
                          id={`overview-${section.id}`}
                          short={section.shortDescription || section.intro || "No overview available for this section yet."}
                          long={section.longDescription || ""}
                          expanded={!!overviewMap[`overview-${section.id}`]}
                          onToggle={(v) =>
                            setOverviewMap((m) => ({ ...m, [`overview-${section.id}`]: v }))
                          }
                          emptyFallback={!section.intro}
                        />
                      </div>

                      {/* Resources — table shell */}
                      <div className="rounded-lg border border-border/40 overflow-hidden">
                        <div className="flex items-start gap-2 px-3 sm:px-4 py-3 bg-muted/30 border-b border-border/40">
                          <ListChecks className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[11px] uppercase tracking-[0.1em] font-semibold text-foreground m-0 break-words">
                              Resources
                            </h3>
                            <OverviewText
                              id={`resources-${section.id}`}
                              short="Hand-picked links, docs, and tutorials to study."
                              long="Check off each one as you finish it — progress rolls up into your milestones and overall roadmap automatically."
                              expanded={!!overviewMap[`resources-${section.id}`]}
                              onToggle={(v) =>
                                setOverviewMap((m) => ({ ...m, [`resources-${section.id}`]: v }))
                              }
                              size="xs"
                            />
                          </div>
                          <span className="text-[10px] tabular-nums text-muted-foreground shrink-0 mt-0.5">
                            {section.resources.length} total
                          </span>
                        </div>



                        {/* DSA-sheet style table: shadcn primitives, overflow-x-auto */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-b border-border/30 hover:bg-transparent">
                                <TableHead className="w-14 text-xs font-medium text-center">Status</TableHead>
                                <TableHead className="w-12 text-xs font-medium">#</TableHead>
                                <TableHead className="text-xs font-medium">Resource</TableHead>
                                <TableHead className="text-xs font-medium">Description</TableHead>
                                <TableHead className="w-24 text-xs font-medium text-center">Rating</TableHead>
                                <TableHead className="w-24 text-xs font-medium text-center">Link</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {section.resources.length === 0 && (
                                <TableRow className="hover:bg-transparent">
                                  <TableCell colSpan={6} className="py-8 text-center">
                                    <ListChecks className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
                                    <p className="text-xs italic text-muted-foreground/70">
                                      No resources added to this section yet.
                                    </p>
                                  </TableCell>
                                </TableRow>
                              )}

                              {section.resources.map((r, i) => {
                                const key = resourceKey(section.id, i, r.name);
                                const isDone = !!done[key];
                                return (
                                  <TableRow
                                    key={key}
                                    className={cn(
                                      "border-b border-border/30 transition-colors hover:bg-muted/40",
                                      isDone && "bg-emerald-500/[0.04]",
                                    )}
                                  >
                                    <TableCell className="w-14 text-center">
                                      <Checkbox
                                        checked={isDone}
                                        onCheckedChange={(v) =>
                                          setDone((d) => ({ ...d, [key]: !!v }))
                                        }
                                        aria-label={`Mark ${r.name} complete`}
                                        className="h-5 w-5 rounded-none border-2 border-muted-foreground/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white"
                                      />
                                    </TableCell>
                                    <TableCell className="w-12 text-xs text-muted-foreground tabular-nums">
                                      {String(i + 1).padStart(2, "0")}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      <span
                                        className={cn(
                                          "text-sm text-foreground",
                                          isDone && "line-through text-muted-foreground",
                                        )}
                                      >
                                        {r.name}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-md">
                                      <span className="line-clamp-2">{r.description || "—"}</span>
                                    </TableCell>
                                    <TableCell className="w-24 text-center">
                                      {r.rating ? (
                                        <span className="inline-flex items-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 text-[11px] font-medium tabular-nums">
                                          {r.rating}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="w-24 text-center">
                                      {r.url ? (
                                        <a
                                          href={r.url}
                                          target="_blank"
                                          rel="noreferrer noopener"
                                          aria-label={`Open ${r.name}`}
                                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </a>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Milestones */}
                      <div className="rounded-lg border border-border/40 bg-muted/20 p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h3 className="text-[11px] uppercase tracking-[0.1em] font-semibold text-foreground m-0 break-words">
                                Milestones
                              </h3>
                              <OverviewText
                                id={`milestones-${section.id}`}
                                short={
                                  section.resources.length > 0
                                    ? "Track how far you've come in this section."
                                    : "No milestones to track yet."
                                }
                                long={
                                  section.resources.length > 0
                                    ? "Milestones reflect completed resources here and roll up into your overall roadmap progress."
                                    : ""
                                }
                                expanded={!!overviewMap[`milestones-${section.id}`]}
                                onToggle={(v) =>
                                  setOverviewMap((m) => ({ ...m, [`milestones-${section.id}`]: v }))
                                }
                                size="xs"
                                emptyFallback={section.resources.length === 0}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0 mt-0.5">
                            {progressText}{section.resources.length > 0 && hydrated ? ` · ${secPct}%` : ""}
                          </span>
                        </div>

                        {section.resources.length > 0 && (
                          <div className="mt-2.5">
                            <Progress
                              value={secPct}
                              className={cn(
                                "h-1.5 bg-muted/50",
                                fullyDone
                                  ? "[&>div]:bg-emerald-500"
                                  : "[&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500",
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                  </motion.div>

                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Overview text with a short summary + expandable long description.
 * Applies consistent wrap/truncate rules across breakpoints.
 * When `expanded`/`onToggle` are provided, state is fully controlled and can be persisted.
 */
function OverviewText({
  id,
  short,
  long,
  expanded: expandedProp,
  onToggle,
  size = "sm",
  emptyFallback = false,
}: {
  id?: string;
  short: string;
  long: string;
  expanded?: boolean;
  onToggle?: (v: boolean) => void;
  size?: "xs" | "sm";
  emptyFallback?: boolean;
}) {
  const [uncontrolled, setUncontrolled] = useState(false);
  const expanded = expandedProp ?? uncontrolled;
  const setExpanded = (v: boolean) => (onToggle ? onToggle(v) : setUncontrolled(v));
  const hasLong = long.trim().length > 0;
  const panelId = id ? `${id}-long` : undefined;
  const textCls =
    size === "xs"
      ? "text-[11px] text-muted-foreground/80 leading-snug break-words hyphens-auto"
      : "text-sm text-muted-foreground leading-relaxed break-words hyphens-auto";
  return (
    <div>
      <p
        className={cn(textCls, emptyFallback && "italic text-muted-foreground/70")}
        id={panelId}
      >
        {short}
        {hasLong && expanded && <span> {long}</span>}
      </p>
      {hasLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setExpanded(!expanded);
            }
          }}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-amber-300 hover:text-amber-200 focus-parikshaa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

export default RoadmapSheetView;
