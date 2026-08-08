import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  Loader2,
  Minus,
  Plus,
  Type,
  ChevronRight,
  Keyboard,
  Wand2,
  History,
  Maximize2,
  Minimize2,
  FileText,
  BookOpen,
  Clock,
  MessageCircle,
  Copy,
  NotebookPen,
} from "lucide-react";

import SecureProblemHUD from "@/components/contests/SecureProblemHUD";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProblemBySlug,
  LANGUAGES,
  getLanguageById,
  isSQLLang,
  type LangId,
} from "@/data/codingProblemsData";
import {
  useDbCodingProblem,
  useDbProblemReferenceSolutions,
} from "@/hooks/useDbCodingProblem";
import { MonacoEditor, type MonacoEditorHandle } from "@/components/coding/MonacoEditor";
import { getDefaultStarter } from "@/lib/coding/defaultStarters";
import { VerdictBadge } from "@/components/coding/VerdictBadge";
import { CodeExecutionError, useCodeRunner, type RunResult, type SubmitResult, type CaseResult } from "@/hooks/useCodeRunner";
import { getExecLimitsForLang, formatLimits } from "@/lib/coding/executionLimits";

const humanRunErrorTitle = (stage?: string) => {
  switch (stage) {
    case "config": return "Code runner isn't configured";
    case "validation": return "Invalid run request";
    case "submit": return "Provider rejected the run";
    case "poll": return "Provider timed out";
    default: return "Run failed";
  }
};

import { Cpu, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCodeDraft } from "@/hooks/useCodeDraft";
import { useCodingSubmissions } from "@/hooks/useCodingSubmissions";
import { useCodeRuns } from "@/hooks/useCodeRuns";
import { useCodingProblemBookmarks } from "@/hooks/useCodingProblemBookmarks";
import { Dialog, DialogContent } from "@/components/ui/dialog";


import { SubmissionDetailsDrawer } from "@/components/library/coding/SubmissionDetailsDrawer";

import { NotesPanel } from "@/components/library/coding/NotesPanel";
import { ProgressiveHints } from "@/components/library/coding/ProgressiveHints";
import { MySolutionPanel } from "@/components/library/coding/MySolutionPanel";
import { FloatingActionBar } from "@/components/library/coding/FloatingActionBar";
import { SessionTimer, formatSolveTime, type SessionTimerHandle } from "@/components/library/coding/SessionTimer";
import { TestCaseWorkbench } from "@/components/library/coding/TestCaseWorkbench";
import { SubmissionResultView } from "@/components/library/coding/SubmissionResultView";
import { SchemaSeedToggle } from "@/components/library/coding/SchemaSeedToggle";
import { SqlResultDiff, SqlResultTable } from "@/components/library/coding/SqlResultDiff";
import { ProblemRunHistory } from "@/components/library/coding/ProblemRunHistory";
import { ShortcutsCheatSheet } from "@/components/library/coding/ShortcutsCheatSheet";
import { useProblemNotes } from "@/hooks/useProblemNotes";
import { useProblemSolution } from "@/hooks/useProblemSolution";
import { useContestLocks } from "@/hooks/useContestLocks";
import { LockedAuxPanel } from "@/components/contests/LockedAuxPanel";
import { logContestLockEvent } from "@/lib/contestTelemetry";
import { useActiveContestSession } from "@/hooks/useActiveContestSession";
import { useTypingTelemetry } from "@/hooks/useTypingTelemetry";
import { useEditorPrefs } from "@/hooks/useEditorPrefs";
import type { CodeSubmissionRow } from "@/hooks/useCodingSubmissions";
import { cn } from "@/lib/utils";
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
import { CodeDiffPreview } from "@/components/library/coding/CodeDiffPreview";
import { DraftSaveIndicator } from "@/components/library/coding/DraftSaveIndicator";
import { EditorSettingsPopover } from "@/components/library/coding/EditorSettingsPopover";
import { useFormatOnSubmitOverride } from "@/hooks/useFormatOnSubmitOverride";
import { ChevronScroller } from "@/components/library/coding/ChevronScroller";
import {
  useEditorTabsLayout,
  type EditorTabId,
} from "@/hooks/useEditorTabsLayout";
import { SortableEditorTabs } from "@/components/library/coding/SortableEditorTabs";
import { LayoutGrid } from "lucide-react";
import { useEditorLayoutPreset } from "@/hooks/useEditorLayoutPreset";
import { LayoutPresetPopover } from "@/components/library/coding/LayoutPresetPopover";
import type { ImperativePanelGroupHandle } from "react-resizable-panels";

import { ProblemCurriculumSidebar } from "@/components/library/coding/ProblemCurriculumSidebar";
import { ProblemMcqBlock } from "@/components/library/coding/ProblemMcqBlock";
import { ProblemFooterBar } from "@/components/library/coding/ProblemFooterBar";
import { ProblemDiscussion } from "@/components/library/coding/ProblemDiscussion";
import { SignInGate } from "@/components/library/coding/SignInGate";
import {
  ProblemFormatCards,
  ProblemConstraints,
  splitProblemDescription,
} from "@/components/library/coding/ProblemFormatSections";


const difficultyClass = (d: string) =>
  d === "Easy"
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : d === "Medium"
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-rose-500 bg-rose-500/10 border-rose-500/20";

const LAST_OPENED_KEY = "parikshaa:coding-last-opened-submission";
const LAST_FAILED_KEY = "parikshaa:coding-last-failed-submission";

const DEFAULT_PROBLEM_TAB: EditorTabId = "description";
const validTabIds: readonly EditorTabId[] = [
  "description",
  "editorial",
  "submissions",
  "discussion",
  "notes",
  "my-solution",
  "solution",
  "runs",
] as const;

const isValidProblemTab = (tab: string | null): tab is EditorTabId =>
  !!tab && validTabIds.includes(tab as EditorTabId);

const readMap = (key: string): Record<string, string> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

