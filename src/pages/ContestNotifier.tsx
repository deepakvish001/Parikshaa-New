import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { AlertTriangle, Bell, BellOff, BellRing, CalendarClock, CalendarPlus, ChevronLeft, ChevronRight, Download, ExternalLink, Filter, Info, Inbox, LayoutGrid, List as ListIcon, RefreshCw, RotateCcw, Search, Settings2, Star, Timer, Trash2, WifiOff, X } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/shell/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Contest {
  name: string;
  url: string;
  start_time: string;
  end_time: string;
  duration: string;
  site: string;
  in_24_hours: string;
  status: string;
}

interface CompeteApiContest {
  site: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  url: string;
}

const SITE_LABEL: Record<string, string> = {
  codeforces: "CodeForces",
  codechef: "CodeChef",
  leetcode: "LeetCode",
  atcoder: "AtCoder",
  hackerrank: "HackerRank",
  hackerearth: "HackerEarth",
  topcoder: "TopCoder",
  toph: "Toph",
  kaggle: "Kaggle",
  codewars: "Codewars",
  codingame: "CodinGame",
};

const ALL_PLATFORMS = [
  "LeetCode",
  "CodeChef",
  "CodeForces",
  "AtCoder",
  "HackerRank",
  "HackerEarth",
  "GeeksforGeeks",
  "Coding Ninjas",
  "TopCoder",
  "Kick Start",
  "Toph",
  "Kaggle",
  "Codewars",
  "CodinGame",
] as const;

type TimeFilter = "all" | "live" | "24h" | "upcoming" | "today" | "tomorrow" | "this_week" | "next_week" | "this_month" | "this_weekend" | "next_7d";
type ReminderLead = 10 | 60 | 1440; // minutes: 10m, 1h, 1d

type SortMode = "start_asc" | "start_desc" | "end_asc";
type DurationFilter = "any" | "short" | "medium" | "long";
type ViewMode = "list" | "calendar";

const REMINDERS_KEY = "contest-notifier:reminders";
const PLATFORMS_KEY = "contest-notifier:platforms";
const SORT_KEY = "contest-notifier:sort";
const DURATION_KEY = "contest-notifier:duration";
const REMINDER_ONLY_KEY = "contest-notifier:reminder-only";
const TZ_KEY = "contest-notifier:timezone";
const LEADS_KEY = "contest-notifier:leads";
const FAVORITES_KEY = "contest-notifier:favorites";
const VIEW_KEY = "contest-notifier:view";
const PLATFORM_LEADS_KEY = "contest-notifier:platform-leads";
const PAGE_SIZE = 20;


const COMMON_TIMEZONES = [
  "auto",
  "UTC",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Australia/Sydney",
] as const;


