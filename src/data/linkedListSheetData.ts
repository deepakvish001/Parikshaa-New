import { Section } from "./dsaLevel1Types";

// Helper builders keep the file compact and every topic well-formed.
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
  id: `ll-${++__id}`,
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

export const linkedListSheetSections: Section[] = [
  {
    id: "ll-sec-0",
    title: "0) Linked List (Implementation / Basics)",
    subSections: [
      {
        id: "ll-sec-0-sub-1",
        title: "Implementation",
        topics: [t("Design Linked List", "design-linked-list", "Medium", "LC 707")],
      },
    ],
  },
  {
    id: "ll-sec-1",
    title: "1) Normal Recursion (Given 1 LL)",
    subSections: [
      {
        id: "ll-sec-1-sub-1",
        title: "1.1 Simple recursion (no structural changes)",
        topics: [
          t("Swapping Nodes in a Linked List", "swapping-nodes-in-a-linked-list", "Medium", "LC 1721"),
          t("Plus One Linked List", "plus-one-linked-list", "Medium", "LC 369"),
          t("Convert Binary Number in a Linked List to Integer", "convert-binary-number-in-a-linked-list-to-integer", "Easy", "LC 1290", "15 min"),
        ],
      },
      {
        id: "ll-sec-1-sub-2a",
        title: "1.2 Modify LL — (A) Reversing patterns",
        topics: [
          t("Reverse Linked List", "reverse-linked-list", "Easy", "LC 206", "15 min"),
          t("Reverse Linked List II", "reverse-linked-list-ii", "Medium", "LC 92"),
          t("Palindrome Linked List", "palindrome-linked-list", "Easy", "LC 234", "20 min"),
          t("Reverse Nodes in k-Group", "reverse-nodes-in-k-group", "Hard", "LC 25", "35 min"),
          t("Print Immutable Linked List in Reverse", "print-immutable-linked-list-in-reverse", "Medium", "LC 1265"),
        ],
      },
      {
        id: "ll-sec-1-sub-2b",
        title: "1.2 Modify LL — (B) Reordering patterns",
        topics: [
          { ...t("Partition List", "partition-list", "Medium", "IMP · LC 86"), startHere: true },
          t("Reorder List", "reorder-list", "Medium", "LC 143"),
          t("Swap Nodes in Pairs", "swap-nodes-in-pairs", "Medium", "LC 24"),
          t("Rotate List", "rotate-list", "Medium", "LC 61"),
          t("Odd Even Linked List", "odd-even-linked-list", "Medium", "LC 328"),
        ],
      },
      {
        id: "ll-sec-1-sub-3",
        title: "1.3 Delete nodes",
        topics: [
          t("Remove Nth Node From End of List", "remove-nth-node-from-end-of-list", "Medium", "LC 19"),
          t("Remove Duplicates from Sorted List", "remove-duplicates-from-sorted-list", "Easy", "LC 83 · Unsorted → HashMap", "15 min"),
          t("Remove Duplicates from Sorted List II", "remove-duplicates-from-sorted-list-ii", "Medium", "LC 82"),
          t("Remove Linked List Elements", "remove-linked-list-elements", "Easy", "LC 203", "15 min"),
        ],
      },
      {
        id: "ll-sec-1-sub-4",
        title: "1.4 Insert node",
        topics: [
          t("Insert into a Sorted Circular Linked List", "insert-into-a-sorted-circular-linked-list", "Medium", "LC 708"),
        ],
      },
    ],
  },
  {
    id: "ll-sec-2",
    title: "2) Given 2 or More Linked Lists",
    subSections: [
      {
        id: "ll-sec-2-sub-1",
        title: "Combine / Merge / Intersect",
        topics: [
          t("Add Two Numbers", "add-two-numbers", "Medium", "LC 2"),
          t("Add Two Numbers II", "add-two-numbers-ii", "Medium", "LC 445"),
          t("Merge Two Sorted Lists", "merge-two-sorted-lists", "Easy", "LC 21", "15 min"),
          { ...t("Merge k Sorted Lists", "merge-k-sorted-lists", "Hard", "IMP · LC 23", "35 min"), startHere: true },
          t("Intersection of Two Linked Lists", "intersection-of-two-linked-lists", "Easy", "LC 160", "20 min"),
          t("Add Two Polynomials Represented as Linked Lists", "add-two-polynomials-represented-as-linked-lists", "Medium", "LC 1634"),
        ],
      },
    ],
  },
  {
    id: "ll-sec-3",
    title: "3) Fast & Slow Pointer (Cycle / Middle)",
    subSections: [
      {
        id: "ll-sec-3-sub-1",
        title: "Two-pointer patterns",
        topics: [
          t("Linked List Cycle", "linked-list-cycle", "Easy", "LC 141", "15 min"),
          t("Middle of the Linked List", "middle-of-the-linked-list", "Easy", "LC 876", "15 min"),
          t("Delete the Middle Node of a Linked List", "delete-the-middle-node-of-a-linked-list", "Medium", "LC 2095"),
          t("Linked List Cycle II", "linked-list-cycle-ii", "Medium", "LC 142"),
        ],
      },
    ],
  },
  {
    id: "ll-sec-4",
    title: "4) Hash Table + Linked List",
    subSections: [
      {
        id: "ll-sec-4-sub-1",
        title: "Hash-assisted",
        topics: [
          { ...t("Copy List with Random Pointer", "copy-list-with-random-pointer", "Medium", "IMP · LC 138"), startHere: true },
          t("Remove Duplicates from an Unsorted Linked List", "remove-duplicates-from-an-unsorted-linked-list", "Medium", "LC 1836 · Sorted → no hash"),
        ],
      },
    ],
  },
  {
    id: "ll-sec-5",
    title: "5) Design Data Structure Using Linked List",
    subSections: [
      {
        id: "ll-sec-5-sub-1",
        title: "Design",
        topics: [
          t("LRU Cache", "lru-cache", "Medium", "LC 146", "30 min"),
          t("Design HashMap", "design-hashmap", "Easy", "LC 706", "20 min"),
          t("Max Stack", "max-stack", "Hard", "LC 716", "30 min"),
          t("Design HashSet", "design-hashset", "Easy", "LC 705", "20 min"),
          t("Design Browser History", "design-browser-history", "Medium", "LC 1472 · Stack"),
          t("Design Twitter", "design-twitter", "Medium", "LC 355 · No need of LL"),
          t("Design Circular Queue", "design-circular-queue", "Medium", "LC 622"),
        ],
      },
    ],
  },
  {
    id: "ll-sec-6",
    title: "6) Merge Sort on Linked List",
    subSections: [
      {
        id: "ll-sec-6-sub-1",
        title: "Sorting",
        topics: [t("Sort List", "sort-list", "Medium", "LC 148", "30 min")],
      },
    ],
  },
  {
    id: "ll-sec-7",
    title: "7) Linked List + Tree / Special Linked Lists",
    subSections: [
      {
        id: "ll-sec-7-sub-1",
        title: "Tree · DLL · Twins",
        topics: [
          t("Convert Binary Search Tree to Sorted Doubly Linked List", "convert-binary-search-tree-to-sorted-doubly-linked-list", "Medium", "LC 426"),
          t("Flatten a Multilevel Doubly Linked List", "flatten-a-multilevel-doubly-linked-list", "Medium", "LC 430"),
          t("Maximum Twin Sum of a Linked List", "maximum-twin-sum-of-a-linked-list", "Medium", "LC 2130"),
          t("Delete Node in a Linked List", "delete-node-in-a-linked-list", "Medium", "LC 237"),
          t("Convert Sorted List to Binary Search Tree", "convert-sorted-list-to-binary-search-tree", "Medium", "LC 109"),
        ],
      },
      {
        id: "ll-sec-7-sub-2",
        title: "7.1 Monotonic Stack / Next Greater",
        topics: [
          t("Next Greater Node In Linked List", "next-greater-node-in-linked-list", "Medium", "LC 1019 · Monotonic stack"),
        ],
      },
    ],
  },
  {
    id: "ll-sec-8",
    title: "8) To Do (Later)",
    subSections: [
      {
        id: "ll-sec-8-sub-1",
        title: "Advanced designs",
        topics: [
          t("All O`one Data Structure", "all-oone-data-structure", "Hard", "LC 432", "40 min"),
          t("LFU Cache", "lfu-cache", "Hard", "LC 460", "40 min"),
          t("Design a Text Editor", "design-a-text-editor", "Hard", "LC 2296", "40 min"),
        ],
      },
    ],
  },
];

// Difficulty roll-up computed from the sections above.
const __all = linkedListSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const linkedListSheetMeta = {
  id: "linked-list-90",
  title: "Linked List — 90% LeetCode (Type-wise)",
  description:
    "Type-wise sheet covering ~90% of LeetCode Linked List questions — recursion, reversing, reordering, two-pointer, hash, design, merge sort and tree-linked patterns.",
  lastUpdated: "July 4, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
