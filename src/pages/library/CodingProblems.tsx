import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  SquareCheckBig,
  Square,
  SquareDot,
  Code2,
  Filter,
  Star,
  ChevronLeft,
  ChevronRight,
  Share2,
  CheckSquare,
  Link2,
  Columns3,
  RotateCcw,
  Keyboard,
  Rows3,
  Rows2,
  Focus,
  Trophy,
  Search,
  ChevronsUpDown,
  Check,
  Hash,
  FileText,
  Tags,
  BarChart3,
  Percent,
  Bookmark,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type Difficulty,
} from "@/data/codingProblemsData";
import { fetchDbCodingProblem } from "@/hooks/useDbCodingProblem";
import { useDbCodingProblems } from "@/hooks/useCodingProblems";
import { usePublishedProblemCount } from "@/hooks/useAdminProblems";
import { useCodingProblemsRealtime } from "@/hooks/useCodingProblemsRealtime";
import { useCodingAttemptStats } from "@/hooks/useCodingAttemptStats";
import { useManualProblemStatuses, type ManualStatus } from "@/hooks/useManualProblemStatus";
import { useCodingProblemBookmarks } from "@/hooks/useCodingProblemBookmarks";
import { ProblemStatsHeader } from "@/components/library/coding/ProblemStatsHeader";
import { PatternsHero, type PatternsRoadmap } from "@/components/library/coding/PatternsHero";

import { DifficultyGroupRow } from "@/components/library/coding/DifficultyGroupRow";
import { ProblemFiltersBar, type SortKey, type ViewMode } from "@/components/library/coding/ProblemFiltersBar";

import { RandomMenu } from "@/components/library/coding/RandomMenu";
import { BulkActionsBar } from "@/components/library/coding/BulkActionsBar";
import { TopicBadgesWithOverflow } from "@/components/library/coding/TopicBadgesWithOverflow";
import { ProblemNoteQuickEdit } from "@/components/library/coding/ProblemNoteQuickEdit";
import { CompanyLogos } from "@/components/library/coding/CompanyLogos";
import {
  useProblemCompanies,
  ProblemCompaniesProvider,
} from "@/hooks/useProblemCompanies";
import { companiesForSlug } from "@/data/problemCompaniesMap";

import {
  EXPERIENCED_HEADER,
  EXPERIENCED_GUIDANCE,
  EXPERIENCED_NEXT_STEPS,
  EXPERIENCED_ROADMAP,
} from "@/data/experiencedRoadmap";
import { useCodingSelection } from "@/hooks/useCodingSelection";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PROBLEM_COLUMNS,
  useCodingProblemsTablePrefs,
  type ProblemColumnId,
} from "@/hooks/useCodingProblemsTablePrefs";
import {
  SortableResizableHeader,
  type SortDir,
} from "@/components/library/coding/SortableResizableHeader";
import {
  RecommendationStrip,
  ShowRecommendationsChip,
} from "@/components/library/coding/RecommendationStrip";
import { TopicMasteryChips } from "@/components/library/coding/TopicMasteryChips";
import { SavedFiltersMenu } from "@/components/library/coding/SavedFiltersMenu";
import { ShortcutsCheatSheet } from "@/components/library/coding/ShortcutsCheatSheet";
import { useSavedFilterPresets } from "@/hooks/useSavedFilterPresets";
import { useListingFocusMode } from "@/hooks/useListingFocusMode";
import { SmartFilterChips, type SmartChip } from "@/components/library/coding/SmartFilterChips";
import { TopicProgressRing } from "@/components/library/coding/TopicProgressRing";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { HeroAmbientBackdrop } from "@/components/landing/HeroAmbientBackdrop";


const difficultyClass = (d: Difficulty) =>
  d === "Easy"
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : d === "Medium"
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-rose-500 bg-rose-500/10 border-rose-500/20";

const DIFF_ORDER: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };

