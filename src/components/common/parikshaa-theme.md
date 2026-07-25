# Parikshaa Theme — Quick Reference

The Parikshaa brand palette is the **orange → amber** combo lifted from
the logo. Every chip, button, ring, card border, and gradient on `/learn`
(and any future Parikshaa-branded page) must stay inside this combo.

> Memory file: `mem://design/parikshaa-brand-palette`
> Brand chip legend / scrollable strip: `mem://design/brand-chip-legend`
> Icon button standard: `mem://design/action-icon`

## 1. CSS Tokens (src/index.css)

Defined on `:root` (light) and overridden where needed in `.dark`.

| Token                          | Purpose                                  | Value (light)        |
| ------------------------------ | ---------------------------------------- | -------------------- |
| `--parikshaa-orange-strong`    | Primary orange (`orange-500`)            | `24 95% 53%`         |
| `--parikshaa-orange`           | Soft orange (`orange-400`)               | `27 96% 61%`         |
| `--parikshaa-amber`            | Primary amber (`amber-400`)              | `43 96% 56%`         |
| `--parikshaa-amber-soft`       | `amber-300`                              | `46 97% 65%`         |
| `--parikshaa-amber-mist`       | `amber-200`                              | `48 96% 76%`         |
| `--parikshaa-gradient`         | Full-saturation orange → amber           | linear-gradient(135°)|
| `--parikshaa-gradient-soft`    | 90/70% opacity variant                   | linear-gradient(135°)|
| `--parikshaa-gradient-mist`    | 25/18% opacity variant for surfaces      | linear-gradient(135°)|
| `--parikshaa-ring`             | Standard ring color                      | `amber-400/55`       |
| `--parikshaa-shadow`           | Card / chip elevation shadow             | orange-tinted        |
| `--parikshaa-shadow-glow`      | Active state glow                        | amber-tinted         |

## 2. Helper Classes (src/index.css `@layer components`)

| Class                          | Use it for                                              |
| ------------------------------ | ------------------------------------------------------- |
| `bg-parikshaa-gradient`        | Hero / nav-card backgrounds (full saturation)           |
| `bg-parikshaa-gradient-soft`   | Section banners, prominent CTAs                         |
| `bg-parikshaa-gradient-mist`   | Subtle tinted surfaces (callouts, empty states)         |
| `text-parikshaa-gradient`      | Gradient headline text                                  |
| `ring-parikshaa`               | 1px amber ring (replaces `ring-1 ring-amber-400/55`)    |
| `shadow-parikshaa`             | Brand-tinted card shadow                                |
| `shadow-parikshaa-glow`        | Active / hover glow                                     |
| `focus-parikshaa`              | **Standard keyboard focus ring — use on every chip/icon button** |
| `chip-parikshaa`               | Base interactive chip (idle/hover/active/focus baked in); selected via `data-active="true"` |

`focus-parikshaa` expands to:
`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background`

## 3. Shared Components

### `ActionIcon` — every icon-only control
`@/components/common/ActionIcon`. Tooltip + `aria-label` required. Focus
ring is `focus-parikshaa`. See its companion doc `ActionIcon.md`.

### `ParikshaaChip` — every interactive chip
`@/components/common/ParikshaaChip`. Variants: `solid` (default),
`outline`, `ghost`. Selection driven by the `selected` prop, which
sets both `data-active` and `aria-pressed`:

```tsx
import { ParikshaaChip } from "@/components/common/ParikshaaChip";

<ParikshaaChip selected={filter === "today"} onClick={() => setFilter("today")}>
  Starts today
</ParikshaaChip>

// Non-interactive label (e.g. inside a task row)
<ParikshaaChip as="span" variant="ghost" selected>
  Recurring
</ParikshaaChip>
```

State map (all variants):

| State        | Visual                                                |
| ------------ | ----------------------------------------------------- |
| Idle         | `amber-400/30` border, `amber-500/5` fill, `amber-200/90` text |
| Hover        | `amber-400/60` border, `amber-500/15` fill, `amber-100` text   |
| Active (mouse press) | `orange-500/25` fill, `orange-50` text         |
| Selected (`data-active="true"`) | `orange-500/25 → amber-400/25` gradient, `amber-50` text, `amber-400/45` ring |
| Focus-visible | `amber-400/60` ring with 1px background offset       |

## 4. Rules

1. **Never** add new chips/buttons with non-brand hues (sky, violet, teal,
   fuchsia, indigo, cyan, pink, purple, yellow). Migrate legacy
   occurrences to amber/orange when you touch the file.
2. Semantic state colors (`emerald` for success, `rose` for destructive)
   are allowed **only** with an accompanying icon (`CheckCircle2`,
   `AlertCircle`, `Trash2`) so meaning is never color-only — WCAG 1.4.1.
3. Prefer helper classes over hard-coded utilities. Reach for raw
   `amber-*` / `orange-*` Tailwind shades only when a helper does not
   cover the case.
4. Every interactive element on `/learn` must show a visible focus ring
   via `focus-parikshaa` (or via `ActionIcon` / `ParikshaaChip`, which
   already include it).
5. WCAG contrast checked on dark surfaces (`hsl(0 0% 4–7%)`):
   `amber-100` ~15:1, `amber-200` ~13:1, `amber-300` ~11:1,
   `orange-300` ~9:1, active chip text (`amber-50` on
   `from-orange-500/25 to-amber-400/25`) ≥7:1 — all AAA. Do not drop
   chip body text below `amber-300`.
