/**
 * Heuristic confidence scoring for the AI-estimated complexity.
 * We can't get a probability from the model, so we score how *complete and
 * self-consistent* the estimate is: parsable Big-O, a recurrence, distinct
 * best/average/worst ordering, reasoning text, and code size.
 */

import { parseComplexity } from "./complexityMath";

export interface ComplexityInput {
  time?: string;
  space?: string;
  timeReason?: string;
  spaceReason?: string;
  recurrence?: string | null;
  best?: string;
  average?: string;
  worst?: string;
  notes?: string[];
}

export interface ConfidenceResult {
  /** 0-100 */
  score: number;
  level: "low" | "medium" | "high";
  label: string;
  color: string;
  /** What raised the score. */
  positives: string[];
  /** What is missing or shaky. */
  concerns: string[];
}

export function scoreConfidence(c?: ComplexityInput | null, codeLines = 0): ConfidenceResult {
  const positives: string[] = [];
  const concerns: string[] = [];
  let score = 20;

  if (!c) {
    return {
      score: 0,
      level: "low",
      label: "No estimate",
      color: "#f87171",
      positives,
      concerns: ["No complexity analysis was returned."],
    };
  }

  const specTime = parseComplexity(c.time);
  const specSpace = parseComplexity(c.space);
  if (specTime) {
    score += 18;
    positives.push(`Time bound parses cleanly as ${specTime.label}.`);
  } else {
    concerns.push("Time complexity string could not be parsed into a standard growth class.");
  }
  if (specSpace) {
    score += 8;
  } else {
    concerns.push("Space complexity is missing or non-standard.");
  }

  const cases = (["best", "average", "worst"] as const).map((k) => parseComplexity(c[k]));
  const present = cases.filter(Boolean).length;
  if (present === 3) {
    score += 16;
    positives.push("Best, average and worst cases are all provided.");
  } else if (present > 0) {
    score += 6;
    concerns.push("Not all three cases (best/average/worst) were estimated.");
  } else {
    concerns.push("No per-case breakdown was returned.");
  }

  if (present === 3) {
    const [b, a, w] = cases as NonNullable<(typeof cases)[number]>[];
    if (b.rank <= a.rank && a.rank <= w.rank) {
      score += 12;
      positives.push("Cases are ordered consistently (best ≤ average ≤ worst).");
    } else {
      score -= 12;
      concerns.push("Case ordering is inconsistent — best/average/worst don't grow monotonically.");
    }
  }

  if (c.recurrence) {
    score += 12;
    positives.push("A concrete recurrence relation backs the estimate.");
  } else {
    concerns.push("No recurrence relation given — bound is stated, not derived.");
  }

  const reasons = [c.timeReason, c.spaceReason].filter((r) => (r ?? "").trim().length > 15).length;
  score += reasons * 5;
  if (reasons < 2) concerns.push("Reasoning for one or both bounds is thin or missing.");
  else positives.push("Both time and space bounds come with reasoning.");

  if ((c.notes?.length ?? 0) >= 2) {
    score += 5;
    positives.push("Supporting notes explain the estimate.");
  }

  if (codeLines > 120) {
    score -= 12;
    concerns.push("Long snippet — static estimates get less reliable as code grows.");
  } else if (codeLines > 0 && codeLines <= 40) {
    score += 4;
  }

  score = Math.max(5, Math.min(98, Math.round(score)));
  const level = score >= 75 ? "high" : score >= 45 ? "medium" : "low";
  return {
    score,
    level,
    label: level === "high" ? "High confidence" : level === "medium" ? "Moderate confidence" : "Low confidence",
    color: level === "high" ? "#34d399" : level === "medium" ? "#fbbf24" : "#f87171",
    positives,
    concerns,
  };
}
