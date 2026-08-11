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
  "relative group overflow-hidden rounded-xl border border-border/40 bg-muted/10 p-4 sm:p-5 transition-all duration-300 hover:border-border/60 hover:bg-muted/20";
const labelCls =
  "inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3 pb-1 border-b border-border/20 w-full group-hover:text-muted-foreground/60 transition-colors";
const bodyCls =
  "prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed font-sans text-foreground/80 selection:bg-primary/20 [&_p]:my-0 [&_p+p]:mt-3 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:bg-muted/80 [&_code]:text-foreground [&_code]:border [&_code]:border-border/40 [&_code]:font-mono [&_code]:before:content-none [&_code]:after:content-none [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:bg-black/40 [&_pre]:border [&_pre]:border-border/20 [&_pre]:shadow-inner";

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
      className="grid gap-4 grid-cols-1 w-full min-w-0"
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
        <Cpu className="h-3 w-3 opacity-50" />
        Constraints
      </p>
      <ul className="grid gap-2 list-none">
        {constraints.map((c, i) => (
          <li key={i} className="flex items-start gap-2.5 group/item">
            <div className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/30 group-hover/item:bg-primary/60 transition-colors shrink-0" />
            <span className="text-[13px] leading-relaxed font-mono text-foreground/70 group-hover/item:text-foreground transition-colors selection:bg-primary/20">
              {c}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
