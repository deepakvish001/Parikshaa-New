import { useEffect, useRef, useState, useMemo, type ReactNode } from "react";
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
    () => (readStore<CaseStatusEntry>(SAMPLE_KEY)[slug ?? ""] as Record<number, CaseStatusEntry>) ?? {},
  );
  const [customCaseStatus, setCustomCaseStatus] = useState<Record<string, CustomStatusEntry>>(
    () =>
      (readStore<CustomStatusEntry>(CUSTOM_KEY)[slug ?? ""] as Record<string, CustomStatusEntry>) ?? {},
  );
  const [activeSampleIndex, setActiveSampleIndex] = useState<number | null>(0);
  const [activeCustomId, setActiveCustomId] = useState<string | null>(null);

  // Reload + persist per-slug case status (so navigating away & back keeps marks).
  useEffect(() => {
    if (!slug) return;
    setSampleCaseStatus(
      (readStore<CaseStatusEntry>(SAMPLE_KEY)[slug] as Record<number, CaseStatusEntry>) ?? {},
    );
    setCustomCaseStatus(
      (readStore<CustomStatusEntry>(CUSTOM_KEY)[slug] as Record<string, CustomStatusEntry>) ?? {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  useEffect(() => {
    if (!slug) return;
    const map = readStore<CaseStatusEntry>(SAMPLE_KEY);
    if (Object.keys(sampleCaseStatus).length === 0) delete map[slug];
    else map[slug] = sampleCaseStatus;
    writeStore(SAMPLE_KEY, map);
  }, [slug, sampleCaseStatus]);
  useEffect(() => {
    if (!slug) return;
    const map = readStore<CustomStatusEntry>(CUSTOM_KEY);
    if (Object.keys(customCaseStatus).length === 0) delete map[slug];
    else map[slug] = customCaseStatus;
    writeStore(CUSTOM_KEY, map);
  }, [slug, customCaseStatus]);

  const handleResetResults = () => {
    if (!slug) return;
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
  
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);
  const { submissions, loading: submissionsLoading, refetch: refetchSubmissions } = useCodingSubmissions(slug ?? "");
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(() =>
    slug ? readLastOpenedMap()[slug] ?? null : null,
  );
  const [lastFailedId, setLastFailedId] = useState<string | null>(() =>
    slug ? readLastFailedMap()[slug] ?? null : null,
  );
  const [timelineScrollKey, setTimelineScrollKey] = useState(0);
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
  const [pendingRestoreCode, setPendingRestoreCode] = useState<{
    code: string;
    label: string;
    snapshot: string;
  } | null>(null);
  const [restoreUndoSnapshot, setRestoreUndoSnapshot] = useState<string | null>(null);
  const { runs, refetch: refetchRuns } = useCodeRuns(slug ?? "");
  const { toggle: rawToggleBookmark } = useCodingProblemBookmarks();
  const { note: notesValue, setNote: setNotesValue, savedAt: notesSavedAt } = useProblemNotes(slug ?? "");
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
  } = useProblemSolution(slug ?? "", mySolutionLanguage);
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
  } = useFormatOnSubmitOverride(slug ?? "", language, editorPrefs.formatOnSubmit);

  const layout = { order: [], active: DEFAULT_PROBLEM_TAB, setOrder: () => {}, setActive: () => {}, reset: () => {}, isCustomized: false };
  const setLayout = () => {};
  const toggleTab = () => {};
  const activeTabs = [] as EditorTabId[];
  const { preset, setPreset: applyPreset } = useEditorLayoutPreset(slug ?? "", DEFAULT_PROBLEM_TAB);
  const companyTags = [] as any[];

  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [showCompanyTags, setShowCompanyTags] = useState(false);
  const [detailSubmission, setDetailSubmission] = useState<CodeSubmissionRow | null>(null);

  return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>{problem?.title ?? "Coding Problem"} | Parikshaa</title>
        </Helmet>
        <div className="flex h-screen flex-col overflow-hidden">
          {problem ? (
            <ResizablePanelGroup direction="horizontal">
               <ResizablePanel defaultSize={50} minSize={30}>
                 <div className="h-full overflow-y-auto p-6">
                   <h1 className="text-3xl font-bold">{problem.title}</h1>
                 </div>
               </ResizablePanel>
               <ResizableHandle />
               <ResizablePanel defaultSize={50} minSize={30}>
                 <div className="h-full overflow-hidden">
                   <MonacoEditor 
                     language={language}
                     value={code}
                     onChange={setCode}
                   />
                 </div>
               </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="flex h-full items-center justify-center">Loading...</div>
          )}
        </div>
      </div>
  );
};

export default CodingProblemDetail;