# ActionIcon — Icon button styling guide

Use `<ActionIcon>` for **every** icon-only button across the app so spacing,
hover/active states, focus rings and a11y stay consistent.

```tsx
import { ActionIcon } from "@/components/common/ActionIcon";
import { Plus } from "lucide-react";

<ActionIcon
  icon={Plus}
  label="Add task"        // required — used for aria-label + fallback tooltip
  tooltip="Add task"      // optional — visible hint on hover/focus
  tone="amber"            // default | amber | rose | violet | sky | emerald
  size={8}                // 7 | 8 | 9 | 10 (tw units, square)
  iconSize={4}            // 3.5 | 4 | 5
  active={isOpen}         // toggles the "active" palette + aria-pressed
  onClick={...}
/>
```

## Defaults & rules

| Concern        | Default                                                                 |
|----------------|-------------------------------------------------------------------------|
| Size           | `h-8 w-8`, `rounded-full`, 1px border                                   |
| Icon size      | `h-4 w-4`                                                               |
| Hover          | Lifted bg + border in the chosen tone                                   |
| Active state   | `aria-pressed=true` + accent palette                                    |
| Focus ring     | Amber `ring-2` with offset — never remove                               |
| Press feedback | `active:scale-95`                                                       |
| Tooltip        | Portaled Radix tooltip, `side="bottom"` — requires `TooltipProvider`    |
| A11y           | `label` is required and applied as `aria-label`                         |
| Disabled       | `opacity-50 pointer-events-none` via native `disabled`                  |

## Conventions

- **Always pass `label`.** Icon-only buttons without it fail WCAG `button-name`.
- **Tone choice**: `amber` = primary action, `rose` = destructive/close,
  `emerald` = confirm/save, `default` = neutral toolbar, `sky`/`violet`
  reserved for surfaces that already use those accents.
- **Hover-only visibility** (e.g. row actions): pass utility classes via
  `className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"`.
  Do not override the size/border/ring tokens.
- **Size 7** for inline row actions and dense toolbars (e.g. quick-edit
  save/cancel). **Size 8** is the default. **Size 9/10** for hero CTAs.
- **Tooltip text** should be a noun or short verb phrase ("Save", "Task
  history"), not a full sentence; use `label` for the screen-reader version
  if the two diverge.
- **Do not** wrap `ActionIcon` in another `<button>` — it is already one.

## When NOT to use it

- Text-bearing buttons (chips, primary CTAs) — use `<Button>` from shadcn.
- Toggle pills with text — use a `<button>` with chip styling.
- Links — use `<Link>`/`<a>` with appropriate aria labelling.
