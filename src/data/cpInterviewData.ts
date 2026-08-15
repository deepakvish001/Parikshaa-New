import { Section } from "./dsaLevel1Types";

export const cpInterviewSections: Section[] = [
  {
    id: "cp-interview-fundamentals",
    title: "CP Interview Fundamentals",
    subSections: [
      {
        id: "cp-interview-basics",
        title: "Basics & Complexity",
        topics: [
          {
            id: "cpi-1",
            title: "Time and Space Complexity Analysis",
            completed: false,
            difficulty: "Easy",
            resourceType: "youtube",
            resourceUrl: "https://www.youtube.com/results?search_query=time+complexity+competitive+programming",
            practiceUrl: "https://codeforces.com/problemset?tags=implementation",
            note: "Big O, Omega, Theta notations, Amortized analysis",
            isRevision: false,
            estTime: "45 min"
          },
          {
            id: "cpi-2",
            title: "Fast I/O and Competition Templates",
            completed: false,
            difficulty: "Easy",
            resourceType: "article",
            resourceUrl: "https://codeforces.com/blog/entry/5217",
            note: "Optimizing cin/cout, using scanf/printf, modular templates",
            isRevision: false,
            estTime: "30 min"
          }
        ]
      },
      {
        id: "cp-interview-math",
        title: "Number Theory for Interviews",
        topics: [
          {
            id: "cpi-3",
            title: "Sieve of Eratosthenes & Primality",
            completed: false,
            difficulty: "Easy",
            resourceType: "youtube",
            resourceUrl: "https://www.youtube.com/results?search_query=sieve+of+eratosthenes+cp",
            practiceUrl: "https://codeforces.com/problemset/problem/230/B",
            note: "Basic and Segmented Sieve, Miller-Rabin intro",
            isRevision: false,
            estTime: "60 min"
          },
          {
            id: "cpi-4",
            title: "Modular Arithmetic & Inverse",
            completed: false,
            difficulty: "Medium",
            resourceType: "youtube",
            resourceUrl: "https://www.youtube.com/results?search_query=modular+arithmetic+inverse+cp",
            practiceUrl: "https://codeforces.com/problemset/problem/300/C",
            note: "Fermat's Little Theorem, Extended Euclidean Algorithm",
            isRevision: false,
            estTime: "90 min"
          }
        ]
      }
    ]
  },
  {
    id: "cp-interview-techniques",
    title: "Advanced Contest Techniques",
    subSections: [
      {
        id: "cp-interview-bitwise",
        title: "Bit Manipulation Mastery",
        topics: [
          {
            id: "cpi-5",
            title: "Bitmasking and Bitwise Tricks",
            completed: false,
            difficulty: "Medium",
            resourceType: "youtube",
            resourceUrl: "https://www.youtube.com/results?search_query=bitmasking+cp+tutorial",
            practiceUrl: "https://codeforces.com/problemset/problem/484/A",
            note: "XOR properties, subset enumeration using bits",
            isRevision: false,
            estTime: "75 min"
          }
        ]
      },
      {
        id: "cp-interview-greedy-dp",
        title: "Greedy & Constructive Algorithms",
        topics: [
          {
            id: "cpi-6",
            title: "Greedy Strategy & Exchange Arguments",
            completed: false,
            difficulty: "Medium",
            resourceType: "youtube",
            resourceUrl: "https://www.youtube.com/results?search_query=greedy+algorithms+cp",
            practiceUrl: "https://codeforces.com/problemset/problem/160/A",
            note: "Proof by contradiction, induction in greedy",
            isRevision: false,
            estTime: "60 min"
          }
        ]
      }
    ]
  }
];

export const cpInterviewMeta = {
  id: "cp-interview-sheet",
  title: "Competitive Programming Interview Sheet",
  description: "Targeted CP concepts and contest-style problems frequently asked in top-tier technical interviews.",
  lastUpdated: "August 15, 2026",
  totalProblems: 50,
  completed: 0,
  easy: 15,
  medium: 25,
  hard: 10,
};
