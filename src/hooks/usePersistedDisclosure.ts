import { useEffect, useState } from "react";

/**
 * Open/closed state that survives navigation away and back.
 * Pass a stable `key` (null disables persistence).
 */
export function usePersistedDisclosure(key: string | null, initial = false) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (!key || typeof window === "undefined") return initial;
    try {
      const v = window.sessionStorage.getItem(key);
      if (v === "1") return true;
      if (v === "0") return false;
    } catch {
      /* storage unavailable */
    }
    return initial;
  });

  useEffect(() => {
    if (!key || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(key, isOpen ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, [key, isOpen]);

  return [isOpen, setIsOpen] as const;
}
