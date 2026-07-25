import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Code2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { cn } from "@/lib/utils";
import { SubmissionPerformancePanel } from "./SubmissionPerformancePanel";
import type { CodeSubmissionRow } from "@/hooks/useCodingSubmissions";
import type { SubmitResult } from "@/hooks/useCodeRunner";

interface Props {
  submitResult: SubmitResult;
  problemSlug: string;
  problemTitle: string;
  language: string;
  languageId: number;
  sourceCode: string;
  user: { id: string; email?: string | null } | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  /** Recent submissions for this problem (to power a small distribution chart). */
  recentSubmissions?: CodeSubmissionRow[];
  /** Switch the right pane back to the code editor. */
  onBackToCode?: () => void;
  /** Open the full submissions history (tab/page) for this problem. */
  onOpenAllSubmissions?: () => void;
  /** Override the submission timestamp (defaults to "now" when omitted). */
  submittedAt?: string;
}

const formatTimestamp = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const SubmissionResultView = ({
  submitResult,
  problemSlug,
  problemTitle,
  language,
  languageId,
  sourceCode,
  user,
  displayName,
  avatarUrl,
  recentSubmissions = [],
  onBackToCode,
  onOpenAllSubmissions,
  submittedAt,
}: Props) => {
  const isAccepted = submitResult.verdict === "Accepted";
  const [codeOpen, setCodeOpen] = useState(false);

  // Synthesize a CodeSubmissionRow so we can reuse the performance panel
  // immediately (no extra DB round-trip required).
  const submissionRow = useMemo<CodeSubmissionRow>(
    () => ({
      id: submitResult.submission_id ?? "pending",
      problem_slug: problemSlug,
      language,
      language_id: languageId,
      source_code: sourceCode,
      verdict: submitResult.verdict,
      runtime_ms: submitResult.runtime_ms ?? null,
      memory_kb: submitResult.memory_kb ?? null,
      passed_tests: submitResult.passed,
      total_tests: submitResult.total,
      failing_case: submitResult.failing_case ?? null,
      stderr: submitResult.stderr ?? null,
      created_at: submittedAt ?? new Date().toISOString(),
    }),
    [submitResult, problemSlug, language, languageId, sourceCode, submittedAt],
  );

  // Personal distribution: bucket the user's own past accepted runtimes
  // for this problem so they can see where this submission lands.
  const distribution = useMemo(() => {
    const accepted = recentSubmissions.filter(
      (r) => r.verdict === "Accepted" && typeof r.runtime_ms === "number",
    );
    if (accepted.length === 0) return [];
    const times = accepted.map((r) => r.runtime_ms as number);
    const min = Math.min(...times);
    const max = Math.max(...times);
    if (min === max) return [{ label: `${min}ms`, count: times.length, isCurrent: true }];
    const buckets = 8;
    const step = Math.max(1, Math.ceil((max - min + 1) / buckets));
    const bins = Array.from({ length: buckets }, (_, i) => ({
      from: min + i * step,
      to: min + (i + 1) * step - 1,
      count: 0,
      isCurrent: false,
    }));
    times.forEach((t) => {
      const i = Math.min(buckets - 1, Math.floor((t - min) / step));
      bins[i].count += 1;
    });
    const currentRuntime = submitResult.runtime_ms;
    if (typeof currentRuntime === "number") {
      const i = Math.min(buckets - 1, Math.max(0, Math.floor((currentRuntime - min) / step)));
      if (bins[i]) bins[i].isCurrent = true;
    }
    return bins
      .filter((b) => b.count > 0)
      .map((b) => ({
        label: `${b.from}-${b.to}ms`,
        count: b.count,
        isCurrent: b.isCurrent,
      }));
  }, [recentSubmissions, submitResult.runtime_ms]);
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  const initials = (displayName || user?.email || "U")
    .split(/[\s@]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-4">
      {/* Header: verdict + actions */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {isAccepted ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-emerald-400" aria-hidden />
              <div>
                <div className="text-xl font-semibold text-emerald-400 leading-tight">
                  Accepted
                </div>
                <div className="text-xs text-muted-foreground">
                  {submitResult.passed} / {submitResult.total} testcases passed
                </div>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6 text-rose-500" aria-hidden />
              <div>
                <div className="text-xl font-semibold text-rose-500 leading-tight">
                  {submitResult.verdict}
                </div>
                <div className="text-xs text-muted-foreground">
                  {submitResult.passed} / {submitResult.total} testcases passed
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onBackToCode && (
            <Button size="sm" variant="outline" onClick={onBackToCode} className="h-8 gap-1.5 text-xs">
              <Code2 className="h-3.5 w-3.5" />
              Back to code
            </Button>
          )}
          {onOpenAllSubmissions && (
            <Button size="sm" variant="ghost" onClick={onOpenAllSubmissions} className="h-8 gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              All submissions
            </Button>
          )}
        </div>
      </div>

      {/* Submitter strip */}
      {user && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-5 w-5">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName ?? "You"} />}
            <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-foreground/80">{displayName || user.email || "You"}</span>
          <span>· submitted at {formatTimestamp(submissionRow.created_at)}</span>
          <Badge variant="outline" className="text-[10px] uppercase">
            {language}
          </Badge>
        </div>
      )}

      {/* Performance: Runtime / Memory + Beats % (real percentile, server-side) */}
      {isAccepted && <SubmissionPerformancePanel submission={submissionRow} />}

      {/* Personal distribution chart (own accepted runs) */}
      {isAccepted && distribution.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-[#070709] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Your runtime distribution</span>
            <span className="text-[10px] text-muted-foreground">
              Based on your {distribution.reduce((a, d) => a + d.count, 0)} accepted run(s)
            </span>
          </div>
          <div className="flex items-end gap-1 h-24">
            {distribution.map((d, i) => {
              const h = Math.max(8, Math.round((d.count / maxCount) * 96));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-full rounded-sm transition-colors",
                      d.isCurrent ? "bg-emerald-500" : "bg-muted-foreground/30",
                    )}
                    style={{ height: `${h}px` }}
                    title={`${d.label} · ${d.count}`}
                  />
                  <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Failing test summary for rejected verdicts */}
      {!isAccepted && submitResult.failing_case && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 space-y-2 text-xs">
          <div className="font-medium text-rose-400">
            Failed on test case #{(submitResult.failing_case.index ?? 0) + 1}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground mb-1">Input</div>
              <pre className="bg-background p-2 rounded border border-white/10 whitespace-pre-wrap overflow-x-auto">
                {submitResult.failing_case.input}
              </pre>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground mb-1">Expected</div>
              <pre className="bg-background p-2 rounded border border-white/10 whitespace-pre-wrap overflow-x-auto text-emerald-400">
                {submitResult.failing_case.expected}
              </pre>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground mb-1">Got</div>
              <pre className="bg-background p-2 rounded border border-white/10 whitespace-pre-wrap overflow-x-auto text-rose-400">
                {submitResult.failing_case.output || "(empty)"}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Submitted code preview */}
      <div className="rounded-lg border border-white/10 bg-[#070709] overflow-hidden">
        <button
          type="button"
          onClick={() => setCodeOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/5"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Code2 className="h-3.5 w-3.5" />
            Code <span className="text-muted-foreground">| {language}</span>
          </span>
          {codeOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {codeOpen && (
          <pre className="px-3 py-2 text-[11px] font-mono bg-background/40 overflow-x-auto max-h-[260px] whitespace-pre-wrap border-t border-white/10">
            {sourceCode}
          </pre>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end text-xs">
        <span className="text-muted-foreground truncate max-w-[60%] text-right">{problemTitle}</span>
      </div>
    </div>
  );
};
