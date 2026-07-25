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
  id: `q-${++__id}`,
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

export const queueSheetSections: Section[] = [
  {
    id: "q-sec-0",
    title: "0) Queue (Implementation / Design / Basics)",
    subSections: [
      {
        id: "q-sec-0-sub-1",
        title: "Design",
        topics: [
          { ...t("Implement Queue using Stacks", "implement-queue-using-stacks", "Easy", "Base, amortized O(1)", "20 min"), startHere: true },
          t("Implement Stack using Queues", "implement-stack-using-queues", "Easy", "", "15 min"),
          t("Design Circular Queue", "design-circular-queue", "Medium", "Array + head/tail"),
          t("Design Circular Deque", "design-circular-deque", "Medium"),
          t("Number of Recent Calls", "number-of-recent-calls", "Easy", "Sliding window queue", "15 min"),
          t("Moving Average from Data Stream", "moving-average-from-data-stream", "Easy", "Premium", "15 min"),
          t("Design Front Middle Back Queue", "design-front-middle-back-queue", "Medium", "Two deques"),
        ],
      },
    ],
  },
  {
    id: "q-sec-1",
    title: "1) BFS on Tree (Level Order Traversal)",
    subSections: [
      {
        id: "q-sec-1-sub-1",
        title: "Level order patterns",
        topics: [
          { ...t("Binary Tree Level Order Traversal", "binary-tree-level-order-traversal", "Medium", "Base pattern"), startHere: true },
          t("Binary Tree Level Order Traversal II", "binary-tree-level-order-traversal-ii", "Medium", "Reverse at end"),
          t("Binary Tree Zigzag Level Order Traversal", "binary-tree-zigzag-level-order-traversal", "Medium", "Flip direction/level"),
          t("Average of Levels in Binary Tree", "average-of-levels-in-binary-tree", "Easy", "", "15 min"),
          t("Binary Tree Right Side View", "binary-tree-right-side-view", "Medium", "IMP (last of level)"),
          t("Minimum Depth of Binary Tree", "minimum-depth-of-binary-tree", "Easy", "BFS early-exit", "20 min"),
          t("Find Largest Value in Each Tree Row", "find-largest-value-in-each-tree-row", "Medium"),
          t("Maximum Level Sum of a Binary Tree", "maximum-level-sum-of-a-binary-tree", "Medium"),
          t("Deepest Leaves Sum", "deepest-leaves-sum", "Medium"),
          t("Even Odd Tree", "even-odd-tree", "Medium"),
          t("Cousins in Binary Tree", "cousins-in-binary-tree", "Easy", "", "20 min"),
          t("Add One Row to Tree", "add-one-row-to-tree", "Medium"),
          t("Populating Next Right Pointers in Each Node", "populating-next-right-pointers-in-each-node", "Medium", "IMP"),
          t("Populating Next Right Pointers in Each Node II", "populating-next-right-pointers-in-each-node-ii", "Medium"),
          t("N-ary Tree Level Order Traversal", "n-ary-tree-level-order-traversal", "Medium"),
        ],
      },
    ],
  },
  {
    id: "q-sec-2",
    title: "2) BFS on Graph / Matrix",
    subSections: [
      {
        id: "q-sec-2-sub-1",
        title: "2.1 Grid BFS (Connected Components)",
        topics: [
          { ...t("Number of Islands", "number-of-islands", "Medium", "Base grid BFS", "25 min"), startHere: true },
          t("Flood Fill", "flood-fill", "Easy", "", "15 min"),
          t("Max Area of Island", "max-area-of-island", "Medium"),
          t("Surrounded Regions", "surrounded-regions", "Medium", "Border BFS"),
          t("Number of Enclaves", "number-of-enclaves", "Medium"),
        ],
      },
      {
        id: "q-sec-2-sub-2",
        title: "2.2 Multi-Source BFS",
        topics: [
          { ...t("Rotting Oranges", "rotting-oranges", "Medium", "IMP (must-do)", "25 min"), startHere: true },
          t("01 Matrix", "01-matrix", "Medium", "IMP (push all 0s)"),
          t("Walls and Gates", "walls-and-gates", "Medium", "Premium"),
          t("As Far from Land as Possible", "as-far-from-land-as-possible", "Medium"),
          t("Map of Highest Peak", "map-of-highest-peak", "Medium"),
          t("Shortest Bridge", "shortest-bridge", "Medium", "DFS + multi-src BFS"),
          t("Pacific Atlantic Water Flow", "pacific-atlantic-water-flow", "Medium", "Reverse BFS x2"),
        ],
      },
      {
        id: "q-sec-2-sub-3",
        title: "2.3 Shortest Path / Word Transformation (Implicit Graph)",
        topics: [
          t("Shortest Path in Binary Matrix", "shortest-path-in-binary-matrix", "Medium", "8-directional"),
          t("Nearest Exit from Entrance in Maze", "nearest-exit-from-entrance-in-maze", "Medium"),
          t("Shortest Path in a Grid with Obstacles Elimination", "shortest-path-in-a-grid-with-obstacles-elimination", "Hard", "State = (r,c,k)", "35 min"),
          { ...t("Word Ladder", "word-ladder", "Hard", "IMP", "35 min"), startHere: true },
          t("Word Ladder II", "word-ladder-ii", "Hard", "BFS + backtrack", "40 min"),
          t("Open the Lock", "open-the-lock", "Medium"),
          t("Minimum Genetic Mutation", "minimum-genetic-mutation", "Medium", "Same as Word Ladder"),
          t("Jump Game III", "jump-game-iii", "Medium"),
          t("Snakes and Ladders", "snakes-and-ladders", "Medium"),
          t("Bus Routes", "bus-routes", "Hard", "Route-as-node", "35 min"),
          t("Shortest Path to Get All Keys", "shortest-path-to-get-all-keys", "Hard", "Bitmask state", "40 min"),
        ],
      },
    ],
  },
  {
    id: "q-sec-3",
    title: "3) Topological Sort (Kahn's Algorithm — BFS based)",
    subSections: [
      {
        id: "q-sec-3-sub-1",
        title: "Topo sort",
        topics: [
          { ...t("Course Schedule", "course-schedule", "Medium", "IMP (cycle detect)"), startHere: true },
          t("Course Schedule II", "course-schedule-ii", "Medium", "Return order"),
          t("Course Schedule IV", "course-schedule-iv", "Medium"),
          t("Minimum Height Trees", "minimum-height-trees", "Medium", "Trim leaves (BFS)"),
          t("Find Eventual Safe States", "find-eventual-safe-states", "Medium", "Reverse graph"),
          t("Alien Dictionary", "alien-dictionary", "Hard", "Premium, IMP", "35 min"),
          t("Parallel Courses", "parallel-courses", "Medium", "Premium, level = time"),
          t("Sequence Reconstruction", "sequence-reconstruction", "Medium", "Premium, unique topo"),
          t("Sort Items by Groups Respecting Dependencies", "sort-items-by-groups-respecting-dependencies", "Hard", "Double topo", "40 min"),
        ],
      },
    ],
  },
  {
    id: "q-sec-4",
    title: "4) Monotonic Deque (Sliding Window Max / Min)",
    subSections: [
      {
        id: "q-sec-4-sub-1",
        title: "Monotonic deque",
        topics: [
          { ...t("Sliding Window Maximum", "sliding-window-maximum", "Hard", "IMP (must-do, base)", "30 min"), startHere: true },
          t("Shortest Subarray with Sum at Least K", "shortest-subarray-with-sum-at-least-k", "Hard", "IMP (prefix + deque)", "35 min"),
          t("Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit", "longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit", "Medium", "Max deque + Min deque"),
          t("Constrained Subsequence Sum", "constrained-subsequence-sum", "Hard", "DP + deque", "35 min"),
          t("Jump Game VI", "jump-game-vi", "Medium", "DP + deque"),
          t("Continuous Subarrays", "continuous-subarrays", "Medium"),
        ],
      },
    ],
  },
  {
    id: "q-sec-5",
    title: "5) Queue Simulation",
    subSections: [
      {
        id: "q-sec-5-sub-1",
        title: "Simulation",
        topics: [
          t("Number of Students Unable to Eat Lunch", "number-of-students-unable-to-eat-lunch", "Easy", "Warm-up", "15 min"),
          t("Time Needed to Buy Tickets", "time-needed-to-buy-tickets", "Easy", "", "15 min"),
          t("Reveal Cards In Increasing Order", "reveal-cards-in-increasing-order", "Medium", "Reverse simulate"),
          t("Dota2 Senate", "dota2-senate", "Medium", "Two queues"),
        ],
      },
    ],
  },
  {
    id: "q-sec-6",
    title: "6) To Do (Later)",
    subSections: [
      {
        id: "q-sec-6-sub-1",
        title: "Later",
        topics: [
          t("Design Hit Counter", "design-hit-counter", "Medium"),
          t("First Unique Number", "first-unique-number", "Medium"),
          t("The Maze", "the-maze", "Medium"),
          t("Cut Off Trees for Golf Event", "cut-off-trees-for-golf-event", "Hard", "", "35 min"),
        ],
      },
    ],
  },
];

const __all = queueSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const queueSheetMeta = {
  id: "queue-typewise",
  title: "Queue Questions Sheet (Type-wise)",
  description:
    "Type-wise Queue question bank — design, BFS on tree/graph/matrix, multi-source BFS, implicit-graph shortest path, Kahn's topo sort, monotonic deque & queue simulation.",
  lastUpdated: "July 8, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
