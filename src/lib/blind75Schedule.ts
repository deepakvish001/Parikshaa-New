import { parseEstMinutes } from "@/components/sheets/Blind75StudyPlan";

interface BucketableTopic {
  id: string;
  estTime?: string;
}

export interface ScheduleResult<T extends BucketableTopic> {
  buckets: T[][];
  loadsMin: number[];
  /** true when weeks > 0 && hoursPerWeek > 0 */
  scheduled: boolean;
  /** true when weeks > 0 but hoursPerWeek === 0 (round-robin layout, no weekly budget) */
  paused: boolean;
}

/**
 * Bucket topics into N weeks using a greedy first-fit by est-time.
 * Edge cases:
 *  - weeks <= 0 → returns single bucket containing ALL topics (so totals stay correct elsewhere)
 *    but `buckets` is exposed as empty and `scheduled=false` for UIs that want an empty state.
 *  - hoursPerWeek <= 0 → distributes round-robin across weeks; `paused=true`.
 */
export function bucketByWeeks<T extends BucketableTopic>(
  topics: T[],
  weeks: number,
  hoursPerWeek: number
): ScheduleResult<T> {
  const w = Math.max(0, Math.floor(weeks));
  const h = Math.max(0, Math.floor(hoursPerWeek));

  if (w === 0) {
    return { buckets: [], loadsMin: [], scheduled: false, paused: false };
  }

  const buckets: T[][] = Array.from({ length: w }, () => []);
  const loads = new Array(w).fill(0);

  if (h === 0) {
    // Round-robin so user still sees a distribution
    topics.forEach((it, i) => {
      const idx = i % w;
      buckets[idx].push(it);
      loads[idx] += parseEstMinutes(it.estTime);
    });
    return { buckets, loadsMin: loads, scheduled: false, paused: true };
  }

  const budget = h * 60;
  topics.forEach((it) => {
    const t = parseEstMinutes(it.estTime);
    let idx = buckets.findIndex((_, i) => loads[i] + t <= budget);
    if (idx === -1) idx = loads.indexOf(Math.min(...loads));
    buckets[idx].push(it);
    loads[idx] += t;
  });

  return { buckets, loadsMin: loads, scheduled: true, paused: false };
}

/**
 * Compute ETA given total needed minutes and chosen pace.
 * Returns null when not computable (hours=0).
 */
export function computeEtaWeeks(neededMinutes: number, hoursPerWeek: number): number | null {
  if (hoursPerWeek <= 0) return null;
  if (neededMinutes <= 0) return 0;
  return Math.ceil(neededMinutes / (hoursPerWeek * 60));
}
