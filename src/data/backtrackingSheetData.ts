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
  id: `bt-${++__id}`,
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

export const backtrackingSheetSections: Section[] = [
  {
    id: "bt-sec-0",
    title: "0) Subsets (Power Set)",
    subSections: [
      {
        id: "bt-sec-0-sub-1",
        title: "Subsets",
        topics: [
          { ...t("Subsets", "subsets", "Medium", "IMP (base template)", "20 min"), startHere: true },
          t("Subsets II", "subsets-ii", "Medium", "IMP (sort + skip duplicates)"),
          t("Letter Case Permutation", "letter-case-permutation", "Medium", "Branch on each letter"),
          t("Generalized Abbreviation", "generalized-abbreviation", "Medium", "Prem, keep/abbreviate", "30 min"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-1",
    title: "1) Combinations",
    subSections: [
      {
        id: "bt-sec-1-sub-1",
        title: "Combinations",
        topics: [
          { ...t("Combinations", "combinations", "Medium", "IMP (base + pruning on remaining)"), startHere: true },
          t("Combination Sum III", "combination-sum-iii", "Medium", "IMP (k numbers, sum n)"),
          t("Factor Combinations", "factor-combinations", "Medium", "Prem"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-2",
    title: "2) Permutations",
    subSections: [
      {
        id: "bt-sec-2-sub-1",
        title: "Permutations",
        topics: [
          { ...t("Permutations", "permutations", "Medium", "IMP (base, used[])"), startHere: true },
          t("Permutations II", "permutations-ii", "Medium", "IMP (sort + skip dup at same level)"),
          t("Beautiful Arrangement", "beautiful-arrangement", "Medium", "IMP (permutation + divisibility prune)"),
          t("Letter Tile Possibilities", "letter-tile-possibilities", "Medium", "Count with freq map"),
          t("Permutation Sequence", "permutation-sequence", "Hard", "Math (factorial) faster than backtrack", "35 min"),
          t("Numbers With Same Consecutive Differences", "numbers-with-same-consecutive-differences", "Medium", "Build digit by digit"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-3",
    title: "3) Combination Sum (Target-based)",
    subSections: [
      {
        id: "bt-sec-3-sub-1",
        title: "Combination Sum",
        topics: [
          { ...t("Combination Sum", "combination-sum", "Medium", "IMP (reuse allowed → same i)"), startHere: true },
          t("Combination Sum II", "combination-sum-ii", "Medium", "IMP (each once + skip dup)"),
          t("Matchsticks to Square", "matchsticks-to-square", "Medium", "IMP (4 buckets, prune)", "30 min"),
          t("Partition to K Equal Sum Subsets", "partition-to-k-equal-sum-subsets", "Hard", "k buckets", "35 min"),
          t("Splitting a String Into Descending Consecutive Values", "splitting-a-string-into-descending-consecutive-values", "Medium", "Try each split"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-4",
    title: "4) String Generation (Parentheses / Phone / IP)",
    subSections: [
      {
        id: "bt-sec-4-sub-1",
        title: "String generation",
        topics: [
          { ...t("Generate Parentheses", "generate-parentheses", "Medium", "IMP (open/close count prune)"), startHere: true },
          t("Letter Combinations of a Phone Number", "letter-combinations-of-a-phone-number", "Medium", "IMP (digit → letters)"),
          t("Restore IP Addresses", "restore-ip-addresses", "Medium", "IMP (4 segments, validate)"),
          t("Additive Number", "additive-number", "Medium", "Fix first two, verify rest"),
          t("Split a String Into the Max Number of Unique Substrings", "split-a-string-into-the-max-number-of-unique-substrings", "Medium", "Set + backtrack"),
          t("Word Break II", "word-break-ii", "Hard", "Backtrack + memo", "35 min"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-5",
    title: "5) Partitioning",
    subSections: [
      {
        id: "bt-sec-5-sub-1",
        title: "Partitioning",
        topics: [
          { ...t("Palindrome Partitioning", "palindrome-partitioning", "Medium", "IMP (cut if prefix palindrome)"), startHere: true },
          t("Split Array into Fibonacci Sequence", "split-array-into-fibonacci-sequence", "Medium", "Fix first two, extend"),
          t("Partition to K Equal Sum Subsets", "partition-to-k-equal-sum-subsets", "Hard", "k buckets", "35 min"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-6",
    title: "6) Grid / Matrix Backtracking",
    subSections: [
      {
        id: "bt-sec-6-sub-1",
        title: "Grid backtracking",
        topics: [
          { ...t("Word Search", "word-search", "Medium", "IMP (mark/unmark cells)"), startHere: true },
          t("Word Search II", "word-search-ii", "Hard", "IMP (trie + backtrack)", "40 min"),
          t("Path with Maximum Gold", "path-with-maximum-gold", "Medium", "IMP (start from each gold cell)"),
          t("Unique Paths III", "unique-paths-iii", "Hard", "Visit ALL empty cells", "35 min"),
          t("Robot Room Cleaner", "robot-room-cleaner", "Hard", "Prem, backtrack + relative dirs", "45 min"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-7",
    title: "7) Constraint Placement (N-Queens / Sudoku)",
    subSections: [
      {
        id: "bt-sec-7-sub-1",
        title: "Constraint placement",
        topics: [
          { ...t("N-Queens", "n-queens", "Hard", "IMP (col + 2 diagonal sets)", "40 min"), startHere: true },
          t("N-Queens II", "n-queens-ii", "Hard", "IMP (just count)", "35 min"),
          t("Sudoku Solver", "sudoku-solver", "Hard", "IMP (try 1-9, validate, backtrack)", "45 min"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-8",
    title: "8) Advanced / Hard (Heavy Pruning)",
    subSections: [
      {
        id: "bt-sec-8-sub-1",
        title: "Advanced",
        topics: [
          t("Expression Add Operators", "expression-add-operators", "Hard", "IMP (track prev operand for *)", "45 min"),
          t("Remove Invalid Parentheses", "remove-invalid-parentheses", "Hard", "IMP (BFS or backtrack min removals)", "40 min"),
          t("Maximum Length of a Concatenated String with Unique Characters", "maximum-length-of-a-concatenated-string-with-unique-characters", "Medium", "IMP (bitmask + backtrack)"),
          t("Maximum Score Words Formed by Letters", "maximum-score-words-formed-by-letters", "Hard", "Subset of words", "40 min"),
          t("Number of Squareful Arrays", "number-of-squareful-arrays", "Hard", "Permutation + adjacency prune", "40 min"),
          t("Split Array With Same Average", "split-array-with-same-average", "Hard", "Meet-in-middle", "45 min"),
          t("Optimal Account Balancing", "optimal-account-balancing", "Hard", "Prem, settle debts", "40 min"),
          t("Verbal Arithmetic Puzzle", "verbal-arithmetic-puzzle", "Hard", "Assign digits to letters", "45 min"),
          t("Word Squares", "word-squares", "Hard", "Prem, trie + backtrack", "45 min"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-9",
    title: "9) To Do (Later)",
    subSections: [
      {
        id: "bt-sec-9-sub-1",
        title: "Later",
        topics: [
          t("Android Unlock Patterns", "android-unlock-patterns", "Medium", "Prem"),
          t("Confusing Number II", "confusing-number-ii", "Hard", "", "35 min"),
          t("Flip Game II", "flip-game-ii", "Medium", "Prem"),
          t("Word Pattern II", "word-pattern-ii", "Medium", "Prem"),
          t("Zuma Game", "zuma-game", "Hard", "", "40 min"),
        ],
      },
    ],
  },
];

const __all = backtrackingSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const backtrackingSheetMeta = {
  id: "backtracking-typewise",
  title: "Backtracking Questions Sheet (Type-wise)",
  description:
    "Type-wise Backtracking question bank covering ~100% of LeetCode backtracking problems — subsets, combinations, permutations, target sums, string generation, partitioning, grid, N-Queens/Sudoku & advanced pruning.",
  lastUpdated: "July 9, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
