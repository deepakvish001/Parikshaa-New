import { useCallback, useEffect, useState } from "react";

const BASE_KEY = "parikshaa:coding-bookmarks";

const keyFor = (ns?: string) => (ns ? `${BASE_KEY}:${ns}` : BASE_KEY);

const read = (ns?: string): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(keyFor(ns));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const write = (s: Set<string>, ns?: string) => {
  try {
    localStorage.setItem(keyFor(ns), JSON.stringify(Array.from(s)));
    window.dispatchEvent(
      new CustomEvent("coding-bookmarks-changed", { detail: { ns: ns ?? null } }),
    );
  } catch {
    /* ignore */
  }
};

/**
 * Namespaced revision/bookmark store.
 * - `undefined` namespace = the shared library store (default).
 * - Pass "beginner" / "experienced" to keep roadmap revisions separate.
 */
export const useCodingProblemBookmarks = (namespace?: string) => {
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => read(namespace));

  useEffect(() => {
    setBookmarks(read(namespace));
    const sync = (e: Event) => {
      const detail = (e as CustomEvent).detail as { ns: string | null } | undefined;
      // Only refresh if this store's namespace changed (or storage event, which has no detail).
      if (!detail || detail.ns === (namespace ?? null)) {
        setBookmarks(read(namespace));
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === keyFor(namespace)) setBookmarks(read(namespace));
    };
    window.addEventListener("coding-bookmarks-changed", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("coding-bookmarks-changed", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [namespace]);

  const toggle = useCallback(
    (slug: string) => {
      setBookmarks((prev) => {
        const next = new Set(prev);
        if (next.has(slug)) next.delete(slug);
        else next.add(slug);
        write(next, namespace);
        return next;
      });
    },
    [namespace],
  );

  const isBookmarked = useCallback(
    (slug: string) => bookmarks.has(slug),
    [bookmarks],
  );

  return { bookmarks, toggle, isBookmarked, count: bookmarks.size };
};
