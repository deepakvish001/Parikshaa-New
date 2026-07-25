// Beginner Roadmap — Parikshaa's curated 68-problem structured path for coding-interview beginners.
// Grouped by difficulty (Easy → Medium), then by phase. Each entry references a problem
// by its LeetCode-style kebab-case slug; the view resolves it against the live problem list.

export interface RoadmapProblem {
  title: string;
  slug: string;
  hint?: string;
}

export interface RoadmapPhase {
  index: number;
  title: string;
  description: string;
  problems: RoadmapProblem[];
}

export interface RoadmapDifficulty {
  difficulty: "Easy" | "Medium" | "Hard";
  blurb: string;
  phases: RoadmapPhase[];
}

export const BEGINNER_GUIDANCE: string[] = [
  "Choose a programming language that you feel most comfortable with — for me that is Java. If you're new to programming, I would recommend Python.",
  "Spend no more than 30 minutes trying to think of any solution, even if it's brute force. You want to try applying what you know, and if stuck, then expand your skillset by studying the solution until you're able to fully explain it to another individual.",
  "Expect to struggle at first (for my first time, it took at least a month to begin improving).",
  "Do not memorize solutions — this does not work in interviews when asked follow-up questions (I speak from experience).",
  "Don't be afraid to ask an AI agent to explain the solution to you — it's a great alternative to watching a video solution.",
  "Reference the Helpful Tips tab for which tools to consider pulling out of your toolkit when solving a problem — don't use a screwdriver when you need a hammer!",
];

export const BEGINNER_NEXT_STEPS: string[] = [
  "Re-solve problems that gave you trouble — if a question stumped you, redo it until the approach clicks. Repetition is how patterns become second nature.",
  "Remember to study solutions using an AI agent/YouTube video if you get stuck — I still have to do this occasionally for some questions!",
  "Move onto the Experienced Roadmap to solidify your understanding of each pattern across all difficulty levels.",
  "Complete additional questions from the All Questions tab — filter by pattern or difficulty to target your weak areas.",
];

