import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared chip primitive for /learn (and any future Parikshaa-branded page).
 *
 * Why this exists:
 *   Every interactive chip on /learn needs the same idle / hover / active /
 *   selected / focus-visible states so the orange→amber palette stays
 *   coherent and accessible. Instead of repeating ~6 utility classes per
 *   chip we lean on the `chip-parikshaa` + `focus-parikshaa` helpers
 *   defined in src/index.css. Selection is driven by `data-active` so
 *   keyboard/JS consumers can toggle visual state without recomputing
 *   className strings.
 *
 * Variants:
 *   - "solid"   (default) — filled chip used in toolbars and quick filters
 *   - "outline" — transparent body, only border + text; for low-density rails
 *   - "ghost"   — no border, hover reveals an amber tint; for inline actions
 *
 * Semantic tones (opt-in via `tone`, defaults to "brand"):
 *   The base/hover/active/selected/focus *behaviour* stays identical across
 *   tones — only the hue swaps. Use a semantic tone ONLY when the chip
 *   carries meaning that color alone would otherwise convey, and always
 *   pair it with an icon (WCAG 1.4.1):
 *     - "brand"     → amber + orange (default)
 *     - "completed" → emerald (pair with CheckCircle2)
 *     - "missed"    → rose (pair with AlertCircle)
 *     - "today"     → amber with extra ring emphasis
 *     - "future"    → orange (secondary brand)
 *
 * Accessibility:
 *   - When `as="button"` (default), gets `type="button"` and
 *     `aria-pressed={selected}` automatically.
 *   - `focus-parikshaa` provides a 2px amber-400/60 ring with a 1px
 *     background offset so keyboard-only users always see focus.
 */
export type ParikshaaChipVariant = "solid" | "outline" | "ghost";
export type ParikshaaChipTone =
  | "brand"
  | "completed"
  | "missed"
  | "today"
  | "future";

/**
 * Base layout / spacing / typography per variant — colour-agnostic so it
 * can be combined with any tone below.
 */
const VARIANT_LAYOUT: Record<ParikshaaChipVariant, string> = {
  solid:
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold antialiased transition-colors duration-200 focus-parikshaa",
  outline:
    "inline-flex items-center gap-1.5 rounded-full border bg-transparent px-2.5 py-1 text-[11px] font-semibold antialiased transition-colors duration-200 focus-parikshaa",
  ghost:
    "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-semibold antialiased transition-colors duration-200 focus-parikshaa",
};

/**
 * Tone × variant colour matrix. Each cell defines idle / hover / active /
 * data-[active=true] (selected). Behaviour is identical across tones; only
 * the hue family changes.
 */
