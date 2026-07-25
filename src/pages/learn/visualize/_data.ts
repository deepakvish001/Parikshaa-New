export type VisualizeTrackId = "dsa" | "lld" | "networking" | "os";

export interface VisualizeTrack {
  id: VisualizeTrackId;
  title: string;
  subtitle: string;
  description: string;
  status: "LIVE" | "NEW" | "BONUS";
  tags: string[];
  meta: string;
  algos: string[];
}

export const VISUALIZE_TRACKS: VisualizeTrack[] = [
  {
    id: "dsa",
    title: "DSA Visual",
    subtitle: "Data Structures & Algorithms",
    description:
      "Animated, step-by-step walkthroughs from two pointers to dynamic programming. Brute force first, then the optimized trick — always with the why.",
    status: "LIVE",
    tags: ["Two Pointers", "Sliding Window", "Binary Search", "Sorting", "Recursion", "DP"],
    meta: "5 visualizers · more coming",
    algos: ["two-pointers", "sliding-window", "binary-search", "bubble-sort", "recursion-factorial"],
  },
  {
    id: "lld",
    title: "LLD Visual",
    subtitle: "Low-Level & OOP Design",
    description:
      "Object-oriented design taught with animated UML — class & sequence diagrams that build themselves, plus the theory behind every pattern.",
    status: "BONUS",
    tags: ["SOLID", "Design Patterns", "UML", "Sequence"],
    meta: "Preview soon",
    algos: [],
  },
  {
    id: "networking",
    title: "Networking Visual",
    subtitle: "Computer Networks, from the wire up",
    description:
      "A full visual course — from a single fetch() down to bits on the wire and back up through TCP, DNS, HTTP and TLS. Every step illustrated.",
    status: "NEW",
    tags: ["IP", "TCP / UDP", "Routing", "DNS", "HTTP & TLS"],
    meta: "Preview soon",
    algos: [],
  },
  {
    id: "os",
    title: "Operating Systems Visual",
    subtitle: "How your machine really runs your code",
    description:
      "Processes, scheduling, concurrency, virtual memory and file systems — explained the way a working engineer needs them.",
    status: "NEW",
    tags: ["Processes", "Scheduling", "Threads", "Deadlocks", "Virtual Memory"],
    meta: "Preview soon",
    algos: [],
  },
];

export interface VisualizeAlgo {
  id: string;
  title: string;
  track: string;
  blurb: string;
  problem: string;
}

export const VISUALIZE_ALGOS: VisualizeAlgo[] = [
  {
    id: "two-pointers",
    title: "Two Pointers",
    track: "DSA · Arrays",
    blurb: "Find a pair summing to target on a sorted array in O(n).",
    problem: "Two Sum II",
  },
  {
    id: "sliding-window",
    title: "Sliding Window",
    track: "DSA · Arrays",
    blurb: "Maximum sum of a window of size k, one pass.",
    problem: "Max Subarray of Size K",
  },
  {
    id: "binary-search",
    title: "Binary Search",
    track: "DSA · Search",
    blurb: "Halve the search space every step until the target is found.",
    problem: "Search in Sorted Array",
  },
  {
    id: "bubble-sort",
    title: "Bubble Sort",
    track: "DSA · Sorting",
    blurb: "Adjacent swaps bubble the largest value to the end each pass.",
    problem: "Sort an Array",
  },
  {
    id: "recursion-factorial",
    title: "Recursion — factorial(4)",
    track: "DSA · Recursion",
    blurb: "Watch the call stack push and pop, Python-Tutor style, as factorial(4) unwinds to 24.",
    problem: "Factorial",
  },
];
