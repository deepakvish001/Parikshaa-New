import { Section } from "./dsaLevel1Types";

export const csesSections: Section[] = [
  {
    id: "cses-foundations",
    title: "Foundations",
    subSections: [
      {
        id: "cses-intro",
        title: "Introductory Problems",
        topics: [
          {
            id: "cses-1",
            title: "Weird Algorithm",
            completed: false,
            difficulty: "Easy",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1068",
            practiceUrl: "https://cses.fi/problemset/task/1068",
            note: "Simulation of a simple mathematical process.",
            isRevision: false,
            estTime: "15 min"
          },
          {
            id: "cses-2",
            title: "Missing Number",
            completed: false,
            difficulty: "Easy",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1083",
            practiceUrl: "https://cses.fi/problemset/task/1083",
            note: "Find the missing number in a range 1..n.",
            isRevision: false,
            estTime: "10 min"
          },
          {
            id: "cses-3",
            title: "Repetitions",
            completed: false,
            difficulty: "Easy",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1069",
            practiceUrl: "https://cses.fi/problemset/task/1069",
            note: "Longest substring with the same character.",
            isRevision: false,
            estTime: "10 min"
          },
          {
            id: "cses-4",
            title: "Increasing Array",
            completed: false,
            difficulty: "Easy",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1094",
            practiceUrl: "https://cses.fi/problemset/task/1094",
            note: "Minimum moves to make array non-decreasing.",
            isRevision: false,
            estTime: "10 min"
          },
          {
            id: "cses-5",
            title: "Permutations",
            completed: false,
            difficulty: "Easy",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1070",
            practiceUrl: "https://cses.fi/problemset/task/1070",
            note: "Construct a beautiful permutation.",
            isRevision: false,
            estTime: "20 min"
          }
        ]
      },
      {
        id: "cses-sorting-searching",
        title: "Sorting and Searching",
        topics: [
          {
            id: "cses-6",
            title: "Distinct Numbers",
            completed: false,
            difficulty: "Easy",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1621",
            practiceUrl: "https://cses.fi/problemset/task/1621",
            note: "Count unique elements in an array.",
            isRevision: false,
            estTime: "10 min"
          },
          {
            id: "cses-7",
            title: "Apartments",
            completed: false,
            difficulty: "Easy",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1084",
            practiceUrl: "https://cses.fi/problemset/task/1084",
            note: "Greedy matching problem.",
            isRevision: false,
            estTime: "25 min"
          },
          {
            id: "cses-8",
            title: "Ferris Wheel",
            completed: false,
            difficulty: "Easy",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1090",
            practiceUrl: "https://cses.fi/problemset/task/1090",
            note: "Two pointers / greedy problem.",
            isRevision: false,
            estTime: "20 min"
          }
        ]
      }
    ]
  },
  {
    id: "cses-algorithm-design",
    title: "Algorithm Design",
    subSections: [
      {
        id: "cses-dp",
        title: "Dynamic Programming",
        topics: [
          {
            id: "cses-9",
            title: "Dice Combinations",
            completed: false,
            difficulty: "Medium",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1633",
            practiceUrl: "https://cses.fi/problemset/task/1633",
            note: "Ways to get sum n using dice throws.",
            isRevision: false,
            estTime: "30 min"
          },
          {
            id: "cses-10",
            title: "Minimizing Coins",
            completed: false,
            difficulty: "Medium",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1634",
            practiceUrl: "https://cses.fi/problemset/task/1634",
            note: "Classic coin change problem.",
            isRevision: false,
            estTime: "30 min"
          },
          {
            id: "cses-11",
            title: "Coin Combinations I",
            completed: false,
            difficulty: "Medium",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1635",
            practiceUrl: "https://cses.fi/problemset/task/1635",
            note: "Counting ways to make sum (ordered).",
            isRevision: false,
            estTime: "30 min"
          }
        ]
      }
    ]
  },
  {
    id: "cses-graph-theory",
    title: "Graph Theory",
    subSections: [
      {
        id: "cses-graph-basics",
        title: "Graph Algorithms",
        topics: [
          {
            id: "cses-12",
            title: "Counting Rooms",
            completed: false,
            difficulty: "Easy",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1192",
            practiceUrl: "https://cses.fi/problemset/task/1192",
            note: "Connected components in a grid.",
            isRevision: false,
            estTime: "25 min"
          },
          {
            id: "cses-13",
            title: "Labyrinth",
            completed: false,
            difficulty: "Medium",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1193",
            practiceUrl: "https://cses.fi/problemset/task/1193",
            note: "BFS for shortest path in a grid.",
            isRevision: false,
            estTime: "40 min"
          },
          {
            id: "cses-14",
            title: "Building Roads",
            completed: false,
            difficulty: "Easy",
            resourceType: "link",
            resourceUrl: "https://cses.fi/problemset/task/1666",
            practiceUrl: "https://cses.fi/problemset/task/1666",
            note: "Connecting components in a graph.",
            isRevision: false,
            estTime: "20 min"
          }
        ]
      }
    ]
  }
];

export const csesMeta = {
  id: "cses-sheet",
  title: "CSES Problem Set Sheet",
  description: "A comprehensive tracker for the CSES Problem Set, covering Foundations, Algorithm Design, Graphs, Math, and more.",
  lastUpdated: "August 15, 2026",
  totalProblems: 300,
  completed: 0,
  easy: 80,
  medium: 150,
  hard: 70,
};
