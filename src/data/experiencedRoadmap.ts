// Experienced Roadmap — Blind 75 (originally shared by Yangshun Tay on Blind.com).
// Parikshaa's curated guidance, phased by difficulty (Easy → Medium → Hard).

import type { RoadmapDifficulty } from "./beginnerRoadmap";

export const EXPERIENCED_HEADER = {
  eyebrow: "Experienced Roadmap",
  title:
    "Originally shared on Blind.com by Yangshun Tay, the Blind 75 problemset represents the highest-value questions for coding interview preparation.",
};

export const EXPERIENCED_GUIDANCE: string[] = [
  "If you're here, you are familiar with technical interviews and the patterns you need to know. Pick a language and begin working through all easy problems to build confidence.",
  "If you get stuck on a problem for more than 15 minutes, consult the Helpful Tips tab and proceed to study the solution using an AI agent/YouTube video.",
  "Once you have completed all 75 questions, I would recommend reattempting ones that gave you trouble before moving onto company-specific lists from Leetcode Premium or 1point3acres.",
  "Ensure to leverage free mock interviews on Pramp to reacclimate to brain fog/interview anxiety — you want to fail as many times practicing and not during an interview.",
  "Schedule interviews with companies that are not your first choice before interviewing with your goal companies — the practice will drastically help.",
];

export const EXPERIENCED_NEXT_STEPS: string[] = [
  "Re-solve problems that gave you trouble — if you struggled with a question, redo it until the approach is second nature.",
  "Work through remaining questions in the All Problems tab or company-specific lists from Leetcode Premium, InterviewDB, or 1point3acres to target your upcoming interviews.",
  "I highly recommend taking advantage of free mock interviews on Pramp — you want to fail as many times practicing and not during an interview.",
];

