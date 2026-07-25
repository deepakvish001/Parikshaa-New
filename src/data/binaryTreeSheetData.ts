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
  estTime = "20 min",
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

export const binaryTreeSheetSections: Section[] = [
  {
    id: "bt-sec-0",
    title: "0) DFS Traversals (Recursive + Iterative)",
    subSections: [
      {
        id: "bt-sec-0-sub-1",
        title: "Traversals",
        topics: [
          t("Binary Tree Preorder Traversal", "binary-tree-preorder-traversal", "Easy", "Root → L → R", "15 min"),
          { ...t("Binary Tree Inorder Traversal", "binary-tree-inorder-traversal", "Easy", "IMP · L → Root → R", "15 min"), startHere: true },
          t("Binary Tree Postorder Traversal", "binary-tree-postorder-traversal", "Easy", "L → R → Root (2-stack iter)", "20 min"),
          t("N-ary Tree Preorder Traversal", "n-ary-tree-preorder-traversal", "Easy", "", "15 min"),
          t("N-ary Tree Postorder Traversal", "n-ary-tree-postorder-traversal", "Easy", "", "15 min"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-1",
    title: "1) BFS / Level Order",
    subSections: [
      {
        id: "bt-sec-1-sub-1",
        title: "Level order",
        topics: [
          { ...t("Binary Tree Level Order Traversal", "binary-tree-level-order-traversal", "Medium", "IMP · base"), startHere: true },
          t("Binary Tree Level Order Traversal II", "binary-tree-level-order-traversal-ii", "Medium", "Reverse"),
          t("Binary Tree Zigzag Level Order Traversal", "binary-tree-zigzag-level-order-traversal", "Medium", "IMP"),
          t("Binary Tree Right Side View", "binary-tree-right-side-view", "Medium", "IMP · last of level"),
          t("Average of Levels in Binary Tree", "average-of-levels-in-binary-tree", "Easy", "", "15 min"),
          t("Find Largest Value in Each Tree Row", "find-largest-value-in-each-tree-row", "Medium"),
          t("Find Bottom Left Tree Value", "find-bottom-left-tree-value", "Medium"),
          t("Maximum Level Sum of a Binary Tree", "maximum-level-sum-of-a-binary-tree", "Medium"),
          t("Deepest Leaves Sum", "deepest-leaves-sum", "Medium"),
          t("Even Odd Tree", "even-odd-tree", "Medium"),
          t("Maximum Width of Binary Tree", "maximum-width-of-binary-tree", "Medium", "IMP · index nodes"),
          t("Add One Row to Tree", "add-one-row-to-tree", "Medium"),
          t("N-ary Tree Level Order Traversal", "n-ary-tree-level-order-traversal", "Medium"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-2",
    title: "2) Tree Construction",
    subSections: [
      {
        id: "bt-sec-2-sub-1",
        title: "Construct",
        topics: [
          { ...t("Construct Binary Tree from Preorder and Inorder Traversal", "construct-binary-tree-from-preorder-and-inorder-traversal", "Medium", "IMP · root from pre, split by in"), startHere: true },
          t("Construct Binary Tree from Inorder and Postorder Traversal", "construct-binary-tree-from-inorder-and-postorder-traversal", "Medium", "IMP"),
          t("Construct Binary Tree from Preorder and Postorder Traversal", "construct-binary-tree-from-preorder-and-postorder-traversal", "Medium"),
          t("Construct Binary Search Tree from Preorder Traversal", "construct-binary-search-tree-from-preorder-traversal", "Medium", "Bounds trick"),
          t("Convert Sorted Array to Binary Search Tree", "convert-sorted-array-to-binary-search-tree", "Easy", "IMP · mid = root", "20 min"),
          t("Convert Sorted List to Binary Search Tree", "convert-sorted-list-to-binary-search-tree", "Medium", "Inorder-build (also LL §7)"),
          t("Maximum Binary Tree", "maximum-binary-tree", "Medium", "Monotonic stack O(n)"),
          t("Merge Two Binary Trees", "merge-two-binary-trees", "Easy", "", "15 min"),
          t("Create Binary Tree From Descriptions", "create-binary-tree-from-descriptions", "Medium", "Map + find root"),
          t("Construct String from Binary Tree", "construct-string-from-binary-tree", "Medium"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-3",
    title: "3) Tree Properties (Height / Diameter / Balanced / Count)",
    subSections: [
      {
        id: "bt-sec-3-sub-1",
        title: "Properties",
        topics: [
          { ...t("Maximum Depth of Binary Tree", "maximum-depth-of-binary-tree", "Easy", "IMP · base recursion", "15 min"), startHere: true },
          t("Minimum Depth of Binary Tree", "minimum-depth-of-binary-tree", "Easy", "Careful with 1 child", "20 min"),
          t("Balanced Binary Tree", "balanced-binary-tree", "Easy", "IMP · height + flag", "20 min"),
          t("Diameter of Binary Tree", "diameter-of-binary-tree", "Easy", "IMP · return height, update global", "20 min"),
          t("Count Complete Tree Nodes", "count-complete-tree-nodes", "Easy", "IMP · O(log²n)", "25 min"),
          t("Count Good Nodes in Binary Tree", "count-good-nodes-in-binary-tree", "Medium", "Pass max-so-far"),
          t("Sum of Left Leaves", "sum-of-left-leaves", "Easy", "", "15 min"),
          t("Second Minimum Node In a Binary Tree", "second-minimum-node-in-a-binary-tree", "Easy", "", "20 min"),
          t("Univalued Binary Tree", "univalued-binary-tree", "Easy", "", "10 min"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-4",
    title: "4) Path Problems (Root-to-leaf / Max Path Sum)",
    subSections: [
      {
        id: "bt-sec-4-sub-1",
        title: "Paths",
        topics: [
          { ...t("Path Sum", "path-sum", "Easy", "IMP · base", "15 min"), startHere: true },
          t("Path Sum II", "path-sum-ii", "Medium", "IMP · backtracking"),
          t("Path Sum III", "path-sum-iii", "Medium", "IMP · prefix sum on tree"),
          t("Sum Root to Leaf Numbers", "sum-root-to-leaf-numbers", "Medium"),
          t("Binary Tree Paths", "binary-tree-paths", "Easy", "", "15 min"),
          t("Binary Tree Maximum Path Sum", "binary-tree-maximum-path-sum", "Hard", "IMP · return one arm, update global", "30 min"),
          t("Longest Univalue Path", "longest-univalue-path", "Medium", "Same shape as diameter"),
          t("Longest ZigZag Path in a Binary Tree", "longest-zigzag-path-in-a-binary-tree", "Medium"),
          t("Pseudo-Palindromic Paths in a Binary Tree", "pseudo-palindromic-paths-in-a-binary-tree", "Medium", "Bitmask on path"),
          t("Smallest String Starting From Leaf", "smallest-string-starting-from-leaf", "Medium"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-5",
    title: "5) Lowest Common Ancestor (LCA)",
    subSections: [
      {
        id: "bt-sec-5-sub-1",
        title: "LCA",
        topics: [
          { ...t("Lowest Common Ancestor of a Binary Tree", "lowest-common-ancestor-of-a-binary-tree", "Medium", "IMP · base"), startHere: true },
          t("Lowest Common Ancestor of a Binary Search Tree", "lowest-common-ancestor-of-a-binary-search-tree", "Medium", "Use BST property"),
          t("Lowest Common Ancestor of Deepest Leaves", "lowest-common-ancestor-of-deepest-leaves", "Medium", "Depth + LCA"),
          t("Step-By-Step Directions From a Binary Tree Node to Another", "step-by-step-directions-from-a-binary-tree-node-to-another", "Medium", "LCA + path strings"),
          t("Lowest Common Ancestor of a Binary Tree II", "lowest-common-ancestor-of-a-binary-tree-ii", "Medium", "Premium · nodes may be absent"),
          t("Lowest Common Ancestor of a Binary Tree III", "lowest-common-ancestor-of-a-binary-tree-iii", "Medium", "Premium · parent ptr = LL intersection"),
          t("Lowest Common Ancestor of a Binary Tree IV", "lowest-common-ancestor-of-a-binary-tree-iv", "Medium", "Premium · list of nodes"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-6",
    title: "6) Same / Symmetric / Subtree / Invert",
    subSections: [
      {
        id: "bt-sec-6-sub-1",
        title: "Comparisons",
        topics: [
          { ...t("Same Tree", "same-tree", "Easy", "IMP · base compare", "15 min"), startHere: true },
          t("Symmetric Tree", "symmetric-tree", "Easy", "IMP · mirror pair", "20 min"),
          t("Invert Binary Tree", "invert-binary-tree", "Easy", "IMP · the famous one", "10 min"),
          t("Subtree of Another Tree", "subtree-of-another-tree", "Easy", "IMP · sameTree at each node", "20 min"),
          t("Leaf-Similar Trees", "leaf-similar-trees", "Easy", "Compare leaf seq", "15 min"),
          t("Flip Equivalent Binary Trees", "flip-equivalent-binary-trees", "Medium"),
          t("Check Completeness of a Binary Tree", "check-completeness-of-a-binary-tree", "Medium", "BFS null-gap check"),
          t("Cousins in Binary Tree", "cousins-in-binary-tree", "Easy", "Depth + parent", "20 min"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-7",
    title: "7) Views (Vertical / Boundary)",
    subSections: [
      {
        id: "bt-sec-7-sub-1",
        title: "Views",
        topics: [
          { ...t("Vertical Order Traversal of a Binary Tree", "vertical-order-traversal-of-a-binary-tree", "Hard", "IMP · (col, row, val) sort", "35 min"), startHere: true },
          t("Binary Tree Vertical Order Traversal", "binary-tree-vertical-order-traversal", "Medium", "Premium · BFS by column"),
          t("Boundary of Binary Tree", "boundary-of-binary-tree", "Medium", "Premium · left + leaves + right"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-8",
    title: "8) BST — Search / Insert / Delete / Validate",
    subSections: [
      {
        id: "bt-sec-8-sub-1",
        title: "BST basics",
        topics: [
          { ...t("Validate Binary Search Tree", "validate-binary-search-tree", "Medium", "IMP · min/max bounds"), startHere: true },
          t("Search in a Binary Search Tree", "search-in-a-binary-search-tree", "Easy", "Base", "10 min"),
          t("Insert into a Binary Search Tree", "insert-into-a-binary-search-tree", "Medium"),
          t("Delete Node in a BST", "delete-node-in-a-bst", "Medium", "IMP · 3 cases, inorder succ", "30 min"),
          t("Trim a Binary Search Tree", "trim-a-binary-search-tree", "Medium"),
          t("Balance a Binary Search Tree", "balance-a-binary-search-tree", "Medium", "Inorder → sorted array → BST"),
          t("Recover Binary Search Tree", "recover-binary-search-tree", "Medium", "IMP · 2 swapped, Morris"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-9",
    title: "9) BST — Inorder Property & Counting",
    subSections: [
      {
        id: "bt-sec-9-sub-1",
        title: "Inorder tricks",
        topics: [
          { ...t("Kth Smallest Element in a BST", "kth-smallest-element-in-a-bst", "Medium", "IMP · inorder count"), startHere: true },
          t("Range Sum of BST", "range-sum-of-bst", "Easy", "Prune out-of-range", "15 min"),
          t("Two Sum IV - Input is a BST", "two-sum-iv-input-is-a-bst", "Easy", "", "15 min"),
          t("Minimum Absolute Difference in BST", "minimum-absolute-difference-in-bst", "Easy", "Adjacent inorder", "15 min"),
          t("Minimum Distance Between BST Nodes", "minimum-distance-between-bst-nodes", "Easy", "Same as above", "15 min"),
          t("Find Mode in Binary Search Tree", "find-mode-in-binary-search-tree", "Easy", "Inorder streak", "20 min"),
          t("Convert BST to Greater Tree", "convert-bst-to-greater-tree", "Medium", "IMP · reverse inorder"),
          t("Binary Search Tree to Greater Sum Tree", "binary-search-tree-to-greater-sum-tree", "Medium", "Same as above"),
          t("Increasing Order Search Tree", "increasing-order-search-tree", "Easy", "", "15 min"),
          t("All Elements in Two Binary Search Trees", "all-elements-in-two-binary-search-trees", "Medium", "Merge two inorders"),
          t("Binary Search Tree Iterator", "binary-search-tree-iterator", "Medium", "IMP · controlled inorder, also Stack §6"),
          t("Convert Binary Search Tree to Sorted Doubly Linked List", "convert-binary-search-tree-to-sorted-doubly-linked-list", "Medium", "Premium (also LL §7)"),
          t("Closest Binary Search Tree Value", "closest-binary-search-tree-value", "Easy", "Premium", "15 min"),
          t("Inorder Successor in BST", "inorder-successor-in-bst", "Medium", "Premium · IMP"),
          t("Unique Binary Search Trees", "unique-binary-search-trees", "Medium", "IMP · Catalan DP"),
          t("Unique Binary Search Trees II", "unique-binary-search-trees-ii", "Medium", "Generate all"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-10",
    title: "10) Modify Structure (Flatten / Prune / Connect)",
    subSections: [
      {
        id: "bt-sec-10-sub-1",
        title: "Structural mods",
        topics: [
          { ...t("Flatten Binary Tree to Linked List", "flatten-binary-tree-to-linked-list", "Medium", "IMP · reverse-preorder / Morris"), startHere: true },
          t("Populating Next Right Pointers in Each Node", "populating-next-right-pointers-in-each-node", "Medium", "IMP · O(1) via next ptr"),
          t("Populating Next Right Pointers in Each Node II", "populating-next-right-pointers-in-each-node-ii", "Medium", "Not-perfect tree"),
          t("Binary Tree Pruning", "binary-tree-pruning", "Medium", "Postorder prune"),
          t("Delete Leaves With a Given Value", "delete-leaves-with-a-given-value", "Medium"),
          t("Delete Nodes And Return Forest", "delete-nodes-and-return-forest", "Medium", "IMP · pass parent-exists"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-11",
    title: "11) Tree DP (Rob / Camera / Coins)",
    subSections: [
      {
        id: "bt-sec-11-sub-1",
        title: "Tree DP",
        topics: [
          { ...t("House Robber III", "house-robber-iii", "Medium", "IMP · rob vs skip pair"), startHere: true },
          t("Distribute Coins in Binary Tree", "distribute-coins-in-binary-tree", "Medium", "Flow = abs(balance)"),
          t("Binary Tree Cameras", "binary-tree-cameras", "Hard", "IMP · 3-state greedy DP", "35 min"),
          t("Maximum Product of Splitted Binary Tree", "maximum-product-of-splitted-binary-tree", "Medium", "Subtree sums"),
          t("Count Nodes Equal to Average of Subtree", "count-nodes-equal-to-average-of-subtree", "Medium", "Return (sum, count)"),
          t("Maximum Sum BST in Binary Tree", "maximum-sum-bst-in-binary-tree", "Hard", "return (isBST, min, max, sum)", "35 min"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-12",
    title: "12) Ancestor / Distance",
    subSections: [
      {
        id: "bt-sec-12-sub-1",
        title: "Distance",
        topics: [
          { ...t("All Nodes Distance K in Binary Tree", "all-nodes-distance-k-in-binary-tree", "Medium", "IMP · tree → graph + BFS"), startHere: true },
          t("Amount of Time for Binary Tree to Be Infected", "amount-of-time-for-binary-tree-to-be-infected", "Medium", "Same idea (BFS from start)"),
          t("Kth Ancestor of a Tree Node", "kth-ancestor-of-a-tree-node", "Hard", "binary lifting", "40 min"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-13",
    title: "13) Serialize / Deserialize",
    subSections: [
      {
        id: "bt-sec-13-sub-1",
        title: "Serialize",
        topics: [
          { ...t("Serialize and Deserialize Binary Tree", "serialize-and-deserialize-binary-tree", "Hard", "IMP · preorder + null markers", "35 min"), startHere: true },
          t("Serialize and Deserialize BST", "serialize-and-deserialize-bst", "Medium", "No null markers needed"),
          t("Find Duplicate Subtrees", "find-duplicate-subtrees", "Medium", "IMP · serialize + hashmap"),
          t("Verify Preorder Serialization of a Binary Tree", "verify-preorder-serialization-of-a-binary-tree", "Medium", "Slot counting"),
        ],
      },
    ],
  },
  {
    id: "bt-sec-14",
    title: "14) To Do (Later)",
    subSections: [
      {
        id: "bt-sec-14-sub-1",
        title: "Later",
        topics: [
          t("Binary Tree Longest Consecutive Sequence", "binary-tree-longest-consecutive-sequence", "Medium"),
          t("Binary Tree Longest Consecutive Sequence II", "binary-tree-longest-consecutive-sequence-ii", "Medium"),
          t("Find Leaves of Binary Tree", "find-leaves-of-binary-tree", "Medium"),
          t("Maximum Average Subtree", "maximum-average-subtree", "Medium"),
          t("Number of Ways to Reorder Array to Get Same BST", "number-of-ways-to-reorder-array-to-get-same-bst", "Hard", "", "35 min"),
        ],
      },
    ],
  },
];

const __all = binaryTreeSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const binaryTreeSheetMeta = {
  id: "binary-tree-typewise",
  title: "Binary Tree & BST Questions Sheet (Type-wise)",
  description:
    "Type-wise Binary Tree & BST question bank (basic → advanced) — DFS/BFS traversals, construction, properties, paths, LCA, views, BST inorder tricks, structural mods, Tree DP, distance, serialize.",
  lastUpdated: "July 8, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
