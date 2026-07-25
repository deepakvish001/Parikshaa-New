import { Section } from "./dsaLevel1Types";

type Diff = "Easy" | "Medium" | "Hard";
const yt = (title: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent("striver " + title)}`;
const lc = (slug: string) => `https://leetcode.com/problems/${slug}/`;

let __id = 0;
const t = (
  title: string,
  slug: string,
  difficulty: Diff,
  note = "",
  estTime = "25 min",
) => ({
  id: `bs-${++__id}`,
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

export const binarySearchSheetSections: Section[] = [
  {
    id: "bs-sec-0",
    title: "0) Classic Binary Search (Exact Match)",
    subSections: [
      {
        id: "bs-sec-0-sub-1",
        title: "Base templates",
        topics: [
          { ...t("Binary Search", "binary-search", "Easy", "IMP (base template — ratlo isko)"), startHere: true },
          t("Search Insert Position", "search-insert-position", "Easy", "IMP (lower bound)"),
          t("First Bad Version", "first-bad-version", "Easy", "IMP (first true — BS on predicate)"),
          t("Guess Number Higher or Lower", "guess-number-higher-or-lower", "Easy", "Interactive BS"),
          t("Sqrt(x)", "sqrtx", "Easy", "IMP (BS on answer intro)"),
          t("Valid Perfect Square", "valid-perfect-square", "Easy", "BS on answer"),
          t("Arranging Coins", "arranging-coins", "Easy", "BS on rows"),
          t("Find Smallest Letter Greater Than Target", "find-smallest-letter-greater-than-target", "Easy", "Upper bound (circular)"),
        ],
      },
    ],
  },
  {
    id: "bs-sec-1",
    title: "1) Boundaries (Lower / Upper Bound, First / Last)",
    subSections: [
      {
        id: "bs-sec-1-sub-1",
        title: "Lower / Upper bound",
        topics: [
          { ...t("Find First and Last Position of Element in Sorted Array", "find-first-and-last-position-of-element-in-sorted-array", "Medium", "IMP (lower + upper bound)"), startHere: true },
          t("Kth Missing Positive Number", "kth-missing-positive-number", "Easy", "IMP (BS on missing count)"),
          t("Find K Closest Elements", "find-k-closest-elements", "Medium", "IMP (BS on window start)"),
          t("Count Negative Numbers in a Sorted Matrix", "count-negative-numbers-in-a-sorted-matrix", "Easy", "BS per row"),
          t("Maximum Count of Positive Integer and Negative Integer", "maximum-count-of-positive-integer-and-negative-integer", "Easy", "Boundary of 0s"),
          t("Find Target Indices After Sorting Array", "find-target-indices-after-sorting-array", "Easy"),
          t("Search in a Sorted Array of Unknown Size", "search-in-a-sorted-array-of-unknown-size", "Medium", "Prem, exponential + BS"),
        ],
      },
    ],
  },
  {
    id: "bs-sec-2",
    title: "2) Rotated & Mountain Arrays",
    subSections: [
      {
        id: "bs-sec-2-sub-1",
        title: "Rotated / mountain",
        topics: [
          { ...t("Search in Rotated Sorted Array", "search-in-rotated-sorted-array", "Medium", "IMP (which half is sorted?)"), startHere: true },
          t("Search in Rotated Sorted Array II", "search-in-rotated-sorted-array-ii", "Medium", "Duplicates edge (shrink)"),
          t("Find Minimum in Rotated Sorted Array", "find-minimum-in-rotated-sorted-array", "Medium", "IMP (compare mid vs hi)"),
          t("Find Minimum in Rotated Sorted Array II", "find-minimum-in-rotated-sorted-array-ii", "Hard", "Duplicates", "35 min"),
          t("Find Peak Element", "find-peak-element", "Medium", "IMP (go towards higher neighbor)"),
          t("Peak Index in a Mountain Array", "peak-index-in-a-mountain-array", "Medium", "IMP"),
          t("Find in Mountain Array", "find-in-mountain-array", "Hard", "Find peak + 2 BS", "35 min"),
        ],
      },
    ],
  },
  {
    id: "bs-sec-3",
    title: "3) Search on 2D Matrix",
    subSections: [
      {
        id: "bs-sec-3-sub-1",
        title: "2D matrix",
        topics: [
          { ...t("Search a 2D Matrix", "search-a-2d-matrix", "Medium", "IMP (flatten to 1D index)"), startHere: true },
          t("Search a 2D Matrix II", "search-a-2d-matrix-ii", "Medium", "IMP (staircase from top-right)"),
          t("Kth Smallest Element in a Sorted Matrix", "kth-smallest-element-in-a-sorted-matrix", "Medium", "IMP (BS on value + count ≤ mid)", "35 min"),
          t("Find a Peak Element II", "find-a-peak-element-ii", "Medium", "H, BS on columns", "35 min"),
        ],
      },
    ],
  },
  {
    id: "bs-sec-4",
    title: "4) Binary Search on Answer (Minimize Max / Maximize Min) ⭐",
    subSections: [
      {
        id: "bs-sec-4-sub-1",
        title: "BS on answer",
        topics: [
          { ...t("Koko Eating Bananas", "koko-eating-bananas", "Medium", "IMP (base: min eating speed)"), startHere: true },
          t("Capacity To Ship Packages Within D Days", "capacity-to-ship-packages-within-d-days", "Medium", "IMP (min capacity)"),
          t("Split Array Largest Sum", "split-array-largest-sum", "Hard", "IMP (minimize max subarray sum)", "40 min"),
          t("Minimum Number of Days to Make m Bouquets", "minimum-number-of-days-to-make-m-bouquets", "Medium", "IMP (BS on days)"),
          t("Find the Smallest Divisor Given a Threshold", "find-the-smallest-divisor-given-a-threshold", "Medium", "IMP"),
          t("Magnetic Force Between Two Balls", "magnetic-force-between-two-balls", "Medium", "IMP (Aggressive Cows)"),
          t("Minimum Time to Complete Trips", "minimum-time-to-complete-trips", "Medium", "IMP (BS on total time)"),
          t("Minimum Speed to Arrive on Time", "minimum-speed-to-arrive-on-time", "Medium"),
          t("Maximum Candies Allocated to K Children", "maximum-candies-allocated-to-k-children", "Medium", "Maximize pile size"),
          t("Minimized Maximum of Products Distributed to Any Store", "minimized-maximum-of-products-distributed-to-any-store", "Medium", "Minimize max load"),
          t("Minimum Limit of Balls in a Bag", "minimum-limit-of-balls-in-a-bag", "Medium", "Split operations"),
          t("Maximum Running Time of N Computers", "maximum-running-time-of-n-computers", "Hard", "BS on runtime", "40 min"),
          t("Divide Chocolate", "divide-chocolate", "Hard", "Prem, maximize min piece", "35 min"),
          t("Path With Minimum Effort", "path-with-minimum-effort", "Medium", "BS + BFS check"),
          t("Swim in Rising Water", "swim-in-rising-water", "Hard", "BS + BFS/DFS", "40 min"),
        ],
      },
    ],
  },
  {
    id: "bs-sec-5",
    title: "5) Median / Kth Element via Binary Search",
    subSections: [
      {
        id: "bs-sec-5-sub-1",
        title: "Median / Kth",
        topics: [
          { ...t("Median of Two Sorted Arrays", "median-of-two-sorted-arrays", "Hard", "IMP (partition BS on smaller array)", "45 min"), startHere: true },
          t("Find K-th Smallest Pair Distance", "find-k-th-smallest-pair-distance", "Hard", "IMP (BS on distance + 2-ptr count)", "40 min"),
          t("Kth Smallest Number in Multiplication Table", "kth-smallest-number-in-multiplication-table", "Hard", "BS on value", "35 min"),
          t("K-th Smallest Prime Fraction", "k-th-smallest-prime-fraction", "Medium", "BS on fraction value", "35 min"),
          t("Find the Kth Smallest Sum of a Matrix With Sorted Rows", "find-the-kth-smallest-sum-of-a-matrix-with-sorted-rows", "Hard", "BS or heap", "40 min"),
          t("Ugly Number III", "ugly-number-iii", "Medium", "BS + inclusion-exclusion (LCM)", "35 min"),
        ],
      },
    ],
  },
  {
    id: "bs-sec-6",
    title: "6) Advanced / Hard",
    subSections: [
      {
        id: "bs-sec-6-sub-1",
        title: "Advanced",
        topics: [
          t("Longest Increasing Subsequence", "longest-increasing-subsequence", "Medium", "IMP (patience sorting = BS)"),
          t("Russian Doll Envelopes", "russian-doll-envelopes", "Hard", "Sort + LIS-with-BS", "40 min"),
          t("Find the Longest Valid Obstacle Course at Each Position", "find-the-longest-valid-obstacle-course-at-each-position", "Hard", "LIS + BS", "40 min"),
          t("Maximum Value at a Given Index in a Bounded Array", "maximum-value-at-a-given-index-in-a-bounded-array", "Medium", "BS on peak value", "35 min"),
          t("Frequency of the Most Frequent Element", "frequency-of-the-most-frequent-element", "Medium", "Sliding window / BS on answer"),
          t("Nth Magical Number", "nth-magical-number", "Hard", "BS + LCM", "35 min"),
          t("House Robber IV", "house-robber-iv", "Medium", "IMP (BS on answer + greedy check)"),
          t("Preimage Size of Factorial Zeroes Function", "preimage-size-of-factorial-zeroes-function", "Hard", "BS on trailing zeros", "40 min"),
        ],
      },
    ],
  },
  {
    id: "bs-sec-7",
    title: "7) To Do (Later)",
    subSections: [
      {
        id: "bs-sec-7-sub-1",
        title: "Later",
        topics: [
          t("Minimize the Maximum Difference of Pairs", "minimize-the-maximum-difference-of-pairs", "Medium"),
          t("Find the Student that Will Replace the Chalk", "find-the-student-that-will-replace-the-chalk", "Medium"),
          t("Minimize Max Distance to Gas Station", "minimize-max-distance-to-gas-station", "Hard"),
          t("Maximum Number of Removable Characters", "maximum-number-of-removable-characters", "Medium"),
          t("Online Election", "online-election", "Medium"),
        ],
      },
    ],
  },
];

const __all = binarySearchSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const binarySearchSheetMeta = {
  id: "binary-search-typewise",
  title: "Binary Search Questions Sheet (Type-wise)",
  description:
    "Type-wise Binary Search sheet — classic exact match, lower/upper bounds, rotated & mountain, 2D matrix, BS on answer (minimize max / maximize min), median/kth via BS & advanced.",
  lastUpdated: "July 9, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
