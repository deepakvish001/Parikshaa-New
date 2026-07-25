import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Topic = { n?: number; title: string; emoji: string; subtitle: string; to: string };
type Level = {
  id: 0 | 1 | 2 | 3;
  label: string;
  tag: string;
  desc: string;
  topics: Topic[];
};

const LEVELS: Level[] = [
  {
    id: 0,
    label: "LEVEL 0",
    tag: "Problem Solving Foundation",
    desc: "if-else → loops → patterns → digits → primes → strings → arrays → matrices",
    topics: [
      { title: "Problem Solving Foundation", emoji: "🧱", subtitle: "301 curated problems to build core problem-solving fluency.", to: "/learn/sheets/problem-solving-foundation" },
    ],
  },
  {
    id: 1,
    label: "LEVEL 1",
    tag: "Recursion (Foundation)",
    desc: "The foundation of DSA — recursive thinking, base cases & divide & conquer.",
    topics: [
      { title: "Recursion", emoji: "🪆", subtitle: "Bridge to Backtracking, Trees & DP.", to: "/learn/sheets/recursion-typewise" },
    ],
  },
  {
    id: 2,
    label: "LEVEL 2",
    tag: "Core DSA Topics",
    desc: "Arrays → Binary Search → Strings → LL → Stack → Queue → Heap → Bit → Trie → Binary Tree → Math",
    topics: [
      { n: 1, title: "Arrays", emoji: "🔢", subtitle: "Prefix sum, two pointers, sliding window, Kadane, intervals.", to: "/learn/sheets/array-typewise" },
      { n: 2, title: "Binary Search", emoji: "🔍", subtitle: "Classic, rotated arrays, BS-on-answer.", to: "/learn/sheets/binary-search-typewise" },
      { n: 3, title: "Strings", emoji: "🔤", subtitle: "Two pointers, KMP, palindromes, string DP.", to: "/learn/sheets/string-typewise" },
      { n: 4, title: "Linked List", emoji: "🔗", subtitle: "Reversal, fast-slow, merge, cycle detection.", to: "/learn/sheets/linked-list-typewise" },
      { n: 5, title: "Stack", emoji: "📚", subtitle: "Monotonic stack, parentheses, expression eval.", to: "/learn/sheets/stack-typewise" },
      { n: 6, title: "Queue", emoji: "📥", subtitle: "BFS, monotonic deque, topological sort.", to: "/learn/sheets/queue-typewise" },
      { n: 7, title: "Heap / Priority Queue", emoji: "🔺", subtitle: "Top-K, two heaps, K-way merge, scheduling.", to: "/learn/sheets/heap-typewise" },
      { n: 8, title: "Bit Manipulation", emoji: "⚡", subtitle: "XOR tricks, bitmasks, bit hacks.", to: "/learn/sheets/bit-typewise" },
      { n: 9, title: "Trie", emoji: "🔠", subtitle: "Prefix trees, autocomplete, bit-trie for max XOR.", to: "/learn/sheets/trie-typewise" },
      { n: 10, title: "Binary Tree & BST", emoji: "🌳", subtitle: "Traversals, path problems, LCA, tree DP.", to: "/learn/sheets/binary-tree-typewise" },
      { n: 11, title: "Math & Number Theory", emoji: "➗", subtitle: "GCD, Sieve, modular arithmetic, combinatorics.", to: "/learn/sheets/math-typewise" },
    ],
  },
  {
    id: 3,
    label: "LEVEL 3",
    tag: "Advanced",
    desc: "Backtracking → Greedy → Graph → DP",
    topics: [
      { n: 1, title: "Backtracking", emoji: "🔙", subtitle: "Subsets, permutations, N-Queens, constraint solving.", to: "/learn/sheets/backtracking-typewise" },
      { n: 2, title: "Greedy", emoji: "🪙", subtitle: "Interval scheduling, exchange argument, sort-based.", to: "/learn/sheets/greedy-typewise" },
      { n: 3, title: "Graph", emoji: "🕸️", subtitle: "DFS/BFS, Union-Find, Dijkstra, MST, topo sort.", to: "/learn/sheets/graph-typewise" },
      { n: 4, title: "Dynamic Programming", emoji: "🧩", subtitle: "Knapsack, grid DP, LIS, interval & bitmask DP.", to: "/learn/sheets/dp-typewise" },
    ],
  },
];

