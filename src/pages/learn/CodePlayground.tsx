import { useState } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MonacoEditor } from "@/components/coding/MonacoEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Play, Copy, Wand2, Code2 } from "lucide-react";

const LANGS = [
  { id: "javascript", label: "JavaScript", starter: "// Write your solution\nfunction solve(input) {\n  return input;\n}\n" },
  { id: "typescript", label: "TypeScript", starter: "function solve(input: unknown): unknown {\n  return input;\n}\n" },
  { id: "python", label: "Python", starter: "def solve(nums):\n    return nums\n" },
  { id: "java", label: "Java", starter: "class Solution {\n  public int solve(int[] nums) {\n    return 0;\n  }\n}\n" },
  { id: "cpp", label: "C++", starter: "#include <bits/stdc++.h>\nusing namespace std;\nint solve(vector<int>& a){ return 0; }\n" },
  { id: "sql", label: "SQL", starter: "SELECT * FROM users LIMIT 10;\n" },
];

export default function CodePlayground() {
  const [lang, setLang] = useState("python");
  const [code, setCode] = useState(LANGS.find((l) => l.id === "python")!.starter);
  const [problem, setProblem] = useState("");
  const [review, setReview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const changeLang = (id: string) => {
    setLang(id);
    const l = LANGS.find((x) => x.id === id);
    if (l && (!code.trim() || LANGS.some((x) => x.starter.trim() === code.trim()))) {
      setCode(l.starter);
    }
  };

  const runReview = async () => {
    if (!code.trim()) return toast.error("Write some code first");
    setLoading(true);
    setReview("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-code-review", {
        body: { code, language: lang, problem },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReview(data.review ?? "");
    } catch (e: any) {
      const msg = e?.message ?? "Review failed";
      if (msg.includes("402") || msg.toLowerCase().includes("credit")) toast.error("AI credits exhausted. Add credits in workspace settings.");
      else if (msg.includes("429")) toast.error("Rate limited. Try again in a moment.");
      else toast.error(msg);
    } finally { setLoading(false); }
  };

  const copyReview = () => {
    if (!review) return;
    navigator.clipboard.writeText(review);
    toast.success("Review copied");
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Helmet>
        <title>Code Playground · AI Review | Parikshaa</title>
        <meta name="description" content="Write code, get instant AI review — complexity analysis, refactor suggestions, and interview-ready explanations." />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
              <Code2 className="h-6 w-6 text-amber-400" />
              Code Playground
              <span className="ml-2 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">AI Review</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste any code and get instant complexity analysis, refactors, and interview tips.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Editor side */}
          <Card className="flex flex-col border-amber-400/25 bg-card/60 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Select value={lang} onValueChange={changeLang}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGS.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-muted-foreground">{code.split("\n").length} lines · {code.length} chars</span>
              <Button
                onClick={runReview}
                disabled={loading}
                size="sm"
                className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-90"
              >
                {loading ? (<><Wand2 className="mr-2 h-4 w-4 animate-pulse" /> Reviewing…</>)
                  : (<><Sparkles className="mr-2 h-4 w-4" /> AI Review</>)}
              </Button>
            </div>
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Optional: paste the problem statement so the review is context-aware."
              className="mb-2 min-h-[60px] text-xs"
            />
            <div className="h-[520px] overflow-hidden rounded-md border border-border/40">
              <MonacoEditor value={code} onChange={setCode} language={lang} />
            </div>
          </Card>

          {/* Review side */}
          <Card className="border-amber-400/25 bg-card/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-amber-400" /> AI Review
              </h2>
              {review && (
                <Button size="sm" variant="outline" onClick={copyReview} className="h-7 border-amber-400/30 px-2 text-[11px]">
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : review ? (
              <div className="prose prose-sm prose-invert max-w-none prose-headings:text-amber-200 prose-strong:text-amber-100 prose-code:text-orange-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{review}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-[520px] flex-col items-center justify-center gap-3 text-center">
                <div className="rounded-full bg-amber-500/10 p-3"><Play className="h-6 w-6 text-amber-400" /></div>
                <p className="text-sm text-muted-foreground">
                  Write or paste your code, then click <span className="font-medium text-amber-300">AI Review</span>.
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  You'll get time/space complexity, edge-case checks, concrete refactors, faster alternatives, and interview tips.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
