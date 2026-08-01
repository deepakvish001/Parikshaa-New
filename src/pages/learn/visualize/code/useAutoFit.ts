import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Measures a container and returns the largest font size (px) at which the
 * described content still fits — so the code / variable callouts auto-zoom to
 * the viewport instead of forcing the user to scroll.
 */
export function useAutoFitFont(opts: {
  /** number of text rows the content needs */
  rows: number;
  /** longest line length in characters */
  cols: number;
  /** line-height multiplier */
  lineHeight?: number;
  /** monospace char width as a ratio of font size */
  charRatio?: number;
  min?: number;
  max?: number;
  /** vertical/horizontal chrome (padding, borders) in px */
  padY?: number;
  padX?: number;
  /** user multiplier (manual zoom) */
  zoom?: number;
  /** disable auto sizing and just use `max * zoom` */
  enabled?: boolean;
}) {
  const {
    rows,
    cols,
    lineHeight = 1.5,
    charRatio = 0.6,
    min = 9,
    max = 15,
    padY = 24,
    padX = 56,
    zoom = 1,
    enabled = true,
  } = opts;

  const ref = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setBox((prev) =>
      Math.abs(prev.w - r.width) < 1 && Math.abs(prev.h - r.height) < 1
        ? prev
        : { w: r.width, h: r.height },
    );
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  let fontSize = max;
  if (enabled && box.h > 0 && rows > 0) {
    const byHeight = (box.h - padY) / (rows * lineHeight);
    const byWidth = cols > 0 ? (box.w - padX) / (cols * charRatio) : max;
    fontSize = Math.min(max, byHeight, byWidth);
  }
  fontSize = Math.max(min, Math.min(max * 1.8, fontSize * zoom));

  const fs = Math.round(fontSize * 10) / 10;
  const lh = Math.round(fs * lineHeight * 10) / 10;

  return {
    ref,
    fontSize: fs,
    lineHeightPx: lh,
    /** apply directly — includes a smooth transition so the layout never jumps */
    style: {
      fontSize: `${fs}px`,
      lineHeight: `${lh}px`,
      transition:
        "font-size 260ms cubic-bezier(0.4, 0, 0.2, 1), line-height 260ms cubic-bezier(0.4, 0, 0.2, 1)",
    } as CSSProperties,
    remeasure: measure,
  };
}