export const BEGINNER_ROADMAP: RoadmapDifficulty[] = [
  {
    difficulty: "Easy",
    blurb: "Build your foundation with these introductory problems",
    phases: [
      {
        index: 1,
        title: "Phase 1: Arrays & Hash Tables",
        description:
          "Learn the two most fundamental data structures. Arrays teach you iteration and indexing; hash tables give you O(1) lookups.",
        problems: [
          { title: "Contains Duplicate", slug: "contains-duplicate" },
          { title: "Two Sum", slug: "two-sum" },
          { title: "Find All Numbers Disappeared in an Array", slug: "find-all-numbers-disappeared-in-an-array" },
          { title: "Missing Number", slug: "missing-number" },
          { title: "Majority Element", slug: "majority-element" },
        ],
      },
      {
        index: 2,
        title: "Phase 2: Two Pointers",
        description:
          "Two pointers let you solve problems in O(n) by scanning from both ends or using a slow/fast pointer.",
        problems: [
          { title: "Move Zeroes", slug: "move-zeroes" },
          { title: "Squares of a Sorted Array", slug: "squares-of-a-sorted-array" },
          { title: "Backspace String Compare", slug: "backspace-string-compare" },
        ],
      },
      {
        index: 3,
        title: "Phase 3: Sliding Window",
        description:
          "Sliding window optimizes brute-force subarray/substring problems from O(n²) to O(n) by maintaining a moving window.",
        problems: [
          { title: "Maximum Average Subarray I", slug: "maximum-average-subarray-i" },
          { title: "Is Subsequence", slug: "is-subsequence" },
        ],
      },
      {
        index: 4,
        title: "Phase 4: Linked Lists",
        description:
          "Master pointer manipulation with linked lists. These problems build intuition for in-place data structure operations.",
        problems: [
          { title: "Reverse Linked List", slug: "reverse-linked-list" },
          { title: "Middle of the Linked List", slug: "middle-of-the-linked-list" },
          { title: "Linked List Cycle", slug: "linked-list-cycle" },
          { title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists" },
          { title: "Remove Linked List Elements", slug: "remove-linked-list-elements" },
          { title: "Remove Duplicates from Sorted List", slug: "remove-duplicates-from-sorted-list" },
          { title: "Palindrome Linked List", slug: "palindrome-linked-list" },
        ],
      },
      {
        index: 5,
        title: "Phase 5: Binary Search",
        description:
          "Binary search halves the search space each iteration for O(log n) time. Master the template: left, right, mid boundaries.",
        problems: [
          { title: "Binary Search", slug: "binary-search" },
          { title: "Find Smallest Letter Greater Than Target", slug: "find-smallest-letter-greater-than-target" },
        ],
      },
      {
        index: 6,
        title: "Phase 6: Trees - DFS & BFS",
        description:
          "Trees combine recursion with data structures. DFS (preorder, inorder, postorder) and BFS (level-order) are the core traversals.",
        problems: [
          { title: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree" },
          { title: "Minimum Depth of Binary Tree", slug: "minimum-depth-of-binary-tree" },
          { title: "Same Tree", slug: "same-tree" },
          { title: "Invert Binary Tree", slug: "invert-binary-tree" },
          { title: "Path Sum", slug: "path-sum" },
          { title: "Subtree of Another Tree", slug: "subtree-of-another-tree" },
          { title: "Binary Tree Paths", slug: "binary-tree-paths" },
          { title: "Merge Two Binary Trees", slug: "merge-two-binary-trees" },
          { title: "Average of Levels in Binary Tree", slug: "average-of-levels-in-binary-tree" },
        ],
      },
      {
        index: 7,
        title: "Phase 7: Sorting & Intervals",
        description:
          "Sorting unlocks many techniques. Interval problems almost always start with sorting by start time.",
        problems: [{ title: "Meeting Rooms", slug: "meeting-rooms" }],
      },
      {
        index: 10,
        title: "Phase 10: Matrix Traversal",
        description:
          "Apply array and graph techniques to 2D grids. Row/column math and directional traversal are key skills.",
        problems: [{ title: "Convert 1D Array Into 2D Array", slug: "convert-1d-array-into-2d-array" }],
      },
      {
        index: 11,
        title: "Phase 11: Prefix Sums",
        description:
          "Prefix sums let you compute range sums in O(1) after O(n) preprocessing. A powerful technique for subarray problems.",
        problems: [{ title: "Range Sum Query - Immutable", slug: "range-sum-query-immutable" }],
      },
    ],
  },
  {
    difficulty: "Medium",
    blurb:
      "Medium difficulty problems begin introducing new techniques and algorithms — most of the time you will need to study the optimal solution",
    phases: [
      {
        index: 1,
        title: "Phase 1: Arrays & Hash Tables",
        description:
          "Apply array and hash table skills to trickier problems that require multi-pass strategies or in-place techniques.",
        problems: [
          { title: "Product of Array Except Self", slug: "product-of-array-except-self" },
          { title: "Find All Duplicates in an Array", slug: "find-all-duplicates-in-an-array" },
        ],
      },
      {
        index: 2,
        title: "Phase 2: Two Pointers",
        description:
          "Combine sorting with two-pointer scans to handle duplicates, multi-element sums, and greedy boundary decisions.",
        problems: [
          { title: "3Sum", slug: "3sum" },
          { title: "3Sum Closest", slug: "3sum-closest" },
          { title: "Container With Most Water", slug: "container-with-most-water" },
          { title: "Sort Colors", slug: "sort-colors" },
        ],
      },
      {
        index: 3,
        title: "Phase 3: Sliding Window",
        description:
          'Handle variable-width windows with shrink conditions, frequency maps, and constraints like "at most k" distinct elements.',
        problems: [
          { title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters" },
          { title: "Minimum Size Subarray Sum", slug: "minimum-size-subarray-sum" },
          { title: "Longest Repeating Character Replacement", slug: "longest-repeating-character-replacement" },
          { title: "Permutation in String", slug: "permutation-in-string" },
          { title: "Fruit Into Baskets", slug: "fruit-into-baskets" },
          { title: "Subarray Product Less Than K", slug: "subarray-product-less-than-k" },
        ],
      },
      {
        index: 4,
        title: "Phase 4: Linked Lists",
        description:
          "Chain together multiple linked list techniques (find middle, reverse, merge) within a single problem.",
        problems: [
          { title: "Remove Nth Node From End of List", slug: "remove-nth-node-from-end-of-list" },
        ],
      },
      {
        index: 5,
        title: "Phase 5: Binary Search",
        description:
          "Apply binary search to modified arrays — rotated, 2D, or peak-finding — where you must decide which half to discard.",
        problems: [
          { title: "Peak Index in a Mountain Array", slug: "peak-index-in-a-mountain-array" },
          { title: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array" },
          { title: "Find Minimum in Rotated Sorted Array", slug: "find-minimum-in-rotated-sorted-array" },
          { title: "Search a 2D Matrix", slug: "search-a-2d-matrix" },
          { title: "Find Peak Element", slug: "find-peak-element" },
        ],
      },
      {
        index: 6,
        title: "Phase 6: Trees - DFS & BFS",
        description:
          "Tackle tree problems that require maintaining global state, enforcing BST constraints, or processing nodes level by level.",
        problems: [
          { title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal" },
          { title: "Validate Binary Search Tree", slug: "validate-binary-search-tree" },
        ],
      },
      {
        index: 7,
        title: "Phase 7: Sorting & Intervals",
        description:
          "Merge, insert, and remove overlapping intervals. These problems layer greedy decisions on top of sorted input.",
        problems: [
          { title: "Merge Intervals", slug: "merge-intervals" },
          { title: "Insert Interval", slug: "insert-interval" },
          { title: "Non-overlapping Intervals", slug: "non-overlapping-intervals" },
          { title: "Interval List Intersections", slug: "interval-list-intersections" },
        ],
      },
      {
        index: 9,
        title: "Phase 9: Graphs - BFS & DFS",
        description:
          "Build on tree traversals. Graphs add cycles and multiple paths, requiring visited tracking.",
        problems: [
          { title: "Number of Islands", slug: "number-of-islands" },
          { title: "Pacific Atlantic Water Flow", slug: "pacific-atlantic-water-flow" },
          { title: "Graph Valid Tree", slug: "graph-valid-tree" },
          { title: "Number of Connected Components in an Undirected Graph", slug: "number-of-connected-components-in-an-undirected-graph" },
          { title: "Course Schedule", slug: "course-schedule" },
        ],
      },
      {
        index: 10,
        title: "Phase 10: Heaps & Priority Queues",
        description:
          "Heaps efficiently maintain the min or max element. Essential for 'top K' and streaming problems.",
        problems: [
          { title: "Kth Largest Element in an Array", slug: "kth-largest-element-in-an-array" },
          { title: "Top K Frequent Elements", slug: "top-k-frequent-elements" },
          { title: "K Closest Points to Origin", slug: "k-closest-points-to-origin" },
          { title: "Meeting Rooms II", slug: "meeting-rooms-ii" },
          { title: "Kth Smallest Element in a Sorted Matrix", slug: "kth-smallest-element-in-a-sorted-matrix" },
        ],
      },
      {
        index: 10,
        title: "Phase 10: Matrix Traversal",
        description:
          "Navigate matrices with boundary tracking, in-place marking, and coordinate transformations like transpose and spiral order.",
        problems: [
          { title: "Set Matrix Zeroes", slug: "set-matrix-zeroes" },
          { title: "Spiral Matrix", slug: "spiral-matrix" },
          { title: "Rotate Image", slug: "rotate-image" },
        ],
      },
    ],
  },
];

export const BEGINNER_ROADMAP_TOTAL = BEGINNER_ROADMAP.reduce(
  (n, d) => n + d.phases.reduce((s, p) => s + p.problems.length, 0),
  0,
);
