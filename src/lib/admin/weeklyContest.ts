export interface WeeklyCfg {
  day: number;
  hour_utc: number;
  minute_utc: number;
  problem_count: number;
  duration_minutes: number;
}

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function validateWeeklyCfg(v: WeeklyCfg): string | null {
  if (!Number.isInteger(v.day) || v.day < 0 || v.day > 6) return "Day must be Sun–Sat.";
  if (!Number.isInteger(v.hour_utc) || v.hour_utc < 0 || v.hour_utc > 23) return "Hour UTC must be 0–23.";
  if (!Number.isInteger(v.minute_utc) || v.minute_utc < 0 || v.minute_utc > 59) return "Minute UTC must be 0–59.";
  if (!Number.isInteger(v.problem_count) || v.problem_count < 2 || v.problem_count > 10) return "Problem count must be 2–10.";
  if (!Number.isInteger(v.duration_minutes) || v.duration_minutes < 30 || v.duration_minutes > 480) return "Duration must be 30–480 minutes.";
  if (v.duration_minutes % 15 !== 0) return "Duration must be a multiple of 15 minutes.";
  return null;
}

/** Compute the next UTC start Date matching the weekly config, relative to `now`. */
export function nextWeeklyStart(cfg: WeeklyCfg, now: Date = new Date()): Date {
  const candidate = new Date(now);
  const add = (cfg.day - candidate.getUTCDay() + 7) % 7;
  candidate.setUTCDate(candidate.getUTCDate() + add);
  candidate.setUTCHours(cfg.hour_utc, cfg.minute_utc, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setUTCDate(candidate.getUTCDate() + 7);
  }
  return candidate;
}

export function computeWeeklySchedule(cfg: WeeklyCfg, now: Date = new Date()) {
  const starts = nextWeeklyStart(cfg, now);
  const ends = new Date(starts.getTime() + cfg.duration_minutes * 60 * 1000);
  // Problems lock until start; registration opens a week before start.
  const lockUntil = starts;
  const registrationOpens = new Date(starts.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { starts, ends, lockUntil, registrationOpens };
}
