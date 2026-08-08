import { useMemo, useRef, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Outlet, useMatch, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Boxes,
  Users,
  Code2,
  Network,
  ListMusic,
  Swords,
  Newspaper,
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Share2,
  Trophy,
  Flame,
  Code,
  Plus,
  Maximize2,
  Minimize2,
  BookOpen,
  Home as HomeIcon,
  User as UserIcon,
  Settings,
  Sparkles,
  Map as MapIcon,
  Eye,


  Sun,
  Moon,
  Bell,
  LogOut,
  ChevronRight as ChevronRightIcon,
  X,
  Trash2,
  Check,
  Pencil,
  ClipboardList as ClipboardListIcon,
  CalendarDays,
  History as HistoryIcon,
  Repeat,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Search,
  Filter as FilterIcon,
  ArrowLeft,
  ArrowDownNarrowWide,
  CalendarClock,
  CalendarCheck2,
  Loader2,
  UserX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { ActionIcon } from "@/components/common/ActionIcon";
import { BrandChipLegend } from "@/components/common/BrandChipLegend";
import { ScrollableChipStrip } from "@/components/common/ScrollableChipStrip";
import { ParikshaaChip } from "@/components/common/ParikshaaChip";
import { SectionEyebrow } from "@/components/landing/SectionEyebrow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useThemeSync } from "@/hooks/useThemeSync";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import parikshaaLogo from "@/assets/brand/logo-transparent.png";
import {
  LayoutGrid,
  
  Gauge,
  Target,
  FileSpreadsheet,
  Brain,
  BrainCircuit,
  NotebookPen,
  Terminal,
  Briefcase,
  ClipboardList,
  ClipboardCheck,
  Mic,
  Mic2,
  Swords as SwordsIcon,
  Layers,
  LibraryBig,
  Activity,
  MessagesSquare,
  BookMarked,
  Workflow,
  PlayCircle,
  Rocket,
  Database,
  Crown,
  BookOpenCheck,
} from "lucide-react";
import {
  ProgressRing,
  CalendarRoadmap,
} from "@/components/learn/RightRailWidgets";
import { ParikshaLevelsTimeline } from "@/components/learn/ParikshaLevelsTimeline";





// ─────────────────────────────────────────────────────────────
// Curated data — wires to existing routes
// ─────────────────────────────────────────────────────────────

type CardItem = {
  title: string;
  subtitle: string;
  primary: { label: string; to: string };
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const navCard = (title: string, subtitle: string, to: string, label = "Open"): CardItem => ({
  title, subtitle, primary: { label, to },
});

// All categories — each renders both as a top tile and as a section below.
const sections: {
  label: string;
  icon: any;
  items: CardItem[];
}[] = [
  {
    label: "Parikshaa Premium Sheets", icon: Crown,
    items: [
      { title: "SDE Sheet · The Ultimate Guide 💎", subtitle: "Curated roadmap for product-based companies. 180+ problems from top interview patterns.", primary: { label: "Open Sheet", to: "/learn/sheets/sde-sheet" } },
    ],
  },
  {
    label: "Pariksha DSA Sheets", icon: Layers,
    items: [
      { title: "LEVEL 0 · Problem Solving Foundation 🧱", subtitle: "if-else → loops → patterns → digits → primes → strings → arrays → matrices. Build core problem-solving fluency before DSA.", primary: { label: "Open Sheet", to: "/learn/sheets/problem-solving-foundation" } },

      { title: "LEVEL 1 · Recursion 🪆", subtitle: "The foundation of DSA — recursive thinking, base cases & divide & conquer. Bridge to Backtracking, Trees & DP.", primary: { label: "Open Sheet", to: "/learn/sheets/recursion-typewise" } },

      { title: "LEVEL 2 · 1. Arrays 🔢", subtitle: "Prefix sum, two pointers, sliding window, Kadane, intervals.", primary: { label: "Open Sheet", to: "/learn/sheets/array-typewise" } },
      { title: "LEVEL 2 · 2. Binary Search 🔍", subtitle: "Classic, rotated arrays, and binary-search-on-answer.", primary: { label: "Open Sheet", to: "/learn/sheets/binary-search-typewise" } },
      { title: "LEVEL 2 · 3. Strings 🔤", subtitle: "Two pointers, KMP, palindromes, string DP.", primary: { label: "Open Sheet", to: "/learn/sheets/string-typewise" } },
      { title: "LEVEL 2 · 4. Linked List 🔗", subtitle: "Reversal, fast-slow pointers, merge, cycle detection.", primary: { label: "Open Sheet", to: "/learn/sheets/linked-list-typewise" } },
      { title: "LEVEL 2 · 5. Stack 📚", subtitle: "Monotonic stack, parentheses, expression evaluation.", primary: { label: "Open Sheet", to: "/learn/sheets/stack-typewise" } },
      { title: "LEVEL 2 · 6. Queue 📥", subtitle: "BFS, monotonic deque, topological sort.", primary: { label: "Open Sheet", to: "/learn/sheets/queue-typewise" } },
      { title: "LEVEL 2 · 7. Heap / Priority Queue 🔺", subtitle: "Top-K, two heaps, K-way merge, scheduling.", primary: { label: "Open Sheet", to: "/learn/sheets/heap-typewise" } },
      { title: "LEVEL 2 · 8. Bit Manipulation ⚡", subtitle: "XOR tricks, bitmasks, bit hacks.", primary: { label: "Open Sheet", to: "/learn/sheets/bit-typewise" } },
      { title: "LEVEL 2 · 9. Trie 🔠", subtitle: "Prefix trees, autocomplete, bit-trie for max XOR.", primary: { label: "Open Sheet", to: "/learn/sheets/trie-typewise" } },
      { title: "LEVEL 2 · 10. Binary Tree & BST 🌳", subtitle: "Traversals, path problems, LCA, tree DP.", primary: { label: "Open Sheet", to: "/learn/sheets/binary-tree-typewise" } },
      { title: "LEVEL 2 · 11. Math & Number Theory ➗", subtitle: "GCD, Sieve, modular arithmetic, combinatorics.", primary: { label: "Open Sheet", to: "/learn/sheets/math-typewise" } },

      { title: "LEVEL 3 · 1. Backtracking 🔙", subtitle: "Subsets, permutations, N-Queens, constraint solving.", primary: { label: "Open Sheet", to: "/learn/sheets/backtracking-typewise" } },
      { title: "LEVEL 3 · 2. Greedy 🪙", subtitle: "Interval scheduling, exchange argument, sorting-based.", primary: { label: "Open Sheet", to: "/learn/sheets/greedy-typewise" } },
      { title: "LEVEL 3 · 3. Graph 🕸️", subtitle: "DFS/BFS, Union-Find, Dijkstra, MST, topological sort.", primary: { label: "Open Sheet", to: "/learn/sheets/graph-typewise" } },
      { title: "LEVEL 3 · 4. Dynamic Programming 🧩", subtitle: "Knapsack, grid DP, LIS, interval & bitmask DP.", primary: { label: "Open Sheet", to: "/learn/sheets/dp-typewise" } },
    ],
  },
  {
    label: "DSA Sheets", icon: Layers,
    items: [
      { title: "Blind 75", subtitle: "The essential 75 LeetCode problems for tech interviews", primary: { label: "Open Sheet", to: "/learn/sheets/blind-75" } },
      { title: "Neetcode 150", subtitle: "Blind 75 extended with additional patterns", primary: { label: "Open Sheet", to: "/learn/sheets/neetcode-150" } },
      { title: "NeetCode 250", subtitle: "Complete NeetCode collection — 250 problems across all patterns", primary: { label: "Open Sheet", to: "/learn/sheets/neetcode-250" } },
      { title: "Java DSA Level 1", subtitle: "Complete Java DSA prep — 467 topics from basics to advanced", primary: { label: "Open Sheet", to: "/learn/sheets/dsa-level-1" } },
      { title: "Java DSA Level 2", subtitle: "Advanced DSA — Recursion, DP, Graphs, Trees — 309 problems", primary: { label: "Open Sheet", to: "/learn/sheets/dsa-level-2" } },
      { title: "Java DSA Level 3", subtitle: "Expert DSA — Tries, Segment Trees, Advanced DP & Graphs", primary: { label: "Open Sheet", to: "/learn/sheets/dsa-level-3" } },
    ],
  },
  {
    label: "DSA Studio", icon: BrainCircuit,
    items: [
      navCard("DSA Studio", "Practice journal — log problems, revise, export", "/learn/dsa-studio/journal", "Open Studio"),
    ],
  },
  {
    label: "DSA Heatmap", icon: Activity,
    items: [
      navCard("DSA Heatmap", "Visual heatmap & progress across all sheet problems", "/learn/dsa-tracker", "Open Sheet"),
    ],
  },
  {
    label: "Coding Problems", icon: Terminal,
    items: [
      { title: "Array", subtitle: "Learn from Basics to Advanced", primary: { label: "Start Learning", to: "/library/problems?topic=Array" } },
      { title: "Binary Search", subtitle: "Learn from Basics to Advanced", primary: { label: "Start Learning", to: "/library/problems?topic=Binary+Search" } },
      { title: "Dynamic Programming", subtitle: "Learn from Basics to Advanced", primary: { label: "Start Learning", to: "/library/problems?topic=Dynamic+Programming" } },
      { title: "Graphs", subtitle: "Learn from Basics to Advanced", primary: { label: "Start Learning", to: "/library/problems?topic=Graph" } },
      navCard("All Problems", "Full coding problem library", "/library/problems", "Browse"),
    ],
  },
  {
    label: "Library", icon: LibraryBig,
    items: [
      navCard("Coding Problems", "Full searchable library of coding problems", "/library/problems", "Browse"),
      navCard("Interview Questions", "Curated interview questions across topics", "/library/interview", "Browse"),
      navCard("DSA Questions", "Topic-wise DSA question bank", "/library/dsa", "Browse"),
      navCard("SQL Questions", "SQL practice questions with solutions", "/library/sql", "Browse"),
      navCard("Aptitude Questions", "Quant, logical & verbal aptitude sets", "/library/aptitude", "Browse"),
      navCard("Core CS Subjects", "OS, DBMS, Networks & more", "/library/cs", "Browse"),
      navCard("Handwritten Notes", "Concise handwritten revision notes", "/library/notes", "Browse"),
      navCard("Positions & Roles", "Resources organised by job role", "/library/positions", "Browse"),
      navCard("Companies", "Company-specific prep resources", "/library/companies", "Browse"),
      navCard("Mass Recruitment", "Bulk hiring drives & prep packs", "/library/recruitment", "Browse"),
      navCard("Quiz", "Quick MCQ quizzes across topics", "/library/quiz", "Start"),
      navCard("Quiz History", "Review your past quiz attempts", "/library/quiz-history", "Open"),
    ],
  },
  {
    label: "Core CS Subjects", icon: BookMarked,
    items: [
      { title: "DBMS Interview Sheet", subtitle: "124 essential DBMS interview questions — basics to scaling", primary: { label: "Start Learning", to: "/learn/sheets/dbms-sheet" } },
      { title: "Computer Networks Sheet", subtitle: "115 essential CN interview questions — basics to security", primary: { label: "Start Learning", to: "/learn/sheets/cn-sheet" } },
      { title: "Operating Systems Sheet", subtitle: "135 essential OS interview questions — basics to disk scheduling", primary: { label: "Start Learning", to: "/learn/sheets/os-sheet" } },
    ],
  },
  {
    label: "System Design", icon: Workflow,
    items: [
      
      navCard("Fullstack Roadmap", "Interactive 120+ topic flowchart", "/roadmaps/fullstack", "Open Roadmap"),
    ],
  },
  {
    label: "DSA Playlist", icon: PlayCircle,
    items: [
      { title: "Array", subtitle: "Learn from Basics to Advanced", primary: { label: "Start Learning", to: "/library/problems?topic=Array" } },
      { title: "Binary Search", subtitle: "Learn from Basics to Advanced", primary: { label: "Start Learning", to: "/library/problems?topic=Binary+Search" } },
      { title: "Dynamic Programming", subtitle: "Learn from Basics to Advanced", primary: { label: "Start Learning", to: "/library/problems?topic=Dynamic+Programming" } },
      { title: "Graphs", subtitle: "Learn from Basics to Advanced", primary: { label: "Start Learning", to: "/library/problems?topic=Graph" } },
    ],
  },
  {
    label: "Competitive Programming", icon: Rocket,
    items: [
      { title: "Competitive Programming", subtitle: "Master algorithms via Codeforces, AtCoder & ICPC sets — 270 problems", primary: { label: "Start Learning", to: "/learn/sheets/competitive-programming" } },
      { title: "ACM-ICPC CP Training Sheet", subtitle: "1243 problems across 7 levels — Codeforces, UVA, SPOJ & more", primary: { label: "Start Learning", to: "/learn/sheets/acm-icpc-training" } },
      
      { title: "Parikshaa Competitive Programming Sheet", subtitle: "535 handpicked Codeforces problems — rating-wise ladder, climb 800 to 2000", primary: { label: "Start Learning", to: "/learn/sheets/parikshaa-cp-sheet" } },
    ],
  },
  {
    label: "SQL", icon: Database,
    items: [
      { title: "LeetCode SQL 50", subtitle: "50 essential SQL problems — Select, Joins, Aggregations & more", primary: { label: "Start Learning", to: "/learn/sheets/sql-practice" } },
      { title: "LeetCode Advanced SQL 50", subtitle: "50 advanced SQL — Window Functions, Subqueries, CTEs & more", primary: { label: "Start Learning", to: "/learn/sheets/adv-sql-practice" } },
    ],
  },
  {
    label: "Leaderboard", icon: Crown,
    items: [
      navCard("Leaderboard", "See top learners ranked by XP", "/learn/leaderboard", "View Ranks"),
    ],
  },
  {
    label: "Blogs", icon: BookOpenCheck,
    items: [
      navCard("Arrays", "Fundamental data structure for storing elements of the same type.", "/blog", "Read"),
      navCard("Introduction to DSA", "Primer on Data Structures and Algorithms.", "/blog", "Read"),
      navCard("Binary Search", "Efficient searching algorithm for sorted arrays.", "/blog", "Read"),
      navCard("Binary Search Tree", "Hierarchical data structure with efficient search.", "/blog", "Read"),
    ],
  },
  {
    label: "Jobs", icon: Briefcase,
    items: [
      navCard("Job Openings", "Latest internships & fresher openings from Remotive, Adzuna & top boards", "/jobs", "Browse Jobs"),
    ],
  },

];

// Dedup guard — ensure no section (esp. Pariksha DSA Sheets) renders duplicate
// items by title or by primary route.
export const dedupeSectionItems = <T extends CardItem>(items: T[]): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const key = `${(it.title || "").trim().toLowerCase()}|${it.primary?.to ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
};

for (const s of sections) {
  s.items = dedupeSectionItems(s.items);
}



// ─────────────────────────────────────────────────────────────
// Section grouping — organises sections into logical tabs
// ─────────────────────────────────────────────────────────────
const SECTION_GROUPS = [
  { id: "premium", label: "Premium", icon: Crown, hint: "Exclusive Parikshaa curated sheets", sections: ["Parikshaa Premium Sheets"] },
  { id: "sheets", label: "Sheets", icon: Layers, hint: "Curated sheets across DSA, CS core, SD, CP & SQL", sections: ["Pariksha DSA Sheets", "DSA Sheets", "Core CS Subjects", "System Design", "Competitive Programming", "SQL"] },
  { id: "practice", label: "Practice", icon: BrainCircuit, hint: "Solve, review and revise", sections: ["DSA Studio", "DSA Heatmap", "Coding Problems", "DSA Playlist"] },
  { id: "library", label: "Library", icon: LibraryBig, hint: "Question banks, notes, companies & roles", sections: ["Library"] },
  { id: "community", label: "Community", icon: Trophy, hint: "Leaderboards & blogs", sections: ["Leaderboard", "Blogs"] },
  { id: "jobs", label: "Jobs", icon: Briefcase, hint: "Internship & fresher openings", sections: ["Jobs"] },
] as const;


type GroupId = (typeof SECTION_GROUPS)[number]["id"] | "all";


// ─────────────────────────────────────────────────────────────
// Building blocks
// ─────────────────────────────────────────────────────────────

function SectionTitle({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: any;
  gradient?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {Icon && (
        <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2} />
        </div>
      )}
      <h2
        style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
        className="text-lg md:text-xl font-bold tracking-[-0.02em] text-foreground antialiased subpixel-antialiased"
      >
        {children}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
    </div>
  );
}


function GuardedLink({
  to, children, className, onClick,
}: { to: string; children: React.ReactNode; className?: string; onClick?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        if (!user) {
          toast.info("Sign in to start learning", {
            description: "Create a free account to save progress.",
            action: { label: "Sign in", onClick: () => navigate("/login") },
          });
          return;
        }
        navigate(to);
      }}
      className={className}
    >
      {children}
    </button>
  );
}

function ContentCard({ item, icon: Icon }: { item: CardItem; icon?: any }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      className={cn(
        "group relative flex flex-col rounded-2xl p-5 sm:p-6 min-h-[236px]",
        "bg-[hsl(var(--card))]/60 border border-white/[0.06]",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)]",
        "transition-all duration-300 hover:border-primary/40 hover:bg-[hsl(var(--card))]/80",
        "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_28px_50px_-24px_hsl(var(--primary)/0.35)]",
        "focus-within:border-primary/40",
      )}
    >
      {/* Amber wash on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header: icon + status pill */}
      <div className="relative flex items-center justify-between gap-3 mb-5">
        {Icon ? (
          <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/15 transition-colors">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </div>
        ) : <span className="h-10" />}
        <span className="inline-flex items-center h-6 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-[0.14em] leading-none border border-primary/30 text-primary bg-primary/10">
          Open
        </span>
      </div>

      {/* Title + description */}
      <div className="relative flex-1 min-w-0">
        <h3
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          className="font-bold text-[18px] sm:text-[19px] leading-[1.25] text-foreground tracking-[-0.02em] line-clamp-2 antialiased group-hover:text-primary transition-colors"
        >
          {item.title}
        </h3>
        <p className="mt-2 text-[13px] sm:text-[13.5px] leading-[1.55] text-muted-foreground line-clamp-2 antialiased">
          {item.subtitle}
        </p>
      </div>

      {/* Action — single unified CTA */}
      <div className="relative mt-5 sm:mt-6">
        <GuardedLink
          to={item.primary.to}
          className={cn(
            "w-full h-10 inline-flex items-center justify-center rounded-lg text-[12px] font-bold uppercase tracking-[0.1em]",
            "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
            "shadow-[0_0_24px_-6px_hsl(var(--primary)/0.45)] hover:shadow-[0_0_40px_-4px_hsl(var(--primary)/0.75)] transition-all duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          {item.primary.label}
        </GuardedLink>
      </div>
    </motion.div>
  );
}

// Skeleton placeholder matching ContentCard structure
function ContentCardSkeleton() {
  return (
    <div className="relative flex flex-col rounded-2xl p-5 sm:p-6 min-h-[236px] bg-[hsl(var(--card))]/50 border border-white/[0.05] overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div className="h-10 w-10 rounded-xl bg-white/[0.05]" />
        <div className="h-6 w-16 rounded-md bg-white/[0.05]" />
      </div>
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
        <div className="h-3 w-full rounded bg-white/[0.04]" />
        <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
      </div>
      <div className="mt-6 flex gap-2.5">
        <div className="flex-1 h-10 rounded-lg bg-white/[0.05]" />
        <div className="flex-1 h-10 rounded-lg bg-white/[0.04]" />
      </div>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/[0.06] to-transparent"
        animate={{ translateX: ["-100%", "200%"] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" }}
      />
    </div>
  );
}

// Friendly empty state — reused for no results and empty groups
function LearnEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent p-10 text-center"
    >
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
        <Sparkles className="h-6 w-6 text-primary" strokeWidth={1.75} />
      </div>
      <h3
        style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
        className="relative text-base font-bold text-foreground tracking-[-0.02em]"
      >
        {title}
      </h3>
      <p className="relative mt-1.5 text-[13px] leading-relaxed text-muted-foreground max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="relative mt-5 inline-flex items-center gap-2 h-10 px-5 rounded-lg text-[12px] font-bold uppercase tracking-[0.1em] bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-[0_0_24px_-6px_hsl(var(--primary)/0.45)] hover:shadow-[0_0_40px_-4px_hsl(var(--primary)/0.75)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}


// Per-item icon resolver — picks a contextual icon from the item title
function resolveItemIcon(title: string, fallback: any) {
  const t = title.toLowerCase();
  if (t.includes("blind")) return Target;
  if (t.includes("neetcode")) return BrainCircuit;
  if (t.includes("striver") && t.includes("sde")) return Briefcase;
  if (t.includes("striver") && t.includes("a2z")) return Layers;
  if (t.includes("striver") && t.includes("system")) return Workflow;
  if (t.includes("striver")) return BookMarked;
  if (t.includes("level 1")) return Boxes;
  if (t.includes("level 2")) return Network;
  if (t.includes("level 3")) return Crown;
  if (t.includes("dbms")) return Database;
  if (t.includes("network")) return Network;
  if (t.includes("operating")) return Terminal;
  if (t.includes("fullstack") || t.includes("full stack")) return Workflow;
  if (t.includes("system design")) return Workflow;
  if (t.includes("acm") || t.includes("icpc")) return Trophy;
  if (t.includes("cp-31") || t.includes("competitive")) return Rocket;
  if (t.includes("advanced sql")) return Database;
  if (t.includes("sql")) return Database;
  if (t.includes("array")) return LayoutGrid;
  if (t.includes("binary search tree")) return Network;
  if (t.includes("binary search")) return Search;
  if (t.includes("dynamic programming")) return BrainCircuit;
  if (t.includes("graph")) return Network;
  if (t.includes("tree")) return Network;
  if (t.includes("all problems") || t.includes("all sheets")) return LayoutGrid;
  if (t.includes("interview")) return Briefcase;
  if (t.includes("aptitude")) return Brain;
  if (t.includes("note")) return NotebookPen;
  if (t.includes("position") || t.includes("role")) return Users;
  if (t.includes("compan")) return Briefcase;
  if (t.includes("recruit")) return Users;
  if (t.includes("quiz history")) return HistoryIcon;
  if (t.includes("quiz")) return ClipboardList;
  if (t.includes("leaderboard")) return Crown;
  if (t.includes("tracker")) return Activity;
  if (t.includes("studio")) return BrainCircuit;
  if (t.includes("intro")) return BookOpen;
  if (t.includes("core cs") || t.includes("cs subject")) return BookMarked;
  return fallback;
}

// Generic horizontal scroller with chevron controls
function HScroller({ children }: { children: React.ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollBy(-1)}
        disabled={!canPrev}
        className={cn(
                "absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-card/90 backdrop-blur border border-border/60 flex items-center justify-center text-foreground/80  transition-opacity z-10",
          !canPrev && "opacity-0 pointer-events-none",
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollBy(1)}
        disabled={!canNext}
        className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-card/90 backdrop-blur border border-border/60 flex items-center justify-center text-foreground/80  transition-opacity z-10",
          !canNext && "opacity-0 pointer-events-none",
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Horizontal scrollable Categories row
// ─────────────────────────────────────────────────────────────

function CategoriesRow({ onSelect }: { onSelect: (slug: string) => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((c) => {
          const Icon = c.icon;
          const slug = slugify(c.label);
          return (
          <motion.button
            type="button"
            key={c.label}
            onClick={() => onSelect(slug)}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className={cn(
              "learn-home-card group relative shrink-0 snap-start w-[160px] sm:w-[190px] rounded-2xl border backdrop-blur-sm p-3 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-colors text-left overflow-hidden",
            )}
          >
            <div className="relative aspect-[5/3] rounded-xl bg-primary/[0.06] ring-1 ring-primary/[0.12] flex items-center justify-center mb-2.5 overflow-hidden">
              <div className="relative h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center  transition-transform duration-300">
                <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
              </div>
            </div>
            <p className="relative text-center text-[13px] font-semibold tracking-tight text-foreground/85 text-foreground antialiased leading-tight min-h-[2.25rem] flex items-center justify-center px-1 transition-colors">
              {c.label}
            </p>
          </motion.button>

          );
        })}
      </div>


      {/* Chevron controls */}
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollBy(-1)}
        disabled={!canPrev}
        className={cn(
                "absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-card/90 backdrop-blur border border-border/60 flex items-center justify-center text-foreground/80  transition-opacity",
          !canPrev && "opacity-0 pointer-events-none",
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollBy(1)}
        disabled={!canNext}
        className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-card/90 backdrop-blur border border-border/60 flex items-center justify-center text-foreground/80  transition-opacity",
          !canNext && "opacity-0 pointer-events-none",
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────
// Left rail with profile menu
// ─────────────────────────────────────────────────────────────

function LeftRail() {
  const { user, profile, extendedProfile, signOut } = useAuth() as any;
  const username = extendedProfile?.username ?? null;
  const profileHref = user ? (username ? `/u/${username}` : "/profile") : "/login";
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { resolvedTheme, setTheme } = useThemeSync();
  const isDark = resolvedTheme !== "light";

  const initials =
    (profile?.full_name || user?.email || "U")
      .toString()
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase())
      .join("") || "U";

  const sheetMatch = useMatch({ path: "/learn/sheets/:sheetId", end: false });
  const activeSheetId = sheetMatch?.params?.sheetId;

  const railItems = [
    { icon: HomeIcon, label: "Home", to: "/learn", active: pathname === "/learn" },
    { icon: Swords, label: "Contest", to: "/contests", active: pathname.startsWith("/contests") },
    { icon: Briefcase, label: "Jobs", to: "/jobs", active: pathname.startsWith("/jobs") },
    { icon: Eye, label: "Visualize", to: "/learn/visualize", active: pathname.startsWith("/learn/visualize") },
    { icon: MapIcon, label: "Roadmap", to: "/roadmaps", active: pathname.startsWith("/roadmaps") },
    { icon: Bell, label: "Notifier", to: "/contest-notifier", active: pathname.startsWith("/contest-notifier") },
    ...(activeSheetId
      ? [{ icon: BookOpen, label: "Sheet", to: `/learn/sheets/${activeSheetId}`, active: true }]
      : []),
  ];

  const handleHomeNavigation = () => {
    localStorage.removeItem("lastVisitedRoute");
  };



  const handleSignOut = async () => {
    try {
      await signOut?.();
      toast.success("Signed out");
      navigate("/");
    } catch {
      toast.error("Could not sign out");
    }
  };

  const lockedToast = (label: string) =>
    toast.info(`${label} — coming soon`);

  return (
    <aside className="learn-rail-surface hidden md:flex shrink-0 w-16 h-full flex-col items-center justify-between py-4 border-r bg-background">
      {/* Top: Logo + nav */}
      <div className="flex flex-col items-center gap-4 w-full">
        <Link to="/" aria-label="Parikshaa home" className="h-10 w-10 rounded-xl bg-card/50 border border-border/60 flex items-center justify-center overflow-hidden">
          <img src={parikshaaLogo} alt="Parikshaa logo" className="h-7 w-7 object-contain" />
        </Link>

        <div className="flex flex-col items-center gap-2 w-full px-2">
          {railItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={item.to === "/learn" ? handleHomeNavigation : undefined}
                className={cn(
                  "group w-full flex flex-col items-center gap-1 rounded-xl py-2 transition-colors",
                  item.active
                    ? "bg-primary/10 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom: Profile */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Profile menu"
            className="relative h-10 w-10 rounded-full ring-2 ring-border/60 hover:ring-primary/50 transition"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
              <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
            </Avatar>
            {user && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-background" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="end" className="w-72 p-0 border-border/60 bg-card/95 backdrop-blur-xl">
          {user ? (
            <div className="flex items-center gap-3 p-3 border-b border-border/60">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{profile?.full_name || "User"}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
          ) : (
            <div className="p-3 border-b border-border/60">
              <Link to="/login" className="block w-full text-center text-sm font-medium rounded-lg border border-primary/40 bg-primary/10 text-primary px-3 py-2  transition-colors">
                Sign in
              </Link>
            </div>
          )}

          <div className="p-1.5">
            <MenuLink icon={UserIcon} label="My Profile" onClick={() => navigate(profileHref)} />
            <MenuLink icon={Settings} label="Account" onClick={() => navigate(user ? "/settings" : "/login")} />
            <MenuLink icon={Calendar} label="Sessions" locked onClick={() => lockedToast("Sessions")} />

            <MenuLink
              icon={isDark ? Sun : Moon}
              label={isDark ? "Light Mode" : "Dark Mode"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            />
            <MenuLink icon={Bell} label="Notification" trailing={<ChevronRightIcon className="h-4 w-4 text-muted-foreground" />} onClick={() => navigate(user ? "/notifications" : "/login")} />
          </div>

          {user && (
            <div className="border-t border-border/60 p-1.5">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out of Parikshaa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll need to sign in again to track your progress, streaks, and continue learning.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSignOut}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

        </PopoverContent>
      </Popover>
    </aside>
  );
}

function MenuLink({
  icon: Icon, label, onClick, locked, badge, trailing,
}: { icon: any; label: string; onClick?: () => void; locked?: boolean; badge?: string; trailing?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        locked ? "text-muted-foreground/70 hover:bg-muted/30" : "text-foreground/90 hover:bg-muted/40",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">{badge}</span>
      )}
      {locked && <span className="text-muted-foreground">🔒</span>}
      {trailing}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function LearnHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeGroup, setActiveGroup] = useState<GroupId>("sheets");
  
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 320);
    return () => clearTimeout(t);
  }, []);

  const filteredSections = useMemo(() => {
    if (!debouncedSearch) return sections;
    const q = debouncedSearch;
    return sections
      .map((s) => {
        // Pariksha DSA Sheets is a special timeline widget — always keep it mounted.
        if (s.label === "Pariksha DSA Sheets") return s;
        const labelHit = s.label.toLowerCase().includes(q);
        const items = labelHit
          ? s.items
          : s.items.filter(
              (i) =>
                i.title.toLowerCase().includes(q) ||
                i.subtitle.toLowerCase().includes(q),
            );
        return items.length ? { ...s, items } : null;
      })
      .filter(Boolean) as typeof sections;
  }, [debouncedSearch]);

  const totalMatches = useMemo(
    () => filteredSections.reduce((n, s) => n + s.items.length, 0),
    [filteredSections],
  );
  // When a nested /learn child route is active (e.g. /learn/sheets/:id),
  // we swap the middle feed column for an <Outlet/> so the sheet opens
  // inline while the left rail + right rail stay mounted.
  const onIndex = !!useMatch({ path: "/learn", end: true });


  // Derive which sections to show based on active group + search.
  const visibleSections = useMemo(() => {
    const pariksha = sections.find((s) => s.label === "Pariksha DSA Sheets");
    const ensurePariksha = (list: typeof sections) =>
      pariksha && !list.some((s) => s.label === "Pariksha DSA Sheets")
        ? [pariksha, ...list]
        : list;
    if (debouncedSearch) return ensurePariksha(filteredSections);
    if (activeGroup === "all") return sections;
    const group = SECTION_GROUPS.find((g) => g.id === activeGroup);
    if (!group) return sections;
    const allow = new Set<string>(group.sections);
    return ensurePariksha(sections.filter((s) => allow.has(s.label)));
  }, [activeGroup, debouncedSearch, filteredSections]);


  return (
    <TooltipProvider delayDuration={150}>
      <Helmet>
        <title>Learn — Byteskill</title>
        <meta name="description" content="Structured DSA, Core CS and System Design sheets — follow progress, master interviews." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <div className="learn-dark-surface dark relative h-svh min-h-0 overflow-hidden flex antialiased subpixel-antialiased [text-rendering:optimizeLegibility]">

        <LeftRail />
        <div className="relative flex-1 min-w-0 mx-auto max-w-[1500px] h-full min-h-0 px-3 md:px-4 py-3 grid grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] grid-rows-[minmax(0,1fr)] gap-3 items-start overflow-hidden">

          {/* Main column — either the LearnHub feed (index) or the active nested route (e.g. a sheet) */}
          {!onIndex && (
            <div className="learn-frame relative min-w-0 h-full min-h-0 overflow-y-auto pr-1 [scrollbar-width:thin] scroll-smooth rounded-2xl border">
              <Outlet />
            </div>
          )}
          {onIndex && (
          <div
            ref={mainRef}
            className="learn-frame relative min-w-0 h-full min-h-0 overflow-y-auto pr-1 [scrollbar-width:thin] scroll-smooth rounded-2xl border"
          >
            {/* Sticky group tabs — always visible for fast section switching */}
            <div className="sticky top-0 z-30 px-4 md:px-6 pt-5 pb-0 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-xl border-b border-white/5 space-y-5">
              {/* Hero header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-primary/40 blur-xl rounded-2xl" />
                    <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1
                        style={{
                          fontFamily: "'Space Grotesk', system-ui, sans-serif",
                          textRendering: "optimizeLegibility",
                        }}
                        className="text-2xl md:text-[28px] font-bold tracking-[-0.02em] text-foreground leading-none"
                      >
                        Learn{" "}
                        <span className="relative inline-block px-2 py-0.5">
                          <span
                            aria-hidden
                            className="absolute inset-0 -z-10 rounded-md bg-primary/15 ring-1 ring-inset ring-primary/25"
                          />
                          <span
                            className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent"
                            style={{
                              backgroundSize: "200% auto",
                              animation: "apex-shimmer 6s linear infinite",
                            }}
                          >
                            Hub
                          </span>
                        </span>
                      </h1>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label="About Learn Hub"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                          >
                            <Info className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="start" className="max-w-xs text-[12px] leading-relaxed p-3">
                          <p>Follow your preparation, access resources, and compete in real-time.</p>
                          <p className="mt-2">
                            <span className="font-semibold">What is a Sheet?</span>{" "}
                            A curated, ordered set of problems on a topic — open one to solve, mark progress, and revise.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                {/* Search */}
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 flex items-center gap-2 w-full sm:w-72 focus-within:border-primary/40 focus-within:bg-white/[0.05] transition-colors">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Search your library…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-8 text-[13px] placeholder:text-muted-foreground/60"
                  />
                  {debouncedSearch && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="h-6 w-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {debouncedSearch && (
                <div className="text-[11px] font-medium text-muted-foreground -mt-3">
                  {totalMatches} result{totalMatches === 1 ? "" : "s"} for "{search}"
                </div>
              )}

              {/* Group tabs — segmented pill */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  ...SECTION_GROUPS.map((g) => ({
                    id: g.id as GroupId,
                    label: g.label,
                    icon: g.icon,
                    count: sections
                      .filter((s) => (g.sections as readonly string[]).includes(s.label))
                      .reduce((n, s) => n + s.items.length, 0),
                  })),
                  { id: "all" as GroupId, label: "All", icon: LayoutGrid, count: sections.reduce((n, s) => n + s.items.length, 0) },
                ].map((tab) => {
                  const active = !debouncedSearch && activeGroup === tab.id;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setActiveGroup(tab.id);
                        mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={cn(
                        "relative shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold tracking-[0.02em] transition-all duration-300 active:scale-[0.98]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        active
                          ? "bg-gradient-to-b from-primary/20 to-primary/10 text-primary border border-primary/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_4px_16px_-4px_hsl(var(--primary)/0.35)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent hover:border-primary/20",
                      )}
                    >
                      <TabIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      {tab.label}
                      <span className={cn(
                        "inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full text-[9.5px] font-bold tabular-nums",
                        active ? "bg-primary/20 text-primary" : "bg-white/[0.05] text-muted-foreground/80",
                      )}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>


            <div className="space-y-6 md:space-y-8 p-4 sm:p-5 md:p-6">
              {/* Active group sub-header */}
              {!debouncedSearch && activeGroup !== "all" && (() => {
                const g = SECTION_GROUPS.find((x) => x.id === activeGroup);
                if (!g) return null;
                const totalItems = visibleSections.reduce((n, s) => n + s.items.length, 0);
                const GIcon = g.icon;
                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-5 md:p-6"
                  >
                    <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/30 flex items-center justify-center">
                          <GIcon className="h-5 w-5 text-primary" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-primary/80">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                              </span>
                              Active hub
                            </span>
                          </div>
                          <h2
                            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                            className="mt-0.5 text-xl md:text-2xl font-bold text-foreground tracking-[-0.02em]"
                          >
                            {g.label}<span className="text-primary">.</span>
                          </h2>
                          <p className="mt-1 text-[12.5px] text-muted-foreground">{g.hint}</p>
                        </div>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/40 border border-white/10 text-[11px] font-mono text-foreground/80 tabular-nums">
                        {String(totalItems).padStart(2, "0")} items
                      </span>
                    </div>
                  </motion.div>
                );
              })()}


              {isLoading ? (
                <div className="space-y-6 md:space-y-8">
                  {[0, 1].map((s) => (
                    <section key={s}>
                      <div className="flex items-end justify-between gap-4 mb-6 border-l-[3px] border-primary/40 pl-4">
                        <div className="space-y-2">
                          <div className="h-3 w-40 rounded bg-white/[0.06]" />
                          <div className="h-6 w-56 rounded bg-white/[0.08]" />
                        </div>
                        <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-primary/10 to-transparent mb-2" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <ContentCardSkeleton key={i} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : filteredSections.length === 0 && debouncedSearch ? (
                <LearnEmptyState
                  title={`No matches for "${search}"`}
                  description='Try a different keyword — like "DSA", "SQL", or "Mock Interview".'
                  actionLabel="Clear search"
                  onAction={() => setSearch("")}
                />
              ) : visibleSections.length === 0 ? (
                <LearnEmptyState
                  title="Start your first sheet"
                  description="You haven't opened any sheets yet. Kick off with our Problem Solving Foundation — 301 curated problems to build core fluency."
                  actionLabel="Create my first sheet"
                  onAction={() => navigate("/learn/sheets/problem-solving-foundation")}
                />
              ) : (
                visibleSections.map((g) => {
                  const SIcon = g.icon;
                  const isEmpty = g.items.length === 0;
                  return (
                    <section
                      key={g.label}
                      id={`cat-${slugify(g.label)}`}
                      className="scroll-mt-28"
                    >
                      <div className="flex items-end justify-between gap-4 mb-6">
                        <div className="min-w-0 flex flex-col gap-3">
                          <SectionEyebrow kicker={String(visibleSections.indexOf(g) + 1).padStart(2, "0")} label={`Curated / ${g.label}`} />
                          <h2
                            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", textWrap: "balance" }}
                            className="text-2xl md:text-[32px] font-bold text-foreground tracking-[-0.02em] antialiased leading-[1.05]"
                          >
                            {g.label.toUpperCase()}{" "}
                            <span className="relative inline-block px-2 py-0.5 align-baseline">
                              <span
                                aria-hidden
                                className="absolute inset-0 -z-10 rounded-md bg-primary/15 ring-1 ring-inset ring-primary/25"
                              />
                              <span
                                className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent tabular-nums"
                                style={{ backgroundSize: "200% auto", animation: "apex-shimmer 6s linear infinite" }}
                              >
                                {String(g.items.length).padStart(2, "0")}
                              </span>
                            </span>
                          </h2>
                        </div>
                        <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent mb-3" />
                      </div>
                      {isEmpty ? (
                        <LearnEmptyState
                          title={`No ${g.label} yet`}
                          description="New resources are being curated for this section. Check back soon."
                        />
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                          {g.items.map((c) => (
                            <ContentCard key={c.title} item={c} icon={resolveItemIcon(c.title, SIcon)} />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })
              )}

            </div>



          </div>
          )}


          {/* Right rail */}
          <aside className="h-full min-h-0 pr-1 [scrollbar-width:thin] overflow-y-auto space-y-3">
            <ProgressRing />
            <CalendarRoadmap />
            {!user && (
              <Link
                to="/login"
                className="learn-primary-cta w-full px-5 py-3 text-sm"
              >
                <BookOpen className="h-4 w-4" />
                Sign in to save sheet progress
              </Link>
            )}
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}

