/**
 * Tiny Big-O string → growth-function parser used to plot complexity curves.
 * Handles the common shapes an LLM returns: O(1), O(log n), O(sqrt n), O(n),
 * O(n log n), O(n^2), O(n^2 log n), O(2^n), O(n!), O(m + n), O(V + E)…
 */

export interface GrowthSpec {
  /** Normalised label, e.g. "n log n" */
  label: string;
  /** f(n) — used for plotting. */
  fn: (n: number) => number;
  /** Rough ranking for "which is worse" ordering. */
  rank: number;
}

const clean = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/θ|Θ|ω|Ω/g, "")
    .replace(/^o\s*\(/, "(")
    .replace(/[()]/g, " ")
    .replace(/\*/g, " ")
    .replace(/·/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Collapse multi-variable terms (m + n, v + e) into a single n. */
const unifyVars = (s: string): string =>
  s
    .replace(/\b(m|k|v|e|b|d|q)\b/g, "n")
    .replace(/\bn\s*\+\s*n\b/g, "n")
    .replace(/\bn\s*\+\s*1\b/g, "n");

export function parseComplexity(input?: string | null): GrowthSpec | null {
  if (!input || typeof input !== "string") return null;
  const s = unifyVars(clean(input));
  if (!s) return null;

  const has = (re: RegExp) => re.test(s);
  const log = (n: number) => Math.log2(Math.max(2, n));

  // factorial / exponential first — dominant
  if (has(/n\s*!/)) {
    return { label: "n!", rank: 90, fn: (n) => gammaish(n) };
  }
  const expo = s.match(/(\d+)\s*\^\s*n/);
  if (expo) {
    const base = Number(expo[1]) || 2;
    return { label: `${base}^n`, rank: 80, fn: (n) => Math.pow(base, Math.min(n, 40)) };
  }

  const powMatch = s.match(/n\s*\^\s*(\d+(?:\.\d+)?)/);
  const power = powMatch ? Number(powMatch[1]) : has(/\bn\b/) ? 1 : 0;

  const logMatch = s.match(/log\s*\^\s*(\d+)/);
  const logPower = logMatch ? Number(logMatch[1]) : has(/log/) ? 1 : 0;

  const sqrt = has(/sqrt|√|n\s*\^\s*0\.5|n\s*\^\s*1\/2/);

  if (power === 0 && logPower === 0 && !sqrt) {
    return { label: "1", rank: 0, fn: () => 1 };
  }

  const base = sqrt ? 0.5 : power;
  const label =
    `${base === 0 ? "" : base === 1 ? "n" : base === 0.5 ? "√n" : `n^${base}`}` +
    `${logPower ? `${base ? " " : ""}log${logPower > 1 ? `^${logPower}` : ""} n` : ""}`;

  const rank = base * 10 + logPower * 2 + (base === 0 ? 1 : 0);
  return {
    label: label || "1",
    rank,
    fn: (n) => Math.pow(n, base) * Math.pow(log(n), logPower),
  };
}

const gammaish = (n: number) => {
  const capped = Math.min(n, 18);
  let acc = 1;
  for (let i = 2; i <= capped; i += 1) acc *= i;
  return acc;
};

export interface CurvePoint {
  n: number;
  [series: string]: number;
}

/** Sample every named complexity over the same input sizes. */
export function buildCurves(
  series: { key: string; expr?: string | null }[],
  maxN = 64,
  samples = 16,
): { points: CurvePoint[]; specs: Record<string, GrowthSpec> } {
  const specs: Record<string, GrowthSpec> = {};
  for (const s of series) {
    const spec = parseComplexity(s.expr);
    if (spec) specs[s.key] = spec;
  }
  const points: CurvePoint[] = [];
  const stepSize = Math.max(1, Math.round(maxN / samples));
  for (let n = stepSize; n <= maxN; n += stepSize) {
    const p: CurvePoint = { n };
    for (const [key, spec] of Object.entries(specs)) {
      p[key] = Number(spec.fn(n).toFixed(2));
    }
    points.push(p);
  }
  return { points, specs };
}

export const COMPLEXITY_CASE_COLORS: Record<string, string> = {
  best: "#34d399",
  average: "#60a5fa",
  worst: "#f472b6",
  time: "#818cf8",
  space: "#34d399",
};
