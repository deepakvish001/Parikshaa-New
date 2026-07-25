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
  id: `greedy-${++__id}`,
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

export const greedySheetSections: Section[] = [
  {
    id: "greedy-sec-0",
    title: "0) Greedy Fundamentals / Classic",
    subSections: [
      {
        id: "greedy-sec-0-sub-1",
        title: "Classics",
        topics: [
          { ...t("Assign Cookies", "assign-cookies", "Easy", "IMP (sort both, 2-ptr)"), startHere: true },
          t("Lemonade Change", "lemonade-change", "Easy", "IMP (give biggest change first)"),
          t("Best Time to Buy and Sell Stock II", "best-time-to-buy-and-sell-stock-ii", "Medium", "IMP (grab every up-move)"),
          t("Can Place Flowers", "can-place-flowers", "Easy", "IMP (place whenever possible)"),
          t("Maximum Units on a Truck", "maximum-units-on-a-truck", "Easy", "IMP (sort by units desc)"),
          t("Maximize Sum Of Array After K Negations", "maximize-sum-of-array-after-k-negations", "Easy", "Flip most negative first"),
          t("Minimum Cost to Move Chips to The Same Position", "minimum-cost-to-move-chips-to-the-same-position", "Easy", "Parity trick"),
          t("Maximum Ice Cream Bars", "maximum-ice-cream-bars", "Medium", "Sort asc, buy cheapest"),
          t("Maximum Bags With Full Capacity of Rocks", "maximum-bags-with-full-capacity-of-rocks", "Medium", "Sort by remaining need"),
        ],
      },
    ],
  },
  {
    id: "greedy-sec-1",
    title: "1) Interval Scheduling",
    subSections: [
      {
        id: "greedy-sec-1-sub-1",
        title: "Intervals",
        topics: [
          { ...t("Non-overlapping Intervals", "non-overlapping-intervals", "Medium", "IMP (sort by end)"), startHere: true },
          t("Minimum Number of Arrows to Burst Balloons", "minimum-number-of-arrows-to-burst-balloons", "Medium", "IMP (sort by end)"),
          t("Merge Intervals", "merge-intervals", "Medium", "IMP (sort by start)"),
          t("Remove Covered Intervals", "remove-covered-intervals", "Medium", "Sort by start, end desc"),
          t("Maximum Length of Pair Chain", "maximum-length-of-pair-chain", "Medium"),
          t("Two City Scheduling", "two-city-scheduling", "Medium", "IMP (sort by cost diff)"),
          t("Car Pooling", "car-pooling", "Medium", "Sweep line / diff array"),
          t("Maximum Number of Events That Can Be Attended", "maximum-number-of-events-that-can-be-attended", "Hard", "sort + min-heap", "35 min"),
        ],
      },
    ],
  },
  {
    id: "greedy-sec-2",
    title: "2) Sorting-Based Greedy",
    subSections: [
      {
        id: "greedy-sec-2-sub-1",
        title: "Sort + greedy",
        topics: [
          { ...t("Largest Number", "largest-number", "Medium", "IMP (comparator: a+b vs b+a)"), startHere: true },
          t("Queue Reconstruction by Height", "queue-reconstruction-by-height", "Medium", "IMP (tall first, insert at k)"),
          t("Boats to Save People", "boats-to-save-people", "Medium", "IMP (sort + 2-ptr)"),
          t("Advantage Shuffle", "advantage-shuffle", "Medium", "IMP (just beat it)"),
          t("Wiggle Subsequence", "wiggle-subsequence", "Medium", "IMP (count direction flips)"),
          t("Hand of Straights", "hand-of-straights", "Medium", "IMP (start from smallest)"),
          t("Reduce Array Size to The Half", "reduce-array-size-to-the-half", "Medium", "Remove highest freqs first"),
          t("Minimum Rounds to Complete All Tasks", "minimum-rounds-to-complete-all-tasks", "Medium", "Freq → groups of 3/2"),
          t("Eliminate Maximum Number of Monsters", "eliminate-maximum-number-of-monsters", "Medium", "Sort by arrival time"),
          t("Maximum Profit in Job Scheduling", "maximum-profit-in-job-scheduling", "Hard", "sort + DP + BS", "40 min"),
        ],
      },
    ],
  },
  {
    id: "greedy-sec-3",
    title: "3) Jump / Reachability Greedy",
    subSections: [
      {
        id: "greedy-sec-3-sub-1",
        title: "Jump / reach",
        topics: [
          { ...t("Jump Game", "jump-game", "Medium", "IMP (farthest reach)"), startHere: true },
          t("Jump Game II", "jump-game-ii", "Medium", "IMP (BFS-levels greedy)"),
          t("Gas Station", "gas-station", "Medium", "IMP (if total ≥ 0, unique start)"),
          t("Video Stitching", "video-stitching", "Medium", "IMP (jump-game flavor)"),
          t("Minimum Number of Taps to Open to Water a Garden", "minimum-number-of-taps-to-open-to-water-a-garden", "Hard", "convert to jump game II", "35 min"),
          t("Maximize Distance to Closest Person", "maximize-distance-to-closest-person", "Medium", "Max gap / 2"),
        ],
      },
    ],
  },
  {
    id: "greedy-sec-4",
    title: "4) Two-Pointer Greedy",
    subSections: [
      {
        id: "greedy-sec-4-sub-1",
        title: "Two-pointer",
        topics: [
          { ...t("Container With Most Water", "container-with-most-water", "Medium", "IMP (move shorter wall)"), startHere: true },
          t("Bag of Tokens", "bag-of-tokens", "Medium", "IMP (buy cheap, sell dear)"),
          t("Minimize Maximum Pair Sum in Array", "minimize-maximum-pair-sum-in-array", "Medium", "Pair smallest with largest"),
          t("3Sum Smaller", "3sum-smaller", "Medium", "Prem, sort + 2-ptr count"),
        ],
      },
    ],
  },
  {
    id: "greedy-sec-5",
    title: "5) String Greedy",
    subSections: [
      {
        id: "greedy-sec-5-sub-1",
        title: "String",
        topics: [
          { ...t("Partition Labels", "partition-labels", "Medium", "IMP (last-index of each char)"), startHere: true },
          t("Reorganize String", "reorganize-string", "Medium", "IMP (most-frequent first, heap)"),
          t("Increasing Triplet Subsequence", "increasing-triplet-subsequence", "Medium", "IMP (track two smallest)"),
          t("Optimal Partition of String", "optimal-partition-of-string", "Medium", "Cut when repeat seen"),
          t("Maximum 69 Number", "maximum-69-number", "Easy", "First 6 → 9"),
          t("Minimum Add to Make Parentheses Valid", "minimum-add-to-make-parentheses-valid", "Medium", "Counter"),
          t("Split Array into Consecutive Subsequences", "split-array-into-consecutive-subsequences", "Medium", "Greedy extend / new run"),
        ],
      },
    ],
  },
  {
    id: "greedy-sec-6",
    title: "6) Stack / Monotonic Greedy",
    subSections: [
      {
        id: "greedy-sec-6-sub-1",
        title: "Monotonic + greedy",
        topics: [
          { ...t("Remove K Digits", "remove-k-digits", "Medium", "IMP (pop bigger while k left)"), startHere: true },
          t("Remove Duplicate Letters", "remove-duplicate-letters", "Medium", "IMP (smallest lexicographic)"),
          t("Smallest Subsequence of Distinct Characters", "smallest-subsequence-of-distinct-characters", "Medium", "Same as above"),
          t("Find the Most Competitive Subsequence", "find-the-most-competitive-subsequence", "Medium", "IMP (keep k, monotonic)"),
          t("Create Maximum Number", "create-maximum-number", "Hard", "split k + merge greedily", "45 min"),
        ],
      },
    ],
  },
  {
    id: "greedy-sec-7",
    title: "7) Heap-Based Greedy",
    subSections: [
      {
        id: "greedy-sec-7-sub-1",
        title: "Heap greedy",
        topics: [
          { ...t("Task Scheduler", "task-scheduler", "Medium", "IMP (most-frequent first)"), startHere: true },
          t("Furthest Building You Can Reach", "furthest-building-you-can-reach", "Medium", "IMP (ladders on biggest jumps)"),
          t("Minimum Number of Refueling Stops", "minimum-number-of-refueling-stops", "Hard", "max-heap of passed fuel", "35 min"),
          t("IPO", "ipo", "Hard", "two heaps", "35 min"),
          t("Minimum Cost to Connect Sticks", "minimum-cost-to-connect-sticks", "Medium", "Prem, Huffman greedy"),
          t("Single-Threaded CPU", "single-threaded-cpu", "Medium", "Sort + min-heap"),
        ],
      },
    ],
  },
  {
    id: "greedy-sec-8",
    title: "8) Advanced / Hard Greedy",
    subSections: [
      {
        id: "greedy-sec-8-sub-1",
        title: "Advanced",
        topics: [
          t("Candy", "candy", "Hard", "IMP (two passes L→R, R→L)", "35 min"),
          t("Patching Array", "patching-array", "Hard", "IMP (extend reachable sum)", "40 min"),
          t("Minimum Number of Increments on Subarrays to Form a Target Array", "minimum-number-of-increments-on-subarrays-to-form-a-target-array", "Hard", "sum of upward steps", "35 min"),
          t("Maximum Number of Non-Overlapping Substrings", "maximum-number-of-non-overlapping-substrings", "Hard", "expand to valid intervals", "40 min"),
          t("Course Schedule III", "course-schedule-iii", "Hard", "sort by deadline + max-heap", "35 min"),
          t("132 Pattern", "132-pattern", "Medium", "Monotonic stack + greedy k"),
        ],
      },
    ],
  },
  {
    id: "greedy-sec-9",
    title: "9) To Do (Later)",
    subSections: [
      {
        id: "greedy-sec-9-sub-1",
        title: "Later",
        topics: [
          t("Stamping The Sequence", "stamping-the-sequence", "Hard", "", "40 min"),
          t("Jump Game VII", "jump-game-vii", "Medium"),
          t("Minimum Deletions to Make Character Frequencies Unique", "minimum-deletions-to-make-character-frequencies-unique", "Medium"),
          t("Minimum Cost to Hire K Workers", "minimum-cost-to-hire-k-workers", "Hard", "", "40 min"),
        ],
      },
    ],
  },
];

const __all = greedySheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const greedySheetMeta = {
  id: "greedy-typewise",
  title: "Greedy Questions Sheet (Type-wise)",
  description:
    "Type-wise Greedy question bank covering ~100% of LeetCode greedy problems — classics, interval scheduling, sort-based, jump/reachability, two-pointer, string, monotonic, heap greedy & advanced hard.",
  lastUpdated: "July 9, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
