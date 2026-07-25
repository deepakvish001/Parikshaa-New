import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "parikshaa:coding-problem-notes:v1";
const CHANGE_EVENT = "parikshaa:coding-problem-notes:changed";
const VERSIONS_KEY = "parikshaa:coding-problem-notes-versions:v1";
const VERSIONS_EVENT = "parikshaa:coding-problem-notes-versions:changed";
const MAX_VERSIONS = 10;

export type NoteSaveStatus = "idle" | "saving" | "saved" | "error";
export interface NoteVersion {
  value: string;
  at: number;
}

const readMap = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

const writeMap = (map: Record<string, string>, changedSlug?: string): boolean => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(CHANGE_EVENT, { detail: { slug: changedSlug } }),
      );
    }
    return true;
  } catch {
    return false;
  }
};

const readVersionsMap = (): Record<string, NoteVersion[]> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(VERSIONS_KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

const writeVersionsMap = (map: Record<string, NoteVersion[]>, slug?: string) => {
  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(map));
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(VERSIONS_EVENT, { detail: { slug } }),
      );
    }
  } catch {
    /* ignore */
  }
};

const pushVersion = (slug: string, value: string) => {
  const map = readVersionsMap();
  const list = map[slug] ? [...map[slug]] : [];
  // Skip if identical to the most recent version.
  if (list.length > 0 && list[0].value === value) return;
  list.unshift({ value, at: Date.now() });
  map[slug] = list.slice(0, MAX_VERSIONS);
  writeVersionsMap(map, slug);
};

/**
 * Local-only personal markdown notes per problem slug. Autosaves with a
 * 700ms debounce and keeps the last 10 saved versions per slug. Same-tab
 * writes broadcast a custom event and cross-tab writes fire the native
 * `storage` event, so every mounted instance stays in sync in real time.
 */
export const useProblemNotes = (slug: string | undefined) => {
  const [note, setNote] = useState<string>(() =>
    slug ? readMap()[slug] ?? "" : "",
  );
  const [savedAt, setSavedAt] = useState<number | null>(() => (note ? Date.now() : null));
  const [status, setStatus] = useState<NoteSaveStatus>("idle");
  const [versions, setVersions] = useState<NoteVersion[]>(() =>
    slug ? readVersionsMap()[slug] ?? [] : [],
  );
  const debounceRef = useRef<number | null>(null);
  const statusResetRef = useRef<number | null>(null);
  const lastWrittenRef = useRef<string>(note);
  const pendingValueRef = useRef<string | null>(null);

  const reload = useCallback(() => {
    if (!slug) {
      setNote("");
      setSavedAt(null);
      setVersions([]);
      return;
    }
    const v = readMap()[slug] ?? "";
    lastWrittenRef.current = v;
    setNote(v);
    setSavedAt(v ? Date.now() : null);
    setVersions(readVersionsMap()[slug] ?? []);
  }, [slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Cross-tab + cross-component sync (notes + versions).
  useEffect(() => {
    if (!slug || typeof window === "undefined") return;
    const syncNote = () => {
      const v = readMap()[slug] ?? "";
      if (v !== lastWrittenRef.current) {
        lastWrittenRef.current = v;
        setNote(v);
        setSavedAt(v ? Date.now() : null);
      }
    };
    const syncVersions = () => setVersions(readVersionsMap()[slug] ?? []);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) syncNote();
      if (e.key === VERSIONS_KEY) syncVersions();
    };
    const onNoteChange = (e: Event) => {
      const detail = (e as CustomEvent<{ slug?: string }>).detail;
      if (detail?.slug && detail.slug !== slug) return;
      syncNote();
    };
    const onVersionsChange = (e: Event) => {
      const detail = (e as CustomEvent<{ slug?: string }>).detail;
      if (detail?.slug && detail.slug !== slug) return;
      syncVersions();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onNoteChange as EventListener);
    window.addEventListener(VERSIONS_EVENT, onVersionsChange as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onNoteChange as EventListener);
      window.removeEventListener(VERSIONS_EVENT, onVersionsChange as EventListener);
    };
  }, [slug]);

  const flashSaved = useCallback(() => {
    setStatus("saved");
    if (statusResetRef.current) window.clearTimeout(statusResetRef.current);
    statusResetRef.current = window.setTimeout(() => setStatus("idle"), 1500);
  }, []);

  const commit = useCallback(
    (value: string): boolean => {
      if (!slug) return false;
      const map = readMap();
      if (value) map[slug] = value;
      else delete map[slug];
      const ok = writeMap(map, slug);
      if (!ok) {
        pendingValueRef.current = value;
        setStatus("error");
        return false;
      }
      lastWrittenRef.current = value;
      pendingValueRef.current = null;
      setSavedAt(Date.now());
      if (value) pushVersion(slug, value);
      setVersions(readVersionsMap()[slug] ?? []);
      flashSaved();
      return true;
    },
    [slug, flashSaved],
  );

  const update = useCallback(
    (value: string) => {
      setNote(value);
      if (!slug) return;
      setStatus("saving");
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        commit(value);
      }, 700);
    },
    [slug, commit],
  );

  const retry = useCallback((): boolean => {
    if (pendingValueRef.current == null) return true;
    return commit(pendingValueRef.current);
  }, [commit]);

  const clear = useCallback(() => {
    if (!slug) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    // Snapshot the pre-clear value so it can be restored from history.
    const map = readMap();
    const previous = map[slug] ?? "";
    if (previous) pushVersion(slug, previous);
    setNote("");
    delete map[slug];
    lastWrittenRef.current = "";
    writeMap(map, slug);
    setSavedAt(null);
    setVersions(readVersionsMap()[slug] ?? []);
    setStatus("idle");
  }, [slug]);

  const restoreVersion = useCallback(
    (index: number) => {
      if (!slug) return;
      const list = readVersionsMap()[slug] ?? [];
      const entry = list[index];
      if (!entry) return;
      update(entry.value);
    },
    [slug, update],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (statusResetRef.current) window.clearTimeout(statusResetRef.current);
    },
    [],
  );

  return {
    note,
    setNote: update,
    clear,
    savedAt,
    status,
    versions,
    restoreVersion,
    retry,
  };
};

/** Read all notes (used by list page search). */
export const readAllProblemNotes = (): Record<string, string> => readMap();
