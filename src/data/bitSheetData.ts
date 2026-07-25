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
  id: `bit-${++__id}`,
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

export const bitSheetSections: Section[] = [
  {
    id: "bit-sec-0",
    title: "0) Bit Basics / Fundamentals",
    subSections: [
      {
        id: "bit-sec-0-sub-1",
        title: "Fundamentals",
        topics: [
          { ...t("Number of 1 Bits", "number-of-1-bits", "Easy", "IMP (Brian Kernighan)"), startHere: true },
          t("Hamming Distance", "hamming-distance", "Easy", "IMP (XOR then count bits)"),
          t("Reverse Bits", "reverse-bits", "Easy", "IMP (build from LSB)"),
          t("Number Complement", "number-complement", "Easy", "IMP (XOR with mask of 1s)"),
          t("Complement of Base 10 Integer", "complement-of-base-10-integer", "Easy", "Same as complement"),
          t("Binary Number with Alternating Bits", "binary-number-with-alternating-bits", "Easy", "x ^ (x>>1) trick"),
          t("Convert a Number to Hexadecimal", "convert-a-number-to-hexadecimal", "Easy", "4 bits at a time"),
          t("Add Binary", "add-binary", "Easy", "Carry simulation"),
        ],
      },
    ],
  },
  {
    id: "bit-sec-1",
    title: "1) XOR Tricks (Single Number Family)",
    subSections: [
      {
        id: "bit-sec-1-sub-1",
        title: "XOR family",
        topics: [
          { ...t("Single Number", "single-number", "Easy", "IMP (XOR all)"), startHere: true },
          t("Single Number II", "single-number-ii", "Medium", "IMP (bit-count % 3)"),
          t("Single Number III", "single-number-iii", "Medium", "IMP (split by set bit)"),
          t("Missing Number", "missing-number", "Easy", "IMP (XOR index & value)"),
          t("Find the Difference", "find-the-difference", "Easy", "XOR both strings"),
          t("Decode XORed Array", "decode-xored-array", "Easy", "arr[i]=enc[i-1]^arr[i-1]"),
          t("Find the Original Array of Prefix Xor", "find-the-original-array-of-prefix-xor", "Medium", "orig[i]=pref[i]^pref[i-1]"),
          t("XOR Operation in an Array", "xor-operation-in-an-array", "Easy", "Direct"),
          t("Minimize XOR", "minimize-xor", "Medium", "Greedy set bits high→low"),
        ],
      },
    ],
  },
  {
    id: "bit-sec-2",
    title: "2) Counting Bits (Hamming)",
    subSections: [
      {
        id: "bit-sec-2-sub-1",
        title: "Counting bits",
        topics: [
          { ...t("Counting Bits", "counting-bits", "Easy", "IMP (dp[i]=dp[i>>1]+(i&1))"), startHere: true },
          t("Prime Number of Set Bits in Binary Representation", "prime-number-of-set-bits-in-binary-representation", "Easy"),
          t("Sort Integers by The Number of 1 Bits", "sort-integers-by-the-number-of-1-bits", "Easy", "Count + sort"),
          t("Concatenation of Consecutive Binary Numbers", "concatenation-of-consecutive-binary-numbers", "Medium", "Shift by bit-length"),
        ],
      },
    ],
  },
  {
    id: "bit-sec-3",
    title: "3) Power of Two / Four & Checks",
    subSections: [
      {
        id: "bit-sec-3-sub-1",
        title: "Power checks",
        topics: [
          { ...t("Power of Two", "power-of-two", "Easy", "IMP (x&(x-1)==0)"), startHere: true },
          t("Power of Four", "power-of-four", "Easy", "IMP (pow2 + even-pos bit)"),
          t("Reordered Power of 2", "reordered-power-of-2", "Medium", "Digit-count signature"),
        ],
      },
    ],
  },
  {
    id: "bit-sec-4",
    title: "4) Bit Manipulation Tricks",
    subSections: [
      {
        id: "bit-sec-4-sub-1",
        title: "Tricks",
        topics: [
          { ...t("Sum of Two Integers", "sum-of-two-integers", "Medium", "IMP (XOR + carry<<1)"), startHere: true },
          t("Bitwise AND of Numbers Range", "bitwise-and-of-numbers-range", "Medium", "IMP (common prefix of L, R)"),
          t("Gray Code", "gray-code", "Medium", "IMP (i ^ (i>>1))"),
          t("Maximum Product of Word Lengths", "maximum-product-of-word-lengths", "Medium", "IMP (26-bit mask)"),
          t("Total Hamming Distance", "total-hamming-distance", "Medium", "IMP (per bit: c0×c1)"),
          t("Longest Nice Subarray", "longest-nice-subarray", "Medium", "Sliding window + mask"),
          t("Find XOR Sum of All Pairs Bitwise AND", "find-xor-sum-of-all-pairs-bitwise-and", "Hard", "distributive: (⊕a)&(⊕b)", "35 min"),
        ],
      },
    ],
  },
  {
    id: "bit-sec-5",
    title: "5) Subsets / Bitmask Enumeration",
    subSections: [
      {
        id: "bit-sec-5-sub-1",
        title: "Bitmask enumeration",
        topics: [
          { ...t("Subsets", "subsets", "Medium", "IMP (bitmask approach)"), startHere: true },
          t("Maximum Length of a Concatenated String with Unique Characters", "maximum-length-of-a-concatenated-string-with-unique-characters", "Medium", "IMP (mask + overlap check)"),
          t("Count Number of Maximum Bitwise-OR Subsets", "count-number-of-maximum-bitwise-or-subsets", "Medium", "Enumerate all masks"),
          t("Fair Distribution of Cookies", "fair-distribution-of-cookies", "Medium", "subset-sum enumeration"),
        ],
      },
    ],
  },
  {
    id: "bit-sec-6",
    title: "6) Bitwise Math (Fast Exponentiation)",
    subSections: [
      {
        id: "bit-sec-6-sub-1",
        title: "Bit math",
        topics: [
          { ...t("Pow(x, n)", "powx-n", "Medium", "IMP (binary exponentiation)"), startHere: true },
          t("Divide Two Integers", "divide-two-integers", "Medium", "IMP (subtract shifted divisor)"),
        ],
      },
    ],
  },
  {
    id: "bit-sec-7",
    title: "7) Bit Trie (Max XOR)",
    subSections: [
      {
        id: "bit-sec-7-sub-1",
        title: "Bit trie",
        topics: [
          { ...t("Maximum XOR of Two Numbers in an Array", "maximum-xor-of-two-numbers-in-an-array", "Medium", "IMP (base bit-trie)"), startHere: true },
          t("Maximum XOR With an Element From Array", "maximum-xor-with-an-element-from-array", "Hard", "offline queries + trie", "40 min"),
          t("Count Pairs With XOR in a Range", "count-pairs-with-xor-in-a-range", "Hard", "trie counting", "40 min"),
        ],
      },
    ],
  },
  {
    id: "bit-sec-8",
    title: "8) Bitmask DP",
    subSections: [
      {
        id: "bit-sec-8-sub-1",
        title: "Bitmask DP",
        topics: [
          { ...t("Shortest Path Visiting All Nodes", "shortest-path-visiting-all-nodes", "Hard", "IMP (BFS + mask)", "40 min"), startHere: true },
          t("Smallest Sufficient Team", "smallest-sufficient-team", "Hard", "skills as bitmask", "40 min"),
          t("Maximum Students Taking Exam", "maximum-students-taking-exam", "Hard", "row-by-row seat mask", "40 min"),
        ],
      },
    ],
  },
  {
    id: "bit-sec-9",
    title: "9) Advanced / Hard",
    subSections: [
      {
        id: "bit-sec-9-sub-1",
        title: "Advanced",
        topics: [
          t("Minimum Number of K Consecutive Bit Flips", "minimum-number-of-k-consecutive-bit-flips", "Hard", "greedy + diff array on flips", "40 min"),
          t("Bitwise ORs of Subarrays", "bitwise-ors-of-subarrays", "Medium", "frontier set of ORs"),
          t("XOR Queries of a Subarray", "xor-queries-of-a-subarray", "Medium", "Prefix XOR"),
          t("Minimum One Bit Operations to Make Integers Zero", "minimum-one-bit-operations-to-make-integers-zero", "Hard", "inverse Gray code", "45 min"),
          t("Chalkboard XOR Game", "chalkboard-xor-game", "Hard", "game theory + XOR", "40 min"),
        ],
      },
    ],
  },
  {
    id: "bit-sec-10",
    title: "10) To Do (Later)",
    subSections: [
      {
        id: "bit-sec-10-sub-1",
        title: "Later",
        topics: [
          t("UTF-8 Validation", "utf-8-validation", "Medium"),
          t("Maximum Genetic Difference Query", "maximum-genetic-difference-query", "Hard", "", "40 min"),
          t("Concatenation of Consecutive Binary Numbers", "concatenation-of-consecutive-binary-numbers", "Medium"),
          t("Maximum XOR for Each Query", "maximum-xor-for-each-query", "Medium"),
        ],
      },
    ],
  },
];

const __all = bitSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const bitSheetMeta = {
  id: "bit-typewise",
  title: "Bit Manipulation Questions Sheet (Type-wise)",
  description:
    "Type-wise Bit Manipulation question bank covering ~100% of LeetCode bit problems — basics, XOR family, counting bits, power checks, tricks, bitmask enumeration, bit-math, bit-trie max-XOR, bitmask DP & advanced.",
  lastUpdated: "July 9, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
