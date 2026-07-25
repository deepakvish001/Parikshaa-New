import { Section } from "./dsaLevel1Types";

type Diff = "Easy" | "Medium" | "Hard";
const yt = (title: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent("neetcode " + title)}`;
const lc = (slug: string) => `https://leetcode.com/problems/${slug}/`;

let __id = 0;
const t = (
  title: string,
  slug: string,
  difficulty: Diff,
  note = "",
  estTime = "25 min",
) => ({
  id: `heap-${++__id}`,
  title,
  completed: false,
  difficulty,
  resourceType: "youtube" as const,
  resourceUrl: yt(title),
  practiceUrl: lc(slug),
  note,
  isRevision: false,
  estTime,
});

export const heapSheetSections: Section[] = [
  {
    id: "heap-sec-0",
    title: "0) Heap Basics / Design & Simulation",
    subSections: [
      {
        id: "heap-sec-0-sub-1",
        title: "Basics & simulation",
        topics: [
          { ...t("Kth Largest Element in a Stream", "kth-largest-element-in-a-stream", "Easy", "IMP (min-heap size K)"), startHere: true },
          t("Last Stone Weight", "last-stone-weight", "Easy", "IMP (max-heap simulation)"),
          t("Remove Stones to Minimize the Total", "remove-stones-to-minimize-the-total", "Medium", "Max-heap, K ops"),
          t("Take Gifts From the Richest Pile", "take-gifts-from-the-richest-pile", "Easy"),
          t("Maximal Score After Applying K Operations", "maximal-score-after-applying-k-operations", "Medium"),
          t("Seat Reservation Manager", "seat-reservation-manager", "Medium", "Min-heap of freed seats"),
        ],
      },
    ],
  },
  {
    id: "heap-sec-1",
    title: "1) Top K Elements",
    subSections: [
      {
        id: "heap-sec-1-sub-1",
        title: "Top K",
        topics: [
          { ...t("Kth Largest Element in an Array", "kth-largest-element-in-an-array", "Medium", "IMP (heap or quickselect)"), startHere: true },
          t("Top K Frequent Elements", "top-k-frequent-elements", "Medium", "IMP (freq map + heap / bucket)"),
          t("Top K Frequent Words", "top-k-frequent-words", "Medium", "IMP (custom comparator)"),
          t("K Closest Points to Origin", "k-closest-points-to-origin", "Medium", "IMP (max-heap size K)"),
          t("Sort Characters By Frequency", "sort-characters-by-frequency", "Medium", "Also String §3"),
          t("Find K Closest Elements", "find-k-closest-elements", "Medium", "BS window better, heap ok"),
          t("Least Number of Unique Integers after K Removals", "least-number-of-unique-integers-after-k-removals", "Medium", "Remove smallest freqs"),
          t("K Highest Ranked Items Within a Price Range", "k-highest-ranked-items-within-a-price-range", "Medium", "BFS + heap"),
          t("Reorganize String", "reorganize-string", "Medium", "IMP (max-heap greedy)"),
          t("Task Scheduler", "task-scheduler", "Medium", "IMP (max-heap / math)"),
          t("Rearrange String k Distance Apart", "rearrange-string-k-distance-apart", "Hard", "Prem, heap + cooldown queue", "35 min"),
        ],
      },
    ],
  },
  {
    id: "heap-sec-2",
    title: "2) Kth Smallest / Order Statistics",
    subSections: [
      {
        id: "heap-sec-2-sub-1",
        title: "Kth smallest",
        topics: [
          { ...t("Kth Smallest Element in a Sorted Matrix", "kth-smallest-element-in-a-sorted-matrix", "Medium", "IMP (heap or BS on value)"), startHere: true },
          t("Find K Pairs with Smallest Sums", "find-k-pairs-with-smallest-sums", "Medium", "IMP (K-way merge with heap)"),
          t("Ugly Number II", "ugly-number-ii", "Medium", "IMP (min-heap or 3-ptr DP)"),
          t("Super Ugly Number", "super-ugly-number", "Medium", "Generalize with heap"),
          t("K-th Smallest Prime Fraction", "k-th-smallest-prime-fraction", "Hard", "heap or BS", "35 min"),
          t("Kth Smallest Number in Multiplication Table", "kth-smallest-number-in-multiplication-table", "Hard", "BS on answer", "35 min"),
          t("Find K-th Smallest Pair Distance", "find-k-th-smallest-pair-distance", "Hard", "BS + 2-ptr count", "40 min"),
        ],
      },
    ],
  },
  {
    id: "heap-sec-3",
    title: "3) Merge K Sorted (K-way Merge)",
    subSections: [
      {
        id: "heap-sec-3-sub-1",
        title: "K-way merge",
        topics: [
          { ...t("Merge k Sorted Lists", "merge-k-sorted-lists", "Hard", "IMP (base K-way)", "35 min"), startHere: true },
          t("Smallest Range Covering Elements from K Lists", "smallest-range-covering-elements-from-k-lists", "Hard", "IMP (heap + track max)", "40 min"),
          t("Kth Smallest Element in a Sorted Matrix", "kth-smallest-element-in-a-sorted-matrix", "Medium", "K-way on rows"),
        ],
      },
    ],
  },
  {
    id: "heap-sec-4",
    title: "4) Two Heaps (Median / Balance)",
    subSections: [
      {
        id: "heap-sec-4-sub-1",
        title: "Two heaps",
        topics: [
          { ...t("Find Median from Data Stream", "find-median-from-data-stream", "Hard", "IMP (base two-heaps)", "40 min"), startHere: true },
          t("Sliding Window Median", "sliding-window-median", "Hard", "two heaps + lazy delete", "40 min"),
          t("IPO", "ipo", "Hard", "IMP (min-heap capital → max-heap profit)", "35 min"),
          t("Maximum Performance of a Team", "maximum-performance-of-a-team", "Hard", "sort by efficiency + min-heap speeds", "35 min"),
          t("The Skyline Problem", "the-skyline-problem", "Hard", "sweep + max-heap", "45 min"),
        ],
      },
    ],
  },
  {
    id: "heap-sec-5",
    title: "5) Heap + Greedy / Scheduling",
    subSections: [
      {
        id: "heap-sec-5-sub-1",
        title: "Greedy scheduling",
        topics: [
          { ...t("Meeting Rooms II", "meeting-rooms-ii", "Medium", "Prem, IMP (min-heap of end times)"), startHere: true },
          t("Minimum Cost to Connect Sticks", "minimum-cost-to-connect-sticks", "Medium", "Prem, IMP (Huffman)"),
          t("Furthest Building You Can Reach", "furthest-building-you-can-reach", "Medium", "IMP (min-heap of biggest jumps)"),
          t("Single-Threaded CPU", "single-threaded-cpu", "Medium", "IMP (sort + min-heap by duration)"),
          t("Process Tasks Using Servers", "process-tasks-using-servers", "Medium", "Two heaps (free / busy)"),
          t("Maximum Number of Events That Can Be Attended", "maximum-number-of-events-that-can-be-attended", "Hard", "sort + min-heap of end days", "35 min"),
          t("Minimum Number of Refueling Stops", "minimum-number-of-refueling-stops", "Hard", "IMP (max-heap of passed fuel)", "35 min"),
          t("Maximum Average Pass Ratio", "maximum-average-pass-ratio", "Medium", "Max-heap by marginal gain"),
          t("Minimum Cost to Hire K Workers", "minimum-cost-to-hire-k-workers", "Hard", "sort ratio + max-heap of wages", "40 min"),
          t("Course Schedule III", "course-schedule-iii", "Hard", "greedy + max-heap (drop longest)", "35 min"),
          t("Meeting Rooms III", "meeting-rooms-iii", "Hard", "two heaps (free rooms / busy)", "40 min"),
          t("Total Cost to Hire K Workers", "total-cost-to-hire-k-workers", "Medium", "Two heaps (head / tail)"),
        ],
      },
    ],
  },
  {
    id: "heap-sec-6",
    title: "6) Heap on Grid / Shortest Path",
    subSections: [
      {
        id: "heap-sec-6-sub-1",
        title: "Dijkstra family",
        topics: [
          { ...t("Trapping Rain Water II", "trapping-rain-water-ii", "Hard", "IMP (min-heap border inward)", "45 min"), startHere: true },
          t("Path With Minimum Effort", "path-with-minimum-effort", "Medium", "Dijkstra"),
          t("Swim in Rising Water", "swim-in-rising-water", "Hard", "Dijkstra/heap", "35 min"),
          t("Network Delay Time", "network-delay-time", "Medium", "Base Dijkstra"),
        ],
      },
    ],
  },
  {
    id: "heap-sec-7",
    title: "7) Advanced / Design",
    subSections: [
      {
        id: "heap-sec-7-sub-1",
        title: "Advanced design",
        topics: [
          t("Design Twitter", "design-twitter", "Medium", "IMP (merge K feeds with heap)"),
          t("Maximum Frequency Stack", "maximum-frequency-stack", "Hard", "freq-based", "35 min"),
          t("Find Servers That Handled Most Number of Requests", "find-servers-that-handled-most-number-of-requests", "Hard", "two heaps + ordered set", "40 min"),
          t("Number of Flowers in Full Bloom", "number-of-flowers-in-full-bloom", "Hard", "Heap / BS on events", "35 min"),
          t("Maximum Number of Events That Can Be Attended II", "maximum-number-of-events-that-can-be-attended-ii", "Hard", "DP + BS", "40 min"),
        ],
      },
    ],
  },
  {
    id: "heap-sec-8",
    title: "8) To Do (Later)",
    subSections: [
      {
        id: "heap-sec-8-sub-1",
        title: "Later",
        topics: [
          t("Maximum Number of Tasks You Can Assign", "maximum-number-of-tasks-you-can-assign", "Hard", "", "40 min"),
          t("Kth Largest Sum in a Binary Tree", "kth-largest-sum-in-a-binary-tree", "Medium"),
          t("Split Array into Consecutive Subsequences", "split-array-into-consecutive-subsequences", "Medium"),
          t("Kth Smallest Instructions", "kth-smallest-instructions", "Hard", "", "40 min"),
        ],
      },
    ],
  },
];

const __all = heapSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const heapSheetMeta = {
  id: "heap-typewise",
  title: "Heap / Priority Queue Questions Sheet (Type-wise)",
  description:
    "Type-wise Heap / Priority Queue question bank covering ~100% of LeetCode heap problems — top K, kth smallest, K-way merge, two heaps (median), heap+greedy scheduling, Dijkstra grids & advanced design.",
  lastUpdated: "July 9, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
