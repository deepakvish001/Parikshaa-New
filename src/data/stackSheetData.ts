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
  id: `stk-${++__id}`,
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

export const stackSheetSections: Section[] = [
  {
    id: "stk-sec-0",
    title: "0) Stack (Implementation / Design / Basics)",
    subSections: [
      {
        id: "stk-sec-0-sub-1",
        title: "Design",
        topics: [
          t("Min Stack", "min-stack", "Medium", "Base design", "20 min"),
          t("Implement Stack using Queues", "implement-stack-using-queues", "Easy", "", "15 min"),
          t("Implement Queue using Stacks", "implement-queue-using-stacks", "Easy", "Amortized O(1)", "20 min"),
          t("Design a Stack With Increment Operation", "design-a-stack-with-increment-operation", "Medium", "Lazy increment"),
          t("Max Stack", "max-stack", "Hard", "Premium", "30 min"),
          t("Dinner Plate Stacks", "dinner-plate-stacks", "Hard", "", "35 min"),
        ],
      },
    ],
  },
  {
    id: "stk-sec-1",
    title: "1) Parentheses / Bracket Matching",
    subSections: [
      {
        id: "stk-sec-1-sub-1",
        title: "Bracket patterns",
        topics: [
          { ...t("Valid Parentheses", "valid-parentheses", "Easy", "Base problem", "15 min"), startHere: true },
          t("Minimum Add to Make Parentheses Valid", "minimum-add-to-make-parentheses-valid", "Medium"),
          t("Minimum Remove to Make Valid Parentheses", "minimum-remove-to-make-valid-parentheses", "Medium"),
          t("Remove Outermost Parentheses", "remove-outermost-parentheses", "Easy", "", "15 min"),
          t("Maximum Nesting Depth of the Parentheses", "maximum-nesting-depth-of-the-parentheses", "Easy", "Counter, no stack needed", "15 min"),
          t("Check If Word Is Valid After Substitutions", "check-if-word-is-valid-after-substitutions", "Medium"),
          t("Score of Parentheses", "score-of-parentheses", "Medium"),
          t("Minimum Insertions to Balance a Parentheses String", "minimum-insertions-to-balance-a-parentheses-string", "Medium"),
          t("Longest Valid Parentheses", "longest-valid-parentheses", "Hard", "IMP", "35 min"),
        ],
      },
    ],
  },
  {
    id: "stk-sec-2",
    title: "2) String + Stack (Build & Reduce)",
    subSections: [
      {
        id: "stk-sec-2-sub-1",
        title: "Build & reduce",
        topics: [
          t("Baseball Game", "baseball-game", "Easy", "Warm-up", "15 min"),
          t("Backspace String Compare", "backspace-string-compare", "Easy", "", "15 min"),
          t("Removing Stars From a String", "removing-stars-from-a-string", "Medium"),
          t("Clear Digits", "clear-digits", "Easy", "", "15 min"),
          t("Remove All Adjacent Duplicates In String", "remove-all-adjacent-duplicates-in-string", "Easy", "", "15 min"),
          t("Remove All Adjacent Duplicates in String II", "remove-all-adjacent-duplicates-in-string-ii", "Medium", "Store (char, count)"),
          t("Make The String Great", "make-the-string-great", "Easy", "", "15 min"),
          t("Crawler Log Folder", "crawler-log-folder", "Easy", "", "15 min"),
          t("Simplify Path", "simplify-path", "Medium"),
          { ...t("Decode String", "decode-string", "Medium", "IMP (nested, 2 stacks)", "30 min"), startHere: true },
        ],
      },
    ],
  },
  {
    id: "stk-sec-3",
    title: "3) Expression Evaluation (Postfix / Infix / Calculator)",
    subSections: [
      {
        id: "stk-sec-3-sub-1",
        title: "Calculators",
        topics: [
          { ...t("Evaluate Reverse Polish Notation", "evaluate-reverse-polish-notation", "Medium", "IMP (postfix)"), startHere: true },
          t("Basic Calculator II", "basic-calculator-ii", "Medium", "+−×÷, precedence", "30 min"),
          t("Basic Calculator", "basic-calculator", "Hard", "Brackets + sign", "35 min"),
          t("Basic Calculator III", "basic-calculator-iii", "Hard", "Premium, full parser", "40 min"),
          t("Build an Array With Stack Operations", "build-an-array-with-stack-operations", "Medium", "Push/Pop simulation"),
        ],
      },
    ],
  },
  {
    id: "stk-sec-4",
    title: "4) Monotonic Stack",
    subSections: [
      {
        id: "stk-sec-4-sub-1",
        title: "4.1 Next Greater / Next Smaller",
        topics: [
          { ...t("Next Greater Element I", "next-greater-element-i", "Easy", "Base pattern", "20 min"), startHere: true },
          t("Next Greater Element II", "next-greater-element-ii", "Medium", "Circular (2n loop)"),
          t("Next Greater Element III", "next-greater-element-iii", "Medium", "Next permutation flavour"),
          t("Daily Temperatures", "daily-temperatures", "Medium", "IMP (store index)"),
          t("Online Stock Span", "online-stock-span", "Medium", "Prev greater"),
          t("Final Prices With a Special Discount in a Shop", "final-prices-with-a-special-discount-in-a-shop", "Easy", "Next smaller-or-equal", "15 min"),
          t("Next Greater Node In Linked List", "next-greater-node-in-linked-list", "Medium", "LL + monotonic"),
          t("Number of Visible People in a Queue", "number-of-visible-people-in-a-queue", "Hard", "", "35 min"),
          t("132 Pattern", "132-pattern", "Medium", "IMP (tricky, track k)"),
        ],
      },
      {
        id: "stk-sec-4-sub-2",
        title: "4.2 Histogram / Area / Rectangle",
        topics: [
          { ...t("Largest Rectangle in Histogram", "largest-rectangle-in-histogram", "Hard", "IMP (must-do)", "35 min"), startHere: true },
          t("Maximal Rectangle", "maximal-rectangle", "Hard", "Builds on #1", "40 min"),
          t("Trapping Rain Water", "trapping-rain-water", "Hard", "IMP (stack or 2-ptr)", "35 min"),
        ],
      },
      {
        id: "stk-sec-4-sub-3",
        title: "4.3 Lexicographic / Subsequence (Greedy Monotonic)",
        topics: [
          t("Remove K Digits", "remove-k-digits", "Medium", "IMP (increasing stack)"),
          t("Remove Duplicate Letters", "remove-duplicate-letters", "Medium", "Smallest lexicographic"),
          t("Smallest Subsequence of Distinct Characters", "smallest-subsequence-of-distinct-characters", "Medium", "Same as above"),
          t("Find the Most Competitive Subsequence", "find-the-most-competitive-subsequence", "Medium"),
          t("Create Maximum Number", "create-maximum-number", "Hard", "", "40 min"),
        ],
      },
      {
        id: "stk-sec-4-sub-4",
        title: "4.4 Subarray Contribution (Sum over all subarrays)",
        topics: [
          t("Sum of Subarray Minimums", "sum-of-subarray-minimums", "Medium", "IMP (PLE/NLE)", "30 min"),
          t("Sum of Subarray Ranges", "sum-of-subarray-ranges", "Medium", "Max sum − Min sum"),
          t("Maximum Subarray Min-Product", "maximum-subarray-min-product", "Hard", "Premium", "35 min"),
        ],
      },
    ],
  },
  {
    id: "stk-sec-5",
    title: "5) Stack for Simulation",
    subSections: [
      {
        id: "stk-sec-5-sub-1",
        title: "Simulation",
        topics: [
          { ...t("Asteroid Collision", "asteroid-collision", "Medium", "IMP"), startHere: true },
          t("Car Fleet", "car-fleet", "Medium", "Sort + stack"),
          t("Car Fleet II", "car-fleet-ii", "Hard", "Monotonic", "35 min"),
          t("Validate Stack Sequences", "validate-stack-sequences", "Medium", "Push/pop check"),
          t("Exclusive Time of Functions", "exclusive-time-of-functions", "Medium", "Call-stack sim"),
        ],
      },
    ],
  },
  {
    id: "stk-sec-6",
    title: "6) Stack + Tree (Iterative Traversal / Iterators)",
    subSections: [
      {
        id: "stk-sec-6-sub-1",
        title: "Iterative traversal",
        topics: [
          t("Binary Tree Inorder Traversal", "binary-tree-inorder-traversal", "Easy", "Iterative", "20 min"),
          t("Binary Tree Preorder Traversal", "binary-tree-preorder-traversal", "Easy", "Iterative", "20 min"),
          t("Binary Tree Postorder Traversal", "binary-tree-postorder-traversal", "Easy", "Iterative (2 stacks)", "25 min"),
          t("Binary Search Tree Iterator", "binary-search-tree-iterator", "Medium", "Controlled inorder"),
          t("Flatten Nested List Iterator", "flatten-nested-list-iterator", "Medium", "Stack of iterators"),
        ],
      },
    ],
  },
  {
    id: "stk-sec-7",
    title: "7) Advanced / Hard",
    subSections: [
      {
        id: "stk-sec-7-sub-1",
        title: "Advanced",
        topics: [
          t("Maximum Frequency Stack", "maximum-frequency-stack", "Hard", "Freq → stack of stacks", "35 min"),
          t("Number of Atoms", "number-of-atoms", "Hard", "Nested parse", "40 min"),
          t("Parsing A Boolean Expression", "parsing-a-boolean-expression", "Hard", "", "35 min"),
          t("Tag Validator", "tag-validator", "Hard", "", "40 min"),
        ],
      },
    ],
  },
  {
    id: "stk-sec-8",
    title: "8) To Do (Later)",
    subSections: [
      {
        id: "stk-sec-8-sub-1",
        title: "Later",
        topics: [
          t("Basic Calculator IV", "basic-calculator-iv", "Hard", "", "45 min"),
          t("Brace Expansion II", "brace-expansion-ii", "Hard", "", "40 min"),
          t("Robot Collisions", "robot-collisions", "Hard", "", "35 min"),
        ],
      },
    ],
  },
];

const __all = stackSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const stackSheetMeta = {
  id: "stack-typewise",
  title: "Stack Questions Sheet (Type-wise)",
  description:
    "Type-wise Stack question bank covering ~90% of LeetCode Stack problems — design, parentheses, string reduce, expression eval, monotonic stack, simulation, iterative tree traversal & advanced patterns.",
  lastUpdated: "July 8, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