const STORAGE_KEY = "pariksha-levels:completed:v1";

function useCompletedTopics() {
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    } catch {
      /* ignore */
    }
  }, [completed]);
  const toggle = (key: string) =>
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }));
  return { completed, toggle };
}

export function ParikshaLevelsTimeline() {
  const [activeLevel, setActiveLevel] = useState<"all" | 0 | 1 | 2 | 3>("all");
  const { completed, toggle } = useCompletedTopics();

  const visibleLevels = useMemo(
    () => (activeLevel === "all" ? LEVELS : LEVELS.filter((l) => l.id === activeLevel)),
    [activeLevel],
  );

  const levelStats = (l: Level) => {
    const total = l.topics.length;
    const done = l.topics.filter((t) => completed[`${l.id}:${t.title}`]).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const jumpTo = (id: Level["id"]) => {
    setActiveLevel("all");
    requestAnimationFrame(() => {
      document
        .getElementById(`pariksha-level-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="space-y-6">
      {/* Level nav + filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {LEVELS.map((l) => {
            const { done, total, pct } = levelStats(l);
            const isActive = activeLevel === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => jumpTo(l.id)}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  isActive && "border-primary/50 bg-primary/10 text-foreground",
                )}
                aria-label={`Jump to ${l.label}`}
              >
                <span className="tabular-nums">{l.label}</span>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground/80">
                  {done}/{total} · {pct}%
                </span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Show</span>
          <Select
            value={String(activeLevel)}
            onValueChange={(v) =>
              setActiveLevel(v === "all" ? "all" : (Number(v) as 0 | 1 | 2 | 3))
            }
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {LEVELS.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.label} · {l.tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline */}
      <ol className="relative space-y-8 border-l border-primary/20 pl-6">
        {visibleLevels.map((l) => {
          const { done, total, pct } = levelStats(l);
          return (
            <li
              key={l.id}
              id={`pariksha-level-${l.id}`}
              className="scroll-mt-28 relative"
            >
              <span
                aria-hidden
                className="absolute -left-[33px] top-1 grid h-6 w-6 place-items-center rounded-full border border-primary/40 bg-background text-[10px] font-bold text-primary"
              >
                {l.id}
              </span>

              <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {l.label} · {l.tag}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {done}/{total} complete · {pct}%
                </span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{l.desc}</p>

              {/* Progress bar */}
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full bg-gradient-to-r from-primary to-orange-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {l.topics.map((t) => {
                  const key = `${l.id}:${t.title}`;
                  const isDone = !!completed[key];
                  return (
                    <div
                      key={key}
                      className={cn(
                        "group relative flex items-start gap-3 rounded-xl border p-3 transition-all",
                        isDone
                          ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                          : "border-white/10 bg-white/[0.02] hover:border-primary/30",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        aria-pressed={isDone}
                        aria-label={
                          isDone
                            ? `Mark ${t.title} as not completed`
                            : `Mark ${t.title} as completed`
                        }
                        className={cn(
                          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors",
                          isDone
                            ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-500"
                            : "border-white/15 text-muted-foreground hover:border-primary/50 hover:text-primary",
                        )}
                      >
                        {isDone ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={t.to}
                          className="block text-sm font-semibold text-foreground hover:text-primary"
                        >
                          <span className="tabular-nums text-muted-foreground">
                            {t.n ? `${t.n}. ` : ""}
                          </span>
                          {t.title} <span aria-hidden>{t.emoji}</span>
                        </Link>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {t.subtitle}
                        </p>
                        <Link
                          to={t.to}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Open Sheet
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                      {isDone && (
                        <CheckCircle2
                          aria-hidden
                          className="absolute right-2 top-2 h-4 w-4 text-emerald-500/70"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
