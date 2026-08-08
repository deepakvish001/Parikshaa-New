import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictBadge } from "@/components/coding/VerdictBadge";
import { Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { SubmissionPerformancePanel } from "./SubmissionPerformancePanel";
import type { CodeSubmissionRow } from "@/hooks/useCodingSubmissions";

interface Props {
  submission: CodeSubmissionRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Show a skeleton while submissions are still being fetched (e.g. deep-link). */
  loading?: boolean;
}

const copy = async (label: string, text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Couldn't copy ${label.toLowerCase()}`);
  }
};

export const SubmissionDetailsDrawer = ({ submission, open, onOpenChange, loading }: Props) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 border-l border-border/40 bg-[#0a0a0c]/90 backdrop-blur-3xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-2xl font-black uppercase tracking-tighter text-foreground/90 leading-none">
              Submission Details
            </SheetTitle>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
              Insight & Performance Metrics
            </p>
          </SheetHeader>

          {loading && !submission ? (
            <div className="space-y-6" aria-busy="true" aria-live="polite">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-32 rounded-xl" />
                <Skeleton className="h-8 w-20 rounded-xl" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl col-span-2" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-60 w-full rounded-2xl" />
              </div>
            </div>
          ) : !submission ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="h-16 w-16 rounded-[2rem] bg-muted/20 flex items-center justify-center">
                <Link2 className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <p className="text-muted-foreground/40 text-sm font-black uppercase tracking-[0.2em]">
                Submission Not Found
              </p>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="h-11 px-6 rounded-2xl font-black uppercase tracking-widest border-border/40"
              >
                Go Back
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-[2rem] bg-[#0a0a0c]/60 border border-border/20 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-3">
                  <VerdictBadge verdict={submission.verdict} />
                  <Badge 
                    variant="outline" 
                    className="h-7 px-3 rounded-xl border-border/40 text-[10px] font-black uppercase tracking-widest bg-muted/20"
                  >
                    {submission.language}
                  </Badge>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-foreground/5 border border-border/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
                      {submission.passed_tests} / {submission.total_tests}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Passed
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-all"
                  onClick={async () => {
                    const url = new URL(window.location.href);
                    url.searchParams.set("sub", submission.id);
                    url.hash = "submissions";
                    try {
                      await navigator.clipboard.writeText(url.toString());
                      toast.success("Link copied", {
                        description: "Shared URL successfully.",
                      });
                    } catch {
                      toast.error("Couldn't copy link");
                    }
                  }}
                >
                  <Link2 className="h-4 w-4" />
                  Copy URL
                </Button>
              </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Runtime</p>
                <p className="font-mono">
                  {submission.runtime_ms !== null ? `${submission.runtime_ms} ms` : "—"}
                </p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Memory</p>
                <p className="font-mono">
                  {submission.memory_kb !== null
                    ? `${(submission.memory_kb / 1024).toFixed(1)} MB`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border p-2 col-span-2">
                <p className="text-muted-foreground">Submitted</p>
                <p>{new Date(submission.created_at).toLocaleString()}</p>
              </div>
            </div>

            <SubmissionPerformancePanel submission={submission} />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Source code
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs"
                  onClick={() => copy("Source", submission.source_code)}
                >
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>
              <pre className="text-xs bg-muted/50 p-3 rounded border overflow-x-auto max-h-72">
                <code>{submission.source_code}</code>
              </pre>
            </div>

            {submission.failing_case && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Failing case
                </p>
                <pre className="text-xs bg-destructive/5 border border-destructive/30 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(submission.failing_case, null, 2)}
                </pre>
              </div>
            )}

            {submission.stderr && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                    Stderr
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-xs"
                    onClick={() => copy("Stderr", submission.stderr ?? "")}
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <pre className="text-xs bg-destructive/5 border border-destructive/30 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {submission.stderr}
                </pre>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
