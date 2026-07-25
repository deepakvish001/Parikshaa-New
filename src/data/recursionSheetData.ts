import { Section } from "./dsaLevel1Types";

type Diff = "Easy" | "Medium" | "Hard";
const yt = (title: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent("striver " + title)}`;
const lc = (slug: string) => `https://leetcode.com/problems/${slug}/`;
const gfg = (q: string) =>
  `https://www.geeksforgeeks.org/?s=${encodeURIComponent(q)}`;

let __id = 0;
const t = (
  title: string,
  slug: string,
  difficulty: Diff,
  note = "",
  estTime = "25 min",
) => ({
  id: `rec-${++__id}`,
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

const w = (title: string, difficulty: Diff = "Easy", note = "", estTime = "15 min") => ({
  id: `rec-${++__id}`,
  title,
  completed: false,
  difficulty,
  resourceType: "youtube" as const,
  resourceUrl: yt(title),
  practiceUrl: gfg(title),
  note,
  isRevision: false,
  estTime,
});

export const recursionSheetSections: Section[] = [
  {
    id: "rec-sec-0",
    title: "0) Recursion Warm-ups (Foundational Ladder)",
    subSections: [
      {
        id: "rec-sec-0-sub-1",
        title: "Warm-ups (pen & paper / GFG)",
        topics: [
          { ...w("Print 1 to N / N to 1", "Easy", "IMP (base case + single call)"), startHere: true },
          w("Factorial of N", "Easy", "Return value combine"),
          w("Sum of first N numbers", "Easy", "n + f(n-1) pattern"),
          w("Power(a, b) — fast power", "Easy", "IMP (O(log n) fast pow)"),
          w("GCD (Euclid)", "Easy", "gcd(b, a%b)"),
          w("Sum / Max of array (by index)", "Easy", "Array recursion (index passing)"),
          w("Reverse an array (2-ptr recursive)", "Easy", "In-place recursion"),
          w("Check if array is sorted", "Easy", "Boolean combine"),
          w("First & last index of element", "Easy", "Return propagation"),
          w("String reverse / palindrome check", "Easy", "String recursion"),
          w("Tower of Hanoi", "Medium", "IMP (2 recursive calls + move)", "25 min"),
          w("Josephus problem", "Medium", "Circular elimination", "25 min"),
        ],
      },
    ],
  },
  {
    id: "rec-sec-1",
    title: "1) Recursion on Numbers / Math",
    subSections: [
      {
        id: "rec-sec-1-sub-1",
        title: "Numbers / Math",
        topics: [
          { ...t("Pow(x, n)", "powx-n", "Medium", "IMP (fast power: x² = pow(x, n/2)²)"), startHere: true },
          t("Fibonacci Number", "fibonacci-number", "Easy", "IMP (naive recursion tree)"),
          t("N-th Tribonacci Number", "n-th-tribonacci-number", "Easy", "3 calls"),
          t("Sqrt(x)", "sqrtx", "Easy", "Recursive binary search"),
          t("Count and Say", "count-and-say", "Medium", "Build on previous term"),
          t("K-th Symbol in Grammar", "k-th-symbol-in-grammar", "Medium", "IMP (map k to parent)"),
          t("Elimination Game", "elimination-game", "Medium", "IMP (recurse on remaining)", "30 min"),
          t("Find the Winner of the Circular Game", "find-the-winner-of-the-circular-game", "Medium", "IMP (Josephus recurrence)"),
        ],
      },
    ],
  },
  {
    id: "rec-sec-2",
    title: "2) Recursion on Linked Lists",
    subSections: [
      {
        id: "rec-sec-2-sub-1",
        title: "Linked List recursion",
        topics: [
          { ...t("Reverse Linked List", "reverse-linked-list", "Easy", "IMP (recursive reverse — classic)"), startHere: true },
          t("Merge Two Sorted Lists", "merge-two-sorted-lists", "Easy", "IMP (pick smaller + recurse)"),
          t("Swap Nodes in Pairs", "swap-nodes-in-pairs", "Medium", "IMP (swap 2, recurse on rest)"),
          t("Add Two Numbers", "add-two-numbers", "Medium", "Carry as recursion param"),
          t("Palindrome Linked List", "palindrome-linked-list", "Easy", "Recursive front-back compare"),
          t("Reverse Nodes in k-Group", "reverse-nodes-in-k-group", "Hard", "Reverse k + recurse", "35 min"),
        ],
      },
    ],
  },
  {
    id: "rec-sec-3",
    title: "3) Divide & Conquer",
    subSections: [
      {
        id: "rec-sec-3-sub-1",
        title: "Divide & Conquer",
        topics: [
          { ...t("Sort an Array", "sort-an-array", "Medium", "IMP (merge sort + quick sort)"), startHere: true },
          t("Majority Element", "majority-element", "Easy", "D&C: majority of halves"),
          t("Maximum Subarray", "maximum-subarray", "Medium", "D&C cross-split version"),
          t("Different Ways to Add Parentheses", "different-ways-to-add-parentheses", "Medium", "IMP (split at each operator)"),
          t("Count of Smaller Numbers After Self", "count-of-smaller-numbers-after-self", "Hard", "IMP (merge sort counting)", "40 min"),
          t("Reverse Pairs", "reverse-pairs", "Hard", "Merge sort counting", "40 min"),
          t("Beautiful Array", "beautiful-array", "Medium", "D&C construction", "30 min"),
          t("The Skyline Problem", "the-skyline-problem", "Hard", "D&C merge intervals", "45 min"),
        ],
      },
    ],
  },
  {
    id: "rec-sec-4",
    title: "4) Recursion → Subsequences & Subsets (Bridge to Backtracking)",
    subSections: [
      {
        id: "rec-sec-4-sub-1",
        title: "Subsequences / choose-not-choose",
        topics: [
          { ...t("Subsets", "subsets", "Medium", "IMP (include/exclude recursion)"), startHere: true },
          t("Subsets II", "subsets-ii", "Medium", "Skip duplicates"),
          t("Letter Combinations of a Phone Number", "letter-combinations-of-a-phone-number", "Medium", "IMP (recurse per digit)"),
          t("Combinations", "combinations", "Medium", "Choose k, recurse"),
          t("Permutations", "permutations", "Medium", "IMP (order via used[])"),
          t("Generate Parentheses", "generate-parentheses", "Medium", "IMP (open/close choice)"),
        ],
      },
    ],
  },
  {
    id: "rec-sec-5",
    title: "5) Tree Recursion",
    subSections: [
      {
        id: "rec-sec-5-sub-1",
        title: "Tree recursion",
        topics: [
          { ...t("Maximum Depth of Binary Tree", "maximum-depth-of-binary-tree", "Easy", "IMP (1 + max(left, right))"), startHere: true },
          t("Same Tree", "same-tree", "Easy", "Compare recursively"),
          t("Invert Binary Tree", "invert-binary-tree", "Easy", "IMP (swap + recurse)"),
          t("Path Sum", "path-sum", "Easy", "Subtract as you go"),
          t("Balanced Binary Tree", "balanced-binary-tree", "Easy", "Return height + flag"),
          t("Diameter of Binary Tree", "diameter-of-binary-tree", "Easy", "IMP (return height, update global)"),
          t("Merge Two Binary Trees", "merge-two-binary-trees", "Easy", "Combine two nodes"),
        ],
      },
    ],
  },
  {
    id: "rec-sec-6",
    title: "6) Recursion → Memoization (Bridge to DP)",
    subSections: [
      {
        id: "rec-sec-6-sub-1",
        title: "Recursion + memo",
        topics: [
          { ...t("Climbing Stairs", "climbing-stairs", "Easy", "IMP (naive rec → add memo → DP)"), startHere: true },
          t("House Robber", "house-robber", "Medium", "IMP (pick/skip recursion + memo)"),
          t("Coin Change", "coin-change", "Medium", "IMP (try each coin, memo)", "30 min"),
          t("Unique Paths", "unique-paths", "Medium", "Recurse right + down"),
          t("Decode Ways", "decode-ways", "Medium", "1 or 2 digit recursion"),
          t("Word Break", "word-break", "Medium", "IMP (try each prefix, memo)"),
          t("Longest Common Subsequence", "longest-common-subsequence", "Medium", "IMP (match/skip recursion, 2D memo)", "30 min"),
        ],
      },
    ],
  },
  {
    id: "rec-sec-7",
    title: "7) Advanced / Classic Recursion",
    subSections: [
      {
        id: "rec-sec-7-sub-1",
        title: "Advanced",
        topics: [
          t("Unique Binary Search Trees II", "unique-binary-search-trees-ii", "Medium", "IMP (each value as root)", "35 min"),
          t("Strobogrammatic Number II", "strobogrammatic-number-ii", "Medium", "Prem, IMP (build from center outward)", "30 min"),
          t("Expression Add Operators", "expression-add-operators", "Hard", "Recurse with prev-operand", "45 min"),
          t("Permutation Sequence", "permutation-sequence", "Hard", "Recurse by factorial blocks", "35 min"),
          t("Number of Ways to Reorder Array to Get Same BST", "number-of-ways-to-reorder-array-to-get-same-bst", "Hard", "Recurse on subtrees + combinatorics", "45 min"),
          t("Special Binary String", "special-binary-string", "Hard", "Recurse + sort sub-strings", "45 min"),
        ],
      },
    ],
  },
  {
    id: "rec-sec-8",
    title: "8) To Do (Later)",
    subSections: [
      {
        id: "rec-sec-8-sub-1",
        title: "Later",
        topics: [
          t("Predict the Winner", "predict-the-winner", "Medium"),
          t("Different Ways to Add Parentheses", "different-ways-to-add-parentheses", "Medium"),
          t("Beautiful Array", "beautiful-array", "Medium"),
        ],
      },
    ],
  },
];

const __all = recursionSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const recursionSheetMeta = {
  id: "recursion-typewise",
  title: "Recursion Questions Sheet (Type-wise)",
  description:
    "Type-wise Recursion sheet — the FOUNDATION for Backtracking, Trees, DP & D&C. Warm-ups, numbers/math, linked list, divide & conquer, subsets bridge, tree recursion, memo bridge & advanced classics.",
  lastUpdated: "July 9, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
