import React, { useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
  Clock, 
  NotebookPen, 
  Cpu, 
  Settings,
  Code2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

// Components - Using named imports based on file inspection
import { ProblemDetailHeader } from "@/components/library/coding/ProblemDetailHeader";
import { splitProblemDescription } from "@/components/library/coding/ProblemFormatSections";
import { ProblemFormatSections } from "@/components/library/coding/ProblemFormatSections";
import { ProblemFooterBar } from "@/components/library/coding/ProblemFooterBar";
import { ProblemRunHistory } from "@/components/library/coding/ProblemRunHistory";
import { ProgressiveHints } from "@/components/library/coding/ProgressiveHints";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Types & Utils
import { Database } from "@/integrations/supabase/types";

type CodingProblem = Database['public']['Tables']['coding_problems']['Row'];
type EditorTabId = "description" | "editorial" | "submissions" | "discussion" | "notes";

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
  const [searchParams] = useSearchParams();
  const horizontalGroupRef = useRef<any>(null);

  const [activeTab, setActiveTab] = useState<EditorTabId>("description");
  const [tabOrder] = useState<EditorTabId[]>(["description", "submissions", "editorial", "discussion", "notes"]);
  const [language, setLanguage] = useState("cpp");
  const [showLogin, setShowLogin] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [problemStats] = useState({ isSolved: false, isAttempted: false, attempts: 0, solvedAt: null as string | null });

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

  const handleToggleBookmark = () => {
    toast.success("Bookmark updated");
  };

  if (isProblemLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-8">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!problem) return <div>Problem not found</div>;

  const content = splitProblemDescription(problem.description || "");

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      <Helmet>
        <title>{problem.title} — Coding Problem</title>
      </Helmet>

      <ResizablePanelGroup ref={horizontalGroupRef} direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50} minSize={25} className="flex flex-col border-r border-border/40">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EditorTabId)} className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-2 border-b bg-muted/20 h-10 shrink-0">
              <TabsList className="bg-transparent h-9 p-0 gap-1">
                {tabOrder.map(tab => (
                  <TabsTrigger 
                    key={tab} 
                    value={tab} 
                    className="h-8 px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md capitalize"
                  >
                    {tab === "description" ? "Statement" : tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <TabsContent value="description" className="m-0 p-6 space-y-6 focus-visible:outline-none">
                <header className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h1 className="text-2xl font-bold tracking-tight text-foreground">{problem.title}</h1>
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", difficultyClass(problem.difficulty))}>
                          {problem.difficulty}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground/60 font-medium ml-2">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {problem.cpu_time_limit_sec}s</span>
                          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {Math.floor(problem.memory_limit_kb / 1024)}MB</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <ProblemDetailHeader
                        isSolved={problemStats.isSolved}
                        isAttempted={problemStats.isAttempted}
                        attempts={problemStats.attempts}
                        solvedAt={problemStats.solvedAt}
                        isBookmarked={false}
                        onToggleBookmark={handleToggleBookmark}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {problem.topics?.map(topic => (
                      <span key={topic} className="px-2 py-0.5 bg-muted/50 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted cursor-pointer transition-colors">
                        {topic}
                      </span>
                    ))}
                  </div>
                </header>

                <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/40">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.main || problem.description}</ReactMarkdown>
                </div>

                <ProblemFormatCards 
                  inputFormat={content.inputFormat} 
                  outputFormat={content.outputFormat} 
                />

                {problem.constraints && (
                  <ProblemConstraints constraints={problem.constraints as any} />
                )}
              </TabsContent>

              <TabsContent value="submissions" className="m-0 p-6 focus-visible:outline-none">
                <ProblemRunHistory runs={[]} />
              </TabsContent>

              <TabsContent value="notes" className="m-0 p-6 focus-visible:outline-none">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><NotebookPen className="h-4 w-4" /> Personal Notes</h3>
                  <textarea 
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Write your thoughts, approach or edge cases here..."
                    className="w-full h-64 p-4 bg-muted/20 border border-border/40 rounded-xl text-sm focus:ring-1 focus:ring-primary/50 outline-none resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="editorial" className="m-0 p-6 focus-visible:outline-none">
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <BookOpen className="h-10 w-10 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">The official solution is currently unavailable.</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <ProblemFooterBar 
            slug={problem.slug}
            solved={problemStats.isSolved}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={25} className="flex flex-col bg-[#0d0d0f]">
          <div className="flex items-center justify-between px-4 h-10 border-b border-border/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                <span>Solution</span>
              </div>
              <div className="h-4 w-px bg-border/40 mx-1" />
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent border-none text-[11px] font-semibold text-muted-foreground hover:text-foreground focus:ring-0 cursor-pointer outline-none uppercase"
              >
                <option value="cpp">C++ 20</option>
                <option value="java">Java 17</option>
                <option value="python">Python 3</option>
              </select>
            </div>
            <button className="p-1.5 hover:bg-white/5 rounded-md text-muted-foreground transition-colors"><Settings className="h-3.5 w-3.5" /></button>
          </div>

          <div className="flex-1 min-h-0 relative flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <Code2 className="h-12 w-12 mx-auto opacity-20" />
              <p className="text-sm">Editor Component</p>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sign in required</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-sm text-muted-foreground">Please sign in to submit your solution and track progress.</div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodingProblemDetail;