const CodingProblems = () => {
  useCodingProblemsRealtime();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Read URL state with sensible defaults
  const search = params.get("q") ?? "";
  const rawDiff = params.get("diff") ?? "all";
  const VALID_DIFFS = ["Easy", "Medium", "Hard"] as const;
  const selectedDifficulties = rawDiff === "all" || !rawDiff
    ? []
    : rawDiff.split(",").map((s) => s.trim()).filter((v): v is (typeof VALID_DIFFS)[number] =>
        (VALID_DIFFS as readonly string[]).includes(v),
      );
  // Legacy single-value var kept for column sort labels; empty/multi => "all"
  const difficulty = selectedDifficulties.length === 1 ? selectedDifficulties[0] : "all";
  const selectedTopics = (params.get("topics") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const status = params.get("status") ?? "all";
  const sort = (params.get("sort") as SortKey) || "default";
  // Grid mode has been retired — table is the only valid view.
  const view: ViewMode = "table";
  const bookmarked = params.get("bm") === "1";
  const incompleteOnly = params.get("incomplete") === "1";
  const rawPage = params.get("page");
  const parsedPage = rawPage !== null ? parseInt(rawPage, 10) : NaN;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  // Persist & restore scroll position + page for /library/problems so refresh
  // returns the user to the same spot.
  const SCROLL_KEY = "parikshaa:coding-problems-scroll";
  const PAGE_KEY = "parikshaa:coding-problems-last-page";

  // Tracks whether the user has actively changed filters/page in this session
  // (vs. the initial mount restoring previous state). Used so a fresh refresh
  // restores scroll, but applying a filter / paginating jumps to the top.
  const userInteractedRef = useRef(false);
  // Forward-ref so the mount-only effect (declared above tablePrefs) can read
  // the saved per-list sort without re-running.
  const tablePrefsRef = useRef<ReturnType<typeof useCodingProblemsTablePrefs> | null>(null);
  const filterSig = `${search}|${difficulty}|${selectedTopics.join(",")}|${status}|${sort}|${bookmarked ? 1 : 0}`;

  // On first mount: validate URL params (strip invalid view/page) and hydrate
  // last page + scroll + saved sort from storage.
  useEffect(() => {
    try {
      const next = new URLSearchParams(params);
      let dirty = false;

      // Strip invalid view (only "table" is valid now; "grid" was retired)
      if (next.has("view")) {
        next.delete("view");
        dirty = true;
      }

      // Validate page: must be a positive integer string
      if (next.has("page")) {
        const raw = next.get("page");
        const n = raw !== null ? parseInt(raw, 10) : NaN;
        if (!Number.isFinite(n) || n < 1 || String(n) !== raw) {
          next.delete("page");
          dirty = true;
        }
      }

      // If no ?page=, hydrate from last-page memory.
      if (!next.has("page")) {
        const saved = localStorage.getItem(PAGE_KEY);
        const n = saved ? parseInt(saved, 10) : NaN;
        if (Number.isFinite(n) && n > 1) {
          next.set("page", String(n));
          dirty = true;
        }
      }

      // If no ?sort=, hydrate from saved per-list sort (3-state)
      if (!next.has("sort")) {
        const savedSort = tablePrefsRef.current?.getSavedSort("__list__");
        if (savedSort && savedSort !== "default") {
          next.set("sort", savedSort);
          dirty = true;
        }
      }

      if (dirty) setParams(next, { replace: true });
    } catch {
      /* ignore */
    }

    // Restore scroll on next frame so layout has settled.
    try {
      const y = parseInt(sessionStorage.getItem(SCROLL_KEY) ?? "", 10);
      if (Number.isFinite(y) && y > 0) {
        requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save current page whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(PAGE_KEY, String(page));
    } catch {
      /* ignore */
    }
  }, [page]);

  // After the user changes any filter or paginates, jump back to the top so
  // they always see the first results — but only after the initial mount, so
  // a refresh still restores their previous scroll position.
  useEffect(() => {
    if (!userInteractedRef.current) {
      userInteractedRef.current = true;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSig]);

  // Save scroll position (throttled via rAF) and on unload.
  useEffect(() => {
    let ticking = false;
    const save = () => {
      try {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      } catch {
        /* ignore */
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(save);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", save);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", save);
      save();
    };
  }, []);

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      const isDefaultView = k === "view" && v === "table";
      if (
        v === null ||
        v === "" ||
        v === "all" ||
        v === "default" ||
        isDefaultView ||
        (k === "page" && v === "1")
      ) {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    }
    setParams(next, { replace: true });
  };

  const setSearch = (v: string) => updateParams({ q: v, page: "1" });
  const setDifficulty = (v: string) => updateParams({ diff: v, page: "1" });
  const toggleDifficulty = (v: "Easy" | "Medium" | "Hard") => {
    const set = new Set(selectedDifficulties);
    if (set.has(v)) set.delete(v);
    else set.add(v);
    updateParams({ diff: set.size === 0 ? null : Array.from(set).join(","), page: "1" });
  };
  const clearDifficulties = () => updateParams({ diff: null, page: "1" });
  const setStatus = (v: string) => updateParams({ status: v, page: "1" });
  // setSort is defined further below — it needs access to tablePrefs for undo.
  const setView = (v: ViewMode) => updateParams({ view: v });

  // Persisted column visibility & widths (responsive — survives refresh).
  const tablePrefs = useCodingProblemsTablePrefs();
  tablePrefsRef.current = tablePrefs;
  const { focusMode, toggle: toggleFocusMode } = useListingFocusMode();

  // Tracks whether we've finished initial sort hydration so we don't fire
  // a "Sort changed" toast for the URL/localStorage restoration on mount.
  const sortHydratedRef = useRef(false);
  useEffect(() => {
    // Mark hydrated on the next tick after first render commits.
    sortHydratedRef.current = true;
  }, []);

  const setSort = (v: SortKey) => {
    const prev = sort;
    updateParams({ sort: v, page: "1" });
    if (!sortHydratedRef.current) return;
    if (prev === v) return;
      const labelOf = (k: SortKey): string => {
        const map: Partial<Record<SortKey, string>> = {
          default: "Default",
          title: "Title (A→Z)",
          "title-desc": "Title (Z→A)",
          recent: "Most recent",
          "diff-asc": "Difficulty (Easy→Hard)",
          "diff-desc": "Difficulty (Hard→Easy)",
          "status-asc": "Status (Solved first)",
          "status-desc": "Status (Todo first)",
          "accept-asc": "Acceptance (Low→High)",
          "accept-desc": "Acceptance (High→Low)",
          "attempts-asc": "Attempts (Low→High)",
          "attempts-desc": "Attempts (High→Low)",
        };
        return map[k] ?? k;
      };
    toast.success(`Sorted by ${labelOf(v)}`, {
      duration: 6000,
      action: {
        label: "Undo",
        onClick: () => updateParams({ sort: prev, page: "1" }),
      },
    });
  };

  // Persist sort (3-state) per list slug whenever it changes.
  useEffect(() => {
    tablePrefs.setSavedSort("__list__", sort);
  }, [sort, tablePrefs]);

  // Map a column id to its current sort direction (asc/desc/null) and a
  // 3-state cycler that updates the existing `sort` URL param.
  type ColumnSortable = "title" | "status" | "difficulty" | "acceptance" | "attempts";
  const columnSortKeys: Record<ColumnSortable, [SortKey, SortKey]> = {
    title: ["title", "title-desc"],
    status: ["status-asc", "status-desc"],
    difficulty: ["diff-asc", "diff-desc"],
    acceptance: ["accept-asc", "accept-desc"],
    attempts: ["attempts-asc", "attempts-desc"],
  };
  const dirOf = (col: ColumnSortable): SortDir => {
    const [asc, desc] = columnSortKeys[col];
    if (sort === asc) return "asc";
    if (sort === desc) return "desc";
    return null;
  };
  const cycleColumnSort = (col: ColumnSortable) => {
    const [asc, desc] = columnSortKeys[col];
    if (sort === asc) setSort(desc);
    else if (sort === desc) setSort("default");
    else setSort(asc);
  };
  const setBookmarked = (v: boolean) => updateParams({ bm: v ? "1" : null, page: "1" });
  const setIncompleteOnly = (v: boolean) =>
    updateParams({ incomplete: v ? "1" : null, page: "1" });
  const setPage = (n: number) => updateParams({ page: String(n) });
  const prefetchProblem = (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ["coding-problem-db", slug],
      queryFn: () => fetchDbCodingProblem(slug),
      staleTime: 5 * 60 * 1000,
    });
  };

  const toggleTopic = (t: string) => {
    const set = new Set(selectedTopics);
    if (set.has(t)) set.delete(t);
    else set.add(t);
    updateParams({ topics: Array.from(set).join(","), page: "1" });
  };

  const clearAll = () => {
    setParams(new URLSearchParams(), { replace: true });
    toast.success("Filters cleared", {
      description: "Search, difficulty, topics, status, sort, and bookmarks reset.",
    });
  };

  const { solved, attempted, perProblem, loading: attemptsLoading } = useCodingAttemptStats();
  const { manual: manualStatusMap, cycle: cycleManualStatus } = useManualProblemStatuses();
  const { data: dbProblems = [], isLoading: problemsLoading } = useDbCodingProblems();
  // The library shows ONLY admin-published DB problems — the legacy static
  // CODING_PROBLEMS array is no longer merged in, which guarantees the count
  // matches /admin/problems and removes the duplicate slugs that occurred
  // when both sources defined the same problem.
  const ALL_PROBLEMS = useMemo(() => {
    const bySlug = new Map<string, (typeof dbProblems)[number]>();
    for (const p of dbProblems) bySlug.set(p.slug, p);
    return Array.from(bySlug.values());
  }, [dbProblems]);
  // Backend published-count is the single source of truth for the total.
  // Realtime + focus refetch + optimistic mutations keep it live; if it ever
  // fails or is still loading we show a skeleton rather than a stale number.
  const {
    data: publishedHeadCount,
    isLoading: countLoading,
    isError: countError,
    isFetching: countFetching,
  } = usePublishedProblemCount();
  const hasCount = typeof publishedHeadCount === "number" && !countError;
  const displayTotal = hasCount ? publishedHeadCount : 0;
  const displayTotalLoading =
    !hasCount && (countLoading || countFetching || countError);
  const incompleteCount = useMemo(
    () => ALL_PROBLEMS.filter((p) => p._incomplete).length,
    [ALL_PROBLEMS],
  );
  
  const { bookmarks, toggle: rawToggleBookmark, isBookmarked } = useCodingProblemBookmarks();
  const { requireAuth, LoginPromptDialog } = useRequireAuth();
  const toggleBookmark = (slug: string) =>
    requireAuth(() => rawToggleBookmark(slug), { action: "bookmark coding problems" });


  // Per-topic stats for the progress ring
  const topicStats = useMemo(() => {
    const totals = new Map<string, number>();
    const solvedMap = new Map<string, number>();
    const attemptedMap = new Map<string, number>();
    for (const p of ALL_PROBLEMS) {
      for (const t of p.topics) {
        totals.set(t, (totals.get(t) ?? 0) + 1);
        if (solved.has(p.slug)) solvedMap.set(t, (solvedMap.get(t) ?? 0) + 1);
        else if (attempted.has(p.slug)) attemptedMap.set(t, (attemptedMap.get(t) ?? 0) + 1);
      }
    }
    return { totals, solvedMap, attemptedMap };
  }, [solved, attempted, ALL_PROBLEMS]);

  // Stable upload-order index (1-based) — matches the admin table so a
  // problem's number is identical regardless of filters, sort, or page.
  const uploadIndexBySlug = useMemo(() => {
    const m = new Map<string, number>();
    ALL_PROBLEMS.forEach((p, i) => m.set(p.slug, i + 1));
    return m;
  }, [ALL_PROBLEMS]);

  // All unique topics across static + DB problems, sorted alphabetically.
  // Derived from merged ALL_PROBLEMS so admin-published/remapped topics
  // (e.g. the Java DSA → algorithmic-topic remap) appear in the filter.
  const ALL_TOPICS = useMemo(
    () => Array.from(topicStats.totals.keys()).sort((a, b) => a.localeCompare(b)),
    [topicStats],
  );

  // Identify weak topics: solved < 30% (and at least 1 attempt or unsolved problems)
  const weakTopics = useMemo(() => {
    const out: string[] = [];
    for (const [topic, total] of topicStats.totals) {
      const s = topicStats.solvedMap.get(topic) ?? 0;
      if (total >= 3 && s / total < 0.3) out.push(topic);
    }
    return out;
  }, [topicStats]);


  // Persisted selection (bulk actions) — survives refresh and pagination
  const {
    selectionMode,
    setSelectionMode,
    selected,
    toggleSelected,
    addMany,
    clearSelection,
    exitSelection,
  } = useCodingSelection();

  const [confirmUnbookmark, setConfirmUnbookmark] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Group-by-difficulty toggle (persisted). Collapsed groups persisted as an array of Difficulty.
  const GROUP_KEY = "parikshaa:coding-problems-group-by-diff";
  const COLLAPSED_KEY = "parikshaa:coding-problems-collapsed-groups";
  const [groupByDiff, setGroupByDiffState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(GROUP_KEY) !== "0";
    } catch {
      return true;
    }
  });
  const setGroupByDiff = (v: boolean) => {
    setGroupByDiffState(v);
    try {
      localStorage.setItem(GROUP_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };
  const [collapsedGroups, setCollapsedGroups] = useState<Set<Difficulty>>(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_KEY);
      if (!raw) return new Set();
      return new Set(JSON.parse(raw) as Difficulty[]);
    } catch {
      return new Set();
    }
  });
  const toggleGroup = (d: Difficulty) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  // Saved filter presets (localStorage).
  const { presets, save: savePreset, remove: removePreset, rename: renamePreset } =
    useSavedFilterPresets();
  // Active row index for keyboard navigation (j/k/enter). -1 = none.
  const [activeRowIdx, setActiveRowIdx] = useState<number>(-1);
  const tableRef = useRef<HTMLDivElement | null>(null);

  // Build a fully-encoded shareable URL from current params (not raw window URL)
  const buildShareUrl = () => {
    const next = new URLSearchParams();
    if (search.trim()) next.set("q", search.trim());
    if (selectedDifficulties.length > 0) next.set("diff", selectedDifficulties.join(","));
    if (selectedTopics.length > 0) next.set("topics", selectedTopics.join(","));
    if (status !== "all") next.set("status", status);
    if (sort !== "default") next.set("sort", sort);
    // view is always "table" now (grid retired) — no need to encode
    if (bookmarked) next.set("bm", "1");
    if (page > 1) next.set("page", String(page));
    const qs = next.toString();
    const { origin, pathname } = window.location;
    return qs ? `${origin}${pathname}?${qs}` : `${origin}${pathname}`;
  };

  const handleShareFilters = async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", {
        description: "Shareable URL with current filters copied to clipboard.",
      });
    } catch {
      toast.error("Couldn't copy link", { description: url });
    }
  };

  // Build only the query string (no origin) for saved presets.
  const buildCurrentQuery = (): string => {
    const next = new URLSearchParams();
    if (search.trim()) next.set("q", search.trim());
    if (selectedDifficulties.length > 0) next.set("diff", selectedDifficulties.join(","));
    if (selectedTopics.length > 0) next.set("topics", selectedTopics.join(","));
    if (status !== "all") next.set("status", status);
    if (sort !== "default") next.set("sort", sort);
    if (bookmarked) next.set("bm", "1");
    if (page > 1) next.set("page", String(page));
    return next.toString();
  };

  // Apply a saved preset's query string by replacing current params.
  const applyPresetQuery = (qs: string) => {
    setParams(new URLSearchParams(qs), { replace: true });
  };

  // Show only weak topics: replace selection with the provided list.
  const showOnlyWeakTopics = (weak: string[]) => {
    if (weak.length === 0) return;
    updateParams({ topics: weak.join(","), page: "1" });
    toast.success(`Filtered to ${weak.length} weak topic${weak.length === 1 ? "" : "s"}`, {
      description: "Showing topics where your solve rate is below 50%.",
    });
  };

  // Density toggle (compact ↔ comfortable)
  const toggleDensity = () => {
    const next = tablePrefs.density === "compact" ? "comfortable" : "compact";
    tablePrefs.setDensity(next);
    toast.success(`Density: ${next}`);
  };

  // Padding helper for cells based on density
  const cellPadY = tablePrefs.density === "compact" ? "py-1.5" : "py-2.5";
  const rowTextSize = tablePrefs.density === "compact" ? "text-xs" : "text-sm";

  // Keyboard shortcuts: /, b, d, s, ?, Esc, ←, →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editable =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;

      // "/" focuses the search even when not editable
      if (e.key === "/" && !editable) {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search" i], input[type="search"]',
        );
        el?.focus();
        el?.select();
        return;
      }

      if (e.key === "?" && !editable) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (e.key === "Escape") {
        if (selectionMode) {
          exitSelection();
        }
        return;
      }

      if (editable) return;

      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setBookmarked(!bookmarked);
        return;
      }
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        toggleDensity();
        return;
      }
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (selectionMode) exitSelection();
        else setSelectionMode(true);
        return;
      }
      if (e.key === "ArrowLeft" && safePageRef.current > 1) {
        e.preventDefault();
        setPage(safePageRef.current - 1);
        return;
      }
      if (e.key === "ArrowRight" && safePageRef.current < totalPagesRef.current) {
        e.preventDefault();
        setPage(safePageRef.current + 1);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarked, selectionMode, tablePrefs.density]);

  // Refs to keep keyboard handler closure-free for paging.
  const safePageRef = useRef(1);
  const totalPagesRef = useRef(1);

  // Filter
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = ALL_PROBLEMS.filter((p) => {
      if (q) {
        const hay = `${p.title} ${p.slug} ${p.topics.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(p.difficulty)) return false;
      if (selectedTopics.length > 0 && !selectedTopics.every((t) => p.topics.includes(t))) return false;
      if (status === "solved" && !solved.has(p.slug)) return false;
      if (status === "attempted" && (!attempted.has(p.slug) || solved.has(p.slug))) return false;
      if (status === "todo" && attempted.has(p.slug)) return false;
      if (bookmarked && !bookmarks.has(p.slug)) return false;
      if (incompleteOnly && !p._incomplete) return false;
      return true;
    });

    // Sort
    const acceptanceOf = (slug: string) => {
      const s = perProblem.get(slug);
      if (!s || s.attempts === 0) return -1; // unattempted sorts to bottom for asc
      return Math.round(((s.accepted ?? 0) / s.attempts) * 100);
    };
    const statusRank = (slug: string) => {
      // Solved (0) → Attempted (1) → Not started (2)
      if (solved.has(slug)) return 0;
      if (attempted.has(slug)) return 1;
      return 2;
    };
    const attemptsOf = (slug: string) => perProblem.get(slug)?.attempts ?? 0;

    if (sort === "title") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "title-desc") {
      list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    } else if (sort === "diff-asc") {
      list = [...list].sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
    } else if (sort === "diff-desc") {
      list = [...list].sort((a, b) => DIFF_ORDER[b.difficulty] - DIFF_ORDER[a.difficulty]);
    } else if (sort === "recent") {
      list = [...list].sort((a, b) => {
        const la = perProblem.get(a.slug)?.lastAttempt ?? "";
        const lb = perProblem.get(b.slug)?.lastAttempt ?? "";
        return lb.localeCompare(la);
      });
    } else if (sort === "status-asc") {
      list = [...list].sort((a, b) => statusRank(a.slug) - statusRank(b.slug));
    } else if (sort === "status-desc") {
      list = [...list].sort((a, b) => statusRank(b.slug) - statusRank(a.slug));
    } else if (sort === "accept-asc") {
      list = [...list].sort((a, b) => acceptanceOf(a.slug) - acceptanceOf(b.slug));
    } else if (sort === "accept-desc") {
      list = [...list].sort((a, b) => acceptanceOf(b.slug) - acceptanceOf(a.slug));
    } else if (sort === "attempts-asc") {
      list = [...list].sort((a, b) => attemptsOf(a.slug) - attemptsOf(b.slug));
    } else if (sort === "attempts-desc") {
      list = [...list].sort((a, b) => attemptsOf(b.slug) - attemptsOf(a.slug));
    }
    return list;
  }, [
    debouncedSearch,
    selectedDifficulties.join(","),
    selectedTopics.join(","),
    status,
    sort,
    bookmarked,
    incompleteOnly,
    bookmarks,
    solved,
    attempted,
    perProblem,
    ALL_PROBLEMS,
  ]);

  // Pagination
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageSlugs = useMemo(() => pageSlice.map((p) => p.slug), [pageSlice]);
  const { data: pageCompaniesMap } = useProblemCompanies(pageSlugs);
  const showLoadingTable =
    (problemsLoading && ALL_PROBLEMS.length === 0) ||
    (attemptsLoading && status !== "all" && filtered.length === 0);

  // Keep refs in sync for the keyboard ←/→ pagination shortcut.
  useEffect(() => {
    safePageRef.current = safePage;
    totalPagesRef.current = totalPages;
  }, [safePage, totalPages]);

  // Stats
  const counts = useMemo(() => {
    const total = ALL_PROBLEMS.length;
    const easy = ALL_PROBLEMS.filter((p) => p.difficulty === "Easy").length;
    const medium = ALL_PROBLEMS.filter((p) => p.difficulty === "Medium").length;
    const hard = ALL_PROBLEMS.filter((p) => p.difficulty === "Hard").length;
    const inSet = (d: Difficulty) =>
      ALL_PROBLEMS.filter((p) => p.difficulty === d && solved.has(p.slug)).length;
    return {
      total,
      easy,
      medium,
      hard,
      solvedEasy: inSet("Easy"),
      solvedMedium: inSet("Medium"),
      solvedHard: inSet("Hard"),
    };
  }, [solved, ALL_PROBLEMS]);

  const { weekSolved, prevWeekSolved } = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    let w = 0;
    let pw = 0;
    perProblem.forEach((s) => {
      if (!s.solvedAt) return;
      const t = new Date(s.solvedAt).getTime();
      if (now - t < week) w += 1;
      else if (now - t < 2 * week) pw += 1;
    });
    return { weekSolved: w, prevWeekSolved: pw };
  }, [perProblem]);

  const continueProblem = useMemo(() => {
    let best: { slug: string; t: string } | null = null;
    perProblem.forEach((s, slug) => {
      if (solved.has(slug)) return;
      if (!s.lastAttempt) return;
      if (!best || s.lastAttempt > best.t) best = { slug, t: s.lastAttempt };
    });
    return best ? ALL_PROBLEMS.find((p) => p.slug === best!.slug) : undefined;
  }, [perProblem, solved, ALL_PROBLEMS]);

  const activeFilterCount =
    (debouncedSearch ? 1 : 0) +
    (selectedDifficulties.length > 0 ? selectedDifficulties.length : 0) +
    (status !== "all" ? 1 : 0) +
    (sort !== "default" ? 1 : 0) +
    (bookmarked ? 1 : 0) +
    (incompleteOnly ? 1 : 0) +
    selectedTopics.length;

  // Bulk action handlers
  const selectAllVisible = () => {
    addMany(pageSlice.map((p) => p.slug));
  };
  const bulkBookmark = () => {
    let added = 0;
    selected.forEach((slug) => {
      if (!isBookmarked(slug)) {
        toggleBookmark(slug);
        added += 1;
      }
    });
    toast.success(`Bookmarked ${added} ${added === 1 ? "problem" : "problems"}`);
    clearSelection();
  };
  const performBulkUnbookmark = () => {
    const removedSlugs: string[] = [];
    selected.forEach((slug) => {
      if (isBookmarked(slug)) {
        toggleBookmark(slug);
        removedSlugs.push(slug);
      }
    });
    const removed = removedSlugs.length;
    clearSelection();
    setConfirmUnbookmark(false);

    toast.success(`Removed ${removed} ${removed === 1 ? "bookmark" : "bookmarks"}`, {
      duration: 8000,
      action: removed > 0
        ? {
            label: "Undo",
            onClick: () => {
              removedSlugs.forEach((slug) => {
                if (!isBookmarked(slug)) toggleBookmark(slug);
              });
              toast.success(
                `Restored ${removed} ${removed === 1 ? "bookmark" : "bookmarks"}`,
              );
            },
          }
        : undefined,
    });
  };
  const bulkUnbookmark = () => {
    // Count how many are actually bookmarked to decide whether to confirm
    let count = 0;
    selected.forEach((slug) => {
      if (isBookmarked(slug)) count += 1;
    });
    if (count === 0) {
      toast.info("None of the selected problems are bookmarked.");
      return;
    }
    setConfirmUnbookmark(true);
  };
  const unbookmarkCount = (() => {
    let c = 0;
    selected.forEach((slug) => {
      if (isBookmarked(slug)) c += 1;
    });
    return c;
  })();

  return (
    <ProblemCompaniesProvider value={pageCompaniesMap ?? null}>
    <HeroAmbientBackdrop contentClassName="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-[1400px]">


      <Helmet>
        <title>Coding Problems — Practice with Real-Time Code Execution | Parikshaa</title>
        <meta
          name="description"
          content="Solve LeetCode-style coding problems in Python, C++, Java, JavaScript, TypeScript, C, and Go with real code execution and submission tracking."
        />
        {/* Preload logos for companies visible on the first page to remove flicker */}
        {(() => {
          const token = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as
            | string
            | undefined;
          const domains = new Set<string>();
          for (const p of pageSlice) {
            for (const c of companiesForSlug(p.slug, 3)) domains.add(c.domain);
            if (domains.size >= 12) break;
          }
          return Array.from(domains).map((d) => (
            <link
              key={d}
              rel="preload"
              as="image"
              href={
                token
                  ? `https://img.logo.dev/${d}?token=${token}&size=40&format=png&retina=true`
                  : `https://www.google.com/s2/favicons?sz=64&domain=${d}`
              }
            />
          ));
        })()}
      </Helmet>

      {/* Leetcode-Patterns style hero — big wordmark, roadmap tabs, progress rail */}
      {(() => {
        const solvedTotal = counts.solvedEasy + counts.solvedMedium + counts.solvedHard;
        const diffCsv = (params.get("diff") ?? "").toLowerCase();
        const roadmap: PatternsRoadmap =
          diffCsv === "easy"
            ? "beginner"
            : diffCsv === "medium,hard" || diffCsv === "hard,medium"
              ? "experienced"
              : "all";
        return (
          <PatternsHero
            total={displayTotal}
            totalLoading={displayTotalLoading}
            solved={solvedTotal}
            activeRoadmap={roadmap}
            onRoadmapChange={(next) =>
              setDifficulty(
                next === "beginner" ? "Easy" : next === "experienced" ? "Medium,Hard" : "all",
              )
            }
          />
        );
      })()}


      {/* Main body */}
      <div>
        <div className="min-w-0">

      {null}


      {(() => {
        const diff = (params.get("diff") ?? "").toLowerCase();
        return diff !== "easy" && diff !== "medium,hard" && diff !== "hard,medium";
      })() && (<>
      {/* Top tagline + search — glowing input */}
      <div className="mb-3 relative group">
        <div className="absolute -inset-0.5 bg-amber-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500 pointer-events-none" />
        <div className="relative flex items-center gap-3 rounded-2xl border border-zinc-800 bg-[#0a0a0a] px-4 py-2">
          <Search className="h-4 w-4 text-zinc-500 shrink-0" />
          <Input
            placeholder="Search problems by title, slug, or topic…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-9 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Segmented toggle + filter dropdowns */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex shrink-0 rounded-xl border border-border/60 bg-card p-1">
          <button
            type="button"
            onClick={() => setBookmarked(false)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap",
              !bookmarked
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All Problems
          </button>
          <button
            type="button"
            onClick={() => setBookmarked(true)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap",
              bookmarked
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Revision
            <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[11px] font-semibold text-amber-300 tabular-nums">
              {bookmarks.size}
            </span>

          </button>
        </div>

        {/* Group by difficulty toggle — Leetcode-Patterns style collapsible groups */}
        <button
          type="button"
          onClick={() => setGroupByDiff(!groupByDiff)}
          aria-pressed={groupByDiff}
          title="Group rows by difficulty with collapsible sections"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition-colors shrink-0",
            groupByDiff
              ? "border-primary/60 bg-primary/15 text-primary"
              : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          Group by difficulty
        </button>


        {incompleteCount > 0 && (
          <button
            type="button"
            onClick={() => setIncompleteOnly(!incompleteOnly)}
            aria-pressed={incompleteOnly}
            title="Show only problems flagged with missing data"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition-colors shrink-0",
              incompleteOnly
                ? "border-amber-500/60 bg-amber-500/15 text-amber-500"
                : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Incomplete only
            <span className="text-[10px] tabular-nums opacity-80">
              {incompleteCount}
            </span>
          </button>
        )}



        {/* Topics multi-select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 rounded-xl justify-between font-normal min-w-[120px] gap-2 shrink-0"
            >
              <span className="truncate">
                {selectedTopics.length === 0
                  ? "Topics"
                  : selectedTopics.length === 1
                    ? selectedTopics[0]
                    : `${selectedTopics.length} topics`}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search topics…" />
              <CommandList className="max-h-[320px]">
                <CommandEmpty>No topic found.</CommandEmpty>
                <CommandGroup>
                  {ALL_TOPICS.map((t) => {
                    const checked = selectedTopics.includes(t);
                    const total = topicStats.totals.get(t) ?? 0;
                    const solvedN = topicStats.solvedMap.get(t) ?? 0;
                    return (
                      <CommandItem
                        key={t}
                        value={t}
                        onSelect={() => toggleTopic(t)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 mr-2 shrink-0",
                            checked ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate flex-1">{t}</span>
                        <span className="ml-2 text-[10px] tabular-nums text-muted-foreground shrink-0">
                          {solvedN}/{total}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>


        {/* Spacer to push right-side filters */}
        <div className="flex-1" />

        {/* Status */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 rounded-xl justify-between font-normal min-w-[120px] gap-2 shrink-0"
            >
              <span className="truncate">
                {status === "all"
                  ? "All Status"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-0" align="end">
            <Command>
              <CommandList>
                {[
                  { value: "all", label: "All Status" },
                  { value: "solved", label: "Solved" },
                  { value: "attempted", label: "Attempted" },
                  { value: "todo", label: "To-do" },
                ].map((s) => (
                  <CommandItem
                    key={s.value}
                    onSelect={() => setStatus(s.value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 mr-2",
                        status === s.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {s.label}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Difficulty */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 rounded-xl justify-between font-normal min-w-[140px] gap-2 shrink-0"
            >
              <span className="truncate">
                {selectedDifficulties.length === 0
                  ? "All Difficulties"
                  : selectedDifficulties.length === 1
                    ? selectedDifficulties[0]
                    : `${selectedDifficulties.length} difficulties`}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="end">
            <Command>
              <CommandList>
                <CommandItem
                  onSelect={clearDifficulties}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 mr-2",
                      selectedDifficulties.length === 0 ? "opacity-100" : "opacity-0",
                    )}
                  />
                  All Difficulties
                </CommandItem>
                {(["Easy", "Medium", "Hard"] as const).map((d) => {
                  const checked = selectedDifficulties.includes(d);
                  return (
                    <CommandItem
                      key={d}
                      onSelect={() => toggleDifficulty(d)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn("h-4 w-4 mr-2", checked ? "opacity-100" : "opacity-0")}
                      />
                      {d}
                    </CommandItem>
                  );
                })}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>



      {/* Body */}
      {showLoadingTable ? (
        // Table-shaped skeleton — preserves the exact final colgroup widths so
        // the sortable/resizable header doesn't jump when data arrives.
        <Card className="overflow-hidden rounded-2xl border-border/60 min-w-0">
          <div className="overflow-hidden min-w-0 w-full">
            <Table className="table-fixed w-full">
              <colgroup>
                {selectionMode && <col style={{ width: "44px" }} />}
                {PROBLEM_COLUMNS.map((c) =>
                  tablePrefs.isVisible(c.id) ? (
                    <col key={c.id} style={{ width: `${tablePrefs.widthOf(c.id)}px` }} />
                  ) : null,
                )}
              </colgroup>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-0 [&>th]:bg-transparent [&>th]:text-[15px] [&>th]:font-medium [&>th]:normal-case [&>th]:tracking-normal [&>th]:text-muted-foreground [&>th]:h-12 [&>th]:py-0 [&>th]:border-b [&>th]:border-border/40">
                  {selectionMode && <TableHead className="w-[44px]" />}
                  {PROBLEM_COLUMNS.filter((c) => tablePrefs.isVisible(c.id)).map((c) => (
                    <TableHead key={c.id} className={cn(c.id === "topics" && "hidden md:table-cell", (c.id === "acceptance" || c.id === "companies") && "hidden lg:table-cell", c.id === "attempts" && "hidden sm:table-cell")}>
                      <span>{c.label}</span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {selectionMode && (
                      <TableCell className="py-2.5">
                        <Skeleton className="h-4 w-4 rounded" />
                      </TableCell>
                    )}
                    {PROBLEM_COLUMNS.filter((c) => tablePrefs.isVisible(c.id)).map((c) => (
                      <TableCell
                        key={c.id}
                        className={cn(
                          "py-2.5",
                          c.id === "topics" && "hidden md:table-cell",
                          (c.id === "acceptance" || c.id === "companies") && "hidden lg:table-cell",
                          c.id === "attempts" && "hidden sm:table-cell",
                        )}
                      >
                        {c.id === "companies" ? (
                          <div className="flex items-center -space-x-1.5">
                            {[0, 1, 2].map((k) => (
                              <Skeleton key={k} className="h-5 w-5 rounded-full ring-1 ring-zinc-800" />
                            ))}
                          </div>
                        ) : (
                          <Skeleton
                            className={cn(
                              "h-4",
                              c.id === "title" ? "w-3/4" :
                              c.id === "topics" ? "w-2/3" :
                              c.id === "row" || c.id === "status" || c.id === "bookmark" ? "w-4" :
                              "w-12",
                            )}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Filter className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No problems match your filters</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Try removing a filter or clearing all to start over.
          </p>
          <Button variant="outline" onClick={clearAll}>
            Reset filters
          </Button>
        </Card>
      ) : (
        <div className="relative">
          {/* Ambient amber glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" aria-hidden />
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-muted-foreground">
            <span className="uppercase tracking-wider text-zinc-500 mr-1">Filter</span>
            {([
              { key: "solved", label: "Solved", Icon: SquareCheckBig, color: "text-emerald-500", ring: "ring-emerald-500/40 bg-emerald-500/10" },
              { key: "attempted", label: "Attempted", Icon: SquareDot, color: "text-amber-500", ring: "ring-amber-500/40 bg-amber-500/10" },
              { key: "todo", label: "Not started", Icon: Square, color: "text-muted-foreground/60", ring: "ring-zinc-500/40 bg-white/[0.06]" },
            ] as const).map(({ key, label, Icon, color, ring }) => {
              const active = status === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(active ? "all" : key)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60",
                    active ? `ring-1 ${ring} text-foreground` : "hover:bg-white/[0.04]",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", color)} aria-hidden />
                  {label}
                </button>
              );
            })}
            {status !== "all" && (
              <button
                type="button"
                onClick={() => setStatus("all")}
                className="ml-1 text-[10px] uppercase tracking-wider text-zinc-500 hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <Card className="relative overflow-hidden rounded-2xl border-zinc-800/60 bg-[#0a0a0a] shadow-2xl backdrop-blur-sm min-w-0">
          <div className="overflow-hidden min-w-0 w-full">
          <Table className="table-fixed w-full">
            <colgroup>
              {selectionMode && <col style={{ width: "44px" }} />}
              {PROBLEM_COLUMNS.map((c) =>
                tablePrefs.isVisible(c.id) ? (
                  <col key={c.id} style={{ width: `${tablePrefs.widthOf(c.id)}px` }} />
                ) : null,
              )}
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0 [&>th]:bg-[#0f0f0f] [&>th]:text-[11px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wider [&>th]:text-zinc-500 [&>th]:h-11 [&>th]:py-0 [&>th]:border-b [&>th]:border-zinc-800">


                  {selectionMode && (
                    <TableHead className="w-[44px]">
                      <Checkbox
                        checked={
                          pageSlice.length > 0 &&
                          pageSlice.every((p) => selected.has(p.slug))
                        }
                        onCheckedChange={(v) => {
                          if (v) selectAllVisible();
                          else
                            pageSlice.forEach((p) => {
                              if (selected.has(p.slug)) toggleSelected(p.slug);
                            });
                        }}
                        aria-label="Select all on page"
                      />
                    </TableHead>
                  )}
                  {tablePrefs.isVisible("row") && (
                    <SortableResizableHeader
                      columnId="row"
                      label={
                        <span className="inline-flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5 text-primary/70" />
                        </span>
                      }
                      align="center"
                      width={tablePrefs.widthOf("row")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("row", px)}
                    />
                  )}
                  {tablePrefs.isVisible("status") && (
                    <SortableResizableHeader
                      columnId="status"
                      label={<span>Status</span>}
                      width={tablePrefs.widthOf("status")}
                      sortable
                      sortDir={dirOf("status")}
                      onSortClick={() => cycleColumnSort("status")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("status", px)}
                    />
                  )}
                  {tablePrefs.isVisible("title") && (
                    <SortableResizableHeader
                      columnId="title"
                      label={<span>Problem</span>}
                      width={tablePrefs.widthOf("title")}
                      sortable
                      sortDir={dirOf("title")}
                      onSortClick={() => cycleColumnSort("title")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("title", px)}
                    />
                  )}
                  {tablePrefs.isVisible("topics") && (
                    <SortableResizableHeader
                      columnId="topics"
                      label={<span>Topic</span>}
                      width={tablePrefs.widthOf("topics")}
                      className="hidden md:table-cell"
                      resizable
                      onResize={(px) => tablePrefs.setWidth("topics", px)}
                    />
                  )}
                  {tablePrefs.isVisible("companies") && (
                    <SortableResizableHeader
                      columnId="companies"
                      label={<span>Companies</span>}
                      width={tablePrefs.widthOf("companies")}
                      className="hidden lg:table-cell"
                      resizable
                      onResize={(px) => tablePrefs.setWidth("companies", px)}
                    />
                  )}
                  {tablePrefs.isVisible("difficulty") && (
                    <SortableResizableHeader
                      columnId="difficulty"
                      label={<span>Difficulty</span>}
                      width={tablePrefs.widthOf("difficulty")}
                      sortable
                      sortDir={dirOf("difficulty")}
                      onSortClick={() => cycleColumnSort("difficulty")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("difficulty", px)}
                    />
                  )}
                  {tablePrefs.isVisible("acceptance") && (
                    <SortableResizableHeader
                      columnId="acceptance"
                      label={<span>Solve %</span>}
                      align="right"
                      width={tablePrefs.widthOf("acceptance")}
                      className="hidden lg:table-cell"
                      sortable
                      sortDir={dirOf("acceptance")}
                      onSortClick={() => cycleColumnSort("acceptance")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("acceptance", px)}
                    />
                  )}
                  {tablePrefs.isVisible("attempts") && (
                    <SortableResizableHeader
                      columnId="attempts"
                      label={<span>Tries</span>}
                      align="right"
                      width={tablePrefs.widthOf("attempts")}
                      className="hidden sm:table-cell"
                      sortable
                      sortDir={dirOf("attempts")}
                      onSortClick={() => cycleColumnSort("attempts")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("attempts", px)}
                    />
                  )}
                  {tablePrefs.isVisible("bookmark") && (
                    <SortableResizableHeader
                      columnId="bookmark"
                      label={<span>List</span>}
                      width={tablePrefs.widthOf("bookmark")}
                    />
                  )}

                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const visibleColCount =
                    (selectionMode ? 1 : 0) +
                    PROBLEM_COLUMNS.filter((c) => tablePrefs.isVisible(c.id)).length;
                  const renderRow = (p: (typeof pageSlice)[number], idx: number) => {
                    const manual = manualStatusMap[p.slug];
                    const isSolved = solved.has(p.slug) || manual === "solved";
                    const isAttempted =
                      !isSolved && (attempted.has(p.slug) || manual === "attempted");
                    const stats = perProblem.get(p.slug);
                    const bm = isBookmarked(p.slug);
                    const isSel = selected.has(p.slug);
                    const acceptance =
                      stats && stats.attempts > 0
                        ? Math.round(((stats.accepted ?? 0) / stats.attempts) * 100)
                        : null;
                    const rowNumber =
                      uploadIndexBySlug.get(p.slug) ?? (safePage - 1) * PAGE_SIZE + idx + 1;
                    return (
                    <TableRow
                      key={p.slug}
                      data-selected={isSel}
                      className={cn(
                        "group border-b border-zinc-900 transition-colors",
                        "hover:bg-amber-500/[0.03]",
                        isSel && "bg-amber-500/10",
                      )}
                    >

                      {selectionMode && (
                        <TableCell className={`${cellPadY}`}>
                          <Checkbox
                            checked={isSel}
                            onCheckedChange={() => toggleSelected(p.slug)}
                            aria-label="Select problem"
                          />
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("row") && (
                        <TableCell className={`${cellPadY} text-center text-xs text-muted-foreground tabular-nums`}>
                          {rowNumber}
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("status") && (
                        <TableCell className={`${cellPadY}`}>
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cur: ManualStatus = isSolved
                                      ? "solved"
                                      : isAttempted
                                        ? "attempted"
                                        : "none";
                                    cycleManualStatus(p.slug, cur);
                                  }}
                                  className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 ${isSolved ? "hover:bg-emerald-500/15" : isAttempted ? "hover:bg-amber-500/10" : "hover:bg-white/[0.06]"}`}
                                  aria-label={`Status: ${isSolved ? "Solved" : isAttempted ? "Attempted" : "Not started"}. Click to change.`}
                                >
                                  {isSolved ? (
                                    <SquareCheckBig className="h-5 w-5 text-emerald-500" />
                                  ) : isAttempted ? (
                                    <SquareDot className="h-5 w-5 text-amber-500" />
                                  ) : (
                                    <Square className="h-5 w-5 text-muted-foreground/25" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-xs">
                                {isSolved ? "Solved" : isAttempted ? "Attempted" : "Not started"}
                                <span className="ml-1 text-muted-foreground">· click to change</span>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("title") && (
                        <TableCell className={`${cellPadY} min-w-0`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Link
                              to={`/library/problems/${p.slug}`}
                              onMouseEnter={() => prefetchProblem(p.slug)}
                              onFocus={() => prefetchProblem(p.slug)}
                              className="text-sm font-semibold text-foreground group-hover:text-amber-400 transition-colors block truncate"
                            >
                              {p.title}
                            </Link>
                            {p._incomplete && (
                              <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500"
                                      aria-label="Incomplete problem data"
                                    >
                                      <AlertTriangle className="h-3 w-3" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs">
                                      <div className="font-semibold mb-0.5">
                                        Incomplete
                                      </div>
                                      {(p._incompleteReasons ?? []).length > 0 ? (
                                        <ul className="list-disc pl-4 space-y-0.5">
                                          {(p._incompleteReasons ?? []).map((r) => (
                                            <li key={r}>{r}</li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <span>
                                          Missing description, sample tests, or
                                          starter code.
                                        </span>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <ProblemNoteQuickEdit slug={p.slug} title={p.title} />
                          </div>
                          {/* Mobile-only inline topics */}
                          <div className="md:hidden mt-1 flex flex-wrap gap-1">
                            {p.topics.slice(0, 2).map((t) => (
                              <Badge
                                key={t}
                                variant="secondary"
                                className="text-[10px] font-normal px-1.5 py-0"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("topics") && (
                        <TableCell className={`hidden md:table-cell ${cellPadY}`}>
                          <TopicBadgesWithOverflow topics={p.topics} visibleCount={3} />
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("companies") && (
                        <TableCell className={`hidden lg:table-cell ${cellPadY}`}>
                          <CompanyLogos slug={p.slug} min={2} max={10} size={20} />
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("difficulty") && (
                        <TableCell className={`${cellPadY}`}>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              difficultyClass(p.difficulty),
                            )}
                          >
                            {p.difficulty}
                          </Badge>
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("acceptance") && (
                        <TableCell className={`hidden lg:table-cell ${cellPadY} text-right`}>
                          {acceptance !== null ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-12 h-1 rounded-full bg-border/60 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                                  style={{ width: `${Math.max(4, Math.min(100, acceptance))}%` }}
                                />
                              </div>
                              <span className="text-[11px] tabular-nums font-medium text-muted-foreground w-9 text-right">{acceptance}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                      )}

                      {tablePrefs.isVisible("attempts") && (
                        <TableCell className={`hidden sm:table-cell ${cellPadY} text-right text-xs text-muted-foreground tabular-nums`}>
                          {stats?.attempts ?? 0}
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("bookmark") && (
                        <TableCell className={`${cellPadY}`}>
                          <button
                            type="button"
                            onClick={() => toggleBookmark(p.slug)}
                            className="p-1 rounded hover:bg-muted/50 transition-colors"
                            aria-label={bm ? "Remove bookmark" : "Bookmark"}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4 transition-colors",
                                bm
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/40 hover:text-amber-400",
                              )}
                            />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                  };

                  if (!groupByDiff) {
                    return pageSlice.map((p, idx) => (
                      <Fragment key={p.slug}>{renderRow(p, idx)}</Fragment>
                    ));
                  }

                  const buckets = new Map<Difficulty, typeof pageSlice>();
                  pageSlice.forEach((p) => {
                    const arr = buckets.get(p.difficulty) ?? [];
                    arr.push(p);
                    buckets.set(p.difficulty, arr);
                  });
                  const order: Difficulty[] = ["Easy", "Medium", "Hard"];
                  const nodes: React.ReactNode[] = [];
                  order.forEach((d) => {
                    const items = buckets.get(d) ?? [];
                    if (items.length === 0) return;
                    const solvedInGroup = items.filter((p) => solved.has(p.slug)).length;
                    const isOpen = !collapsedGroups.has(d);
                    nodes.push(
                      <DifficultyGroupRow
                        key={`group-${d}`}
                        difficulty={d}
                        total={items.length}
                        solved={solvedInGroup}
                        isOpen={isOpen}
                        onToggle={() => toggleGroup(d)}
                        colSpan={visibleColCount}
                      />,
                    );
                    if (isOpen) {
                      items.forEach((p, i) =>
                        nodes.push(<Fragment key={p.slug}>{renderRow(p, i)}</Fragment>),
                      );
                    }
                  });
                  return nodes;
                })()}
            </TableBody>
          </Table>
          </div>
          </Card>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (() => {
        const start = (safePage - 1) * PAGE_SIZE + 1;
        const end = Math.min(safePage * PAGE_SIZE, filtered.length);
        // Show a 5-page window centered around the current page.
        const WINDOW = 5;
        let winStart = Math.max(1, safePage - Math.floor(WINDOW / 2));
        let winEnd = Math.min(totalPages, winStart + WINDOW - 1);
        winStart = Math.max(1, winEnd - WINDOW + 1);
        const pages: number[] = [];
        for (let i = winStart; i <= winEnd; i++) pages.push(i);
        return (
          <div className="mt-6 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <Button
                variant="outline" size="icon"
                className="h-9 w-9 rounded-lg"
                disabled={safePage <= 1}
                onClick={() => setPage(1)}
                aria-label="First page"
              >
                <ChevronLeft className="h-3.5 w-3.5 -mr-1.5" />
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline" size="icon"
                className="h-9 w-9 rounded-lg"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {pages.map((p) => (
                <Button
                  key={p}
                  variant={p === safePage ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-9 min-w-9 px-2 rounded-lg text-sm font-semibold tabular-nums",
                    p === safePage && "bg-gradient-to-br from-amber-500 to-orange-500 text-black border-0 hover:opacity-90 shadow-[0_4px_14px_-4px_rgba(245,158,11,0.5)]",
                  )}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === safePage ? "page" : undefined}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline" size="icon"
                className="h-9 w-9 rounded-lg"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" size="icon"
                className="h-9 w-9 rounded-lg"
                disabled={safePage >= totalPages}
                onClick={() => setPage(totalPages)}
                aria-label="Last page"
              >
                <ChevronRight className="h-3.5 w-3.5 -mr-1.5" />
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              Showing <span className="font-semibold text-foreground">{start}–{end}</span> of{" "}
              <span className="font-semibold text-foreground">{filtered.length}</span> problems · Page{" "}
              <span className="font-semibold text-foreground">{safePage}</span> of {totalPages}
            </p>
          </div>
        );
      })()}
      </>)}

        </div>
      </div>





      <AlertDialog open={confirmUnbookmark} onOpenChange={setConfirmUnbookmark}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove bookmarks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove bookmarks from{" "}
              <span className="font-semibold text-foreground">{unbookmarkCount}</span>{" "}
              {unbookmarkCount === 1 ? "problem" : "problems"}. You can re-bookmark them
              individually later, but this can't be undone in bulk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performBulkUnbookmark}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove {unbookmarkCount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShortcutsCheatSheet
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        shortcuts={[
          { keys: ["?"], description: "Show keyboard shortcuts" },
          { keys: ["/"], description: "Focus search" },
          { keys: ["b"], description: "Toggle bookmarked-only filter" },
          { keys: ["d"], description: "Toggle row density" },
          { keys: ["s"], description: "Toggle selection mode" },
          { keys: ["Esc"], description: "Clear selection / close" },
          { keys: ["←"], description: "Previous page" },
          { keys: ["→"], description: "Next page" },
        ]}
      />
      {LoginPromptDialog}
    </HeroAmbientBackdrop>
    </ProblemCompaniesProvider>


  );
};

export default CodingProblems;