const TONE: Record<ParikshaaChipTone, Record<ParikshaaChipVariant, string>> = {
  brand: {
    solid:
      "border-amber-400/30 bg-amber-500/5 text-amber-200/90 " +
      "hover:border-amber-400/60 hover:bg-amber-500/15 hover:text-amber-100 " +
      "active:bg-orange-500/25 active:text-orange-50 " +
      "data-[active=true]:border-amber-400/60 data-[active=true]:bg-gradient-to-r data-[active=true]:from-orange-500/25 data-[active=true]:to-amber-400/25 data-[active=true]:text-amber-50",
    outline:
      "border-amber-400/40 text-amber-200 " +
      "hover:border-amber-400/70 hover:bg-amber-500/10 hover:text-amber-100 " +
      "active:bg-orange-500/20 active:text-orange-50 " +
      "data-[active=true]:border-amber-400/70 data-[active=true]:bg-gradient-to-r data-[active=true]:from-orange-500/25 data-[active=true]:to-amber-400/25 data-[active=true]:text-amber-50",
    ghost:
      "text-muted-foreground " +
      "hover:text-amber-200 hover:bg-amber-500/10 hover:border-amber-400/30 " +
      "active:text-orange-100 active:bg-orange-500/15 " +
      "data-[active=true]:text-amber-100 data-[active=true]:bg-amber-500/15 data-[active=true]:border-amber-400/40",
  },
  completed: {
    solid:
      "border-emerald-400/50 bg-emerald-500/15 text-emerald-200 " +
      "hover:border-emerald-400/70 hover:bg-emerald-500/20 hover:text-emerald-100 " +
      "active:bg-emerald-500/30 active:text-emerald-50 " +
      "data-[active=true]:border-emerald-400/70 data-[active=true]:bg-emerald-500/25 data-[active=true]:text-emerald-50",
    outline:
      "border-emerald-400/50 text-emerald-200 " +
      "hover:border-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-100 " +
      "active:bg-emerald-500/20 active:text-emerald-50 " +
      "data-[active=true]:border-emerald-400/70 data-[active=true]:bg-emerald-500/20 data-[active=true]:text-emerald-50",
    ghost:
      "text-emerald-200/90 " +
      "hover:text-emerald-100 hover:bg-emerald-500/10 hover:border-emerald-400/30 " +
      "active:text-emerald-50 active:bg-emerald-500/15 " +
      "data-[active=true]:text-emerald-50 data-[active=true]:bg-emerald-500/15 data-[active=true]:border-emerald-400/40",
  },
  missed: {
    solid:
      "border-rose-400/50 bg-rose-500/15 text-rose-200 " +
      "hover:border-rose-400/70 hover:bg-rose-500/20 hover:text-rose-100 " +
      "active:bg-rose-500/30 active:text-rose-50 " +
      "data-[active=true]:border-rose-400/70 data-[active=true]:bg-rose-500/25 data-[active=true]:text-rose-50",
    outline:
      "border-rose-400/50 text-rose-200 " +
      "hover:border-rose-400/70 hover:bg-rose-500/10 hover:text-rose-100 " +
      "active:bg-rose-500/20 active:text-rose-50 " +
      "data-[active=true]:border-rose-400/70 data-[active=true]:bg-rose-500/20 data-[active=true]:text-rose-50",
    ghost:
      "text-rose-200/90 " +
      "hover:text-rose-100 hover:bg-rose-500/10 hover:border-rose-400/30 " +
      "active:text-rose-50 active:bg-rose-500/15 " +
      "data-[active=true]:text-rose-50 data-[active=true]:bg-rose-500/15 data-[active=true]:border-rose-400/40",
  },
  today: {
    // Same hue family as brand, but with stronger ring/border emphasis so
    // "today" reads as a more prominent state in date chips.
    solid:
      "border-amber-400/60 bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40 " +
      "hover:border-amber-400/80 hover:bg-amber-500/25 hover:text-amber-50 " +
      "active:bg-orange-500/30 active:text-orange-50 " +
      "data-[active=true]:border-amber-400/80 data-[active=true]:bg-gradient-to-r data-[active=true]:from-orange-500/30 data-[active=true]:to-amber-400/30 data-[active=true]:text-amber-50",
    outline:
      "border-amber-400/70 text-amber-100 ring-1 ring-amber-400/30 " +
      "hover:border-amber-400/90 hover:bg-amber-500/15 hover:text-amber-50 " +
      "active:bg-orange-500/20 active:text-orange-50 " +
      "data-[active=true]:border-amber-400/90 data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-50",
    ghost:
      "text-amber-100 " +
      "hover:text-amber-50 hover:bg-amber-500/15 hover:border-amber-400/40 " +
      "active:text-orange-50 active:bg-orange-500/20 " +
      "data-[active=true]:text-amber-50 data-[active=true]:bg-amber-500/20 data-[active=true]:border-amber-400/60",
  },
  future: {
    solid:
      "border-orange-400/40 bg-orange-500/10 text-orange-200 " +
      "hover:border-orange-400/70 hover:bg-orange-500/15 hover:text-orange-100 " +
      "active:bg-orange-500/25 active:text-orange-50 " +
      "data-[active=true]:border-orange-400/70 data-[active=true]:bg-orange-500/20 data-[active=true]:text-orange-50",
    outline:
      "border-orange-400/50 text-orange-200 " +
      "hover:border-orange-400/70 hover:bg-orange-500/10 hover:text-orange-100 " +
      "active:bg-orange-500/20 active:text-orange-50 " +
      "data-[active=true]:border-orange-400/70 data-[active=true]:bg-orange-500/15 data-[active=true]:text-orange-50",
    ghost:
      "text-orange-200/90 " +
      "hover:text-orange-100 hover:bg-orange-500/10 hover:border-orange-400/30 " +
      "active:text-orange-50 active:bg-orange-500/15 " +
      "data-[active=true]:text-orange-50 data-[active=true]:bg-orange-500/15 data-[active=true]:border-orange-400/40",
  },
};

type CommonProps = {
  variant?: ParikshaaChipVariant;
  tone?: ParikshaaChipTone;
  selected?: boolean;
  className?: string;
  children: React.ReactNode;
};



export type ParikshaaChipProps =
  | (CommonProps & {
      as?: "button";
    } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">)
  | (CommonProps & {
      as: "span";
    } & Omit<React.HTMLAttributes<HTMLSpanElement>, "className" | "children">);

/**
 * `data-active` is the single source of truth for the selected visual.
 * Toggle it from props (`selected`) or directly from a parent's keyboard
 * handler — both routes hit the same CSS.
 */
export const ParikshaaChip = React.forwardRef<HTMLElement, ParikshaaChipProps>(
  ({ variant = "solid", tone = "brand", selected = false, className, children, ...rest }, ref) => {
    const cls = cn(VARIANT_LAYOUT[variant], TONE[tone][variant], className);
    if ((rest as { as?: string }).as === "span") {
      const { as: _as, ...spanRest } = rest as { as: "span" } & React.HTMLAttributes<HTMLSpanElement>;
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          data-active={selected || undefined}
          className={cls}
          {...spanRest}
        >
          {children}
        </span>
      );
    }
    const { as: _as, type, ...btnRest } = rest as { as?: "button" } & React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type ?? "button"}
        aria-pressed={selected || undefined}
        data-active={selected || undefined}
        className={cls}
        {...btnRest}
      >
        {children}
      </button>
    );
  },
);
ParikshaaChip.displayName = "ParikshaaChip";

export default ParikshaaChip;
