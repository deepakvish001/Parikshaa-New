import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BRAND_PALETTE,
  MULTICOLOR_PALETTE,
  TOPIC_BADGE_BASE_CLASSNAME,
  TOPIC_FALLBACK_CLASSNAME,
  TOPIC_PALETTE_MODE,
  colorForTopic,
  type TopicPaletteEntry,
} from "@/config/topicBadgePalette";

const SAMPLE_TOPICS = [
  "Array", "String", "Hash Table", "Dynamic Programming", "Math", "Sorting",
  "Greedy", "Depth-First Search", "Binary Search", "Tree", "Breadth-First Search",
  "Matrix", "Two Pointers", "Bit Manipulation", "Stack", "Heap (Priority Queue)",
  "Graph", "Design", "Prefix Sum", "Simulation", "Backtracking", "Union Find",
  "Sliding Window", "Linked List", "Ordered Set", "Monotonic Stack", "Trie",
  "Recursion", "Divide and Conquer", "Binary Tree", "Queue", "Segment Tree",
];

const Row = ({ palette, title }: { palette: TopicPaletteEntry[]; title: string }) => (
  <section className="space-y-3">
    <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
      {title} <span className="text-zinc-500">({palette.length} hues)</span>
    </h2>
    <div className="flex flex-wrap gap-2">
      {palette.map((entry) => (
        <div key={entry.label} className="flex flex-col items-start gap-1">
          <Badge
            variant="outline"
            className={cn(TOPIC_BADGE_BASE_CLASSNAME, entry.className)}
          >
            {entry.label}
          </Badge>
          <code className="text-[10px] text-zinc-500">{entry.label}</code>
        </div>
      ))}
      <div className="flex flex-col items-start gap-1">
        <Badge
          variant="outline"
          className={cn(TOPIC_BADGE_BASE_CLASSNAME, TOPIC_FALLBACK_CLASSNAME)}
        >
          fallback
        </Badge>
        <code className="text-[10px] text-zinc-500">fallback</code>
      </div>
    </div>
  </section>
);

/**
 * Dev-only preview page for `topicBadgePalette` — mount at
 * `/dev/topic-palette` to eyeball hues and contrast.
 */
export default function TopicPalettePreview() {
  const [query, setQuery] = useState("");
  const topics = query
    ? SAMPLE_TOPICS.concat(query.split(",").map((t) => t.trim()).filter(Boolean))
    : SAMPLE_TOPICS;

  return (
    <div className="min-h-dvh bg-[#050505] text-zinc-100 p-8 space-y-10">
      <Helmet><title>Topic Palette Preview</title></Helmet>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Topic Badge Palette Preview</h1>
        <p className="text-sm text-zinc-400">
          Active mode: <code className="text-amber-300">{TOPIC_PALETTE_MODE}</code>.
          Flip <code>TOPIC_PALETTE_MODE</code> in{" "}
          <code>src/config/topicBadgePalette.ts</code> to switch.
        </p>
      </header>

      <Row palette={MULTICOLOR_PALETTE} title="Multicolor palette" />
      <Row palette={BRAND_PALETTE} title="Brand palette" />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
          Sample topics (deterministic mapping)
        </h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try your own, comma-separated"
            className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm outline-none focus:border-amber-500/60"
          />
          <Button variant="outline" size="sm" onClick={() => setQuery("")}>
            Reset
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className={cn(TOPIC_BADGE_BASE_CLASSNAME, colorForTopic(t))}
            >
              {t}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
