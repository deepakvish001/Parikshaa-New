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
  id: `dp-${++__id}`,
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

export const dpSheetSections: Section[] = [
  {
    id: "dp-sec-0",
    title: "0) 1D Linear DP (Fibonacci-style / Climbing)",
    subSections: [
      {
        id: "dp-sec-0-sub-1",
        title: "Basics",
        topics: [
          { ...t("Climbing Stairs", "climbing-stairs", "Easy", "IMP (the 'hello world' of DP)", "15 min"), startHere: true },
          t("Fibonacci Number", "fibonacci-number", "Easy", "Memo vs tab", "15 min"),
          t("N-th Tribonacci Number", "n-th-tribonacci-number", "Easy", "", "15 min"),
          t("Min Cost Climbing Stairs", "min-cost-climbing-stairs", "Easy", "IMP", "20 min"),
          t("Decode Ways", "decode-ways", "Medium", "IMP (1 or 2 digit choice)", "25 min"),
          t("Count Ways to Build Good Strings", "count-ways-to-build-good-strings", "Medium"),
          t("Number of Ways to Stay in the Same Place After Some Steps", "number-of-ways-to-stay-in-the-same-place-after-some-steps", "Hard", "Bounded steps", "35 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-1",
    title: "1) House Robber (Pick vs Skip)",
    subSections: [
      {
        id: "dp-sec-1-sub-1",
        title: "Pick vs skip",
        topics: [
          { ...t("House Robber", "house-robber", "Medium", "IMP (base pick/skip)"), startHere: true },
          t("House Robber II", "house-robber-ii", "Medium", "IMP (circular → 2 runs)"),
          t("House Robber III", "house-robber-iii", "Medium", "Tree DP"),
          t("Delete and Earn", "delete-and-earn", "Medium", "IMP (bucket → house robber)"),
          t("Pizza With 3n Slices", "pizza-with-3n-slices", "Hard", "Circular pick k", "35 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-2",
    title: "2) Kadane / Max Subarray",
    subSections: [
      {
        id: "dp-sec-2-sub-1",
        title: "Kadane",
        topics: [
          { ...t("Maximum Subarray", "maximum-subarray", "Medium", "IMP (dp = extend or restart)"), startHere: true },
          t("Maximum Product Subarray", "maximum-product-subarray", "Medium", "IMP (track min & max)"),
          t("Maximum Sum Circular Subarray", "maximum-sum-circular-subarray", "Medium", "Total − minKadane"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-3",
    title: "3) 0/1 Knapsack (Subset / Partition / Target Sum)",
    subSections: [
      {
        id: "dp-sec-3-sub-1",
        title: "0/1 Knapsack",
        topics: [
          { ...t("Partition Equal Subset Sum", "partition-equal-subset-sum", "Medium", "IMP (subset sum = total/2)"), startHere: true },
          t("Target Sum", "target-sum", "Medium", "IMP (+/− → subset sum)"),
          t("Last Stone Weight II", "last-stone-weight-ii", "Medium", "IMP (minimize diff)"),
          t("Ones and Zeroes", "ones-and-zeroes", "Medium", "2D knapsack"),
          t("Partition to K Equal Sum Subsets", "partition-to-k-equal-sum-subsets", "Hard", "Bitmask/backtrack", "35 min"),
          t("Tallest Billboard", "tallest-billboard", "Hard", "DP on difference", "40 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-4",
    title: "4) Unbounded Knapsack (Coin Change / Combinations)",
    subSections: [
      {
        id: "dp-sec-4-sub-1",
        title: "Unbounded knapsack",
        topics: [
          { ...t("Coin Change", "coin-change", "Medium", "IMP (min coins)"), startHere: true },
          t("Coin Change II", "coin-change-ii", "Medium", "IMP (combinations — coin outer loop!)"),
          t("Combination Sum IV", "combination-sum-iv", "Medium", "IMP (permutations — target outer loop)"),
          t("Perfect Squares", "perfect-squares", "Medium", "IMP (min squares)"),
          t("Integer Break", "integer-break", "Medium", "Max product"),
          t("Minimum Cost For Tickets", "minimum-cost-for-tickets", "Medium"),
          t("Word Break", "word-break", "Medium", "IMP (dp + dict)"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-5",
    title: "5) Grid / 2D Path DP",
    subSections: [
      {
        id: "dp-sec-5-sub-1",
        title: "Grid DP",
        topics: [
          { ...t("Unique Paths", "unique-paths", "Medium", "IMP (base grid DP)"), startHere: true },
          t("Unique Paths II", "unique-paths-ii", "Medium", "IMP (obstacles)"),
          t("Minimum Path Sum", "minimum-path-sum", "Medium", "IMP"),
          t("Triangle", "triangle", "Medium", "Bottom-up"),
          t("Minimum Falling Path Sum", "minimum-falling-path-sum", "Medium"),
          t("Maximal Square", "maximal-square", "Medium", "IMP (dp = min of 3 neighbors + 1)"),
          t("Maximal Rectangle", "maximal-rectangle", "Hard", "Histogram per row", "40 min"),
          t("Dungeon Game", "dungeon-game", "Hard", "IMP (reverse DP from end)", "35 min"),
          t("Cherry Pickup", "cherry-pickup", "Hard", "Two paths simultaneously", "40 min"),
          t("Cherry Pickup II", "cherry-pickup-ii", "Hard", "Two robots", "40 min"),
          t("Minimum Falling Path Sum II", "minimum-falling-path-sum-ii", "Hard", "Track 2 mins", "35 min"),
          t("Paths in Matrix Whose Sum Is Divisible by K", "paths-in-matrix-whose-sum-is-divisible-by-k", "Hard", "Extra state = remainder", "35 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-6",
    title: "6) Longest Increasing Subsequence (LIS family)",
    subSections: [
      {
        id: "dp-sec-6-sub-1",
        title: "LIS family",
        topics: [
          { ...t("Longest Increasing Subsequence", "longest-increasing-subsequence", "Medium", "IMP (base)"), startHere: true },
          t("Number of Longest Increasing Subsequence", "number-of-longest-increasing-subsequence", "Medium", "Length + count"),
          t("Largest Divisible Subset", "largest-divisible-subset", "Medium", "IMP (sort + LIS + reconstruct)"),
          t("Longest String Chain", "longest-string-chain", "Medium", "IMP (LIS on predecessors)"),
          t("Russian Doll Envelopes", "russian-doll-envelopes", "Hard", "2D LIS", "35 min"),
          t("Longest Arithmetic Subsequence", "longest-arithmetic-subsequence", "Medium", "dp[i][diff]"),
          t("Maximum Length of Pair Chain", "maximum-length-of-pair-chain", "Medium", "Greedy or LIS"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-7",
    title: "7) Two-Sequence DP (LCS / Edit Distance)",
    subSections: [
      {
        id: "dp-sec-7-sub-1",
        title: "2-sequence DP",
        topics: [
          { ...t("Longest Common Subsequence", "longest-common-subsequence", "Medium", "IMP (base 2-seq DP)"), startHere: true },
          t("Edit Distance", "edit-distance", "Medium", "IMP (insert/delete/replace)", "30 min"),
          t("Delete Operation for Two Strings", "delete-operation-for-two-strings", "Medium", "via LCS"),
          t("Uncrossed Lines", "uncrossed-lines", "Medium", "= LCS in disguise"),
          t("Interleaving String", "interleaving-string", "Medium", "2D DP"),
          t("Distinct Subsequences", "distinct-subsequences", "Hard", "Counting DP", "35 min"),
          t("Shortest Common Supersequence", "shortest-common-supersequence", "Hard", "LCS + reconstruct", "35 min"),
          t("Wildcard Matching", "wildcard-matching", "Hard", "?/*", "35 min"),
          t("Regular Expression Matching", "regular-expression-matching", "Hard", "IMP (./*)", "40 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-8",
    title: "8) Palindrome DP",
    subSections: [
      {
        id: "dp-sec-8-sub-1",
        title: "Palindrome DP",
        topics: [
          { ...t("Longest Palindromic Subsequence", "longest-palindromic-subsequence", "Medium", "IMP (= LCS(s, reverse(s)))"), startHere: true },
          t("Longest Palindromic Substring", "longest-palindromic-substring", "Medium", "IMP (expand or DP)"),
          t("Palindromic Substrings", "palindromic-substrings", "Medium", "Count"),
          t("Minimum Insertion Steps to Make a String Palindrome", "minimum-insertion-steps-to-make-a-string-palindrome", "Hard", "n − LPS", "30 min"),
          t("Palindrome Partitioning II", "palindrome-partitioning-ii", "Hard", "Min cuts DP", "35 min"),
          t("Count Different Palindromic Subsequences", "count-different-palindromic-subsequences", "Hard", "Interval DP", "40 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-9",
    title: "9) Interval / Partition DP (Burst Balloons / MCM)",
    subSections: [
      {
        id: "dp-sec-9-sub-1",
        title: "Interval DP",
        topics: [
          { ...t("Burst Balloons", "burst-balloons", "Hard", "IMP (fix last balloon to burst)", "40 min"), startHere: true },
          t("Minimum Cost to Cut a Stick", "minimum-cost-to-cut-a-stick", "Hard", "IMP (MCM template)", "35 min"),
          t("Minimum Score Triangulation of Polygon", "minimum-score-triangulation-of-polygon", "Medium", "IMP (fix third vertex)"),
          t("Guess Number Higher or Lower II", "guess-number-higher-or-lower-ii", "Medium", "Minimax interval", "30 min"),
          t("Partition Array for Maximum Sum", "partition-array-for-maximum-sum", "Medium", "IMP (partition DP)"),
          t("Remove Boxes", "remove-boxes", "Hard", "3D interval DP", "45 min"),
          t("Strange Printer", "strange-printer", "Hard", "Interval", "35 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-10",
    title: "10) State Machine DP (Stock Buy & Sell)",
    subSections: [
      {
        id: "dp-sec-10-sub-1",
        title: "Stock series",
        topics: [
          { ...t("Best Time to Buy and Sell Stock", "best-time-to-buy-and-sell-stock", "Easy", "IMP (1 transaction)", "20 min"), startHere: true },
          t("Best Time to Buy and Sell Stock II", "best-time-to-buy-and-sell-stock-ii", "Medium", "IMP (unlimited)"),
          t("Best Time to Buy and Sell Stock with Cooldown", "best-time-to-buy-and-sell-stock-with-cooldown", "Medium", "IMP (3 states)"),
          t("Best Time to Buy and Sell Stock with Transaction Fee", "best-time-to-buy-and-sell-stock-with-transaction-fee", "Medium", "IMP"),
          t("Best Time to Buy and Sell Stock III", "best-time-to-buy-and-sell-stock-iii", "Hard", "at most 2", "35 min"),
          t("Best Time to Buy and Sell Stock IV", "best-time-to-buy-and-sell-stock-iv", "Hard", "IMP (at most k)", "35 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-11",
    title: "11) Partition & Decision DP (Arrays)",
    subSections: [
      {
        id: "dp-sec-11-sub-1",
        title: "Partition DP",
        topics: [
          t("Jump Game", "jump-game", "Medium", "Greedy best, DP intro"),
          t("Jump Game II", "jump-game-ii", "Medium", "Min jumps"),
          t("Filling Bookcase Shelves", "filling-bookcase-shelves", "Medium", "IMP (partition into rows)"),
          t("Minimum Difficulty of a Job Schedule", "minimum-difficulty-of-a-job-schedule", "Hard", "Partition into d days", "35 min"),
          t("Number of Dice Rolls With Target Sum", "number-of-dice-rolls-with-target-sum", "Medium", "IMP (bounded knapsack counting)"),
          t("Domino and Tromino Tiling", "domino-and-tromino-tiling", "Medium", "IMP (tiling recurrence)"),
          t("Stickers to Spell Word", "stickers-to-spell-word", "Hard", "Bitmask + DP", "40 min"),
          t("Word Break II", "word-break-ii", "Hard", "DP + backtrack", "35 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-12",
    title: "12) Bitmask DP",
    subSections: [
      {
        id: "dp-sec-12-sub-1",
        title: "Bitmask DP",
        topics: [
          { ...t("Partition to K Equal Sum Subsets", "partition-to-k-equal-sum-subsets", "Hard", "IMP (mask of used)", "35 min"), startHere: true },
          t("Shortest Path Visiting All Nodes", "shortest-path-visiting-all-nodes", "Hard", "IMP (BFS + mask)", "40 min"),
          t("Smallest Sufficient Team", "smallest-sufficient-team", "Hard", "IMP (skills as mask)", "40 min"),
          t("Find the Shortest Superstring", "find-the-shortest-superstring", "Hard", "TSP-style", "45 min"),
          t("Number of Ways to Wear Different Hats to Each Other", "number-of-ways-to-wear-different-hats-to-each-other", "Hard", "Assign by hats", "40 min"),
          t("Maximum Students Taking Exam", "maximum-students-taking-exam", "Hard", "Row-by-row mask", "40 min"),
          t("Parallel Courses II", "parallel-courses-ii", "Hard", "Mask of taken", "45 min"),
          t("Minimum Cost to Connect Two Groups of Points", "minimum-cost-to-connect-two-groups-of-points", "Hard", "Mask on group 2", "40 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-13",
    title: "13) DP on Trees",
    subSections: [
      {
        id: "dp-sec-13-sub-1",
        title: "Tree DP",
        topics: [
          { ...t("House Robber III", "house-robber-iii", "Medium", "IMP (rob vs skip pair)"), startHere: true },
          t("Binary Tree Maximum Path Sum", "binary-tree-maximum-path-sum", "Hard", "IMP (return one arm)", "35 min"),
          t("Diameter of Binary Tree", "diameter-of-binary-tree", "Easy", "Return height, update global", "20 min"),
          t("Binary Tree Cameras", "binary-tree-cameras", "Hard", "3-state greedy DP", "40 min"),
          t("Longest Univalue Path", "longest-univalue-path", "Medium"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-14",
    title: "14) Digit DP",
    subSections: [
      {
        id: "dp-sec-14-sub-1",
        title: "Digit DP",
        topics: [
          t("Count Numbers with Unique Digits", "count-numbers-with-unique-digits", "Medium", "Intro (combinatorics/DP)"),
          t("Rotated Digits", "rotated-digits", "Medium", "Warm-up"),
          { ...t("Numbers At Most N Given Digit Set", "numbers-at-most-n-given-digit-set", "Hard", "IMP (base digit DP)", "35 min"), startHere: true },
          t("Non-negative Integers without Consecutive Ones", "non-negative-integers-without-consecutive-ones", "Hard", "Binary digit DP", "35 min"),
          t("Numbers With Repeated Digits", "numbers-with-repeated-digits", "Hard", "Complement + digit DP", "40 min"),
          t("Count Special Integers", "count-special-integers", "Hard", "Mask + digit DP", "40 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-15",
    title: "15) Game Theory / Minimax DP",
    subSections: [
      {
        id: "dp-sec-15-sub-1",
        title: "Game DP",
        topics: [
          t("Nim Game", "nim-game", "Easy", "Pattern (n%4)", "15 min"),
          t("Divisor Game", "divisor-game", "Easy", "Parity", "15 min"),
          { ...t("Predict the Winner", "predict-the-winner", "Medium", "IMP (interval minimax)"), startHere: true },
          t("Stone Game", "stone-game", "Medium", "Same as Predict the Winner"),
          t("Stone Game II", "stone-game-ii", "Medium", "state = (i, M)", "35 min"),
          t("Stone Game III", "stone-game-iii", "Hard", "Take 1-3", "35 min"),
          t("Can I Win", "can-i-win", "Medium", "Bitmask + game", "35 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-16",
    title: "16) Counting / Catalan / Probability DP",
    subSections: [
      {
        id: "dp-sec-16-sub-1",
        title: "Counting DP",
        topics: [
          { ...t("Unique Binary Search Trees", "unique-binary-search-trees", "Medium", "IMP (Catalan)"), startHere: true },
          t("Different Ways to Add Parentheses", "different-ways-to-add-parentheses", "Medium", "IMP (divide by operator)"),
          t("Knight Probability in Chessboard", "knight-probability-in-chessboard", "Medium", "IMP (prob DP over moves)"),
          t("Out of Boundary Paths", "out-of-boundary-paths", "Medium", "Counting paths"),
          t("Count Vowels Permutation", "count-vowels-permutation", "Hard", "Transition rules", "30 min"),
          t("Student Attendance Record II", "student-attendance-record-ii", "Hard", "state = (A count, trailing L)", "35 min"),
          t("Dice Roll Simulation", "dice-roll-simulation", "Hard", "Consecutive limit", "35 min"),
          t("Soup Servings", "soup-servings", "Medium", "Probability + threshold trick", "30 min"),
          t("New 21 Game", "new-21-game", "Medium", "Prob DP + sliding window", "30 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-17",
    title: "17) Advanced / Hard",
    subSections: [
      {
        id: "dp-sec-17-sub-1",
        title: "Advanced",
        topics: [
          t("Frog Jump", "frog-jump", "Hard", "state = (stone, lastJump)", "35 min"),
          t("Freedom Trail", "freedom-trail", "Hard", "DP over ring positions", "40 min"),
          t("Profitable Schemes", "profitable-schemes", "Hard", "3D knapsack", "35 min"),
          t("Number of Ways to Form a Target String Given a Dictionary", "number-of-ways-to-form-a-target-string-given-a-dictionary", "Hard", "", "35 min"),
          t("Count All Valid Pickup and Delivery Options", "count-all-valid-pickup-and-delivery-options", "Hard", "Combinatorial DP", "30 min"),
          t("Minimum Cost to Merge Stones", "minimum-cost-to-merge-stones", "Hard", "Interval DP with k", "45 min"),
        ],
      },
    ],
  },
  {
    id: "dp-sec-18",
    title: "18) To Do (Later)",
    subSections: [
      {
        id: "dp-sec-18-sub-1",
        title: "Later",
        topics: [
          t("Number of Ways of Cutting a Pizza", "number-of-ways-of-cutting-a-pizza", "Hard", "", "40 min"),
          t("Allocate Mailboxes", "allocate-mailboxes", "Hard", "", "40 min"),
          t("Number of Music Playlists", "number-of-music-playlists", "Hard", "", "35 min"),
          t("Maximum AND Sum of Array", "maximum-and-sum-of-array", "Hard", "", "40 min"),
          t("Constrained Subsequence Sum", "constrained-subsequence-sum", "Hard", "", "35 min"),
        ],
      },
    ],
  },
];

const __all = dpSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const dpSheetMeta = {
  id: "dp-typewise",
  title: "Dynamic Programming Questions Sheet (Type-wise)",
  description:
    "Type-wise DP question bank covering ~100% of LeetCode DP problems — 1D linear, house robber, Kadane, knapsack, grid, LIS, 2-sequence, palindrome, interval, state machine, bitmask, tree, digit, game theory & counting.",
  lastUpdated: "July 9, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
