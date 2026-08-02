/**
 * Cache for code-trace results so unchanged code never re-hits the AI.
 * In-memory (instant) + localStorage (survives reloads), keyed by language + code hash.
 */

const KEY = "parikshaa:visualize:trace-cache:v1";
const MAX_ENTRIES = 40;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  key: string;
  value: unknown;
  savedAt: number;
}

const hash = (input: string): string => {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 + c, 2246822519) ^ (h2 >>> 13);
  }
  return `${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
};

export const traceCacheKey = (code: string, language: string): string =>
  `${language}:${code.length}:${hash(code)}`;

const memory = new Map<string, CacheEntry>();

const readDisk = (): CacheEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDisk = (entries: CacheEntry[]) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* quota — ignore */
  }
};

let hydrated = false;
const hydrate = () => {
  if (hydrated) return;
  hydrated = true;
  const now = Date.now();
  for (const e of readDisk()) {
    if (now - e.savedAt < TTL_MS) memory.set(e.key, e);
  }
};

export function getCachedTrace<T>(key: string): T | null {
  hydrate();
  const hit = memory.get(key);
  if (!hit) return null;
  if (Date.now() - hit.savedAt > TTL_MS) {
    memory.delete(key);
    return null;
  }
  return hit.value as T;
}

export function setCachedTrace<T>(key: string, value: T): T {
  hydrate();
  memory.set(key, { key, value, savedAt: Date.now() });
  const entries = [...memory.values()].sort((a, b) => b.savedAt - a.savedAt);
  memory.clear();
  for (const e of entries.slice(0, MAX_ENTRIES)) memory.set(e.key, e);
  writeDisk([...memory.values()]);
  return value;
}

export function clearTraceCache() {
  memory.clear();
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function traceCacheSize(): number {
  hydrate();
  return memory.size;
}

/* ---- debounce preference ---- */

const DEBOUNCE_KEY = "parikshaa:visualize:debounce-ms:v1";
export const DEBOUNCE_MIN = 200;
export const DEBOUNCE_MAX = 3000;
export const DEBOUNCE_DEFAULT = 900;

export const loadDebounceMs = (): number => {
  try {
    const raw = Number(window.localStorage.getItem(DEBOUNCE_KEY));
    if (Number.isFinite(raw) && raw >= DEBOUNCE_MIN && raw <= DEBOUNCE_MAX) return raw;
  } catch {
    /* ignore */
  }
  return DEBOUNCE_DEFAULT;
};

export const saveDebounceMs = (ms: number) => {
  try {
    window.localStorage.setItem(DEBOUNCE_KEY, String(ms));
  } catch {
    /* ignore */
  }
};
