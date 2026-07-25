import { useEffect, useState, useCallback } from "react";

const KEY = "parikshaa:visualize:favorites:v1";

const read = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const write = (ids: string[]) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("parikshaa:visualize:favorites"));
  } catch {
    /* ignore */
  }
};

export function useVisualizeFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => read());

  useEffect(() => {
    const sync = () => setFavorites(read());
    window.addEventListener("storage", sync);
    window.addEventListener("parikshaa:visualize:favorites", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(
        "parikshaa:visualize:favorites",
        sync as EventListener,
      );
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    write(next);
    setFavorites(next);
    return next.includes(id);
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  return { favorites, toggle, isFavorite };
}
