/** Lightweight runtime-value type inference for visualizer variable callouts. */

export type InferredType =
  | "int"
  | "float"
  | "str"
  | "bool"
  | "none"
  | "list"
  | "tuple"
  | "set"
  | "dict"
  | "object"
  | "function"
  | "unknown";

export interface VarInfo {
  type: InferredType;
  label: string;
  /** Short human sentence explaining the value. */
  hint: string;
  size?: number;
}

const countTop = (s: string) => {
  // count top-level comma-separated items
  const inner = s.slice(1, -1).trim();
  if (!inner) return 0;
  let depth = 0;
  let n = 1;
  let quote: string | null = null;
  for (const ch of inner) {
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
    else if (ch === "," && depth === 0) n++;
  }
  return n;
};

export function inferVar(value: string): VarInfo {
  const v = (value ?? "").trim();
  if (!v) return { type: "unknown", label: "unknown", hint: "No value captured yet." };

  if (/^(none|null|nil|undefined)$/i.test(v))
    return { type: "none", label: "None", hint: "An empty value — nothing is stored here." };

  if (/^(true|false)$/i.test(v))
    return { type: "bool", label: "bool", hint: "A true/false flag." };

  if (/^-?\d+$/.test(v))
    return { type: "int", label: "int", hint: "A whole number (integer)." };

  if (/^-?\d*\.\d+(e[-+]?\d+)?$/i.test(v))
    return { type: "float", label: "float", hint: "A decimal number (floating point)." };

  if (/^["'`].*["'`]$/s.test(v))
    return {
      type: "str",
      label: "str",
      hint: `Text of ${Math.max(0, v.length - 2)} character(s).`,
      size: Math.max(0, v.length - 2),
    };

  if (v.startsWith("[") && v.endsWith("]")) {
    const n = countTop(v);
    return { type: "list", label: "list", hint: `An ordered list with ${n} item(s).`, size: n };
  }
  if (v.startsWith("(") && v.endsWith(")")) {
    const n = countTop(v);
    return { type: "tuple", label: "tuple", hint: `A fixed tuple of ${n} item(s).`, size: n };
  }
  if (v.startsWith("{") && v.endsWith("}")) {
    const n = countTop(v);
    if (/:/.test(v))
      return { type: "dict", label: "dict", hint: `A key → value map with ${n} entry(ies).`, size: n };
    return { type: "set", label: "set", hint: `A set of ${n} unique item(s).`, size: n };
  }
  if (/^(<function|lambda|def |function)/i.test(v))
    return { type: "function", label: "function", hint: "A function value (callable)." };
  if (/^<.*>$/.test(v))
    return { type: "object", label: "object", hint: "An object instance." };

  return { type: "unknown", label: "value", hint: "A value produced by your program." };
}

export const TYPE_COLOR: Record<InferredType, string> = {
  int: "text-sky-300 border-sky-400/40 bg-sky-500/10",
  float: "text-cyan-300 border-cyan-400/40 bg-cyan-500/10",
  str: "text-amber-300 border-amber-400/40 bg-amber-500/10",
  bool: "text-fuchsia-300 border-fuchsia-400/40 bg-fuchsia-500/10",
  none: "text-slate-300 border-slate-400/40 bg-slate-500/10",
  list: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10",
  tuple: "text-teal-300 border-teal-400/40 bg-teal-500/10",
  set: "text-lime-300 border-lime-400/40 bg-lime-500/10",
  dict: "text-violet-300 border-violet-400/40 bg-violet-500/10",
  object: "text-orange-300 border-orange-400/40 bg-orange-500/10",
  function: "text-rose-300 border-rose-400/40 bg-rose-500/10",
  unknown: "text-muted-foreground border-border/60 bg-muted/20",
};