function loadReminders(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(REMINDERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function fmtCountdown(ms: number) {
  if (ms <= 0) return "Started";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`;
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

function gcalDate(iso: string) {
  // Google Calendar expects UTC in YYYYMMDDTHHMMSSZ
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

type IcsContest = { name: string; url: string; start_time: string; end_time: string; site: string; duration?: string };

/** Parse & validate contest times. Ensures end > start; falls back to duration or +2h. */
function safeContestRange(c: IcsContest): { start: Date; end: Date } | null {
  const start = new Date(c.start_time);
  if (isNaN(start.getTime())) return null;
  let end = new Date(c.end_time);
  if (isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    const durSec = Number(c.duration);
    const durMs = Number.isFinite(durSec) && durSec > 0 ? durSec * 1000 : 2 * 60 * 60 * 1000;
    end = new Date(start.getTime() + durMs);
  }
  return { start, end };
}

function gcalUrl(c: IcsContest) {
  const range = safeContestRange(c);
  if (!range) return c.url;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${c.site}: ${c.name}`,
    dates: `${gcalDate(range.start.toISOString())}/${gcalDate(range.end.toISOString())}`,
    details: `Platform: ${c.site}\nContest: ${c.name}\nLink: ${c.url}`,
    location: c.url,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const icsEsc = (s: string) => s.replace(/[\\,;]/g, (m) => "\\" + m).replace(/\r?\n/g, "\\n");

function leadTrigger(leadMin: number): string {
  const m = Math.max(0, Math.floor(leadMin));
  if (m === 0) return "TRIGGER:PT0M";
  if (m % 1440 === 0) return `TRIGGER:-P${m / 1440}D`;
  if (m % 60 === 0) return `TRIGGER:-PT${m / 60}H`;
  return `TRIGGER:-PT${m}M`;
}

function leadLabel(leadMin: number): string {
  if (leadMin >= 1440) return `${leadMin / 1440} day`;
  if (leadMin >= 60) return `${leadMin / 60} hour`;
  return `${leadMin} min`;
}

function buildVEvent(c: IcsContest, leadMin: number = 10): string[] {
  const range = safeContestRange(c);
  if (!range) return [];
  const uid = `${gcalDate(range.start.toISOString())}-${c.site.replace(/\s+/g, "")}-${Math.random().toString(36).slice(2, 8)}@parikshaa`;
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${gcalDate(new Date().toISOString())}`,
    `DTSTART:${gcalDate(range.start.toISOString())}`,
    `DTEND:${gcalDate(range.end.toISOString())}`,
    `SUMMARY:${icsEsc(`${c.site}: ${c.name}`)}`,
    `DESCRIPTION:${icsEsc(`Platform: ${c.site}\nContest: ${c.name}\nLink: ${c.url}`)}`,
    `URL:${c.url}`,
    `LOCATION:${icsEsc(c.url)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEsc(c.name)} starts in ${leadLabel(leadMin)}`,
    leadTrigger(leadMin),
    "END:VALARM",
    "END:VEVENT",
  ];
}

function buildIcs(
  entries: { contest: IcsContest; lead: number }[],
  tz: string,
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Parikshaa//Contest Notifier//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-TIMEZONE:${tz}`,
    `X-WR-CALNAME:Parikshaa Contests`,
    ...entries.flatMap((e) => buildVEvent(e.contest, e.lead)),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function saveIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadIcs(c: IcsContest, tz: string, lead: number = 10) {
  saveIcs(
    `${c.site.replace(/\s+/g, "_")}-${c.name.replace(/[^a-z0-9]+/gi, "_").slice(0, 60)}.ics`,
    buildIcs([{ contest: c, lead }], tz),
  );
}

function downloadIcsBulk(
  contests: IcsContest[],
  tz: string,
  leadFor: (c: IcsContest) => number = () => 10,
) {
  saveIcs(
    `parikshaa-contests-${new Date().toISOString().slice(0, 10)}.ics`,
    buildIcs(contests.map((c) => ({ contest: c, lead: leadFor(c) })), tz),
  );
}



export default function ContestNotifier() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [platforms, setPlatforms] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(PLATFORMS_KEY) || "null") || [...ALL_PLATFORMS];
    } catch {
      return [...ALL_PLATFORMS];
    }
  });
  const [sortMode, setSortMode] = useState<SortMode>(
    () => (localStorage.getItem(SORT_KEY) as SortMode) || "start_asc",
  );
  const [durationFilter, setDurationFilter] = useState<DurationFilter>(
    () => (localStorage.getItem(DURATION_KEY) as DurationFilter) || "any",
  );
  const [reminderOnly, setReminderOnly] = useState<boolean>(
    () => localStorage.getItem(REMINDER_ONLY_KEY) === "1",
  );
  const [timezone, setTimezone] = useState<string>(
    () => localStorage.getItem(TZ_KEY) || "auto",
  );
  const [leads, setLeads] = useState<Record<string, ReminderLead>>(() => {
    try { return JSON.parse(localStorage.getItem(LEADS_KEY) || "{}"); } catch { return {}; }
  });
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [search, setSearch] = useState<string>("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); } catch { return []; }
  });
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem(VIEW_KEY) as ViewMode) || "list",
  );
  const [calCursor, setCalCursor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [platformLeads, setPlatformLeads] = useState<Record<string, ReminderLead>>(() => {
    try { return JSON.parse(localStorage.getItem(PLATFORM_LEADS_KEY) || "{}"); } catch { return {}; }
  });
  const [detailContest, setDetailContest] = useState<Contest | null>(null);
  // Persist Filters panel open/closed state across refreshes.
  const [filtersOpen, setFiltersOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("contest-notifier:filters-open") === "1";
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "contest-notifier:filters-open",
        filtersOpen ? "1" : "0",
      );
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [filtersOpen]);


  const [reminders, setReminders] = useState<Record<string, boolean>>(loadReminders);
  const [source, setSource] = useState<string | null>(null);
  const [reminderMeta, setReminderMeta] = useState<Record<string, { name: string; site: string; url: string; start_time: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(REMINDERS_KEY + ":meta") || "{}"); } catch { return {}; }
  });
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const timeoutsRef = useRef<Record<string, number>>({});

  const fetchFromCompeteApi = async (): Promise<Contest[]> => {
    const res = await fetch("https://competeapi.vercel.app/contests/upcoming/");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw: CompeteApiContest[] = await res.json();
    return (Array.isArray(raw) ? raw : []).map((c) => ({
      name: c.title,
      url: c.url,
      start_time: new Date(c.startTime).toISOString(),
      end_time: new Date(c.endTime).toISOString(),
      duration: String(Math.round(c.duration / 1000)),
      site: SITE_LABEL[c.site?.toLowerCase()] || c.site || "Unknown",
      in_24_hours: "",
      status: "",
    }));
  };

  const fetchFromCodeforces = async (): Promise<Contest[]> => {
    const res = await fetch("https://codeforces.com/api/contest.list?gym=false");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json?.status !== "OK" || !Array.isArray(json.result)) throw new Error("Bad payload");
    return json.result
      .filter((c: any) => c.phase === "BEFORE")
      .map((c: any) => {
        const start = c.startTimeSeconds * 1000;
        return {
          name: c.name,
          url: `https://codeforces.com/contests/${c.id}`,
          start_time: new Date(start).toISOString(),
          end_time: new Date(start + c.durationSeconds * 1000).toISOString(),
          duration: String(c.durationSeconds),
          site: "CodeForces",
          in_24_hours: "",
          status: "",
        } satisfies Contest;
      });
  };

  const fetchContests = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSource(null);
    // Try primary, then fallback. Any fetch success (even empty) short-circuits.
    try {
      const primary = await fetchFromCompeteApi();
      if (primary.length > 0) {
        setContests(primary);
        setSource("competeapi.vercel.app");
        return;
      }
      // Empty response → try fallback for richer data
      try {
        const fb = await fetchFromCodeforces();
        setContests(fb);
        setSource("codeforces.com (fallback)");
      } catch {
        setContests(primary);
        setSource("competeapi.vercel.app");
      }
    } catch (primaryErr) {
      try {
        const fb = await fetchFromCodeforces();
        setContests(fb);
        setSource("codeforces.com (fallback)");
      } catch {
        setError("Couldn't reach any contests service. Check your connection or try again in a moment.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    localStorage.setItem(PLATFORMS_KEY, JSON.stringify(platforms));
  }, [platforms]);
  useEffect(() => { localStorage.setItem(SORT_KEY, sortMode); }, [sortMode]);
  useEffect(() => { localStorage.setItem(DURATION_KEY, durationFilter); }, [durationFilter]);
  useEffect(() => { localStorage.setItem(REMINDER_ONLY_KEY, reminderOnly ? "1" : "0"); }, [reminderOnly]);
  useEffect(() => { localStorage.setItem(TZ_KEY, timezone); }, [timezone]);
  useEffect(() => { localStorage.setItem(LEADS_KEY, JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem(VIEW_KEY, viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem(PLATFORM_LEADS_KEY, JSON.stringify(platformLeads)); }, [platformLeads]);

  const effectiveLead = useCallback(
    (c: { site: string; name: string; start_time: string }): ReminderLead => {
      const key = c.name + c.start_time;
      return (leads[key] ?? platformLeads[c.site] ?? 10) as ReminderLead;
    },
    [leads, platformLeads],
  );


  const resolvedTz = timezone === "auto"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : timezone;


  // Schedule reminders (per-contest lead time) for enabled contests.
  useEffect(() => {
    Object.values(timeoutsRef.current).forEach((id) => clearTimeout(id));
    timeoutsRef.current = {};
    Object.entries(reminders).forEach(([key, on]) => {
      if (!on) return;
      const meta = reminderMeta[key]
        || (() => {
          const c = contests.find((x) => (x.name + x.start_time) === key);
          return c ? { name: c.name, site: c.site, url: c.url, start_time: c.start_time } : null;
        })();
      if (!meta) return;
      const start = new Date(meta.start_time).getTime();
      const leadMin: ReminderLead = effectiveLead(meta as any);
      const fireAt = start - leadMin * 60 * 1000;
      const delay = fireAt - Date.now();
      if (delay <= 0 || delay > 2_147_000_000) return;
      const leadLabel = leadMin >= 1440 ? "1 day" : leadMin >= 60 ? `${leadMin / 60} hour` : `${leadMin} minutes`;
      const id = window.setTimeout(() => {
        toast.info(`⏰ ${meta.name} starts in ${leadLabel}`, { description: meta.site });
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Contest starting soon", { body: `${meta.name} · ${meta.site}` });
        }
      }, delay);
      timeoutsRef.current[key] = id;
    });
    return () => {
      Object.values(timeoutsRef.current).forEach((id) => clearTimeout(id));
    };
  }, [reminders, reminderMeta, contests, leads, platformLeads, effectiveLead]);


  const filtered = useMemo(() => {
    return contests
      .filter((c) => platforms.some((p) => c.site.toLowerCase().includes(p.toLowerCase())))
      .filter((c) => {
        const start = new Date(c.start_time).getTime();
        const end = new Date(c.end_time).getTime();
        if (timeFilter === "live") return start <= now && end >= now;
        if (timeFilter === "upcoming") return start > now;
        if (timeFilter === "24h") return start > now && start - now <= 24 * 3600 * 1000;
        if (timeFilter === "next_7d") return start > now && start - now <= 7 * 86400 * 1000;
        if (timeFilter === "today" || timeFilter === "tomorrow" ||
            timeFilter === "this_week" || timeFilter === "next_week" ||
            timeFilter === "this_month" || timeFilter === "this_weekend") {
          const nowD = new Date(now);
          const dayStart = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate()).getTime();
          const DAY = 86400 * 1000;
          let rangeStart = dayStart;
          let rangeEnd = dayStart + DAY;
          if (timeFilter === "tomorrow") { rangeStart = dayStart + DAY; rangeEnd = dayStart + 2 * DAY; }
          else if (timeFilter === "this_week") {
            const dow = (nowD.getDay() + 6) % 7;
            rangeStart = dayStart - dow * DAY;
            rangeEnd = rangeStart + 7 * DAY;
          } else if (timeFilter === "next_week") {
            const dow = (nowD.getDay() + 6) % 7;
            rangeStart = dayStart - dow * DAY + 7 * DAY;
            rangeEnd = rangeStart + 7 * DAY;
          } else if (timeFilter === "this_month") {
            rangeStart = new Date(nowD.getFullYear(), nowD.getMonth(), 1).getTime();
            rangeEnd = new Date(nowD.getFullYear(), nowD.getMonth() + 1, 1).getTime();
          } else if (timeFilter === "this_weekend") {
            // Sat 00:00 → Mon 00:00 of the current week
            const dow = (nowD.getDay() + 6) % 7; // 0=Mon..6=Sun
            const daysUntilSat = (5 - dow + 7) % 7; // 0 if today is Sat
            rangeStart = dayStart + daysUntilSat * DAY;
            rangeEnd = rangeStart + 2 * DAY;
            // If today is Sun, include today onwards
            if (dow === 6) { rangeStart = dayStart; rangeEnd = dayStart + DAY; }
          }
          return start >= rangeStart && start < rangeEnd;
        }
        return end >= now;
      })


      .filter((c) => {
        if (durationFilter === "any") return true;
        const mins = Number(c.duration) / 60;
        if (durationFilter === "short") return mins < 90;
        if (durationFilter === "medium") return mins >= 90 && mins <= 180;
        return mins > 180;
      })
      .filter((c) => {
        if (!reminderOnly) return true;
        return !!reminders[c.name + c.start_time];
      })
      .filter((c) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return c.name.toLowerCase().includes(q) || c.site.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const sa = new Date(a.start_time).getTime();
        const sb = new Date(b.start_time).getTime();
        const ea = new Date(a.end_time).getTime();
        const eb = new Date(b.end_time).getTime();
        if (sortMode === "start_desc") return sb - sa;
        if (sortMode === "end_asc") return ea - eb;
        return sa - sb;
      });
  }, [contests, platforms, timeFilter, now, durationFilter, reminderOnly, reminders, sortMode, search]);

  // Reset pagination whenever filters/sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [timeFilter, durationFilter, reminderOnly, sortMode, platforms, search]);

  const paginated = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const setLead = (key: string, lead: ReminderLead) => {
    setLeads((prev) => {
      const next = { ...prev, [key]: lead };
      localStorage.setItem(LEADS_KEY, JSON.stringify(next));
      return next;
    });
  };




  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const toggleFavorite = (p: string) => {
    setFavorites((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const orderedPlatforms = useMemo(() => {
    const favs = ALL_PLATFORMS.filter((p) => favorites.includes(p));
    const rest = ALL_PLATFORMS.filter((p) => !favorites.includes(p));
    return [...favs, ...rest];
  }, [favorites]);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") toast.success("Notifications enabled");
      else if (res === "denied") toast.error("Notifications blocked in browser settings");
    } catch {
      /* ignore */
    }
  };

  const persistReminders = (nextOn: Record<string, boolean>, nextMeta: typeof reminderMeta) => {
    setReminders(nextOn);
    setReminderMeta(nextMeta);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(nextOn));
    localStorage.setItem(REMINDERS_KEY + ":meta", JSON.stringify(nextMeta));
  };

  const toggleReminder = async (c: Contest) => {
    const key = c.name + c.start_time;
    const turningOn = !reminders[key];
    if (turningOn && typeof Notification !== "undefined" && Notification.permission === "default") {
      const res = await Notification.requestPermission().catch(() => "default" as NotificationPermission);
      setPermission(res);
    }
    const nextOn = { ...reminders, [key]: turningOn };
    const nextMeta = { ...reminderMeta };
    if (turningOn) nextMeta[key] = { name: c.name, site: c.site, url: c.url, start_time: c.start_time };
    else delete nextMeta[key];
    persistReminders(nextOn, nextMeta);
    toast.success(turningOn ? "Reminder set — 10 min before start" : "Reminder removed");
  };

  const removeReminder = (key: string) => {
    const nextOn = { ...reminders };
    delete nextOn[key];
    const nextMeta = { ...reminderMeta };
    delete nextMeta[key];
    persistReminders(nextOn, nextMeta);
    toast.success("Reminder removed");
  };

  const clearAllReminders = () => {
    persistReminders({}, {});
    toast.success("All reminders cleared");
  };

  const activeReminders = useMemo(() => {
    return Object.entries(reminders)
      .filter(([, on]) => on)
      .map(([key]) => ({ key, ...(reminderMeta[key] || {}) }))
      .filter((r) => r.start_time)
      .sort((a, b) => new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime());
  }, [reminders, reminderMeta]);

  return (
    <>
      <Helmet>
        <title>Contest Notifier — Track Coding Contests | Parikshaa</title>
        <meta name="description" content="Track upcoming LeetCode, Codeforces, CodeChef, AtCoder & more coding contests in one place. Set reminders 10 min before start." />
      </Helmet>

      <PageShell width="wide">
        {/* Hero — minimal: title + inline live counts */}
        <section className="pt-2 pb-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h1
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
            >
              Contest <span className="text-primary">Notifier</span>
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {contests.filter((c) => {
                  const s = new Date(c.start_time).getTime();
                  const e = new Date(c.end_time).getTime();
                  return s <= now && e >= now;
                }).length} live
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Timer className="h-3 w-3" />
                {contests.filter((c) => new Date(c.start_time).getTime() > now).length} upcoming
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
                <BellRing className="h-3 w-3 text-primary" />
                {activeReminders.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchContests}
                disabled={loading}
                className="h-7 rounded-full border-border/60 px-2.5"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </section>



        {/* Divider line like the home hero stats separator */}
        <div className="mx-auto max-w-5xl border-t border-border/40 mb-6" />

        {/* Controls row */}
        <div className="mb-6 flex flex-wrap items-center gap-2" id="contest-list">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contests or platforms…"
              className="w-full h-9 rounded-md border border-border/60 bg-background/60 pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="inline-flex items-center rounded-md border border-border/60 bg-background/60 p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={viewMode === "list"}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                viewMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={viewMode === "calendar"}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Calendar
            </button>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Reminders
                  {activeReminders.length > 0 && (
                    <span className="ml-2 rounded-full bg-primary/20 text-primary px-1.5 text-[10px] font-bold tabular-nums">
                      {activeReminders.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Scheduled reminders
                  </div>
                  {activeReminders.length > 0 && (
                    <button
                      onClick={clearAllReminders}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {activeReminders.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                      <BellOff className="h-5 w-5 mx-auto mb-2 opacity-60" />
                      No reminders yet. Tap the bell on any contest.
                    </div>
                  ) : (
                    activeReminders.map((r) => {
                      const start = new Date(r.start_time!).getTime();
                      const past = start < now;
                      return (
                        <div key={r.key} className="flex items-center gap-2 px-3 py-2 border-b border-border/40 last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{r.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {r.site} · {past ? "started" : fmtCountdown(start - now) + " to start"}
                            </div>
                          </div>
                          <button
                            onClick={() => removeReminder(r.key)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                            aria-label="Remove reminder"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (filtered.length === 0) { toast.error("No contests to export"); return; }
                downloadIcsBulk(filtered, resolvedTz, effectiveLead);
                toast.success(`Exported ${filtered.length} contest${filtered.length === 1 ? "" : "s"} to .ics`);
              }}
              disabled={loading || filtered.length === 0}
              title="Download all filtered contests as one .ics file"
            >
              <Download className="h-4 w-4 mr-2" />
              Export .ics
            </Button>
            <Button variant="outline" size="sm" onClick={fetchContests} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Notification permission banner */}
        {permission === "denied" && (
          <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-400 shrink-0" />
            <div className="flex-1 text-xs text-amber-200/90">
              <div className="font-semibold text-amber-300 mb-0.5">Notifications are blocked</div>
              Reminders will still show as in-app toasts, but system notifications are off.
              Enable them from your browser's site settings (usually the lock icon in the address bar) and reload.
            </div>
            <Button size="sm" variant="outline" onClick={requestPermission}>Retry</Button>
          </div>
        )}
        {permission === "default" && activeReminders.length > 0 && (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
            <Bell className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 text-xs text-foreground/90">
              Enable browser notifications so your reminders can ping you even when this tab isn't focused.
            </div>
            <Button size="sm" onClick={requestPermission}>Enable</Button>
          </div>
        )}

        {/* Filters */}
        {(() => {
          const platformsAllOn = platforms.length === ALL_PLATFORMS.length;
          const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
          if (search.trim()) activeChips.push({ key: "search", label: `“${search.trim()}”`, onRemove: () => setSearch("") });
          if (timeFilter !== "all") activeChips.push({ key: "time", label: `Time: ${timeFilter}`, onRemove: () => setTimeFilter("all") });
          if (durationFilter !== "any") activeChips.push({ key: "dur", label: `Duration: ${durationFilter}`, onRemove: () => setDurationFilter("any") });
          if (reminderOnly) activeChips.push({ key: "rem", label: "Reminders only", onRemove: () => setReminderOnly(false) });
          if (sortMode !== "start_asc") activeChips.push({ key: "sort", label: `Sort: ${sortMode}`, onRemove: () => setSortMode("start_asc") });
          if (!platformsAllOn) activeChips.push({ key: "plat", label: platforms.length === 0 ? "No platforms" : `${platforms.length} platforms`, onRemove: () => setPlatforms([...ALL_PLATFORMS]) });
          const clearAllFilters = () => {
            setSearch("");
            setTimeFilter("all");
            setDurationFilter("any");
            setReminderOnly(false);
            setSortMode("start_asc");
            setPlatforms([...ALL_PLATFORMS]);
          };
          return (
        <div className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="contest-filters-panel"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
              <span className="ml-1 text-[10px] normal-case tracking-normal text-muted-foreground/70">
                {filtered.length} shown
              </span>
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  filtersOpen && "rotate-90",
                )}
              />
            </button>
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {activeChips.map((c) => (
                  <span
                    key={c.key}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 pl-2 pr-0.5 py-0.5 text-[11px] font-medium text-amber-300"
                  >
                    <span className="truncate max-w-[140px]">{c.label}</span>
                    <button
                      type="button"
                      onClick={c.onRemove}
                      aria-label={`Remove ${c.label}`}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-amber-500/20"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-rose-300 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              filtersOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
            aria-hidden={!filtersOpen}
          >
            <div className="overflow-hidden min-h-0">
          <div id="contest-filters-panel" className="space-y-4 pt-1">
            {activeChips.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-border/60 text-muted-foreground hover:text-rose-300 hover:border-rose-500/40 transition-colors"
                >
                  <X className="h-3 w-3" /> Clear filters
                </button>
              </div>
            )}


          <div className="flex flex-wrap gap-2">
            {([
              { id: "all", label: "All" },
              { id: "live", label: "🔴 Live" },
              { id: "today", label: "Today" },
              { id: "tomorrow", label: "Tomorrow" },
              { id: "24h", label: "Within 24h" },
              { id: "next_7d", label: "Next 7 days" },
              { id: "this_weekend", label: "This weekend" },
              { id: "this_week", label: "This week" },
              { id: "next_week", label: "Next week" },
              { id: "this_month", label: "This month" },
              { id: "upcoming", label: "All upcoming" },

            ] as { id: TimeFilter; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeFilter(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  timeFilter === t.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>


          <div className="flex flex-wrap gap-2 items-center">
            {orderedPlatforms.map((p) => {
              const on = platforms.includes(p);
              const fav = favorites.includes(p);
              return (
                <div
                  key={p}
                  className={cn(
                    "group inline-flex items-center gap-1 rounded-full border pl-3 pr-1 py-1 text-xs font-medium transition-colors",
                    on
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <button onClick={() => togglePlatform(p)} className="outline-none">
                    {p}
                  </button>
                  <button
                    onClick={() => toggleFavorite(p)}
                    aria-label={fav ? `Unpin ${p}` : `Pin ${p} to top`}
                    title={fav ? "Unpin" : "Pin to top"}
                    className={cn(
                      "ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors",
                      fav ? "text-amber-400" : "text-muted-foreground/50 hover:text-amber-400",
                    )}
                  >
                    <Star className={cn("h-3 w-3", fav && "fill-current")} />
                  </button>
                </div>
              );
            })}
            <span className="mx-1 h-4 w-px bg-border/60" />
            <button
              onClick={() => setPlatforms([...ALL_PLATFORMS])}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              title="Select all platforms"
            >
              Select all
            </button>
            <button
              onClick={() => {
                if (favorites.length === 0) { toast.error("Pin a platform with ★ first"); return; }
                setPlatforms([...favorites]);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors"
              title="Show only pinned favorites"
            >
              <Star className="h-3 w-3 fill-current" /> Favorites
            </button>
            <button
              onClick={() => setPlatforms([])}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-border/60 text-muted-foreground hover:text-rose-300 hover:border-rose-500/40 transition-colors"
              title="Clear all platforms"
            >
              Clear all
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  title="Default reminder lead per platform"
                >
                  <Settings2 className="h-3 w-3" /> Default reminders
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Default lead per platform
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {ALL_PLATFORMS.map((p) => (
                    <div key={p} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate">{p}</span>
                      <select
                        value={String(platformLeads[p] ?? 10)}
                        onChange={(e) =>
                          setPlatformLeads((prev) => ({ ...prev, [p]: Number(e.target.value) as ReminderLead }))
                        }
                        className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="10">10 min before</option>
                        <option value="60">1 hour before</option>
                        <option value="1440">1 day before</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="pt-2 mt-2 border-t border-border/40 flex justify-end">
                  <button
                    onClick={() => { setPlatformLeads({}); toast.success("Defaults cleared"); }}
                    className="text-[11px] text-rose-400 hover:text-rose-300"
                  >
                    Reset defaults
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <button
              onClick={() => {
                setPlatforms([...ALL_PLATFORMS]);
                setTimeFilter("all");
                setDurationFilter("any");
                setReminderOnly(false);
                setSortMode("start_asc");
                setTimezone("auto");
                toast.success("Preferences reset to defaults");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              title="Reset all preferences"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>


          {/* Duration filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mr-1">
              Duration
            </span>
            {([
              { id: "any", label: "Any" },
              { id: "short", label: "< 90m" },
              { id: "medium", label: "90m–3h" },
              { id: "long", label: "> 3h" },
            ] as { id: DurationFilter; label: string }[]).map((d) => (
              <button
                key={d.id}
                onClick={() => setDurationFilter(d.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  durationFilter === d.id
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {d.label}
              </button>
            ))}
            <button
              onClick={() => setReminderOnly((v) => !v)}
              className={cn(
                "ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                reminderOnly
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={reminderOnly}
            >
              <BellRing className="h-3 w-3" />
              Reminders only
            </button>
          </div>

          {/* Sort + Timezone */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/40">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-widest text-[10px]">Sort</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="start_asc">Soonest start</option>
                <option value="start_desc">Latest start</option>
                <option value="end_asc">Soonest end</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-widest text-[10px]">Timezone</span>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 max-w-[220px]"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz === "auto" ? `Auto (${Intl.DateTimeFormat().resolvedOptions().timeZone})` : tz}
                  </option>
                ))}
              </select>
            </label>
            <span className="ml-auto text-[10px] text-muted-foreground/70 tabular-nums">
              {filtered.length} shown
            </span>
          </div>
          </div>
            </div>
          </div>
        </div>
          );
        })()}



        {/* List */}
        <div className="mt-6 space-y-3">
          {error && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <WifiOff className="h-8 w-8 text-rose-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-rose-200 mb-0.5">Couldn't load contests</div>
                <div className="text-xs text-rose-300/80">{error}</div>
              </div>
              <Button size="sm" variant="outline" onClick={fetchContests} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Try again
              </Button>
            </div>
          )}
          {loading && !contests.length && !error && (
            <div className="grid gap-3" aria-label="Loading contests" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/60 bg-card/40 p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-muted/60 animate-pulse" />
                    <div className="h-4 w-2/3 rounded bg-muted/60 animate-pulse" />
                    <div className="h-3 w-40 rounded bg-muted/40 animate-pulse" />
                  </div>
                  <div className="h-9 w-24 rounded-lg bg-muted/50 animate-pulse" />
                  <div className="h-9 w-9 rounded-md bg-muted/50 animate-pulse" />
                </div>
              ))}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
              <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
              <div className="text-base font-semibold text-foreground mb-1">No contests to show</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                {contests.length === 0
                  ? "The contest service returned no results right now — check back in a bit."
                  : "Nothing matches your current filters. Try selecting more platforms or widening the timeframe."}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="outline" onClick={() => { setTimeFilter("all"); setPlatforms([...ALL_PLATFORMS]); }}>
                  Reset filters
                </Button>
                <Button size="sm" onClick={fetchContests} disabled={loading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>
          )}

          {viewMode === "calendar" && !loading && !error && filtered.length > 0 && (() => {
            const year = calCursor.getFullYear();
            const month = calCursor.getMonth();
            const first = new Date(year, month, 1);
            const startDow = (first.getDay() + 6) % 7; // Mon=0
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells: (Date | null)[] = [];
            for (let i = 0; i < startDow; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
            while (cells.length % 7 !== 0) cells.push(null);
            const byDay = new Map<string, Contest[]>();
            filtered.forEach((c) => {
              const s = new Date(c.start_time);
              if (s.getFullYear() !== year || s.getMonth() !== month) return;
              const key = String(s.getDate());
              (byDay.get(key) || byDay.set(key, []).get(key)!)!.push(c);
            });
            const monthLabel = calCursor.toLocaleString(undefined, { month: "long", year: "numeric" });
            const today = new Date();
            const isToday = (d: Date) => d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
            return (
              <div className="rounded-2xl border border-border/60 bg-card/40 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setCalCursor(new Date(year, month - 1, 1))}
                    className="p-1.5 rounded-md border border-border/60 text-muted-foreground hover:text-foreground"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="text-sm font-semibold text-foreground">{monthLabel}</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const inMonth = filtered.filter((c) => {
                          const s = new Date(c.start_time);
                          return s.getFullYear() === year && s.getMonth() === month;
                        });
                        if (inMonth.length === 0) { toast.error("No contests in this month"); return; }
                        downloadIcsBulk(inMonth, resolvedTz, effectiveLead);
                        toast.success(`Exported ${inMonth.length} contest${inMonth.length === 1 ? "" : "s"} for ${monthLabel}`);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-primary hover:border-primary/40"
                      title="Export contests visible this month as .ics"
                    >
                      <Download className="h-3 w-3" /> Export month
                    </button>
                    <button
                      onClick={() => setCalCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
                      className="px-2 py-1 rounded-md border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setCalCursor(new Date(year, month + 1, 1))}
                      className="p-1.5 rounded-md border border-border/60 text-muted-foreground hover:text-foreground"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                    <div key={d} className="px-1 py-1 text-center">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} className="min-h-[72px] rounded-md bg-transparent" />;
                    const day = byDay.get(String(d.getDate())) || [];
                    return (
                      <div
                        key={i}
                        className={cn(
                          "min-h-[72px] rounded-md border p-1 flex flex-col gap-1 overflow-hidden",
                          isToday(d)
                            ? "border-primary/60 bg-primary/5"
                            : "border-border/50 bg-background/30",
                        )}
                      >
                        <div className={cn("text-[10px] font-semibold tabular-nums", isToday(d) ? "text-primary" : "text-muted-foreground")}>
                          {d.getDate()}
                        </div>
                        {day.slice(0, 3).map((c) => (
                          <a
                            key={c.name + c.start_time}
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            title={`${c.site}: ${c.name} — ${new Date(c.start_time).toLocaleString(undefined, { timeZone: resolvedTz, hour: "2-digit", minute: "2-digit" })}`}
                            className="truncate rounded bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 px-1 py-0.5 text-[10px] leading-tight"
                          >
                            {new Date(c.start_time).toLocaleTimeString(undefined, { timeZone: resolvedTz, hour: "2-digit", minute: "2-digit" })} {c.name}
                          </a>
                        ))}
                        {day.length > 3 && (
                          <div className="text-[10px] text-muted-foreground/80">+{day.length - 3} more</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {viewMode === "list" && paginated.map((c) => {
            const key = c.name + c.start_time;
            const start = new Date(c.start_time).getTime();
            const end = new Date(c.end_time).getTime();
            const isLive = start <= now && end >= now;
            const on = !!reminders[key];
            const durMin = Math.max(1, Math.round(Number(c.duration) / 60));
            const durLabel = durMin >= 60
              ? `${Math.floor(durMin / 60)}h${durMin % 60 ? ` ${durMin % 60}m` : ""}`
              : `${durMin}m`;
            const startDate = new Date(c.start_time);
            const endDate = new Date(c.end_time);
            const dateFmt = (opts: Intl.DateTimeFormatOptions) =>
              new Intl.DateTimeFormat(undefined, { timeZone: resolvedTz, ...opts });
            const dayNum = dateFmt({ day: "numeric" }).format(startDate);
            const monthShort = dateFmt({ month: "short" }).format(startDate);
            const weekdayShort = dateFmt({ weekday: "short" }).format(startDate);
            const dayLabel = dateFmt({ weekday: "short", month: "short", day: "numeric" }).format(startDate);
            const timeLabel = dateFmt({ hour: "numeric", minute: "2-digit" }).format(startDate);
            const endTimeLabel = dateFmt({ hour: "numeric", minute: "2-digit" }).format(endDate);
            const tzAbbr = dateFmt({ timeZoneName: "short" })
              .formatToParts(startDate)
              .find((p) => p.type === "timeZoneName")?.value || resolvedTz;
            const soon = !isLive && start - now < 24 * 3600 * 1000;
            const remaining = Math.max(0, isLive ? end - now : start - now);
            const currentLead: ReminderLead = effectiveLead(c);
            const leadOptions: { v: ReminderLead; l: string }[] = [
              { v: 10, l: "10m" },
              { v: 60, l: "1h" },
              { v: 1440, l: "1d" },
            ];

            return (
              <div
                key={key}
                className={cn(
                  "group relative rounded-2xl border p-3 sm:p-5 transition-colors",
                  isLive
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : soon
                      ? "border-primary/40 bg-primary/[0.04] hover:border-primary/60"
                      : "border-border/60 bg-card/40 hover:border-primary/40",
                )}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Left: date block */}
                  <div className="flex flex-col items-center justify-center shrink-0 rounded-xl border border-border/60 bg-background/60 px-2.5 sm:px-3 py-2 min-w-[58px] sm:min-w-[68px]">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-primary">{monthShort}</div>
                    <div className="text-xl sm:text-2xl font-bold tabular-nums leading-none text-foreground">{dayNum}</div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{weekdayShort}</div>
                  </div>

                  {/* Middle: meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold border-primary/40 text-primary bg-primary/10"
                      >
                        {c.site}
                      </Badge>
                      {isLive && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">
                          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE
                        </Badge>
                      )}
                      {soon && !isLive && (
                        <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/40 text-[10px]">
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                          Soon
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] border-border/60 text-muted-foreground bg-transparent">
                        <Timer className="h-2.5 w-2.5 mr-1" />
                        {durLabel}
                      </Badge>
                      {on && (
                        <Badge className="bg-primary/15 text-primary border border-primary/40 text-[10px]">
                          <BellRing className="h-2.5 w-2.5 mr-1" />
                          Reminder
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailContest(c)}
                        className="font-semibold text-sm sm:text-base text-foreground hover:text-primary text-left inline-flex items-start gap-1.5 leading-snug break-words"
                        title="View details"
                      >
                        <span className="line-clamp-2">{c.name}</span>
                        <Info className="h-3.5 w-3.5 mt-1 shrink-0 opacity-70 group-hover:opacity-100" />
                      </button>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 text-muted-foreground hover:text-primary"
                        aria-label="Open contest page"
                        title="Open contest page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <CalendarClock className="h-3 w-3 text-primary/80 shrink-0" />
                        <span className="truncate">
                          {dayLabel} · {timeLabel} <span className="text-muted-foreground/60">→</span> {endTimeLabel}
                        </span>
                      </span>
                      <span className="text-muted-foreground/60 text-[10px] whitespace-nowrap">{resolvedTz}</span>
                    </div>

                    {/* Mobile-only countdown + action row */}
                    <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
                      <div>
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                          {isLive ? "Ends in" : "Starts in"}
                          <span className="ml-1 text-muted-foreground/60 normal-case tracking-normal">· {tzAbbr}</span>
                        </div>
                        <div className={cn(
                          "text-sm font-bold tabular-nums",
                          isLive ? "text-emerald-400" : "text-primary",
                        )}>
                          {fmtCountdown(remaining)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={gcalUrl(c)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                          aria-label="Add to Google Calendar"
                          title="Add to Google Calendar"
                        >
                          <CalendarPlus className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadIcs(c, resolvedTz, currentLead)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                          aria-label="Download .ics"
                          title="Download .ics"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <Button
                          variant={on ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleReminder(c)}
                          aria-label={on ? "Remove reminder" : "Set reminder"}
                          className={cn("h-8", on && "bg-primary text-primary-foreground hover:bg-primary/90")}
                        >
                          {on ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>

                    {/* Per-contest lead selector, visible when reminder is on */}
                    {on && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Notify me
                        </span>
                        {leadOptions.map((opt) => (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => setLead(key, opt.v)}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors",
                              currentLead === opt.v
                                ? "bg-primary/20 text-primary border-primary/50"
                                : "border-border/60 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {opt.l} before
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: countdown + actions (sm+) */}
                  <div className="hidden sm:flex items-center gap-3 ml-auto shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {isLive ? "Ends in" : "Starts in"}
                      </div>
                      <div className={cn(
                        "text-base sm:text-lg font-bold tabular-nums whitespace-nowrap",
                        isLive ? "text-emerald-400" : "text-primary",
                      )}>
                        {fmtCountdown(remaining)}
                      </div>
                      <div className="text-[10px] text-muted-foreground/70 tabular-nums">
                        {tzAbbr}
                      </div>
                    </div>
                    <a
                      href={gcalUrl(c)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                      aria-label="Add to Google Calendar"
                      title="Add to Google Calendar"
                    >
                      <CalendarPlus className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadIcs(c, resolvedTz, currentLead)}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                      aria-label="Download .ics"
                      title="Download .ics file"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <Button
                      variant={on ? "default" : "outline"}
                      size="icon"
                      onClick={() => toggleReminder(c)}
                      aria-label={on ? "Remove reminder" : "Set reminder"}
                      title={on ? `Reminder set — ${currentLead >= 1440 ? "1 day" : currentLead >= 60 ? `${currentLead / 60}h` : `${currentLead}m`} before` : "Remind me before start"}
                      className={cn(on && "bg-primary text-primary-foreground hover:bg-primary/90")}
                    >
                      {on ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show more (pagination) */}
          {viewMode === "list" && filtered.length > paginated.length && (
            <div className="pt-2 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="rounded-full"
              >
                Show more ({filtered.length - paginated.length} more)
              </Button>
            </div>
          )}

        </div>

      </PageShell>

      <Dialog open={!!detailContest} onOpenChange={(o) => !o && setDetailContest(null)}>
        <DialogContent className="max-w-lg">
          {detailContest && (() => {
            const c = detailContest;
            const start = new Date(c.start_time).getTime();
            const end = new Date(c.end_time).getTime();
            const isLive = start <= now && end >= now;
            const remaining = Math.max(0, isLive ? end - now : start - now);
            const durMin = Math.max(1, Math.round(Number(c.duration) / 60));
            const durLabel = durMin >= 60
              ? `${Math.floor(durMin / 60)}h${durMin % 60 ? ` ${durMin % 60}m` : ""}`
              : `${durMin}m`;
            const fmt = new Intl.DateTimeFormat(undefined, {
              timeZone: resolvedTz, weekday: "short", month: "short", day: "numeric",
              hour: "numeric", minute: "2-digit", timeZoneName: "short",
            });
            const lead = effectiveLead(c);
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10">
                      {c.site}
                    </Badge>
                    {isLive && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] border-border/60 text-muted-foreground">
                      <Timer className="h-2.5 w-2.5 mr-1" /> {durLabel}
                    </Badge>
                  </div>
                  <DialogTitle className="text-left leading-snug">{c.name}</DialogTitle>
                  <DialogDescription className="text-left">
                    Contest hosted by <span className="text-foreground">{c.site}</span>. Register on the platform
                    before the contest starts and follow their standard rules for participation, scoring, and
                    plagiarism.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-1">
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      {isLive ? "Ends in" : "Starts in"}
                    </div>
                    <div className={cn("text-2xl font-bold tabular-nums", isLive ? "text-emerald-400" : "text-primary")}>
                      {fmtCountdown(remaining)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div><span className="text-foreground/80 font-medium">Start:</span> {fmt.format(new Date(c.start_time))}</div>
                    <div><span className="text-foreground/80 font-medium">End:</span> {fmt.format(new Date(c.end_time))}</div>
                    <div><span className="text-foreground/80 font-medium">Duration:</span> {durLabel}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                      Reminder lead (this contest)
                    </div>
                    <div role="radiogroup" aria-label="Reminder lead override" className="flex flex-wrap gap-1.5">
                      {([10, 60, 1440] as ReminderLead[]).map((v) => {
                        const key = c.name + c.start_time;
                        const isCustom = leads[key] === v;
                        const isActive = lead === v;
                        return (
                          <button
                            key={v}
                            role="radio"
                            aria-checked={isActive}
                            onClick={() =>
                              setLeads((prev) => ({ ...prev, [key]: v }))
                            }
                            className={cn(
                              "px-2.5 h-7 rounded-md border text-[11px] font-medium transition-colors",
                              isActive
                                ? "border-primary/60 bg-primary/15 text-primary"
                                : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border",
                            )}
                          >
                            {leadLabel(v)}{isCustom ? " ·" : ""}
                          </button>
                        );
                      })}
                      {leads[c.name + c.start_time] !== undefined && (
                        <button
                          onClick={() =>
                            setLeads((prev) => {
                              const next = { ...prev };
                              delete next[c.name + c.start_time];
                              return next;
                            })
                          }
                          className="px-2.5 h-7 rounded-md border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                          aria-label="Reset reminder lead to platform default"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Applies to alerts and single/bulk .ics exports. Current: {leadLabel(lead)} before start
                      {leads[c.name + c.start_time] === undefined ? " (platform default)" : " (overridden)"}.
                    </p>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadIcs(c, resolvedTz, lead)}>
                    <Download className="h-4 w-4 mr-1" /> .ics
                  </Button>
                  <a
                    href={gcalUrl(c)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-border/60 px-3 h-9 text-xs font-medium hover:border-primary/40 hover:text-primary"
                  >
                    <CalendarPlus className="h-4 w-4" /> Google Cal
                  </a>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-3 h-9 text-xs font-medium hover:bg-primary/90"
                  >
                    <ExternalLink className="h-4 w-4" /> Open contest
                  </a>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