const writeMapEntry = (key: string, slug: string, id: string | null) => {
  try {
    const map = readMap(key);
    if (id) map[slug] = id;
    else delete map[slug];
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

const readLastOpenedMap = () => readMap(LAST_OPENED_KEY);
const writeLastOpened = (slug: string, id: string | null) =>
  writeMapEntry(LAST_OPENED_KEY, slug, id);

const readLastFailedMap = () => readMap(LAST_FAILED_KEY);
const writeLastFailed = (slug: string, id: string | null) =>
  writeMapEntry(LAST_FAILED_KEY, slug, id);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};


const CodingProblemDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const staticProblem = useMemo(() => (slug ? getProblemBySlug(slug) : undefined), [slug]);
  const { data: dbProblem, isLoading: dbProblemLoading } = useDbCodingProblem(
    staticProblem ? undefined : slug,
  );
  const problem = staticProblem ?? dbProblem ?? undefined;
  const [searchParams, setSearchParams] = useSearchParams();

  const isSQLProblem = !!problem?.sql;
  const defaultLang: LangId = isSQLProblem ? "sql" : "cpp";
  const [language, setLanguage] = useState<LangId>(defaultLang);
  const [mySolutionLanguage, setMySolutionLanguage] = useState<LangId>(defaultLang);
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"testcase" | "output">("testcase");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  type CaseStatusEntry = {
    status: "passed" | "failed";
    input?: string;
    expected?: string;
    got?: string;
  };
  type CustomStatusEntry = {
    status: "ok" | "error";
    input?: string;
    got?: string;
    stderr?: string;
  };
  const SAMPLE_KEY = "parikshaa:coding-case-status:v1";
  const CUSTOM_KEY = "parikshaa:coding-custom-status:v1";
  const readStore = <T,>(key: string): Record<string, Record<string, T>> => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return {};
      const v = JSON.parse(raw);
      return v && typeof v === "object" ? v : {};
    } catch {
      return {};
    }
  };
  const writeStore = (key: string, map: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  };
  const [sampleCaseStatus, setSampleCaseStatus] = useState<Record<number, CaseStatusEntry>>(
    () => (readStore<CaseStatusEntry>(SAMPLE_KEY)[slug] as Record<number, CaseStatusEntry>) ?? {},
  );
  const [customCaseStatus, setCustomCaseStatus] = useState<Record<string, CustomStatusEntry>>(
    () =>
      (readStore<CustomStatusEntry>(CUSTOM_KEY)[slug] as Record<string, CustomStatusEntry>) ?? {},
  );
  const [activeSampleIndex, setActiveSampleIndex] = useState<number | null>(0);
  const [activeCustomId, setActiveCustomId] = useState<string | null>(null);

  // Reload + persist per-slug case status (so navigating away & back keeps marks).
  useEffect(() => {
    setSampleCaseStatus(
      (readStore<CaseStatusEntry>(SAMPLE_KEY)[slug] as Record<number, CaseStatusEntry>) ?? {},
    );
    setCustomCaseStatus(
      (readStore<CustomStatusEntry>(CUSTOM_KEY)[slug] as Record<string, CustomStatusEntry>) ?? {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  useEffect(() => {
    const map = readStore<CaseStatusEntry>(SAMPLE_KEY);
    if (Object.keys(sampleCaseStatus).length === 0) delete map[slug];
    else map[slug] = sampleCaseStatus;
    writeStore(SAMPLE_KEY, map);
  }, [slug, sampleCaseStatus]);
  useEffect(() => {
    const map = readStore<CustomStatusEntry>(CUSTOM_KEY);
    if (Object.keys(customCaseStatus).length === 0) delete map[slug];
    else map[slug] = customCaseStatus;
    writeStore(CUSTOM_KEY, map);
  }, [slug, customCaseStatus]);

  const handleResetResults = () => {
    setSampleCaseStatus({});
    setCustomCaseStatus({});
    try {
      const sMap = readStore<CaseStatusEntry>(SAMPLE_KEY);
      delete sMap[slug];
      writeStore(SAMPLE_KEY, sMap);
      const cMap = readStore<CustomStatusEntry>(CUSTOM_KEY);
      delete cMap[slug];
      writeStore(CUSTOM_KEY, cMap);
    } catch {
      /* ignore */
    }
    toast({ title: "Results reset", description: "All case statuses cleared for this problem." });
  };
  const [executionErrorDetails, setExecutionErrorDetails] = useState<boolean>(false);
  const [runError, setRunError] = useState<{
    message: string;
    stage?: string;
    providerStatus?: number;
    providerBody?: string;
    requestedUrl?: string;
  } | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginAction, setLoginAction] = useState<"run" | "submit" | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Inline contest-submission error banner (shown above the editor when a
  // contest-context submission is rejected by the server).
  const [contestError, setContestError] = useState<string | null>(null);
  // Hard-block flag: when a contest pre-check (on mount) determines the user
  // cannot submit (e.g. contest closed, not registered), disable Submit so
  // the action is blocked before click — not just on the click handler.
  const [contestSubmitBlocked, setContestSubmitBlocked] = useState(false);
  const [contestId, setContestId] = useState<string | null>(null);
  // Reflects the SecureProblemHUD's heartbeat health. While the heartbeat is
  // offline/reconnecting we disable the Submit button — server-side
  // validate_contest_submission also rejects in that state, so this is purely
  // a UX guardrail to prevent confusing failures mid-network-blip.
  const [secureSubmissionReady, setSecureSubmissionReady] = useState(true);
  const sessionTimerRef = useRef<SessionTimerHandle>(null);
  const editorRef = useRef<MonacoEditorHandle>(null);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [showCompanyTags, setShowCompanyTags] = useState(false);
  
  const [detailSubmission, setDetailSubmission] = useState<CodeSubmissionRow | null>(null);
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(() =>
    slug ? readLastOpenedMap()[slug] ?? null : null,
  );
  const [lastFailedId, setLastFailedId] = useState<string | null>(() =>
    slug ? readLastFailedMap()[slug] ?? null : null,
  );
  // Bumped whenever we want the AttemptTimeline to auto-scroll the highlighted
  // entry into view (e.g. after "Go to failed cases" toast action, or when a
  // previously-highlighted failed attempt is restored on remount).
  const [timelineScrollKey, setTimelineScrollKey] = useState(0);
  // Tracks whether we've already auto-restored the persisted "last failed"
  // highlight for this mount, so we don't keep re-triggering it.
  const restoredFailedRef = useRef(false);

  const { run, submit, isRunning, isSubmitting } = useCodeRunner();
  const {
    draft,
    draftLoaded,
    saveDraft,
    flushDraft,
    saveStatus,
    lastSavedAt,
  } = useCodeDraft(slug ?? "", language);
  // Pending candidate code for the "Last submitted" confirm dialog. When set,
  // the dialog is open and applying it replaces the editor contents.
  const [pendingRestoreCode, setPendingRestoreCode] = useState<{
    code: string;
    label: string;
    /** Snapshot of editor contents BEFORE the dialog opened, so a one-click
     *  "Cancel restoration" can revert exactly to what the user had. */
    snapshot: string;
  } | null>(null);
  /** Snapshot of editor contents BEFORE the dialog opened, so a one-click
   *  "Cancel restoration" can revert exactly to what the user had. */
  const [restoreUndoSnapshot, setRestoreUndoSnapshot] = useState<string | null>(null);
  // Transient hint shown briefly when entering fullscreen.
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);
  const { submissions, loading: submissionsLoading, refetch: refetchSubmissions } = useCodingSubmissions(slug);
  // Lock state for contest aux materials (notes / my-solution / reference / runs)
  // — driven by useContestLocks. While the contest is live and the user is a
  // registered participant, these panels are replaced with a LockedAuxPanel
  // surface that countdowns to the contest end. Hooks below also receive the
  // `locked` flag so they refuse to fetch sensitive data over the network.
  const contestLocks = useContestLocks(contestId ?? undefined);
  // Active contest session id (for typing telemetry). Only resolved when we
  // are on a `?contest=<slug>` URL inside an active secure session.
  const contestSession = useActiveContestSession(contestId ?? undefined);
  const typing = useTypingTelemetry({
    contestId: contestId ?? undefined,
    sessionId: contestSession.sessionId ?? null,
    problemSlug: slug,
    enabled: !!contestId && contestSession.hasActive,
  });
  const lastCodeLenRef = useRef<number>(0);
  const { runs, refetch: refetchRuns } = useCodeRuns(slug, {
    locked: (contestLocks as any).historyLocked,
    contestId,
  });
  const { toggle: rawToggleBookmark } = useCodingProblemBookmarks();
  const { note: notesValue, setNote: setNotesValue, savedAt: notesSavedAt } = useProblemNotes(slug);
  const {
    notes: mySolutionNotes,
    code: mySolutionCode,
    savedAt: mySolutionSavedAt,
    savedLanguages: mySolutionSavedLanguages,
    codeUpdatedAt: mySolutionCodeUpdatedAt,
    setNotes: setMySolutionNotes,
    setCode: setMySolutionCode,
    clear: clearMySolution,
    restore: restoreMySolution,
    hasUnsavedCurrentCode: mySolutionHasUnsavedCurrentCode,
    undoCodeChange: undoMySolutionCode,
    canUndoCode: canUndoMySolutionCode,
    hasContent: hasMySolution,
    hasNotes: mySolutionHasNotes,
    hasAnyCode: mySolutionHasAnyCode,
    isComplete: mySolutionIsComplete,
    syncStatus: mySolutionSyncStatus,
    isCloudSynced: mySolutionIsCloudSynced,
    lastSyncedAt: mySolutionLastSyncedAt,
    lastConflictResolvedAt: mySolutionLastConflictAt,
  } = useProblemSolution(slug, mySolutionLanguage, {
    locked: (contestLocks as any).solutionLocked,
    contestId,
  });
  const {
    prefs: editorPrefs,
    incFontSize,
    decFontSize,
    toggleTimestampFormat,
    setFormatOnSubmit,
    MIN: FS_MIN,
    MAX: FS_MAX,
  } = useEditorPrefs();
  const {
    effective: effectiveFormatOnSubmit,
    override: formatOnSubmitOverride,
    setOverride: setFormatOnSubmitOverride,
  } = useFormatOnSubmitOverride(slug, language, editorPrefs.formatOnSubmit);
  const {
    order: tabOrder,
    active: activeTab,
    setOrder: setTabOrder,
    setActive: setActiveTabRaw,
    reset: resetTabsLayout,
    isCustomized: isLayoutCustomized,
  } = useEditorTabsLayout(slug, language);
  const acceptedExists = submissions.some((s) => s.verdict === "Accepted");
  const shouldLoadReferenceSolution =
    !staticProblem &&
    acceptedExists &&
    !(contestLocks as any).solutionLocked &&
    (activeTab === "editorial" || activeTab === "solution");
  const { data: dbReferenceSolution = {}, isLoading: referenceSolutionLoading } = useDbProblemReferenceSolutions(
    slug,
    shouldLoadReferenceSolution,
  );

  // Map of which tabs are locked by the active contest. Used to (a) reject
  // setActiveTab calls that would land on a locked tab, (b) auto-redirect to
  // Description if the persisted active tab is locked when the contest starts,
  // and (c) decorate trigger labels with a 🔒.
  const isTabLocked = (id: EditorTabId) =>
    (id === "notes" && (contestLocks as any).notesLocked) ||
    (id === "my-solution" && (contestLocks as any).solutionLocked) ||
    (id === "solution" && (contestLocks as any).solutionLocked) ||
    (id === "editorial" && (contestLocks as any).solutionLocked) ||
    (id === "runs" && (contestLocks as any).historyLocked);

  const setActiveTab = (id: EditorTabId) => {
    if (isTabLocked(id)) {
      logContestLockEvent({
        contestId,
        problemSlug: slug,
        kind: "blocked_tab_activation",
        target: id as never,
      });
      toast({
        title: "Locked during contest",
        description: "This panel unlocks when the contest ends.",
      });
      return;
    }
    setActiveTabRaw(id);
  };

  // Sync active tab with URL ?tab= for shareable/back-nav persistence.
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (!isValidProblemTab(urlTab)) return;

    const next = new URLSearchParams(searchParams);
    if (isTabLocked(urlTab)) {
      next.delete("tab");
      setSearchParams(next, { replace: true });
      if (isTabLocked(activeTab)) setActiveTabRaw(DEFAULT_PROBLEM_TAB);
      return;
    }

    if (urlTab !== activeTab) {
      setActiveTabRaw(urlTab);
    }

    // The default Description tab is never represented in the URL. This runs
    // before the active-tab-to-URL sync can persist a stale non-default tab
    // from localStorage, so opening/refeshing ?tab=description always cleans it.
    if (urlTab === DEFAULT_PROBLEM_TAB) {
      next.delete("tab");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  useEffect(() => {
    if (!activeTab) return;
    const current = searchParams.get("tab");
    // If a valid URL tab is still being applied, do not let a persisted tab
    // value race in and overwrite it. The URL is the source of truth on load.
    if (isValidProblemTab(current) && current !== activeTab) return;

    const next = new URLSearchParams(searchParams);
    // Keep the default "description" tab out of the URL so canonical/share
    // links stay clean (no ?tab=description noise for SEO).
    if (activeTab === DEFAULT_PROBLEM_TAB) {
      if (!current) return;
      next.delete("tab");
    } else {
      if (current === activeTab) return;
      next.set("tab", activeTab);
    }
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // If the user previously had a now-locked tab as their active tab (e.g.
  // they had "notes" open before the contest started, or hot-reloaded into a
  // contest), force them back to Description.
  useEffect(() => {
    if (isTabLocked(activeTab)) {
      setActiveTabRaw("description");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    (contestLocks as any).notesLocked,
    (contestLocks as any).solutionLocked,
    (contestLocks as any).historyLocked,
  ]);
  const {
    presetId: layoutPresetId,
    preset: layoutPreset,
    setPreset: setLayoutPreset,
    reset: resetLayoutPreset,
    isCustomized: isPresetCustomized,
  } = useEditorLayoutPreset(slug, language);
  const horizontalGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const verticalGroupRef = useRef<ImperativePanelGroupHandle>(null);

  // Apply the chosen preset's split sizes whenever the preset changes.
  useEffect(() => {
    horizontalGroupRef.current?.setLayout(layoutPreset.horizontal);
    verticalGroupRef.current?.setLayout(layoutPreset.vertical);
  }, [layoutPreset]);

  // Open drawer when ?sub=<id> is in URL and submissions have loaded.
  // If the submission ID doesn't exist for this problem, clear the param so
  // the drawer doesn't open to nothing.
  useEffect(() => {
    const subId = searchParams.get("sub");
    if (!subId) return;
    if (submissions.length === 0) return; // wait for load
    const found = submissions.find((s) => s.id === subId);
    if (found) {
      if (!detailSubmission || detailSubmission.id !== subId) {
        setDetailSubmission(found);
        setLastOpenedId(subId);
        if (slug) writeLastOpened(slug, subId);
      }
    } else {
      // Stale deep-link — strip it and offer the most relevant fallback.
      const next = new URLSearchParams(searchParams);
      next.delete("sub");
      setSearchParams(next, { replace: true });

      // Prefer the most recent failing submission (most useful for debugging),
      // then fall back to the latest attempt of any verdict.
      const latestFailed = submissions.find(
        (s) => s.verdict && s.verdict !== "Accepted",
      );
      const latest = submissions[0]; // newest-first
      const target = latestFailed ?? latest;

      toast({
        title: "Submission link expired",
        description: latestFailed
          ? "That submission isn't available — jump straight to your most recent failed attempt to see what went wrong."
          : latest
            ? "That submission isn't available — open your most recent attempt instead."
            : "That submission isn't available for this problem anymore.",
        action: target ? (
          <ToastAction
            altText={latestFailed ? "Go to failed cases" : "Go to last attempt"}
            onClick={() =>
              latestFailed ? jumpToFailed(latestFailed) : openSubmission(target)
            }
          >
            {latestFailed ? "Go to failed cases" : "Go to last attempt"}
          </ToastAction>
        ) : undefined,
      });
    }
  }, [searchParams, submissions, slug, detailSubmission, setSearchParams, toast]);

  const openSubmission = (s: CodeSubmissionRow) => {
    setDetailSubmission(s);
    setLastOpenedId(s.id);
    if (slug) writeLastOpened(slug, s.id);
    // Trigger an auto-scroll inside the AttemptTimeline so the highlighted
    // entry becomes visible immediately (especially for "Go to failed cases").
    setTimelineScrollKey((k) => k + 1);
    const next = new URLSearchParams(searchParams);
    next.set("sub", s.id);
    setSearchParams(next, { replace: true });
  };

  /**
   * Jump to a failed submission: opens its drawer, persists it as the last
   * highlighted failed attempt for this slug, and shows a confirmation toast
   * that names the specific test case (when available).
   */
  const jumpToFailed = (s: CodeSubmissionRow) => {
    openSubmission(s);
    setLastFailedId(s.id);
    if (slug) writeLastFailed(slug, s.id);

    // Build a friendly description that names the failing case if we have it.
    const failingCase = (s.failing_case ?? null) as
      | { index?: number | null; name?: string | null }
      | null;
    const caseLabel = failingCase
      ? failingCase.name
        ? `case "${failingCase.name}"`
        : typeof failingCase.index === "number"
          ? `test case #${failingCase.index + 1}`
          : "the failing case"
      : `${s.passed_tests}/${s.total_tests} tests passed`;

    toast({
      title: "Jumped to failed attempt",
      description: `Highlighted ${caseLabel} on the timeline.`,
    });
  };

  const closeSubmission = () => {
    setDetailSubmission(null);
    if (searchParams.get("sub")) {
      const next = new URLSearchParams(searchParams);
      next.delete("sub");
      setSearchParams(next, { replace: true });
    }
  };

  // Restore previously-highlighted failed attempt when submissions arrive,
  // but only if the user hasn't deep-linked a specific submission. Auto-scrolls
  // the timeline to the same entry once.
  useEffect(() => {
    if (restoredFailedRef.current) return;
    if (!slug || !lastFailedId) return;
    if (submissions.length === 0) return;
    if (searchParams.get("sub")) return;
    const exists = submissions.some((s) => s.id === lastFailedId);
    if (!exists) {
      // Stale persisted id — clear it.
      writeLastFailed(slug, null);
      setLastFailedId(null);
      restoredFailedRef.current = true;
      return;
    }
    setLastOpenedId(lastFailedId);
    setTimelineScrollKey((k) => k + 1);
    restoredFailedRef.current = true;
  }, [submissions, slug, lastFailedId, searchParams]);

  // Contest pre-validation: when the page is opened in the context of a
  // contest (?contest=<slug>), call validate_contest_submission on mount so
  // the Submit button is disabled (with the server's reason) for closed /
  // unregistered / disqualified states — before the user even clicks.
  useEffect(() => {
    const contestSlug = searchParams.get("contest");
    if (!contestSlug || !problem?.slug) {
      setContestSubmitBlocked(false);
      setContestError(null);
      setContestId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: contestRow } = await supabase
          .from("contests" as any)
          .select("id")
          .eq("slug", contestSlug)
          .maybeSingle();
        if (cancelled || !(contestRow as any)?.id) return;
        setContestId((contestRow as any).id);
        const { data: check } = await supabase.rpc("validate_contest_submission", {
          _contest_id: (contestRow as any).id,
          _problem_slug: problem.slug,
        });
        if (cancelled) return;
        const v = check as { ok: boolean; message?: string; code?: string } | null;
        // Only hard-block for terminal/contest-state failures. Auth-required
        // is handled by the existing login flow and shouldn't permanently
        // disable Submit.
        const blockingCodes = new Set([
          "closed",
          "not_active",
          "not_started",
          "not_registered",
          "withdrawn",
          "disqualified",
          "already_solved",
          "invalid_problem",
          "not_found",
          "no_active_session",
        ]);
        if (v && !v.ok && v.code && blockingCodes.has(v.code)) {
          setContestSubmitBlocked(true);
          setContestError(v.message ?? "Cannot submit to this contest right now.");
        } else {
          setContestSubmitBlocked(false);
        }
      } catch {
        // Network/RPC errors should not permanently block — let the click
        // handler surface the failure with full context.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, problem?.slug]);

  // Derived per-problem stats
  const problemStats = useMemo(() => {
    const attempts = submissions.length;
    const accepted = submissions.filter((s) => s.verdict === "Accepted");
    const isSolved = accepted.length > 0;
    const isAttempted = attempts > 0;
    // earliest accepted = solvedAt
    let solvedAt: string | null = null;
    for (const a of accepted) {
      if (!solvedAt || a.created_at < solvedAt) solvedAt = a.created_at;
    }
    return { attempts, isSolved, isAttempted, solvedAt };
  }, [submissions]);

  // Resolve starter code with SQL-aware fallback. When the DB row is missing
  // a language (some problems were seeded with only one language), fall back
  // to a properly formatted generic template so the editor never opens empty.
  const getStarter = (lang: LangId): string => {
    if (!problem) return "";
    if (isSQLLang(lang)) return problem.sql?.starter ?? "-- Write your SQL query here\n";
    const stored = problem.starterCode[lang];
    if (stored && stored.trim().length > 0) return stored;
    return getDefaultStarter(lang);
  };

  // Initialize code from draft or starter
  useEffect(() => {
    if (!problem || !draftLoaded) return;
    setCode(draft && draft.length > 0 ? draft : getStarter(language));
  }, [problem, language, draft, draftLoaded]);

  // Initialize stdin to first sample test
  useEffect(() => {
    if (problem && problem.sampleTests[0]) {
      setStdin(problem.sampleTests[0].input);
    }
  }, [problem]);

  // Notify when the My Solution sync resolved a real local↔cloud conflict.
  useEffect(() => {
    if (!mySolutionLastConflictAt) return;
    toast({
      title: "My Solution merged across devices",
      description:
        "We kept the most recently edited version of each part (notes and per language). Nothing was lost.",
    });
  }, [mySolutionLastConflictAt, toast]);

  // Editor keyboard shortcuts. We use a ref-bag so we can read the latest
  // handler closures without re-binding the listener on every render.
  const shortcutBagRef = useRef<{
    run: () => void;
    submit: () => void;
    reset: () => void;
    busy: boolean;
  }>({ run: () => {}, submit: () => {}, reset: () => {}, busy: false });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const target = e.target as HTMLElement | null;
      // Skip when typing in plain inputs/textareas outside Monaco — Monaco
      // surfaces its own command palette and doesn't bubble these by default.
      const tag = target?.tagName?.toLowerCase();
      const isPlainEditable =
        tag === "input" ||
        (tag === "textarea" && !target?.closest(".monaco-editor"));
      if (isPlainEditable) return;

      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        if (!shortcutBagRef.current.busy) shortcutBagRef.current.submit();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (!shortcutBagRef.current.busy) shortcutBagRef.current.run();
      } else if (e.key.toLowerCase() === "r" && e.shiftKey) {
        // Ctrl/Cmd+Shift+R → reset starter (avoid clobbering browser hard reload
        // which is Ctrl+Shift+R on most platforms — but here we're inside the
        // app and users expect a guard; we still preventDefault for parity).
        e.preventDefault();
        if (!shortcutBagRef.current.busy) shortcutBagRef.current.reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Esc exits editor fullscreen.
  useEffect(() => {
    if (!isEditorFullscreen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsEditorFullscreen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isEditorFullscreen]);

  // Briefly show "Press Esc to exit fullscreen" hint when entering fullscreen.
  useEffect(() => {
    if (!isEditorFullscreen) {
      setShowFullscreenHint(false);
      return;
    }
    setShowFullscreenHint(true);
    const t = window.setTimeout(() => setShowFullscreenHint(false), 3500);
    return () => window.clearTimeout(t);
  }, [isEditorFullscreen]);

  // After the guest signs in and returns to this page, replay the action they
  // originally attempted (run/submit). Handlers are wired via a ref because
  // they're declared further below; the hook itself MUST run before any early
  // return to keep hook order stable (React error #310).
  const pendingActionRef = useRef<{ run: () => void; submit: () => void }>({
    run: () => {},
    submit: () => {},
  });
  const replayedRef = useRef(false);
  useEffect(() => {
    if (!user || replayedRef.current) return;
    let raw: string | null = null;
    try { raw = localStorage.getItem("pendingAuthAction"); } catch { return; }
    if (!raw) return;
    let parsed: { path?: string; actionKey?: string | null } | null = null;
    try { parsed = JSON.parse(raw); } catch { parsed = null; }
    if (!parsed) return;
    const here = window.location.pathname;
    if (parsed.path && !parsed.path.startsWith(here)) return;
    const key = parsed.actionKey;
    if (key !== "run" && key !== "submit") return;
    replayedRef.current = true;
    try { localStorage.removeItem("pendingAuthAction"); } catch { /* ignore */ }
    setTimeout(() => {
      if (key === "run") pendingActionRef.current.run();
      else pendingActionRef.current.submit();
    }, 0);
  }, [user]);




  if (!problem && dbProblemLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full" aria-busy="true">
        <div className="w-1/2 min-w-0 border-r p-4 sm:p-6 space-y-5">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-40" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-28 w-full rounded-md" />
          <Skeleton className="h-28 w-full rounded-md" />
        </div>
        <div className="flex-1 min-w-0 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-48" />
          </div>
          <Skeleton className="h-[58vh] w-full rounded-md" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Problem not found.</p>
        <Button asChild variant="outline">
          <Link to="/library/problems">Back to problems</Link>
        </Button>
      </div>
    );
  }

  const langInfo = getLanguageById(language);

  const handleCodeChange = (v: string) => {
    // Telemetry: record net characters added (deletes are ignored). Only
    // active in contest mode; the hook is otherwise a no-op.
    const prevLen = lastCodeLenRef.current;
    const delta = v.length - prevLen;
    lastCodeLenRef.current = v.length;
    if (delta > 0) typing.record(delta);
    setCode(v);
    saveDraft(v);
    sessionTimerRef.current?.poke();
  };

  const handleReset = () => {
    const starter = getStarter(language);
    setCode(starter);
    saveDraft(starter);
    toast({ title: "Code reset", description: "Editor restored to starter template." });
  };

  const handleFormat = async () => {
    try {
      await editorRef.current?.format();
    } catch {
      /* ignore */
    }
  };

  /** Apply restored code and offer a one-click "Cancel restoration" undo. */
  const applyRestore = (nextCode: string, label: string, snapshot: string) => {
    setCode(nextCode);
    saveDraft(nextCode);
    setRestoreUndoSnapshot(snapshot);
    toast({
      title: "Restored last submitted code",
      description: label,
      action: (
        <ToastAction
          altText="Cancel restoration"
          onClick={() => {
            setCode(snapshot);
            saveDraft(snapshot);
            setRestoreUndoSnapshot(null);
            toast({
              title: "Restoration cancelled",
              description: "Editor reverted to your previous code.",
            });
          }}
        >
          Cancel restoration
        </ToastAction>
      ),
    });
  };

  const handleRestoreLastSubmitted = () => {
    const lastForLang = submissions.find((s) => s.language === language);
    if (!lastForLang) {
      toast({
        title: "No previous submission",
        description: `No ${langInfo.label} submission found for this problem yet.`,
        variant: "destructive",
      });
      return;
    }
    const label = `${langInfo.label} · ${lastForLang.verdict ?? "Pending"} · ${new Date(lastForLang.created_at).toLocaleString()}`;
    const baseline = draft ?? getStarter(language);
    const hasUnsavedChanges = code !== baseline && code !== lastForLang.source_code;
    if (hasUnsavedChanges) {
      setPendingRestoreCode({
        code: lastForLang.source_code,
        label,
        snapshot: code,
      });
      return;
    }
    applyRestore(lastForLang.source_code, label, code);
  };

  const confirmRestoreLastSubmitted = () => {
    if (!pendingRestoreCode) return;
    applyRestore(
      pendingRestoreCode.code,
      pendingRestoreCode.label,
      pendingRestoreCode.snapshot,
    );
    setPendingRestoreCode(null);
  };


  const toggleEditorFullscreen = () => setIsEditorFullscreen((v) => !v);

  const handleRun = async () => {
    if (!user) {
      setLoginAction("run");
      setShowLogin(true);
      return;
    }
    setRunResult(null);
    setSubmitResult(null);
    setExecutionErrorDetails(false);
    setActiveBottomTab("output");
    try {
      const result = await run({
        source_code: code,
        language_id: langInfo.judge0Id,
        stdin,
        problem_slug: slug,
        language,
        ...(problem.sql
          ? { schema: problem.sql.schema, seed: problem.sql.seed }
          : {}),
      });
      setRunResult(result);
      setExecutionErrorDetails(false);
      // Update per-sample pass/fail indicator for the active sample tab.
      if (activeSampleIndex !== null && problem?.sampleTests?.[activeSampleIndex]) {
        const sample = problem.sampleTests[activeSampleIndex];
        const expected = (sample.expected ?? "").trim();
        const actual = (result.stdout ?? "").trim();
        const ok =
          !result.stderr &&
          !result.compile_output &&
          expected.length > 0 &&
          expected === actual;
        setSampleCaseStatus((prev) => ({
          ...prev,
          [activeSampleIndex]: {
            status: ok ? "passed" : "failed",
            input: sample.input,
            expected: sample.expected,
            got: result.stdout ?? result.stderr ?? result.compile_output ?? "",
          },
        }));
      } else if (activeCustomId) {
        // Custom case has no expected output — mark as ok unless there's an error.
        const hasError = !!result.stderr || !!result.compile_output;
        setCustomCaseStatus((prev) => ({
          ...prev,
          [activeCustomId]: {
            status: hasError ? "error" : "ok",
            input: stdin,
            got: result.stdout ?? "",
            stderr: result.stderr ?? result.compile_output ?? "",
          },
        }));
      }
      refetchRuns();
    } catch (err) {
      setExecutionErrorDetails(true);
      const ce = err as CodeExecutionError;
      const message = ce?.message || "Something went wrong while running your code.";
      const d = ce?.diagnostics;
      setRunError({
        message,
        stage: d?.error_stage,
        providerStatus: d?.judge0_status,
        providerBody: d?.judge0_body,
        requestedUrl: d?.requested_url,
      });
      toast({
        title: humanRunErrorTitle(d?.error_stage),
        description: message,
        variant: "destructive",
      });
    }
  };


  const handleSubmit = async () => {
    if (!user) {
      setLoginAction("submit");
      setShowLogin(true);
      return;
    }
    setSubmitResult(null);
    setRunResult(null);
    setExecutionErrorDetails(false);
    setActiveBottomTab("output");
    // Auto-format right before submit so submitted code has consistent style.
    // Honors the user's "Format on submit" preference. Failures are non-blocking.
    if (effectiveFormatOnSubmit !== "off") {
      try {
        await editorRef.current?.format();
      } catch {
        /* ignore formatter errors */
      }
    }
    // Optional lightweight lint pass: trim trailing whitespace, collapse 3+
    // blank lines into one, and ensure exactly one trailing newline.
    let lintCleaned: string | null = null;
    if (effectiveFormatOnSubmit === "format+lint") {
      const current = editorRef.current?.getValue() ?? code;
      const cleaned = current
        .split("\n")
        .map((l) => l.replace(/[ \t]+$/g, ""))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\s+$/g, "") + "\n";
      if (cleaned !== current) {
        lintCleaned = cleaned;
        setCode(cleaned);
        saveDraft(cleaned);
      }
    }
    // Make sure the latest draft is persisted before we ship the submission.
    try {
      await flushDraft?.();
    } catch {
      /* ignore */
    }
    // Prefer the lint-cleaned source if we computed one; otherwise read
    // directly from the editor so we capture freshly-formatted code (React
    // state may not have flushed yet).
    const sourceToSubmit = lintCleaned ?? editorRef.current?.getValue() ?? code;

    // If submitting in the context of a contest, validate server-side first so
    // we surface clear errors (not registered, contest closed, already solved, etc.)
    setContestError(null);
    const contestSlug = searchParams.get("contest");
    if (contestSlug) {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: contestRow } = await supabase
          .from("contests" as any)
          .select("id")
          .eq("slug", contestSlug)
          .maybeSingle();
        if ((contestRow as any)?.id) {
          const { data: check, error: checkErr } = await supabase.rpc(
            "validate_contest_submission",
            { _contest_id: (contestRow as any).id, _problem_slug: problem.slug },
          );
          if (checkErr) throw checkErr;
          const v = check as { ok: boolean; message?: string; code?: string } | null;
          if (v && !v.ok) {
            const msg = v.message ?? "Cannot submit to this contest right now.";
            setContestError(msg);
            toast({ title: "Submission blocked", description: msg, variant: "destructive" });
            return;
          }
        }
      } catch (err) {
        const msg = (err as Error).message;
        setContestError(msg);
        toast({ title: "Contest validation failed", description: msg, variant: "destructive" });
        return;
      }
    }

    try {
      const result = await submit({
        source_code: sourceToSubmit,
        language,
        language_id: langInfo.judge0Id,
        problem_slug: problem.slug,
        tests: problem.hiddenTests,
        cpu_time_limit: problem.cpuTimeLimitSec,
        memory_limit: problem.memoryLimitKb,
        ...(problem.sql
          ? {
              schema: problem.sql.schema,
              seed: problem.sql.seed,
              order_matters: !!problem.sql.orderMatters,
            }
          : {}),
        ...(searchParams.get("contest") ? { contest_slug: searchParams.get("contest")! } : {}),
      });
      setSubmitResult(result);
      setExecutionErrorDetails(false);
      refetchSubmissions();
      const isAccepted = result.verdict === "Accepted";
      // When the full submission is Accepted, every visible sample passed
      // implicitly — reflect that on the testcase chips.
      if (isAccepted && problem?.sampleTests?.length) {
        setSampleCaseStatus((prev) => {
          const next = { ...prev };
          problem.sampleTests.forEach((s, i) => {
            next[i] = {
              status: "passed",
              input: s.input,
              expected: s.expected,
              got: s.expected,
            };
          });
          return next;
        });
      }
      const elapsedMs = sessionTimerRef.current?.getElapsedMs() ?? 0;
      const baseDesc = `${result.passed} / ${result.total} test cases passed`;
      toast({
        title: result.verdict,
        description:
          isAccepted && elapsedMs > 0
            ? `${baseDesc} · Solved in ${formatSolveTime(elapsedMs)}`
            : baseDesc,
        variant: isAccepted ? "default" : "destructive",
      });

      // Contest auto-finish: if this submission was Accepted in contest mode,
      // route the participant to the leaderboard so they can see their result.
      // Only triggers for accepted submissions to avoid kicking the user out
      // mid-attempt on a wrong answer.
      const contestSlugParam = searchParams.get("contest");
      if (isAccepted && contestSlugParam) {
        window.setTimeout(() => {
          navigate(`/contests/${contestSlugParam}/leaderboard`);
        }, 1500);
      }
    } catch (err) {
      setExecutionErrorDetails(true);
      const ce = err as CodeExecutionError;
      const d = ce?.diagnostics;
      setRunError({
        message: ce?.message || "Something went wrong while grading your submission.",
        stage: d?.error_stage,
        providerStatus: d?.judge0_status,
        providerBody: d?.judge0_body,
        requestedUrl: d?.requested_url,
      });
      toast({
        title: humanRunErrorTitle(d?.error_stage) || "Submit failed",
        description: ce?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const referenceSolution = staticProblem?.referenceSolution ?? dbReferenceSolution;

  // Keep the shortcut bag pointing at the latest closures + busy state.
  shortcutBagRef.current = {
    run: handleRun,
    submit: handleSubmit,
    reset: handleReset,
    busy: isRunning || isSubmitting,
  };
  pendingActionRef.current = { run: () => void handleRun(), submit: () => void handleSubmit() };

  // Replay hook moved above the early returns — see block near line 835.





  const mcqData = (problem as unknown as { mcq?: { question?: string; options: { label: string; correct?: boolean }[] } }).mcq;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">

      <div className="flex-1 flex flex-col min-w-0">
      <Helmet>
        <title>{problem.title} — Coding Problem | Parikshaa</title>
        <meta name="description" content={problem.description.slice(0, 155)} />
        <link rel="canonical" href={`https://www.parikshaa.org/library/problems/${problem.slug}`} />
        <meta property="og:title" content={`${problem.title} — Coding Problem | Parikshaa`} />
        <meta property="og:description" content={problem.description.slice(0, 155)} />
        <meta property="og:url" content={`https://www.parikshaa.org/library/problems/${problem.slug}`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:title" content={`${problem.title} — Coding Problem | Parikshaa`} />
        <meta name="twitter:description" content={problem.description.slice(0, 155)} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: problem.title,
          name: problem.title,
          description: problem.description.slice(0, 300),
          url: `https://www.parikshaa.org/library/problems/${problem.slug}`,
          articleSection: "Coding Problems",
          keywords: ["coding problem", problem.difficulty, "DSA", "algorithm"].join(", "),
          author: { "@type": "Organization", name: "Parikshaa" },
        })}</script>
      </Helmet>

      {contestError && (
        <div
          data-testid="contest-submit-error"
          role="alert"
          className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive flex items-center justify-between gap-3"
        >
          <span>
            <strong className="font-semibold">Submission blocked:</strong>{" "}
            <span data-testid="contest-submit-error-message">{contestError}</span>
          </span>
          <button
            data-testid="contest-submit-error-dismiss"
            onClick={() => setContestError(null)}
            className="text-destructive/70 hover:text-destructive text-xs underline"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      )}

      {contestId && searchParams.get("contest") && (
        <div className="px-4 py-2">
          <SecureProblemHUD
            contestId={contestId}
            contestSlug={searchParams.get("contest")!}
            onSubmissionReadyChange={setSecureSubmissionReady}
          />
        </div>
      )}


      {/* Resizable split */}
      <ResizablePanelGroup ref={horizontalGroupRef} direction="horizontal" className="flex-1">
        {/* LEFT: tabs */}
        <ResizablePanel defaultSize={layoutPreset.horizontal[0]} minSize={20}>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as EditorTabId)}
            className="h-full flex flex-col"
            aria-label="Problem panels"
          >
            <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <ChevronScroller>
                <SortableEditorTabs
                  order={tabOrder}
                  onReorder={(next) => setTabOrder(next)}
                  lockedIds={(["notes", "editorial", "discussion"] as EditorTabId[]).filter(isTabLocked)}
                  reorderDisabled={
                    (contestLocks as any).notesLocked ||
                    (contestLocks as any).solutionLocked ||
                    (contestLocks as any).historyLocked
                  }
                  onBlockedReorder={(reason, info) => {
                    logContestLockEvent({
                      contestId,
                      problemSlug: slug,
                      kind: "blocked_drag_reorder",
                      target: "tabs",
                      details: { reason, ...info },
                    });
                  }}
                  renderLabel={(id) => {
                    const lockMark = isTabLocked(id) ? (
                      <span className="ml-1 text-amber-400" aria-label="Locked during contest">🔒</span>
                    ) : null;
                    const chip = (
                      Icon: typeof FileText,
                      label: string,
                      accentClasses: string,
                      iconActiveClass: string,
                      underlineClass: string,
                      extra?: ReactNode,
                    ) => (
                      <span
                        className={cn(
                          "relative inline-flex items-center gap-2 px-4 py-3 text-[13px] font-medium tracking-tight transition-colors duration-200 rounded-t-md",
                          "text-muted-foreground/70 hover:text-foreground",
                          accentClasses,
                          "after:absolute after:left-3 after:right-3 after:-bottom-px after:h-[2px] after:rounded-full after:opacity-0 after:transition-opacity after:duration-200",
                          underlineClass,
                          "group-data-[state=active]/tab:after:opacity-100",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            iconActiveClass,
                          )}
                          aria-hidden="true"
                        />
                        {label}
                        {extra}
                        {lockMark}
                      </span>
                    );
                    switch (id) {
                      case "description":
                        return chip(
                          FileText,
                          "Question",
                          "group-data-[state=active]/tab:text-amber-300 group-data-[state=active]/tab:bg-amber-500/10",
                          "group-data-[state=active]/tab:text-amber-400",
                          "after:bg-gradient-to-r after:from-amber-400 after:to-orange-500",
                        );
                      case "editorial":
                        return chip(
                          BookOpen,
                          "Solution",
                          "group-data-[state=active]/tab:text-emerald-300 group-data-[state=active]/tab:bg-emerald-500/10",
                          "group-data-[state=active]/tab:text-emerald-400",
                          "after:bg-gradient-to-r after:from-emerald-400 after:to-teal-500",
                        );
                      case "submissions":
                        return chip(
                          Clock,
                          "Submissions",
                          "group-data-[state=active]/tab:text-sky-300 group-data-[state=active]/tab:bg-sky-500/10",
                          "group-data-[state=active]/tab:text-sky-400",
                          "after:bg-gradient-to-r after:from-sky-400 after:to-blue-500",
                          submissions.length > 0 ? (
                            <span className="ml-1 rounded-md bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300 tabular-nums">
                              {submissions.length}
                            </span>
                          ) : null,
                        );
                      case "discussion":
                        return chip(
                          MessageCircle,
                          "Discuss",
                          "group-data-[state=active]/tab:text-fuchsia-300 group-data-[state=active]/tab:bg-fuchsia-500/10",
                          "group-data-[state=active]/tab:text-fuchsia-400",
                          "after:bg-gradient-to-r after:from-fuchsia-400 after:to-pink-500",
                        );
                      case "notes":
                        return chip(
                          NotebookPen,
                          "Notes",
                          "group-data-[state=active]/tab:text-amber-300 group-data-[state=active]/tab:bg-amber-500/10",
                          "group-data-[state=active]/tab:text-amber-400",
                          "after:bg-gradient-to-r after:from-amber-400 after:to-orange-500",
                          notesValue.trim().length > 0 ? (
                            <span
                              className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-400"
                              aria-label="Has note"
                            />
                          ) : null,
                        );

                      default:
                        return null;
                    }
                  }}

                />
              </ChevronScroller>
            </div>


            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <TabsContent value="description" className="mt-0 space-y-6">
                <header className="space-y-4">
                  <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight leading-[1.2] text-foreground">
                    {problem.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {problem.difficulty && (
                      <span
                        className={cn(
                          "inline-flex items-center text-[12px] font-medium px-3 py-1 rounded-full transition-colors",
                          problem.difficulty === "Easy"
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15"
                            : problem.difficulty === "Medium"
                              ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/15"
                              : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/15",
                        )}
                      >
                        {problem.difficulty}
                      </span>
                    )}
                    {problem.companies && problem.companies.length > 0 ? (
                      <Collapsible
                        open={showCompanyTags}
                        onOpenChange={setShowCompanyTags}
                        className="contents"
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            aria-expanded={showCompanyTags}
                            aria-controls="company-tags-panel"
                            className={cn(
                              "inline-flex items-center gap-1 text-[12px] font-medium px-3 py-1 rounded-full border transition-all duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              showCompanyTags
                                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                                : "border-amber-500/25 text-amber-300/90 hover:bg-amber-500/10 hover:border-amber-500/40",
                            )}
                          >
                            Company Tags
                            <span className="tabular-nums text-amber-300/70">
                              {problem.companies.length}
                            </span>
                            <ChevronRight
                              aria-hidden="true"
                              className={cn(
                                "h-3 w-3 transition-transform duration-200",
                                showCompanyTags && "rotate-90",
                              )}
                            />
                          </button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    ) : dbProblemLoading ? (
                      <Skeleton className="h-6 w-28 rounded-full" />
                    ) : (
                      <span
                        className="inline-flex items-center text-[12px] font-medium px-3 py-1 rounded-full border border-dashed border-foreground/15 text-foreground/40"
                        title="No company tags yet"
                      >
                        No company tags
                      </span>
                    )}
                    {problem.topics && problem.topics.length > 0
                      ? problem.topics.slice(0, 6).map((t) => (
                          <button
                            key={`t-${t}`}
                            type="button"
                            onClick={() =>
                              navigate(`/library/problems?topics=${encodeURIComponent(t)}`)
                            }
                            title={`Filter problems by #${t}`}
                            className="inline-flex items-center max-w-[10rem] sm:max-w-[14rem] text-[11px] font-bold px-3 py-1 rounded-full bg-foreground/[0.04] text-foreground/60 border border-foreground/10 hover:bg-primary/10 hover:text-primary hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-200"
                          >
                            <span className="truncate">#{t}</span>
                          </button>
                        ))
                      : dbProblemLoading ? (
                        <>
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-14 rounded-full" />
                        </>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border border-dashed border-foreground/10 text-foreground/40">
                          No topics tagged
                        </span>
                      )}
                  </div>

                  {problem.companies && problem.companies.length > 0 && (
                    <Collapsible open={showCompanyTags} onOpenChange={setShowCompanyTags}>
                      <CollapsibleContent
                        id="company-tags-panel"
                        className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up"
                      >
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {problem.companies.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() =>
                                navigate(`/library/problems?q=${encodeURIComponent(c)}`)
                              }
                              title={`Search problems mentioning ${c}`}
                              className="inline-flex items-center max-w-[10rem] sm:max-w-[14rem] text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-200/90 border border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 transition-colors"
                            >
                              <span className="truncate">{c}</span>
                            </button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </header>









                {(() => {
                  const { main, inputFormat, outputFormat } =
                    splitProblemDescription(problem.description ?? "");
                  return (
                    <div className="space-y-8">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed text-foreground/90 font-sans selection:bg-amber-500/20">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                            code: ({ inline, className, children, ...props }: any) => {
                              if (inline) {
                                return (
                                  <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-amber-500 text-[0.9em]" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {main}
                        </ReactMarkdown>
                      </div>
                      
                      {(inputFormat || outputFormat) && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-1 bg-primary rounded-full" />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                              Format Details
                            </h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                          </div>
                          <ProblemFormatCards
                            inputFormat={inputFormat}
                            outputFormat={outputFormat}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* SQL Schema panel — only for SQL problems */}
                {problem.sql && (
                  <SchemaSeedToggle
                    schema={problem.sql.schema}
                    seed={problem.sql.seed}
                    defaultOpen
                  />
                )}

                {/* Examples */}
                {problem.examples && problem.examples.length > 0 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 bg-amber-500 rounded-full" />
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                        Examples & Explanations
                      </h3>
                      <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                    </div>
                    <div className="space-y-5">
                      {problem.examples.map((ex, i) => (
                        <div key={i} className="rounded-2xl bg-muted/20 p-5 border border-border/40 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] overflow-hidden group hover:border-border/80 transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20">
                                {i + 1}
                              </span>
                              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">
                                Example Case
                              </p>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 border-border/40 bg-background/50"
                                    onClick={() => {
                                      setStdin(ex.input);
                                      toast({ 
                                        title: "Input copied", 
                                        description: "Example input loaded into testcase runner.",
                                        className: "rounded-2xl border-2" 
                                      });
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl font-medium">Use as Test Case</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                                  Input
                                </p>
                              </div>
                              <div className="bg-background/40 backdrop-blur-sm rounded-xl p-3.5 border border-border/30 font-mono text-[13px] leading-relaxed shadow-inner">
                                <pre className="whitespace-pre-wrap break-all text-amber-500/90 selection:bg-amber-500/20">{ex.input}</pre>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                  Output
                                </p>
                              </div>
                              <div className="bg-background/40 backdrop-blur-sm rounded-xl p-3.5 border border-border/30 font-mono text-[13px] leading-relaxed shadow-inner">
                                <pre className="whitespace-pre-wrap break-all text-emerald-500/90 selection:bg-emerald-500/20">{ex.output}</pre>
                              </div>
                            </div>
                          </div>

                          {ex.explanation && (
                            <div className="mt-5 pt-5 border-t border-border/30">
                              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                                <BookOpen className="h-3 w-3" />
                                Explanation
                              </p>
                              <div className="relative overflow-hidden rounded-xl bg-primary/[0.03] p-4 border border-primary/10">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/40 to-primary/10" />
                                <p className="text-sm text-foreground/80 leading-relaxed font-sans selection:bg-primary/20">
                                  {ex.explanation}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 bg-rose-500 rounded-full" />
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                        Operational Constraints
                      </h3>
                      <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                    </div>
                    <ProblemConstraints constraints={problem.constraints} />
                  </div>
                )}

                {/* MCQ — "Now your turn!" */}
                {mcqData && mcqData.options?.length > 0 && (
                  <ProblemMcqBlock problemSlug={problem.slug} mcq={mcqData} />
                )}



                {/* Hints — progressive disclosure */}
                {(contestLocks as any).hintsLocked ? (
                  <LockedAuxPanel label="Hints" endsAt={(contestLocks as any).endsAt} />
                ) : (
                    <div className="mt-8 pt-8 border-t border-dashed border-border/50">
                      <ProgressiveHints hints={problem.hints} slug={problem.slug} />
                    </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                {(contestLocks as any).notesLocked ? (
                  <LockedAuxPanel label="Notes" endsAt={(contestLocks as any).endsAt} />
                ) : !user ? (
                  <SignInGate action="notes" />
                ) : (
                  <NotesPanel slug={problem.slug} title={problem.title} />

                )}
              </TabsContent>

              <TabsContent value="my-solution" className="mt-0">
                {(contestLocks as any).solutionLocked ? (
                  <LockedAuxPanel label="My Solution" endsAt={(contestLocks as any).endsAt} />
                ) : (
                <MySolutionPanel
                  notes={mySolutionNotes}
                  onNotesChange={setMySolutionNotes}
                  code={mySolutionCode}
                  onCodeChange={setMySolutionCode}
                  language={mySolutionLanguage}
                  onLanguageChange={setMySolutionLanguage}
                  savedLanguages={mySolutionSavedLanguages}
                  codeUpdatedAt={mySolutionCodeUpdatedAt}
                  onUseCurrentDraft={() => code}
                  onClear={clearMySolution}
                  onRestore={restoreMySolution}
                  onUndoCodeChange={undoMySolutionCode}
                  canUndoCode={canUndoMySolutionCode}
                  hasUnsavedCurrentCode={mySolutionHasUnsavedCurrentCode}
                  savedAt={mySolutionSavedAt}
                  hasNotes={mySolutionHasNotes}
                  hasAnyCode={mySolutionHasAnyCode}
                  isComplete={mySolutionIsComplete}
                  timestampFormat={editorPrefs.timestampFormat}
                  onToggleTimestampFormat={toggleTimestampFormat}
                  fontSize={editorPrefs.fontSize}
                  syncStatus={mySolutionSyncStatus}
                  isCloudSynced={mySolutionIsCloudSynced}
                  lastSyncedAt={mySolutionLastSyncedAt}
                  onSignInClick={() =>
                    navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)
                  }
                />
                )}
              </TabsContent>

              <TabsContent value="editorial" className="mt-0">
                {(contestLocks as any).solutionLocked ? (
                  <LockedAuxPanel label="Editorial" endsAt={(contestLocks as any).endsAt} />
                ) : !acceptedExists ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      🔒 Solve the problem first to unlock the editorial.
                    </p>
                  </Card>
                ) : referenceSolutionLoading ? (
                  <Skeleton className="h-64 w-full rounded-md" />
                ) : referenceSolution[language] ? (
                  <pre className="text-sm bg-muted/50 p-4 rounded-md border overflow-x-auto">
                    <code>{referenceSolution[language]}</code>
                  </pre>
                ) : referenceSolution.python ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Editorial (Python):
                    </p>
                    <pre className="text-sm bg-muted/50 p-4 rounded-md border overflow-x-auto">
                      <code>{referenceSolution.python}</code>
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No editorial available yet.</p>
                )}
              </TabsContent>

              <TabsContent value="discussion" className="mt-0">
                <ProblemDiscussion slug={slug} />
              </TabsContent>

              <TabsContent value="solution" className="mt-0">

                {(contestLocks as any).solutionLocked ? (
                  <LockedAuxPanel label="Reference solution" endsAt={(contestLocks as any).endsAt} />
                ) : !acceptedExists ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      🔒 Solve the problem first to unlock the reference solution.
                    </p>
                  </Card>
                ) : referenceSolutionLoading ? (
                  <Skeleton className="h-64 w-full rounded-md" />
                ) : referenceSolution[language] ? (
                  <pre className="text-sm bg-muted/50 p-4 rounded-md border overflow-x-auto">
                    <code>{referenceSolution[language]}</code>
                  </pre>
                ) : referenceSolution.python ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Reference (Python):
                    </p>
                    <pre className="text-sm bg-muted/50 p-4 rounded-md border overflow-x-auto">
                      <code>{referenceSolution.python}</code>
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No reference solution available.</p>
                )}
              </TabsContent>

              <TabsContent value="submissions" className="mt-0">
                {!user ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-3">
                      Sign in to view your submission history.
                    </p>
                    <Button onClick={() => setShowLogin(true)}>Sign in</Button>
                  </Card>
                ) : submissionsLoading && submissions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Loading submissions…</p>
                  </Card>
                ) : submissions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No submissions yet.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const focused = detailSubmission ?? submissions[0];
                      if (!focused) return null;
                      const focusedSubmitResult: SubmitResult = {
                        verdict: focused.verdict,
                        passed: focused.passed_tests,
                        total: focused.total_tests,
                        runtime_ms: focused.runtime_ms ?? 0,
                        memory_kb: focused.memory_kb ?? 0,
                        failing_case: (focused.failing_case as SubmitResult["failing_case"]) ?? null,
                        stderr: focused.stderr,
                        submission_id: focused.id,
                        case_results: [],
                      };
                      return (
                        <SubmissionResultView
                          submitResult={focusedSubmitResult}
                          problemSlug={problem.slug}
                          problemTitle={problem.title}
                          language={focused.language}
                          languageId={focused.language_id}
                          sourceCode={focused.source_code}
                          user={user ? { id: user.id, email: user.email } : null}
                          displayName={user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null}
                          avatarUrl={user?.user_metadata?.avatar_url ?? null}
                          recentSubmissions={submissions}
                          submittedAt={focused.created_at}
                          onBackToCode={() => setActiveTab("description")}
                        />
                      );
                    })()}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="runs" className="mt-0" aria-label="Run history">
                {(contestLocks as any).historyLocked ? (
                  <LockedAuxPanel label="Run history" endsAt={(contestLocks as any).endsAt} />
                ) : !user ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-3">
                      Sign in to view your run history.
                    </p>
                    <Button onClick={() => setShowLogin(true)}>Sign in</Button>
                  </Card>
                ) : runs.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No runs yet. Hit <strong>Run</strong> to test your code with custom input.
                    </p>
                  </Card>
                ) : (
                  <ProblemRunHistory runs={runs} />
                )}
              </TabsContent>
            </div>
          </Tabs>
          <ProblemFooterBar
            slug={problem.slug}
            solved={problemStats.isSolved}
            onDiscuss={() => setActiveTab("submissions" as EditorTabId)}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT: editor + bottom panel */}
        <ResizablePanel defaultSize={layoutPreset.horizontal[1]} minSize={25}>
          <ResizablePanelGroup ref={verticalGroupRef} direction="vertical">
            <ResizablePanel defaultSize={layoutPreset.vertical[0]} minSize={20}>
              <div
                className={cn(
                  "h-full flex flex-col bg-background",
                  isEditorFullscreen &&
                    "fixed inset-0 z-50 h-screen w-screen border-0",
                )}
              >
                {/* Editor toolbar */}
                <div className="sticky top-0 z-20 px-3 py-2 border-b bg-muted/40 backdrop-blur supports-[backdrop-filter]:bg-muted/30">
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2 min-w-0 shrink-0">
                      <Select value={language} onValueChange={(v) => setLanguage(v as LangId)}>
                        <SelectTrigger className="w-[140px] h-8 text-xs rounded-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES
                            .filter((l) => (isSQLProblem ? isSQLLang(l.id) : !isSQLLang(l.id)))
                            .map((l) => (
                              <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <DraftSaveIndicator
                        status={saveStatus}
                        lastSavedAt={lastSavedAt}
                        isAuthenticated={!!user}
                        className="hidden sm:inline-flex"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label="Copy code"
                        title="Copy code"
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                          toast({ title: "Code copied", description: "Editor contents copied to clipboard." });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label="Reset code"
                        title="Reset to starter template"
                        onClick={handleReset}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={handleRun}
                        disabled={isRunning || isSubmitting}
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 rounded-full border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
                        title="Run code (Ctrl/Cmd+Enter)"
                      >
                        {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">Run</span>
                      </Button>
                      <Button
                        type="button"
                        data-testid="contest-submit-button"
                        data-contest-submit-btn=""
                        onClick={handleSubmit}
                        disabled={
                          isRunning ||
                          isSubmitting ||
                          contestSubmitBlocked ||
                          (!!searchParams.get("contest") && !secureSubmissionReady)
                        }
                        size="sm"
                        className="h-8 gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400"
                        title="Submit solution (Ctrl/Cmd+Shift+Enter)"
                      >
                        {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Submit
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0 relative">
                  <MonacoEditor
                    ref={editorRef}
                    value={code}
                    onChange={handleCodeChange}
                    language={langInfo.monaco}
                    fontSize={editorPrefs.fontSize}
                  />
                  {/* Bottom-right floating utilities: font size, format, fullscreen */}
                  <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
                    <div className="pointer-events-auto flex items-center gap-1 rounded-full border bg-background/85 backdrop-blur px-1.5 py-1 shadow-sm">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label="Decrease font size"
                        title="Decrease font size"
                        onClick={() => decFontSize()}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="px-1 text-[11px] font-mono tabular-nums text-muted-foreground select-none">
                        {editorPrefs.fontSize}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label="Increase font size"
                        title="Increase font size"
                        onClick={() => incFontSize()}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label="Format code"
                        title="Format code"
                        onClick={handleFormat}
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label={isEditorFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        title={isEditorFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        onClick={toggleEditorFullscreen}
                      >
                        {isEditorFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  {isEditorFullscreen && showFullscreenHint && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-50 rounded-full border bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-md animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      Press <kbd className="mx-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to exit fullscreen
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={layoutPreset.vertical[1]} minSize={15}>
              <Tabs
                value={activeBottomTab}
                onValueChange={(v) => setActiveBottomTab(v as "testcase" | "output")}
                className="h-full flex flex-col"
                aria-label="Test case and output"
              >
                <div className="border-b overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <TabsList
                    className="rounded-none justify-start bg-transparent border-0 h-10 px-2 w-max min-w-full flex-nowrap"
                    aria-label="Bottom panel tabs"
                  >
                    <TabsTrigger
                      value="testcase"
                      className="shrink-0 whitespace-nowrap"
                      aria-label="Test case input"
                    >
                      Test Case
                    </TabsTrigger>
                    <TabsTrigger
                      value="output"
                      className="shrink-0 whitespace-nowrap"
                      aria-label="Run and submit output"
                    >
                      Output
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="testcase"
                  className="flex-1 m-0 p-3 overflow-y-auto"
                  aria-label="Test case input"
                >
                  {isSQLProblem ? (
                    <div className="space-y-3">
                      <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        <p className="font-medium mb-1">Seeded dataset</p>
                        <p className="text-muted-foreground text-xs">
                          Your query runs against the schema and seed data shown below. Click{" "}
                          <span className="font-mono">Run</span> to execute and{" "}
                          <span className="font-mono">Submit</span> to compare results with the
                          reference query.
                        </p>
                      </div>
                      {problem.sql && (
                        <SchemaSeedToggle
                          schema={problem.sql.schema}
                          seed={problem.sql.seed}
                          compact
                        />
                      )}
                      <Button
                        onClick={handleRun}
                        disabled={isRunning}
                        size="sm"
                        className="gap-1.5"
                        aria-label="Run SQL query"
                      >
                        {isRunning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        Run query
                      </Button>
                    </div>
                  ) : (
                    <TestCaseWorkbench
                      slug={problem.slug}
                      sampleTests={problem.sampleTests}
                      stdin={stdin}
                      onStdinChange={setStdin}
                      onRun={handleRun}
                      isRunning={isRunning}
                      sampleCaseStatus={sampleCaseStatus}
                      customCaseStatus={customCaseStatus}
                      onActiveSampleChange={setActiveSampleIndex}
                      onActiveCustomChange={setActiveCustomId}
                      onResetResults={handleResetResults}
                    />
                  )}
                </TabsContent>

                <TabsContent
                  value="output"
                  className="flex-1 m-0 p-3 overflow-y-auto"
                  aria-label="Run and submit output"
                >
                  {isRunning || isSubmitting ? (
                    <div
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      role="status"
                      aria-live="polite"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {isSubmitting ? "Judging against hidden test cases..." : "Running..."}
                    </div>
                  ) : submitResult ? (
                    <div className="space-y-4">
                      <SubmissionResultView
                        submitResult={submitResult}
                        problemSlug={problem.slug}
                        problemTitle={problem.title}
                        language={language}
                        languageId={langInfo.judge0Id}
                        sourceCode={code}
                        user={user ? { id: user.id, email: user.email } : null}
                        displayName={user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null}
                        avatarUrl={user?.user_metadata?.avatar_url ?? null}
                        recentSubmissions={submissions}
                        onBackToCode={() => setActiveBottomTab("testcase")}
                      />
                    </div>
                  ) : runResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {runResult.status.description}
                        </Badge>
                        {runResult.time !== null && <span>{Math.round(runResult.time * 1000)} ms</span>}
                        {runResult.memory !== null && <span>{(runResult.memory / 1024).toFixed(1)} MB</span>}
                      </div>
                      {runResult.stdout && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {isSQLProblem ? "Query result" : "stdout"}
                          </p>
                          {isSQLProblem ? (
                            <SqlResultTable value={runResult.stdout} />
                          ) : (
                            <pre className="text-xs bg-muted/50 p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                              {runResult.stdout}
                            </pre>
                          )}
                        </div>
                      )}
                      {runResult.stderr && (
                        <div>
                          <p className="text-xs text-destructive mb-1">stderr</p>
                          <pre className="text-xs bg-destructive/5 p-3 rounded border border-destructive/30 overflow-x-auto whitespace-pre-wrap">
                            {runResult.stderr}
                          </pre>
                        </div>
                      )}
                      {runResult.compile_output && (
                        <div>
                          <p className="text-xs text-orange-500 mb-1">compile output</p>
                          <pre className="text-xs bg-orange-500/5 p-3 rounded border border-orange-500/30 overflow-x-auto whitespace-pre-wrap">
                            {runResult.compile_output}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : executionErrorDetails ? (
                    <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
                      <div>
                        <p className="text-sm font-semibold text-destructive">
                          {humanRunErrorTitle(runError?.stage)}
                        </p>
                        <p className="text-sm text-destructive/90 mt-1">
                          {runError?.message ?? "Execution failed before a result was produced."}
                        </p>
                      </div>
                      {(runError?.stage || runError?.providerStatus) && (
                        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          {runError?.stage && (
                            <span className="rounded bg-background/80 px-1.5 py-0.5 border">
                              stage: {runError.stage}
                            </span>
                          )}
                          {runError?.providerStatus != null && (
                            <span className="rounded bg-background/80 px-1.5 py-0.5 border">
                              provider status: {runError.providerStatus}
                            </span>
                          )}
                          {runError?.requestedUrl && (
                            <span className="rounded bg-background/80 px-1.5 py-0.5 border truncate max-w-full">
                              {runError.requestedUrl}
                            </span>
                          )}
                        </div>
                      )}
                      {runError?.providerBody && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                            Provider response
                          </p>
                          <pre className="text-xs bg-background/70 p-2 rounded border overflow-x-auto whitespace-pre-wrap max-h-48">
                            {runError.providerBody.slice(0, 4000)}
                          </pre>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Tip: check your code for syntax errors, then hit Run again. If this keeps
                        happening, the execution provider may be temporarily unavailable.
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Hit <strong>Run</strong> to test your code, or <strong>Submit</strong> to grade.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog
        open={showLogin}
        onOpenChange={(o) => {
          setShowLogin(o);
          if (!o) setLoginAction(null);
        }}
      >
        <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
          <SignInGate action={loginAction ?? "run"} />
        </DialogContent>
      </Dialog>


      <SubmissionDetailsDrawer
        submission={detailSubmission}
        open={!!detailSubmission || (!!searchParams.get("sub") && submissionsLoading)}
        loading={submissionsLoading && !detailSubmission && !!searchParams.get("sub")}
        onOpenChange={(o) => !o && closeSubmission()}
      />

      <FloatingActionBar
        onRun={handleRun}
        onSubmit={handleSubmit}
        onReset={handleReset}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
      />

      <ShortcutsCheatSheet
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        title="Editor shortcuts"
        shortcuts={[
          { keys: ["Ctrl/Cmd", "Enter"], description: "Run code with current test" },
          { keys: ["Ctrl/Cmd", "Shift", "Enter"], description: "Submit solution" },
          { keys: ["Ctrl/Cmd", "Shift", "R"], description: "Reset to starter code" },
          { keys: ["Esc"], description: "Close drawers and dialogs" },
        ]}
      />

      <AlertDialog
        open={!!pendingRestoreCode}
        onOpenChange={(o) => !o && setPendingRestoreCode(null)}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your current code?</AlertDialogTitle>
            <AlertDialogDescription>
              Your editor has unsaved changes that differ from your last saved
              draft. Loading{" "}
              <span className="font-medium text-foreground">
                {pendingRestoreCode?.label}
              </span>{" "}
              will overwrite the code currently in the editor. Review the diff
              below before confirming — this can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingRestoreCode && (
            <CodeDiffPreview
              before={code}
              after={pendingRestoreCode.code}
              maxLines={28}
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my code</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestoreLastSubmitted}>
              Replace with last submission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
};

export default CodingProblemDetail;
