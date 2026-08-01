import { useCallback, useEffect, useState } from "react";

export interface TraceHistoryEntry {
  id: string;
  createdAt: string;
  title: string;
  language: string;
  code: string;
  /** Raw trace payload as returned by the code-trace function. */
  trace: unknown;
  stepCount: number;
}

const KEY = "parikshaa:visualize:code-history:v1";
const MAX = 20;
const EVT = "parikshaa:visualize:code-history";

const read = (): TraceHistoryEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (entries: TraceHistoryEntry[]) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* quota — ignore */
  }
};

export const titleFromCode = (code: string) => {
  const line =
    code
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#") && !l.startsWith("//")) ?? "Untitled run";
  return line.length > 52 ? `${line.slice(0, 52)}…` : line;
};

export function useTraceHistory() {
  const [entries, setEntries] = useState<TraceHistoryEntry[]>(() => read());

  useEffect(() => {
    const sync = () => setEntries(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EVT, sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVT, sync as EventListener);
    };
  }, []);

  const save = useCallback(
    (entry: Omit<TraceHistoryEntry, "id" | "createdAt">) => {
      const full: TraceHistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      };
      const next = [full, ...read().filter((e) => e.code !== entry.code)].slice(0, MAX);
      write(next);
      setEntries(next);
      return full;
    },
    [],
  );

  const remove = useCallback((id: string) => {
    const next = read().filter((e) => e.id !== id);
    write(next);
    setEntries(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setEntries([]);
  }, []);

  return { entries, save, remove, clear };
}
