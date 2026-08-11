import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Cpu } from "lucide-react";

/**
 * Reusable styled cards for a coding problem's Input/Output Format and
 * Constraints sections. Kept in one place so every problem page renders
 * identical, mobile-friendly cards without drift.
 */

type FormatSplit = {
  main: string;
  inputFormat: string;
  outputFormat: string;
};

/**
 * Split Input/Output Format sections out of a description. Supports both
 * markdown-header style (`## Input Format`) and inline label style
 * (`Input format: ...` / `**Input Format:**  ...`) — whichever the DB uses.
 */
export function splitProblemDescription(raw: string): FormatSplit {
  if (!raw) return { main: "", inputFormat: "", outputFormat: "" };

  // Matches:  ## Input Format         (header, own line)
  //           **Input Format:** ...   (bold inline label)
  //           Input format: ...       (plain inline label, start of line)
  const headerRe =
    /(?:^|\n)[ \t]*(?:#{1,6}[ \t]*|\*\*[ \t]*)?(Input|Output)[ \t]+Format[ \t]*:?[ \t]*(?:\*\*)?[ \t]*/gi;

  const matches: { label: "Input" | "Output"; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(raw)) !== null) {
    matches.push({
      label: m[1].toLowerCase() === "input" ? "Input" : "Output",
      start: m.index + (m[0].startsWith("\n") ? 1 : 0),
      end: m.index + m[0].length,
    });
  }
  if (matches.length === 0) {
    return { main: raw.trim(), inputFormat: "", outputFormat: "" };
  }

  const main = raw.slice(0, matches[0].start).trim();
  let inputFormat = "";
  let outputFormat = "";
  matches.forEach((mm, i) => {
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].start : raw.length;
    const body = raw.slice(mm.end, bodyEnd).trim();
    if (mm.label === "Input") inputFormat ||= body;
    else outputFormat ||= body;
  });
  return { main, inputFormat, outputFormat };
}

const cardCls =
  "relative group overflow-hidden rounded-[2rem] border border-border/20 bg-[#0a0a0c]/40 backdrop-blur-3xl p-6 sm:p-8 transition-all duration-500 hover:border-border/40 hover:bg-[#0a0a0c]/60";
const labelCls =
  "inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mb-6 pb-2 border-b border-border/10 w-full group-hover:text-muted-foreground/50 transition-colors";
const bodyCls =
  "prose prose-sm dark:prose-invert max-w-none text-[14px] sm:text-[15px] leading-relaxed font-sans text-foreground/80 selection:bg-primary/20 [&_p]:my-0 [&_p+p]:mt-4 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1.5 [&_code]:px-2 [&_code]:py-0.5 [&_code]:rounded-lg [&_code]:bg-primary/5 [&_code]:text-primary [&_code]:border [&_code]:border-primary/10 [&_code]:font-mono [&_code]:before:content-none [&_code]:after:content-none [&_pre]:p-5 [&_pre]:rounded-2xl [&_pre]:bg-black/60 [&_pre]:border [&_pre]:border-border/10 [&_pre]:shadow-inner";

export function ProblemFormatCards({
  inputFormat,
  outputFormat,
}: {
  inputFormat: string;
  outputFormat: string;
}) {
  if (!inputFormat && !outputFormat) return null;
  return (
    <div
      className="grid gap-3 sm:gap-4 grid-cols-1 w-full min-w-0"
      data-testid="problem-format-cards"
    >
      {inputFormat && (
        <div className={cardCls} data-testid="problem-input-format">
          <p className={labelCls}>Input Format</p>
          <div className={bodyCls}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {inputFormat}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {outputFormat && (
        <div className={cardCls} data-testid="problem-output-format">
          <p className={labelCls}>Output Format</p>
          <div className={bodyCls}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {outputFormat}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProblemConstraints({ constraints }: { constraints: string[] }) {
  if (!constraints || constraints.length === 0) return null;
  return (
    <div className={cardCls} data-testid="problem-constraints">
      <p className={labelCls}>
        <Cpu className="h-3.5 w-3.5 opacity-50" />
        Constraints
      </p>
      <ul className="grid gap-3 list-none">
        {constraints.map((c, i) => (
          <li key={i} className="flex items-start gap-3 group/item">
            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 group-hover/item:bg-primary transition-colors shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.2)]" />
            <span className="text-[13px] sm:text-[14px] leading-relaxed font-mono text-foreground/80 group-hover/item:text-foreground transition-colors selection:bg-primary/20">
              {c}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
