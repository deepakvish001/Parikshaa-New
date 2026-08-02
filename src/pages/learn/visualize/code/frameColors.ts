/** Per-call-stack-depth colour palette, mirroring the recursion-video look. */
export const FRAME_COLORS = [
  {
    ring: "border-sky-400/70",
    glow: "shadow-[0_0_0_1px_hsl(199_89%_60%/0.25),0_8px_24px_-12px_hsl(199_89%_60%/0.6)]",
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/40",
    bar: "bg-sky-500",
    text: "text-sky-300",
  },
  {
    ring: "border-violet-400/70",
    glow: "shadow-[0_0_0_1px_hsl(266_85%_68%/0.25),0_8px_24px_-12px_hsl(266_85%_68%/0.6)]",
    chip: "bg-violet-500/15 text-violet-300 border-violet-500/40",
    bar: "bg-violet-500",
    text: "text-violet-300",
  },
  {
    ring: "border-amber-400/70",
    glow: "shadow-[0_0_0_1px_hsl(43_96%_60%/0.25),0_8px_24px_-12px_hsl(43_96%_60%/0.6)]",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    bar: "bg-amber-500",
    text: "text-amber-300",
  },
  {
    ring: "border-emerald-400/70",
    glow: "shadow-[0_0_0_1px_hsl(160_84%_50%/0.25),0_8px_24px_-12px_hsl(160_84%_50%/0.6)]",
    chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    bar: "bg-emerald-500",
    text: "text-emerald-300",
  },
  {
    ring: "border-rose-400/70",
    glow: "shadow-[0_0_0_1px_hsl(350_89%_66%/0.25),0_8px_24px_-12px_hsl(350_89%_66%/0.6)]",
    chip: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    bar: "bg-rose-500",
    text: "text-rose-300",
  },
  {
    ring: "border-cyan-400/70",
    glow: "shadow-[0_0_0_1px_hsl(187_92%_55%/0.25),0_8px_24px_-12px_hsl(187_92%_55%/0.6)]",
    chip: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
    bar: "bg-cyan-500",
    text: "text-cyan-300",
  },
];

export const frameColor = (depth: number) =>
  FRAME_COLORS[depth % FRAME_COLORS.length];

/** Colour token for a step event type. */
export const EVENT_STYLE: Record<
  string,
  { label: string; chip: string; line: string; gutter: string; text: string }
> = {
  call: {
    label: "call",
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/40",
    line: "bg-sky-500/12 border-sky-400/50",
    gutter: "bg-sky-400",
    text: "text-sky-200",
  },
  return: {
    label: "return",
    chip: "bg-violet-500/15 text-violet-300 border-violet-500/40",
    line: "bg-violet-500/12 border-violet-400/50",
    gutter: "bg-violet-400",
    text: "text-violet-200",
  },
  output: {
    label: "output",
    chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    line: "bg-emerald-500/12 border-emerald-400/50",
    gutter: "bg-emerald-400",
    text: "text-emerald-200",
  },
  line: {
    label: "line",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    line: "bg-amber-500/12 border-amber-400/50",
    gutter: "bg-amber-400",
    text: "text-amber-100",
  },
};

export const eventStyle = (e?: string) => EVENT_STYLE[e ?? "line"] ?? EVENT_STYLE.line;
