import { useCallback, useEffect, useState } from "react";

/**
 * Local, per-device manual overrides for a coding problem's status.
 * Lets users click the status square to mark a problem as
 * solved / attempted / not started without submitting code. Applied
 * on top of the derived status from `code_submissions`.
 */
export type ManualStatus = "solved" | "attempted" | "none";

const KEY = "parikshaa:coding-manual-status:v1";
const EVT = "parikshaa:coding-manual-status:changed";

const read = (): Record<string, "solved" | "attempted"> => {
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

const write = (map: Record<string, "solved" | "attempted">) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVT));
    }
  } catch {
    /* ignore */
  }
};

export const useManualProblemStatuses = () => {
  const [map, setMap] = useState<Record<string, "solved" | "attempted">>(() => read());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setMap(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVT, sync as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVT, sync as EventListener);
    };
  }, []);

  const setStatus = useCallback((slug: string, next: ManualStatus) => {
    const cur = read();
    if (next === "none") delete cur[slug];
    else cur[slug] = next;
    write(cur);
    setMap({ ...cur });
  }, []);

  const cycle = useCallback(
    (slug: string, current: ManualStatus): ManualStatus => {
      const next: ManualStatus =
        current === "none" ? "attempted" : current === "attempted" ? "solved" : "none";
      setStatus(slug, next);
      return next;
    },
    [setStatus],
  );

  return { manual: map, setStatus, cycle };
};
