import { describe, it, expect } from "vitest";
import { validateWeeklyCfg, nextWeeklyStart, computeWeeklySchedule, type WeeklyCfg } from "@/lib/admin/weeklyContest";

const base: WeeklyCfg = { day: 0, hour_utc: 15, minute_utc: 0, problem_count: 4, duration_minutes: 120 };

describe("validateWeeklyCfg", () => {
  it("accepts a valid config", () => {
    expect(validateWeeklyCfg(base)).toBeNull();
  });

  describe("day", () => {
    it.each([-1, 7, 1.5, NaN])("rejects day=%s", (day) => {
      expect(validateWeeklyCfg({ ...base, day: day as number })).toBe("Day must be Sun–Sat.");
    });
    it.each([0, 3, 6])("accepts day=%s", (day) => {
      expect(validateWeeklyCfg({ ...base, day })).toBeNull();
    });
  });

  describe("hour_utc", () => {
    it.each([-1, 24, 1.5])("rejects hour_utc=%s", (h) => {
      expect(validateWeeklyCfg({ ...base, hour_utc: h })).toBe("Hour UTC must be 0–23.");
    });
  });

  describe("minute_utc", () => {
    it.each([-1, 60, 30.5])("rejects minute_utc=%s", (m) => {
      expect(validateWeeklyCfg({ ...base, minute_utc: m })).toBe("Minute UTC must be 0–59.");
    });
  });

  describe("problem_count", () => {
    it.each([1, 11, 4.5])("rejects problem_count=%s", (n) => {
      expect(validateWeeklyCfg({ ...base, problem_count: n })).toBe("Problem count must be 2–10.");
    });
    it.each([2, 4, 10])("accepts problem_count=%s", (n) => {
      expect(validateWeeklyCfg({ ...base, problem_count: n })).toBeNull();
    });
  });

  describe("duration_minutes", () => {
    it.each([15, 29, 481, 60.5])("rejects duration=%s", (d) => {
      expect(validateWeeklyCfg({ ...base, duration_minutes: d })).toBe("Duration must be 30–480 minutes.");
    });
    it("rejects non-multiple of 15", () => {
      for (const d of [46, 65, 97, 100]) {
        expect(validateWeeklyCfg({ ...base, duration_minutes: d })).toBe("Duration must be a multiple of 15 minutes.");
      }
    });

    it.each([30, 45, 120, 480])("accepts duration=%s", (d) => {
      expect(validateWeeklyCfg({ ...base, duration_minutes: d })).toBeNull();
    });
  });
});

describe("nextWeeklyStart", () => {
  it("moves to next week when target already passed today", () => {
    // Sunday 2026-01-04 at 16:00 UTC; target Sunday 15:00 → next Sunday
    const now = new Date("2026-01-04T16:00:00Z");
    const s = nextWeeklyStart(base, now);
    expect(s.toISOString()).toBe("2026-01-11T15:00:00.000Z");
  });

  it("returns today if target still in future today", () => {
    const now = new Date("2026-01-04T10:00:00Z"); // Sunday 10:00
    const s = nextWeeklyStart(base, now);
    expect(s.toISOString()).toBe("2026-01-04T15:00:00.000Z");
  });

  it("advances to the correct weekday", () => {
    // Mon 2026-01-05 → next Wed (day=3) at 09:30
    const now = new Date("2026-01-05T00:00:00Z");
    const s = nextWeeklyStart({ ...base, day: 3, hour_utc: 9, minute_utc: 30 }, now);
    expect(s.toISOString()).toBe("2026-01-07T09:30:00.000Z");
  });
});

describe("computeWeeklySchedule", () => {
  it("returns start/end/lock/registration window", () => {
    const now = new Date("2026-01-01T00:00:00Z"); // Thu
    const out = computeWeeklySchedule(base, now);
    expect(out.starts.toISOString()).toBe("2026-01-04T15:00:00.000Z");
    expect(out.ends.toISOString()).toBe("2026-01-04T17:00:00.000Z");
    expect(out.lockUntil).toEqual(out.starts);
    expect(out.registrationOpens.toISOString()).toBe("2025-12-28T15:00:00.000Z");
  });
});
