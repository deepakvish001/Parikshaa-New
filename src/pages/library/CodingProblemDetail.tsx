import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  BookOpen, 
  NotebookPen, 
  Cpu, 
  Settings,
  Code2,
  Terminal,
  Play,
  Rocket,
  ChevronUp,
  History,
  Info,
  Clock,
  Layout
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

// Components
import { ProblemDetailHeader } from "@/components/library/coding/ProblemDetailHeader";
import { splitProblemDescription, ProblemFormatCards, ProblemConstraints } from "@/components/library/coding/ProblemFormatSections";
import { ProblemFooterBar } from "@/components/library/coding/ProblemFooterBar";
import { ProblemRunHistory } from "@/components/library/coding/ProblemRunHistory";
import { ProblemTopBar } from "@/components/library/coding/ProblemTopBar";
import { TestCaseWorkbench, type SampleCaseStatusEntry, type CustomCaseStatusEntry } from "@/components/library/coding/TestCaseWorkbench";
import { MonacoEditor } from "@/components/coding/MonacoEditor";
import { SubmissionResultView } from "@/components/library/coding/SubmissionResultView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Hooks
import { useCodeRunner, type SubmitResult } from "@/hooks/useCodeRunner";
import { useCodingSubmissions } from "@/hooks/useCodingSubmissions";
import { useAuth } from "@/contexts/AuthContext";
import { useCodeDraft } from "@/hooks/useCodeDraft";
import { useCodeRuns } from "@/hooks/useCodeRuns";
import { findCurriculumLocation } from "@/data/codingCurriculum";

// Types
import { Database } from "@/integrations/supabase/types";

type CodingProblem = Database['public']['Tables']['coding_problems']['Row'];
type EditorTabId = "description" | "editorial" | "submissions" | "history" | "discussion" | "notes";

const LANG_CONFIGS: Record<string, { id: number; label: string; starter: string }> = {
  cpp: { id: 54, label: "C++ 20", starter: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // solve here\n    return 0;\n}" },
  java: { id: 62, label: "Java 17", starter: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // solve here\n    }\n}" },
  python: { id: 71, label: "Python 3", starter: "import sys\n\ndef main():\n    # solve here\n    pass\n\nif __name__ == \"__main__\":\n    main()" },
};

const difficultyClass = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case "easy": return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
    case "medium": return "text-amber-500 border-amber-500/20 bg-amber-500/5";
    case "hard": return "text-rose-500 border-rose-500/20 bg-rose-500/5";
    default: return "text-muted-foreground border-border/20 bg-muted/5";
  }
};

const CodingProblemDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // UI State
  const [activeTab, setActiveTab] = useState<EditorTabId>("description");
  const [language, setLanguage] = useState("cpp");
  const { draft, saveDraft, draftLoaded } = useCodeDraft(slug || "", language);
  const [code, setCode] = useState(LANG_CONFIGS.cpp.starter);

  // Sync draft to code state
  useEffect(() => {
    if (draftLoaded && draft !== null) {
      setCode(draft);
    } else if (draftLoaded && draft === null) {
      setCode(LANG_CONFIGS[language]?.starter || "");
    }
  }, [draft, draftLoaded, language]);

  const [showLogin, setShowLogin] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [consoleOpen, setConsoleOpen] = useState(true);
  
  // Execution State
  const [stdin, setStdin] = useState("");
  const [sampleStatus, setSampleStatus] = useState<Record<number, SampleCaseStatusEntry>>({});
  const [customStatus, setCustomStatus] = useState<Record<string, CustomCaseStatusEntry>>({});
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  
  const { run, submit, isRunning, isSubmitting } = useCodeRunner();
  const { submissions, refetch: refetchSubmissions } = useCodingSubmissions(slug);
  const { runs, refetch: refetchRuns } = useCodeRuns(slug);
  
  // Curriculum context for TopBar
  const loc = useMemo(() => slug ? findCurriculumLocation(slug) : null, [slug]);
  const folderSolved = 0; // In a real app, this would be derived from user progress
  const folderTotal = loc?.folder?.problems?.length || 0;

  const { data: problem, isLoading: isProblemLoading } = useQuery({
    queryKey: ["problem", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coding_problems")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as CodingProblem;
    },
    enabled: !!slug
  });

  // Handle code change and save draft
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    saveDraft(newCode);
  };

  // Handle language change
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    // Draft hook will trigger and update code via useEffect
  };

  const handleRun = async () => {
    if (!problem) return;
    setConsoleOpen(true);
    try {
      const result = await run({
        source_code: code,
        language_id: LANG_CONFIGS[language].id,
        stdin,
        problem_slug: problem.slug,
        language
      });
      toast.success("Run completed");
      refetchRuns();
    } catch (e: any) {
      toast.error(e.message || "Run failed");
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (!problem) return;
    setConsoleOpen(true);
    setSubmitResult(null);
    
    // Parse sample tests for submission from problem.examples
    const samples = Array.isArray(problem.examples) ? (problem.examples as any[]) : [];
    
    try {
      const result = await submit({
        source_code: code,
        language,
        language_id: LANG_CONFIGS[language].id,
        problem_slug: problem.slug,
        tests: samples.map(c => ({ 
          input: c.input || "", 
          expected: c.output || c.expected || "" 
        })),
        cpu_time_limit: problem.cpu_time_limit_sec ?? 2,
        memory_limit: problem.memory_limit_kb ?? 256000
      });
      
      setSubmitResult(result);
      refetchSubmissions();
      refetchRuns();
      if (result.verdict === "Accepted") {
        toast.success("Problem Solved!");
      } else {
        toast.error(`Submission: ${result.verdict}`);
      }
    } catch (e: any) {
      toast.error(e.message || "Submission failed");
    }
  };

  if (isProblemLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0c]">
        <div className="space-y-4 w-full max-w-2xl px-8">
          <Skeleton className="h-12 w-3/4 bg-white/5" />
          <Skeleton className="h-4 w-full bg-white/5" />
          <Skeleton className="h-64 w-full bg-white/5" />
        </div>
      </div>
    );
  }

  if (!problem) return <div className="p-8 text-center text-muted-foreground">Problem not found</div>;

  const content = splitProblemDescription(problem.description || "");

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#0a0a0c] text-[#e0e0e0]">
      <Helmet>
        <title>{problem.title} — CodingPariksha</title>
      </Helmet>

      <ProblemTopBar 
        folderSolved={folderSolved}
        folderTotal={folderTotal}
        streakDay={7} // Placeholder
        onAiClick={() => toast.info("AI Help coming soon")}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel: Description, Submissions, etc. */}
        <ResizablePanel defaultSize={45} minSize={30} className="flex flex-col border-r border-white/10">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EditorTabId)} className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center px-2 border-b border-white/5 bg-[#0d0d0f] h-10 shrink-0">
              <TabsList className="bg-transparent h-9 p-0 gap-1">
                <TabsTrigger value="description" className="h-8 px-4 text-[11px] font-bold uppercase tracking-widest rounded-md data-[state=active]:bg-white/5">
                  <FileText className="h-3 w-3 mr-2 text-primary" /> Statement
                </TabsTrigger>
                <TabsTrigger value="submissions" className="h-8 px-4 text-[11px] font-bold uppercase tracking-widest rounded-md data-[state=active]:bg-white/5">
                  <Rocket className="h-3 w-3 mr-2 text-primary" /> Submissions
                </TabsTrigger>
                <TabsTrigger value="history" className="h-8 px-4 text-[11px] font-bold uppercase tracking-widest rounded-md data-[state=active]:bg-white/5">
                  <History className="h-3 w-3 mr-2 text-amber-400" /> Runs
                </TabsTrigger>
                <TabsTrigger value="editorial" className="h-8 px-4 text-[11px] font-bold uppercase tracking-widest rounded-md data-[state=active]:bg-white/5">
                  <BookOpen className="h-3 w-3 mr-2 text-emerald-400" /> Editorial
                </TabsTrigger>
                <TabsTrigger value="notes" className="h-8 px-4 text-[11px] font-bold uppercase tracking-widest rounded-md data-[state=active]:bg-white/5">
                  <NotebookPen className="h-3 w-3 mr-2 text-rose-400" /> Notes
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0c]">
              <TabsContent value="description" className="m-0 p-6 space-y-8 focus-visible:outline-none max-w-4xl mx-auto">
                <header className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <h1 className="text-3xl font-black tracking-tighter text-white leading-tight">{problem.title}</h1>
                      <div className="flex items-center gap-3">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border", difficultyClass(problem.difficulty))}>
                          {problem.difficulty}
                        </span>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {problem.cpu_time_limit_sec}s</span>
                          <span className="flex items-center gap-1.5"><Cpu className="h-3 w-3" /> {Math.floor(problem.memory_limit_kb / 1024)}MB</span>
                        </div>
                      </div>
                    </div>
                    <ProblemDetailHeader
                      isSolved={submissions.some(s => s.verdict === "Accepted")}
                      isAttempted={submissions.length > 0}
                      attempts={submissions.length}
                      solvedAt={submissions.find(s => s.verdict === "Accepted")?.created_at}
                      isBookmarked={false}
                      onToggleBookmark={() => toast.success("Bookmark updated")}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {problem.topics?.map(topic => (
                      <span key={topic} className="px-2.5 py-1 bg-white/5 rounded-md text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-white hover:bg-white/10 cursor-pointer transition-all border border-white/5">
                        {topic}
                      </span>
                    ))}
                  </div>
                </header>

                <div className="prose prose-sm prose-invert max-w-none prose-p:text-[#b0b0b0] prose-p:leading-relaxed prose-headings:text-white prose-strong:text-white prose-code:text-amber-200 prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.main || problem.description}</ReactMarkdown>
                </div>

                <div className="space-y-6">
                  <ProblemFormatCards 
                    inputFormat={content.inputFormat} 
                    outputFormat={content.outputFormat} 
                  />

                  {problem.constraints && (
                    <ProblemConstraints constraints={problem.constraints as any} />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="submissions" className="m-0 p-6 focus-visible:outline-none">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Rocket className="h-4 w-4" /> Final Submissions
                  </h3>
                  <div className="text-sm text-muted-foreground mb-4">
                    Your official submissions to the hidden test cases.
                  </div>
                  {submissions.map((s) => (
                    <SubmissionResultView 
                      key={s.id} 
                      submitResult={{
                        verdict: s.verdict,
                        passed: s.passed_tests,
                        total: s.total_tests,
                        runtime_ms: s.runtime_ms ?? 0,
                        memory_kb: s.memory_kb ?? 0,
                        failing_case: s.failing_case,
                        stderr: s.stderr,
                        submission_id: s.id,
                        case_results: []
                      }}
                      problemSlug={problem.slug}
                      problemTitle={problem.title}
                      language={s.language}
                      languageId={s.language_id}
                      sourceCode={s.source_code}
                      user={user}
                      submittedAt={s.created_at}
                    />
                  ))}
                  {submissions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground/40 text-xs font-black uppercase tracking-widest">
                      No submissions yet
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="m-0 p-6 focus-visible:outline-none">
                <ProblemRunHistory runs={runs as any} />
              </TabsContent>

              <TabsContent value="notes" className="m-0 p-6 focus-visible:outline-none">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <NotebookPen className="h-4 w-4 text-rose-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Personal Notes</h3>
                  </div>
                  <textarea 
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Write your thoughts, approach or edge cases here..."
                    className="w-full h-[400px] p-6 bg-black/40 border border-white/5 rounded-2xl text-sm font-mono focus:ring-1 focus:ring-primary/50 outline-none resize-none selection:bg-primary/20"
                  />
                </div>
              </TabsContent>

              <TabsContent value="editorial" className="m-0 p-6 focus-visible:outline-none text-center py-20">
                <BookOpen className="h-12 w-12 text-white/5 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Editorial is Locked</p>
                <p className="text-[11px] text-muted-foreground/60 mt-2">Solve the problem first or use tokens to unlock.</p>
              </TabsContent>
            </div>

            <ProblemFooterBar 
              slug={problem.slug}
              solved={submissions.some(s => s.verdict === "Accepted")}
            />
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-white/5 w-1" />

        {/* Right Panel: Editor + Console */}
        <ResizablePanel defaultSize={55} minSize={30} className="flex flex-col bg-[#0d0d0f]">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={65} minSize={30} className="flex flex-col min-h-0">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 h-11 border-b border-white/5 bg-[#0d0d0f] shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                    <Code2 className="h-3.5 w-3.5 text-primary" />
                    Solution
                  </div>
                  <div className="h-4 w-px bg-white/10 mx-1" />
                  <select 
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white focus:ring-0 cursor-pointer outline-none transition-colors"
                  >
                    {Object.entries(LANG_CONFIGS).map(([id, cfg]) => (
                      <option key={id} value={id} className="bg-[#0d0d0f]">{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-white">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-white">
                    <Layout className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 min-h-0 bg-[#0a0a0c]">
                <MonacoEditor 
                  value={code} 
                  onChange={handleCodeChange} 
                  language={language}
                  fontSize={14}
                />
              </div>

              {/* Editor Footer / Quick Actions */}
              <div className="flex items-center justify-between px-4 h-12 border-t border-white/5 bg-[#0d0d0f] shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setConsoleOpen(!consoleOpen)}
                  className="h-8 gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  Console
                  {consoleOpen ? <ChevronUp className="h-3 w-3 rotate-180 transition-transform" /> : <ChevronUp className="h-3 w-3 transition-transform" />}
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRun}
                    disabled={isRunning || isSubmitting}
                    className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    {isRunning ? <Skeleton className="h-3 w-3 rounded-full animate-pulse" /> : <Play className="h-3 w-3 mr-2 fill-current" />}
                    Run
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSubmit}
                    disabled={isRunning || isSubmitting}
                    className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? <Skeleton className="h-3 w-3 rounded-full animate-pulse bg-primary-foreground/40" /> : <Rocket className="h-3 w-3 mr-2" />}
                    Submit
                  </Button>
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-white/5 h-1" />

            <ResizablePanel defaultSize={35} minSize={0} collapsible className="bg-[#0d0d0f]">
              {consoleOpen && problem && (
                <div className="h-full border-t border-white/10 bg-[#0a0a0c] overflow-y-auto custom-scrollbar p-6">
                  <TestCaseWorkbench 
                    slug={problem.slug}
                    sampleTests={Array.isArray(problem.examples) ? (problem.examples as any[]) : []}
                    stdin={stdin}
                    onStdinChange={setStdin}
                    onRun={handleRun}
                    isRunning={isRunning}
                    sampleCaseStatus={sampleStatus}
                    customStatus={customStatus}
                    onResetResults={() => {
                      setSampleStatus({});
                      setCustomStatus({});
                    }}
                  />
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Login Dialog */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="bg-[#0d0d0f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter">Login Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Please sign in to submit your solutions and track progress.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowLogin(false)} className="text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={() => navigate("/login")} className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-6">Sign In</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodingProblemDetail;
