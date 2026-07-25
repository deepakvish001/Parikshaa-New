import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  "rounded-lg bg-muted/50 border p-3 sm:p-4 min-w-0 overflow-hidden";
const labelCls =
  "text-[11px] sm:text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground";
const bodyCls =
  "prose prose-sm dark:prose-invert max-w-none text-[13px] sm:text-sm leading-relaxed font-mono break-words [&_p]:my-0 [&_p+p]:mt-2 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_code]:break-words [&_pre]:whitespace-pre-wrap [&_pre]:break-words";

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
      <p className={labelCls}>Constraints</p>
      <ul className="text-sm space-y-1 list-disc list-inside text-foreground/90 font-mono">
        {constraints.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
