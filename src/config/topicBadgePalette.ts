/**
 * Topic badge color palette + config.
 *
 * Change `TOPIC_PALETTE_MODE` to switch between:
 *   - "multicolor" — full 17-hue rainbow (default)
 *   - "brand"      — deep-black + amber/orange warm spectrum only
 *
 * `colorForTopic()` is deterministic: same topic string (case- and
 * whitespace-normalized) always maps to the same palette entry across
 * pagination, overflow popovers, and re-mounts. Empty / invalid input
 * falls back to a neutral zinc chip.
 *
 * A live preview UI is available at `/dev/topic-palette` (see
 * `TopicPalettePreview`) so you can eyeball hues + contrast whenever
 * you tweak this file.
 */

export type TopicPaletteMode = "multicolor" | "brand";

export interface TopicPaletteEntry {
  label: string;
  className: string;
}

/** Full rainbow — one entry per Tailwind hue, all readable on deep-black. */
export const MULTICOLOR_PALETTE: TopicPaletteEntry[] = [
  { label: "amber", className: "bg-amber-500/15 text-amber-200 border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-400/60" },
  { label: "orange", className: "bg-orange-500/15 text-orange-200 border-orange-500/30 hover:bg-orange-500/25 hover:border-orange-400/60" },
  { label: "yellow", className: "bg-yellow-500/15 text-yellow-100 border-yellow-500/30 hover:bg-yellow-500/25 hover:border-yellow-400/60" },
  { label: "lime", className: "bg-lime-500/15 text-lime-100 border-lime-500/30 hover:bg-lime-500/25 hover:border-lime-400/60" },
  { label: "green", className: "bg-green-500/15 text-green-200 border-green-500/30 hover:bg-green-500/25 hover:border-green-400/60" },
  { label: "emerald", className: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400/60" },
  { label: "teal", className: "bg-teal-500/15 text-teal-200 border-teal-500/30 hover:bg-teal-500/25 hover:border-teal-400/60" },
  { label: "cyan", className: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30 hover:bg-cyan-500/25 hover:border-cyan-400/60" },
  { label: "sky", className: "bg-sky-500/15 text-sky-200 border-sky-500/30 hover:bg-sky-500/25 hover:border-sky-400/60" },
  { label: "blue", className: "bg-blue-500/15 text-blue-200 border-blue-500/30 hover:bg-blue-500/25 hover:border-blue-400/60" },
  { label: "indigo", className: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30 hover:bg-indigo-500/25 hover:border-indigo-400/60" },
  { label: "violet", className: "bg-violet-500/15 text-violet-200 border-violet-500/30 hover:bg-violet-500/25 hover:border-violet-400/60" },
  { label: "purple", className: "bg-purple-500/15 text-purple-200 border-purple-500/30 hover:bg-purple-500/25 hover:border-purple-400/60" },
  { label: "fuchsia", className: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30 hover:bg-fuchsia-500/25 hover:border-fuchsia-400/60" },
  { label: "pink", className: "bg-pink-500/15 text-pink-200 border-pink-500/30 hover:bg-pink-500/25 hover:border-pink-400/60" },
  { label: "rose", className: "bg-rose-500/15 text-rose-200 border-rose-500/30 hover:bg-rose-500/25 hover:border-rose-400/60" },
  { label: "red", className: "bg-red-500/15 text-red-200 border-red-500/30 hover:bg-red-500/25 hover:border-red-400/60" },
];

/** Warm brand-matched palette (amber/orange spectrum). */
export const BRAND_PALETTE: TopicPaletteEntry[] = [
  { label: "amber", className: "bg-amber-500/15 text-amber-200 border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-400/60" },
  { label: "orange", className: "bg-orange-500/15 text-orange-200 border-orange-500/30 hover:bg-orange-500/25 hover:border-orange-400/60" },
  { label: "yellow", className: "bg-yellow-500/15 text-yellow-100 border-yellow-500/30 hover:bg-yellow-500/25 hover:border-yellow-400/60" },
  { label: "red", className: "bg-red-500/15 text-red-200 border-red-500/30 hover:bg-red-500/25 hover:border-red-400/60" },
  { label: "rose", className: "bg-rose-500/15 text-rose-200 border-rose-500/30 hover:bg-rose-500/25 hover:border-rose-400/60" },
  { label: "amber-soft", className: "bg-amber-400/15 text-amber-100 border-amber-400/30 hover:bg-amber-400/25 hover:border-amber-300/60" },
];

/** Flip this to swap the site-wide topic chip look. */
export const TOPIC_PALETTE_MODE = "multicolor" as TopicPaletteMode;

export const TOPIC_PALETTE: TopicPaletteEntry[] =
  TOPIC_PALETTE_MODE === "brand" ? BRAND_PALETTE : MULTICOLOR_PALETTE;

export const TOPIC_FALLBACK_CLASSNAME =
  "bg-zinc-500/15 text-zinc-200 border-zinc-500/30 hover:bg-zinc-500/25 hover:border-zinc-400/60";

/** Deterministic FNV-1a hash → palette index. Exported for tests. */
export const hashTopic = (topic: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < topic.length; i++) {
    h ^= topic.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const colorForTopic = (
  topic: string | null | undefined,
  palette: TopicPaletteEntry[] = TOPIC_PALETTE,
): string => {
  if (!topic || typeof topic !== "string") return TOPIC_FALLBACK_CLASSNAME;
  const key = topic.trim().toLowerCase();
  if (!key) return TOPIC_FALLBACK_CLASSNAME;
  return palette[hashTopic(key) % palette.length].className;
};

export const TOPIC_BADGE_BASE_CLASSNAME =
  "text-xs font-medium rounded-full px-2 py-0.5 border transition-all duration-200 " +
  "hover:-translate-y-0.5 hover:shadow-sm motion-reduce:hover:transform-none motion-reduce:transition-none";
