import { Fragment } from "react";

/**
 * Tiny, dependency-free multi-language tokenizer used by the read-only
 * execution panel. It only needs to be *pretty*, not a real parser.
 */

const COMMON = [
  "if","else","for","while","return","break","continue","function","def","class",
  "new","try","catch","except","finally","throw","raise","import","from","export",
  "const","let","var","public","private","protected","static","void","int","float",
  "double","string","bool","boolean","char","long","struct","enum","interface","type",
  "package","namespace","using","print","println","printf","echo","end","do","switch",
  "case","default","in","of","is","not","and","or","None","null","nil","true","false",
  "True","False","self","this","super","yield","await","async","lambda","fn","let mut",
  "mut","func","defer","go","impl","trait","where","with","as","pass","elif","then",
];

const KEYWORDS = new Set(COMMON);

const BUILTINS = new Set([
  "len","range","str","list","dict","set","tuple","abs","min","max","sum","sorted",
  "map","filter","reduce","enumerate","zip","input","open","format","console","log",
  "Math","Array","Object","String","Number","JSON","push","pop","append","slice",
  "splice","split","join","keys","values","items","toString","vector","cout","cin",
  "System","out","std","size","length",
]);

type Tok = { t: string; k: string };

const CLASS: Record<string, string> = {
  kw: "text-fuchsia-400",
  num: "text-amber-300",
  str: "text-lime-300",
  com: "text-slate-500 italic",
  fn: "text-sky-300",
  builtin: "text-cyan-300",
  op: "text-rose-400",
  punct: "text-slate-400",
  id: "text-slate-200",
  ws: "",
};

const COMMENT_RE = /^(\/\/.*|#.*|--.*)/;
const STR_RE = /^(?:"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?|`(?:\\.|[^`\\])*`?)/;
const NUM_RE = /^\d[\d_.]*(?:e[+-]?\d+)?/i;
const ID_RE = /^[A-Za-z_$][\w$]*/;
const OP_RE = /^(?:=>|===|!==|<=|>=|==|!=|\+\+|--|&&|\|\||\*\*|[-+*/%=<>!&|^~?:])/;
const PUNCT_RE = /^[()[\]{},;.]/;
const WS_RE = /^\s+/;

export function tokenizeLine(line: string): Tok[] {
  const out: Tok[] = [];
  let rest = line;
  let guard = 0;
  while (rest.length && guard++ < 400) {
    let m: RegExpMatchArray | null;
    if ((m = rest.match(WS_RE))) out.push({ t: m[0], k: "ws" });
    else if ((m = rest.match(COMMENT_RE))) out.push({ t: m[0], k: "com" });
    else if ((m = rest.match(STR_RE))) out.push({ t: m[0], k: "str" });
    else if ((m = rest.match(NUM_RE))) out.push({ t: m[0], k: "num" });
    else if ((m = rest.match(ID_RE))) {
      const word = m[0];
      const after = rest.slice(word.length).trimStart();
      const k = KEYWORDS.has(word)
        ? "kw"
        : after.startsWith("(")
          ? BUILTINS.has(word)
            ? "builtin"
            : "fn"
          : BUILTINS.has(word)
            ? "builtin"
            : "id";
      out.push({ t: word, k });
    } else if ((m = rest.match(OP_RE))) out.push({ t: m[0], k: "op" });
    else if ((m = rest.match(PUNCT_RE))) out.push({ t: m[0], k: "punct" });
    else {
      out.push({ t: rest[0], k: "id" });
      m = null;
      rest = rest.slice(1);
      continue;
    }
    rest = rest.slice(out[out.length - 1].t.length);
  }
  return out;
}

export const HighlightedLine = ({ line }: { line: string }) => (
  <>
    {tokenizeLine(line).map((tok, i) => (
      <Fragment key={i}>
        <span className={CLASS[tok.k] ?? CLASS.id}>{tok.t}</span>
      </Fragment>
    ))}
  </>
);
