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
  id: `g-${++__id}`,
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

export const graphSheetSections: Section[] = [
  {
    id: "g-sec-0",
    title: "0) Graph Basics / Representation",
    subSections: [
      {
        id: "g-sec-0-sub-1",
        title: "Basics",
        topics: [
          { ...t("Find if Path Exists in Graph", "find-if-path-exists-in-graph", "Easy", "Build adj list, DFS/UF", "20 min"), startHere: true },
          t("Find the Town Judge", "find-the-town-judge", "Easy", "In/out degree", "15 min"),
          t("Find Center of Star Graph", "find-center-of-star-graph", "Easy", "", "10 min"),
          t("Clone Graph", "clone-graph", "Medium", "IMP · DFS/BFS + visited map"),
          t("Find the Celebrity", "find-the-celebrity", "Medium", "Premium · 2-ptr elimination"),
        ],
      },
    ],
  },
  {
    id: "g-sec-1",
    title: "1) DFS — Connected Components & Grid",
    subSections: [
      {
        id: "g-sec-1-sub-1",
        title: "DFS on grid / graph",
        topics: [
          { ...t("Number of Islands", "number-of-islands", "Medium", "IMP · base grid DFS", "25 min"), startHere: true },
          t("Max Area of Island", "max-area-of-island", "Medium"),
          t("Flood Fill", "flood-fill", "Easy", "", "15 min"),
          t("Number of Provinces", "number-of-provinces", "Medium", "IMP · adj-matrix components"),
          t("Number of Connected Components in an Undirected Graph", "number-of-connected-components-in-an-undirected-graph", "Medium", "Premium · DFS or UF"),
          t("Keys and Rooms", "keys-and-rooms", "Medium", "Reachability"),
          t("Surrounded Regions", "surrounded-regions", "Medium", "IMP · border DFS"),
          t("Pacific Atlantic Water Flow", "pacific-atlantic-water-flow", "Medium", "IMP · reverse DFS from oceans"),
          t("Number of Enclaves", "number-of-enclaves", "Medium"),
          t("Number of Closed Islands", "number-of-closed-islands", "Medium"),
          t("Count Sub Islands", "count-sub-islands", "Medium"),
          t("Island Perimeter", "island-perimeter", "Easy", "", "15 min"),
          t("Coloring A Border", "coloring-a-border", "Medium"),
          t("All Paths From Source to Target", "all-paths-from-source-to-target", "Medium", "IMP · DFS enumerate on DAG"),
          t("Detonate the Maximum Bombs", "detonate-the-maximum-bombs", "Medium", "Directed reach, DFS each"),
          t("Making A Large Island", "making-a-large-island", "Hard", "label islands + merge", "35 min"),
        ],
      },
    ],
  },
  {
    id: "g-sec-2",
    title: "2) BFS — Shortest Path (Unweighted)",
    subSections: [
      {
        id: "g-sec-2-sub-1",
        title: "BFS shortest path",
        topics: [
          { ...t("Rotting Oranges", "rotting-oranges", "Medium", "IMP · multi-source BFS", "25 min"), startHere: true },
          t("01 Matrix", "01-matrix", "Medium", "IMP · multi-source"),
          t("Word Ladder", "word-ladder", "Hard", "IMP · implicit graph", "35 min"),
          t("Shortest Path in Binary Matrix", "shortest-path-in-binary-matrix", "Medium", "8-dir"),
          t("Open the Lock", "open-the-lock", "Medium"),
          t("Snakes and Ladders", "snakes-and-ladders", "Medium"),
          t("Jump Game IV", "jump-game-iv", "Hard", "Value-buckets as edges", "30 min"),
          t("Bus Routes", "bus-routes", "Hard", "route-as-node", "35 min"),
          t("Time Needed to Inform All Employees", "time-needed-to-inform-all-employees", "Medium", "IMP · tree DFS/BFS"),
          t("Shortest Path to Get All Keys", "shortest-path-to-get-all-keys", "Hard", "BFS + bitmask (see §11)", "40 min"),
        ],
      },
    ],
  },
  {
    id: "g-sec-3",
    title: "3) Topological Sort (Kahn + DFS)",
    subSections: [
      {
        id: "g-sec-3-sub-1",
        title: "Topo sort",
        topics: [
          { ...t("Course Schedule", "course-schedule", "Medium", "IMP · cycle detect"), startHere: true },
          t("Course Schedule II", "course-schedule-ii", "Medium", "IMP · return order"),
          t("Alien Dictionary", "alien-dictionary", "Hard", "Premium · IMP · build edges from words", "35 min"),
          t("Minimum Height Trees", "minimum-height-trees", "Medium", "Trim leaves layer-by-layer"),
          t("Find Eventual Safe States", "find-eventual-safe-states", "Medium", "Reverse-graph topo"),
          t("Course Schedule IV", "course-schedule-iv", "Medium", "Transitive closure"),
          t("Loud and Rich", "loud-and-rich", "Medium", "DFS + memo on DAG"),
          t("Longest Increasing Path in a Matrix", "longest-increasing-path-in-a-matrix", "Hard", "IMP · DFS + memo = DAG DP", "35 min"),
          t("Sort Items by Groups Respecting Dependencies", "sort-items-by-groups-respecting-dependencies", "Hard", "double topo", "40 min"),
          t("Build a Matrix With Conditions", "build-a-matrix-with-conditions", "Hard", "topo on rows & cols", "35 min"),
        ],
      },
    ],
  },
  {
    id: "g-sec-4",
    title: "4) Union-Find (Disjoint Set Union)",
    subSections: [
      {
        id: "g-sec-4-sub-1",
        title: "DSU",
        topics: [
          { ...t("Redundant Connection", "redundant-connection", "Medium", "IMP · base UF, undirected cycle"), startHere: true },
          t("Graph Valid Tree", "graph-valid-tree", "Medium", "Premium · IMP · n−1 edges + connected"),
          t("Number of Operations to Make Network Connected", "number-of-operations-to-make-network-connected", "Medium", "Components − 1"),
          t("Accounts Merge", "accounts-merge", "Medium", "IMP · union by email"),
          t("Most Stones Removed with Same Row or Column", "most-stones-removed-with-same-row-or-column", "Medium", "IMP · n − components"),
          t("Satisfiability of Equality Equations", "satisfiability-of-equality-equations", "Medium", "Union ==, check !="),
          t("Smallest String With Swaps", "smallest-string-with-swaps", "Medium", "Sort within component"),
          t("Similar String Groups", "similar-string-groups", "Hard", "", "30 min"),
          t("Regions Cut By Slashes", "regions-cut-by-slashes", "Medium", "Split each cell into 4"),
          t("Evaluate Division", "evaluate-division", "Medium", "IMP · weighted UF or DFS"),
          t("Count Unreachable Pairs of Nodes in an Undirected Graph", "count-unreachable-pairs-of-nodes-in-an-undirected-graph", "Medium", "Component sizes"),
          t("Redundant Connection II", "redundant-connection-ii", "Hard", "directed (2 cases)", "35 min"),
          t("Number of Islands II", "number-of-islands-ii", "Hard", "Premium · online UF", "35 min"),
        ],
      },
    ],
  },
  {
    id: "g-sec-5",
    title: "5) Cycle Detection & Bipartite",
    subSections: [
      {
        id: "g-sec-5-sub-1",
        title: "Cycle / Bipartite",
        topics: [
          t("Detect Cycles in 2D Grid", "detect-cycles-in-2d-grid", "Medium", "DFS with parent / UF"),
          { ...t("Is Graph Bipartite?", "is-graph-bipartite", "Medium", "IMP · 2-coloring BFS/DFS"), startHere: true },
          t("Possible Bipartition", "possible-bipartition", "Medium", "Same as above"),
          t("Flower Planting With No Adjacent", "flower-planting-with-no-adjacent", "Medium", "Greedy coloring (≤4)"),
        ],
      },
    ],
  },
  {
    id: "g-sec-6",
    title: "6) Shortest Path — Dijkstra (Weighted, Non-negative)",
    subSections: [
      {
        id: "g-sec-6-sub-1",
        title: "Dijkstra",
        topics: [
          { ...t("Network Delay Time", "network-delay-time", "Medium", "IMP · base Dijkstra"), startHere: true },
          t("Path With Minimum Effort", "path-with-minimum-effort", "Medium", "IMP · minimax Dijkstra on grid"),
          t("Swim in Rising Water", "swim-in-rising-water", "Hard", "Dijkstra / UF / BS", "35 min"),
          t("Path with Maximum Probability", "path-with-maximum-probability", "Medium", "Max-heap Dijkstra"),
          t("Number of Ways to Arrive at Destination", "number-of-ways-to-arrive-at-destination", "Medium", "Dijkstra + count DP"),
          t("Minimum Obstacle Removal to Reach Corner", "minimum-obstacle-removal-to-reach-corner", "Hard", "0-1 BFS / Dijkstra", "35 min"),
          t("The Maze II", "the-maze-ii", "Medium", "Premium · weighted BFS"),
          t("Number of Restricted Paths From First to Last Node", "number-of-restricted-paths-from-first-to-last-node", "Medium", "Dijkstra + DFS-DP"),
          t("Second Minimum Time to Reach Destination", "second-minimum-time-to-reach-destination", "Hard", "BFS twice (2nd min)", "35 min"),
          t("Minimum Cost to Reach Destination in Time", "minimum-cost-to-reach-destination-in-time", "Hard", "Dijkstra + time state", "40 min"),
        ],
      },
    ],
  },
  {
    id: "g-sec-7",
    title: "7) Shortest Path — Bellman-Ford / 0-1 BFS",
    subSections: [
      {
        id: "g-sec-7-sub-1",
        title: "Bellman-Ford / 0-1 BFS",
        topics: [
          { ...t("Cheapest Flights Within K Stops", "cheapest-flights-within-k-stops", "Medium", "IMP · Bellman-Ford, K+1 relaxations"), startHere: true },
          t("Minimum Cost to Make at Least One Valid Path in a Grid", "minimum-cost-to-make-at-least-one-valid-path-in-a-grid", "Hard", "IMP · 0-1 BFS base", "35 min"),
        ],
      },
    ],
  },
  {
    id: "g-sec-8",
    title: "8) Shortest Path — Floyd-Warshall (All-Pairs)",
    subSections: [
      {
        id: "g-sec-8-sub-1",
        title: "Floyd-Warshall",
        topics: [
          { ...t("Find the City With the Smallest Number of Neighbors at a Threshold Distance", "find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance", "Medium", "IMP · base Floyd-Warshall"), startHere: true },
          t("Count Subtrees With Max Distance Between Cities", "count-subtrees-with-max-distance-between-cities", "Hard", "bitmask subsets + FW", "40 min"),
        ],
      },
    ],
  },
  {
    id: "g-sec-9",
    title: "9) Minimum Spanning Tree (Kruskal / Prim)",
    subSections: [
      {
        id: "g-sec-9-sub-1",
        title: "MST",
        topics: [
          { ...t("Min Cost to Connect All Points", "min-cost-to-connect-all-points", "Medium", "IMP · base MST, Prim/Kruskal"), startHere: true },
          t("Connecting Cities With Minimum Cost", "connecting-cities-with-minimum-cost", "Medium", "Premium · Kruskal"),
          t("Optimize Water Distribution in a Village", "optimize-water-distribution-in-a-village", "Hard", "Premium · virtual node trick", "35 min"),
          t("Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree", "find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree", "Hard", "MST + edge analysis", "40 min"),
        ],
      },
    ],
  },
  {
    id: "g-sec-10",
    title: "10) Advanced (Bridges / Articulation / Eulerian)",
    subSections: [
      {
        id: "g-sec-10-sub-1",
        title: "Advanced",
        topics: [
          { ...t("Critical Connections in a Network", "critical-connections-in-a-network", "Hard", "IMP · Tarjan bridges — disc/low", "40 min"), startHere: true },
          t("Reconstruct Itinerary", "reconstruct-itinerary", "Hard", "IMP · Eulerian path, Hierholzer", "35 min"),
          t("Valid Arrangement of Pairs", "valid-arrangement-of-pairs", "Hard", "Eulerian path", "40 min"),
          t("Cracking the Safe", "cracking-the-safe", "Hard", "Eulerian (de Bruijn)", "40 min"),
          t("Minimum Number of Days to Disconnect Island", "minimum-number-of-days-to-disconnect-island", "Hard", "articulation idea (answer ≤ 2)", "35 min"),
        ],
      },
    ],
  },
  {
    id: "g-sec-11",
    title: "11) BFS + State / Bitmask & Graph DP",
    subSections: [
      {
        id: "g-sec-11-sub-1",
        title: "State-BFS / Graph DP",
        topics: [
          { ...t("Shortest Path Visiting All Nodes", "shortest-path-visiting-all-nodes", "Hard", "IMP · BFS state = (node, mask)", "40 min"), startHere: true },
          t("Shortest Path to Get All Keys", "shortest-path-to-get-all-keys", "Hard", "BFS + key-bitmask", "40 min"),
          t("Number of Increasing Paths in a Grid", "number-of-increasing-paths-in-a-grid", "Hard", "DFS + memo (DAG counting)", "35 min"),
          t("Find All People With Secret", "find-all-people-with-secret", "Hard", "sort by time + BFS/UF", "35 min"),
          t("Frog Position After T Seconds", "frog-position-after-t-seconds", "Hard", "Tree BFS + probability", "30 min"),
          t("Get Watched Videos by Your Friends", "get-watched-videos-by-your-friends", "Medium", "BFS levels"),
          t("Maximal Network Rank", "maximal-network-rank", "Medium", "Degree counting"),
        ],
      },
    ],
  },
  {
    id: "g-sec-12",
    title: "12) To Do (Later)",
    subSections: [
      {
        id: "g-sec-12-sub-1",
        title: "Later",
        topics: [
          t("Bricks Falling When Hit", "bricks-falling-when-hit", "Hard", "", "40 min"),
          t("Number of Good Paths", "number-of-good-paths", "Hard", "", "35 min"),
          t("Checking Existence of Edge Length Limited Paths", "checking-existence-of-edge-length-limited-paths", "Hard", "", "35 min"),
          t("Minimize Malware Spread", "minimize-malware-spread", "Hard", "", "35 min"),
          t("Reachable Nodes In Subdivided Graph", "reachable-nodes-in-subdivided-graph", "Hard", "", "40 min"),
        ],
      },
    ],
  },
];

const __all = graphSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const graphSheetMeta = {
  id: "graph-typewise",
  title: "Graph Questions Sheet (Type-wise)",
  description:
    "Type-wise Graph question bank (basic → advanced) — DFS components, BFS shortest path, topo sort, Union-Find, cycle/bipartite, Dijkstra, Bellman-Ford, Floyd-Warshall, MST, bridges/Eulerian & bitmask BFS.",
  lastUpdated: "July 8, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