export const EXPERIENCED_ROADMAP: RoadmapDifficulty[] = [
  {
    difficulty: "Easy",
    blurb: "",
    phases: [
      {
        index: 1,
        title: "Arrays & Hashing",
        description: "Foundational lookup and counting patterns.",
        problems: [
          { title: "Two Sum", slug: "two-sum" },
          { title: "Contains Duplicate", slug: "contains-duplicate" },
          { title: "Valid Anagram", slug: "valid-anagram" },
        ],
      },
      {
        index: 2,
        title: "Two Pointers",
        description: "Scan from both ends or use fast/slow pointers.",
        problems: [{ title: "Valid Palindrome", slug: "valid-palindrome" }],
      },
      {
        index: 3,
        title: "Sliding Window",
        description: "Track a running window across an array.",
        problems: [{ title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock" }],
      },
      {
        index: 4,
        title: "Stack",
        description: "LIFO reasoning for matching and parsing.",
        problems: [{ title: "Valid Parentheses", slug: "valid-parentheses" }],
      },
      {
        index: 6,
        title: "Linked Lists",
        description: "Pointer manipulation fundamentals.",
        problems: [
          { title: "Reverse Linked List", slug: "reverse-linked-list" },
          { title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists" },
          { title: "Linked List Cycle", slug: "linked-list-cycle" },
        ],
      },
      {
        index: 7,
        title: "Trees",
        description: "Core DFS/BFS on binary trees.",
        problems: [
          { title: "Invert Binary Tree", slug: "invert-binary-tree" },
          { title: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree" },
          { title: "Same Tree", slug: "same-tree" },
          { title: "Subtree of Another Tree", slug: "subtree-of-another-tree" },
        ],
      },
      {
        index: 11,
        title: "Dynamic Programming",
        description: "Classic 1D DP warmup.",
        problems: [{ title: "Climbing Stairs", slug: "climbing-stairs" }],
      },
      {
        index: 13,
        title: "Intervals",
        description: "Sort-and-scan interval basics.",
        problems: [{ title: "Meeting Rooms", slug: "meeting-rooms" }],
      },
      {
        index: 15,
        title: "Bit Manipulation",
        description: "Bitwise tricks for counting and inverting.",
        problems: [
          { title: "Number of 1 Bits", slug: "number-of-1-bits" },
          { title: "Counting Bits", slug: "counting-bits" },
          { title: "Reverse Bits", slug: "reverse-bits" },
          { title: "Missing Number", slug: "missing-number" },
        ],
      },
    ],
  },
  {
    difficulty: "Medium",
    blurb: "",
    phases: [
      {
        index: 1,
        title: "Arrays & Hashing",
        description: "Multi-pass array strategies and hash design.",
        problems: [
          { title: "Group Anagrams", slug: "group-anagrams" },
          { title: "Encode and Decode Strings", slug: "encode-and-decode-strings" },
          { title: "Product of Array Except Self", slug: "product-of-array-except-self" },
          { title: "Longest Consecutive Sequence", slug: "longest-consecutive-sequence" },
        ],
      },
      {
        index: 2,
        title: "Two Pointers",
        description: "Sort + two-pointer patterns for k-sum and area.",
        problems: [
          { title: "3Sum", slug: "3sum" },
          { title: "Container With Most Water", slug: "container-with-most-water" },
        ],
      },
      {
        index: 3,
        title: "Sliding Window",
        description: "Variable-width windows with frequency maps.",
        problems: [
          { title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters" },
          { title: "Longest Repeating Character Replacement", slug: "longest-repeating-character-replacement" },
        ],
      },
      {
        index: 5,
        title: "Binary Search",
        description: "Binary search on rotated/modified arrays.",
        problems: [
          { title: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array" },
          { title: "Find Minimum in Rotated Sorted Array", slug: "find-minimum-in-rotated-sorted-array" },
        ],
      },
      {
        index: 6,
        title: "Linked Lists",
        description: "Compose reverse/merge/find-middle techniques.",
        problems: [
          { title: "Reorder List", slug: "reorder-list" },
          { title: "Remove Nth Node From End of List", slug: "remove-nth-node-from-end-of-list" },
        ],
      },
      {
        index: 7,
        title: "Trees",
        description: "BST validation, traversal, and construction.",
        problems: [
          { title: "Lowest Common Ancestor of a Binary Search Tree", slug: "lowest-common-ancestor-of-a-binary-search-tree" },
          { title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal" },
          { title: "Validate Binary Search Tree", slug: "validate-binary-search-tree" },
          { title: "Kth Smallest Element in a BST", slug: "kth-smallest-element-in-a-bst" },
          { title: "Construct Binary Tree from Preorder and Inorder Traversal", slug: "construct-binary-tree-from-preorder-and-inorder-traversal" },
        ],
      },
      {
        index: 8,
        title: "Tries",
        description: "Prefix trees for lookup and design.",
        problems: [
          { title: "Implement Trie (Prefix Tree)", slug: "implement-trie-prefix-tree" },
          { title: "Design Add and Search Words Data Structure", slug: "design-add-and-search-words-data-structure" },
        ],
      },
      {
        index: 9,
        title: "Heap / Priority Queue",
        description: "Top-K patterns with heaps.",
        problems: [{ title: "Top K Frequent Elements", slug: "top-k-frequent-elements" }],
      },
      {
        index: 10,
        title: "Graphs",
        description: "BFS/DFS on grids and adjacency lists.",
        problems: [
          { title: "Number of Islands", slug: "number-of-islands" },
          { title: "Clone Graph", slug: "clone-graph" },
          { title: "Pacific Atlantic Water Flow", slug: "pacific-atlantic-water-flow" },
          { title: "Course Schedule", slug: "course-schedule" },
          { title: "Graph Valid Tree", slug: "graph-valid-tree" },
          { title: "Number of Connected Components in an Undirected Graph", slug: "number-of-connected-components-in-an-undirected-graph" },
        ],
      },
      {
        index: 11,
        title: "Dynamic Programming",
        description: "Classic 1D/2D DP recurrences.",
        problems: [
          { title: "House Robber", slug: "house-robber" },
          { title: "House Robber II", slug: "house-robber-ii" },
          { title: "Longest Palindromic Substring", slug: "longest-palindromic-substring" },
          { title: "Palindromic Substrings", slug: "palindromic-substrings" },
          { title: "Decode Ways", slug: "decode-ways" },
          { title: "Coin Change", slug: "coin-change" },
          { title: "Maximum Product Subarray", slug: "maximum-product-subarray" },
          { title: "Word Break", slug: "word-break" },
          { title: "Longest Increasing Subsequence", slug: "longest-increasing-subsequence" },
          { title: "Longest Common Subsequence", slug: "longest-common-subsequence" },
          { title: "Unique Paths", slug: "unique-paths" },
          { title: "Combination Sum IV", slug: "combination-sum-iv" },
        ],
      },
      {
        index: 12,
        title: "Greedy",
        description: "Local choices that yield global optima.",
        problems: [
          { title: "Maximum Subarray", slug: "maximum-subarray" },
          { title: "Jump Game", slug: "jump-game" },
        ],
      },
      {
        index: 13,
        title: "Intervals",
        description: "Sort, merge, and schedule intervals.",
        problems: [
          { title: "Insert Interval", slug: "insert-interval" },
          { title: "Merge Intervals", slug: "merge-intervals" },
          { title: "Non-overlapping Intervals", slug: "non-overlapping-intervals" },
          { title: "Meeting Rooms II", slug: "meeting-rooms-ii" },
        ],
      },
      {
        index: 14,
        title: "Matrix",
        description: "2D traversal, rotation, and in-place marking.",
        problems: [
          { title: "Set Matrix Zeroes", slug: "set-matrix-zeroes" },
          { title: "Spiral Matrix", slug: "spiral-matrix" },
          { title: "Rotate Image", slug: "rotate-image" },
          { title: "Word Search", slug: "word-search" },
        ],
      },
      {
        index: 15,
        title: "Bit Manipulation",
        description: "Bitwise arithmetic without operators.",
        problems: [{ title: "Sum of Two Integers", slug: "sum-of-two-integers" }],
      },
    ],
  },
  {
    difficulty: "Hard",
    blurb: "",
    phases: [
      {
        index: 3,
        title: "Sliding Window",
        description: "Advanced shrinking-window with frequency maps.",
        problems: [{ title: "Minimum Window Substring", slug: "minimum-window-substring" }],
      },
      {
        index: 6,
        title: "Linked Lists",
        description: "Divide-and-conquer with heaps on lists.",
        problems: [{ title: "Merge k Sorted Lists", slug: "merge-k-sorted-lists" }],
      },
      {
        index: 7,
        title: "Trees",
        description: "Global-state DFS and serialization.",
        problems: [
          { title: "Binary Tree Maximum Path Sum", slug: "binary-tree-maximum-path-sum" },
          { title: "Serialize and Deserialize Binary Tree", slug: "serialize-and-deserialize-binary-tree" },
        ],
      },
      {
        index: 8,
        title: "Tries",
        description: "Backtracking over a trie on a grid.",
        problems: [{ title: "Word Search II", slug: "word-search-ii" }],
      },
      {
        index: 9,
        title: "Heap / Priority Queue",
        description: "Two-heap design for streaming medians.",
        problems: [{ title: "Find Median from Data Stream", slug: "find-median-from-data-stream" }],
      },
      {
        index: 10,
        title: "Graphs",
        description: "Topological sort on inferred graphs.",
        problems: [{ title: "Alien Dictionary", slug: "alien-dictionary" }],
      },
    ],
  },
];
