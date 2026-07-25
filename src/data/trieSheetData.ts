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
  id: `trie-${++__id}`,
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

export const trieSheetSections: Section[] = [
  {
    id: "trie-sec-0",
    title: "0) Trie Implementation / Basics",
    subSections: [
      {
        id: "trie-sec-0-sub-1",
        title: "Basics",
        topics: [
          { ...t("Implement Trie (Prefix Tree)", "implement-trie-prefix-tree", "Medium", "IMP (base: insert/search/startsWith)"), startHere: true },
          t("Design Add and Search Words Data Structure", "design-add-and-search-words-data-structure", "Medium", "IMP (. wildcard → DFS)"),
          t("Implement Trie II (Prefix Tree)", "implement-trie-ii-prefix-tree", "Medium", "Prem, count words & prefixes"),
          t("Map Sum Pairs", "map-sum-pairs", "Medium", "IMP (store value, sum over prefix)"),
          t("Implement Magic Dictionary", "implement-magic-dictionary", "Medium", "Exactly-one-change search"),
        ],
      },
    ],
  },
  {
    id: "trie-sec-1",
    title: "1) Prefix & Word Lookup",
    subSections: [
      {
        id: "trie-sec-1-sub-1",
        title: "Prefix / word",
        topics: [
          { ...t("Longest Common Prefix", "longest-common-prefix", "Easy", "Trie or vertical scan"), startHere: true },
          t("Replace Words", "replace-words", "Medium", "IMP (shortest root = first isEnd)"),
          t("Longest Word in Dictionary", "longest-word-in-dictionary", "Medium", "IMP (every prefix must be a word)"),
          t("Short Encoding of Words", "short-encoding-of-words", "Medium", "IMP (reversed words → suffix trie)"),
          t("Camelcase Matching", "camelcase-matching", "Medium", "Pattern subsequence match"),
          t("Prefix and Suffix Search", "prefix-and-suffix-search", "Hard", "insert suffix{word} keys", "40 min"),
        ],
      },
    ],
  },
  {
    id: "trie-sec-2",
    title: "2) Autocomplete / Prefix Search",
    subSections: [
      {
        id: "trie-sec-2-sub-1",
        title: "Autocomplete",
        topics: [
          { ...t("Search Suggestions System", "search-suggestions-system", "Medium", "IMP (top-3 per prefix)"), startHere: true },
          t("Stream of Characters", "stream-of-characters", "Hard", "IMP (reversed trie, query suffix)", "35 min"),
          t("Counting Words With a Given Prefix", "counting-words-with-a-given-prefix", "Easy", "Simple prefix count"),
          t("Count Prefixes of a Given String", "count-prefixes-of-a-given-string", "Easy"),
          t("Design Search Autocomplete System", "design-search-autocomplete-system", "Hard", "Prem, trie + hot ranking", "45 min"),
        ],
      },
    ],
  },
  {
    id: "trie-sec-3",
    title: "3) Trie + Backtracking (Grid & Word Building)",
    subSections: [
      {
        id: "trie-sec-3-sub-1",
        title: "Trie + backtrack",
        topics: [
          { ...t("Word Search II", "word-search-ii", "Hard", "IMP (trie of words + grid DFS, prune)", "45 min"), startHere: true },
          t("Concatenated Words", "concatenated-words", "Hard", "IMP (trie + DP)", "40 min"),
          t("Word Squares", "word-squares", "Hard", "Prem, prefix trie + backtrack", "45 min"),
        ],
      },
    ],
  },
  {
    id: "trie-sec-4",
    title: "4) Trie + DP / Counting",
    subSections: [
      {
        id: "trie-sec-4-sub-1",
        title: "Trie + DP",
        topics: [
          { ...t("Word Break", "word-break", "Medium", "IMP (trie speeds dict lookup)"), startHere: true },
          t("Sum of Prefix Scores of Strings", "sum-of-prefix-scores-of-strings", "Hard", "IMP (count at each node)", "35 min"),
          t("Count Prefix and Suffix Pairs I", "count-prefix-and-suffix-pairs-i", "Easy", "Prefix + suffix check"),
          t("Number of Ways to Form a Target String Given a Dictionary", "number-of-ways-to-form-a-target-string-given-a-dictionary", "Hard", "DP over columns", "40 min"),
        ],
      },
    ],
  },
  {
    id: "trie-sec-5",
    title: "5) Bit Trie (Max XOR)",
    subSections: [
      {
        id: "trie-sec-5-sub-1",
        title: "Bit trie",
        topics: [
          { ...t("Maximum XOR of Two Numbers in an Array", "maximum-xor-of-two-numbers-in-an-array", "Medium", "IMP (base bit-trie)"), startHere: true },
          t("Maximum XOR With an Element From Array", "maximum-xor-with-an-element-from-array", "Hard", "sort queries + insert ≤ limit", "40 min"),
          t("Count Pairs With XOR in a Range", "count-pairs-with-xor-in-a-range", "Hard", "trie counting (< high − < low)", "40 min"),
          t("Maximum Strong Pair XOR II", "maximum-strong-pair-xor-ii", "Hard", "sort + sliding + bit-trie", "40 min"),
        ],
      },
    ],
  },
  {
    id: "trie-sec-6",
    title: "6) Advanced / Hard",
    subSections: [
      {
        id: "trie-sec-6-sub-1",
        title: "Advanced",
        topics: [
          t("Palindrome Pairs", "palindrome-pairs", "Hard", "IMP (trie of reversed + palindrome check)", "45 min"),
          t("Lexicographical Numbers", "lexicographical-numbers", "Medium", "Trie-like DFS (10-ary)"),
          t("Design File System", "design-file-system", "Medium", "Prem, path trie"),
          t("Delete Duplicate Folders in System", "delete-duplicate-folders-in-system", "Hard", "trie + subtree serialize", "45 min"),
        ],
      },
    ],
  },
  {
    id: "trie-sec-7",
    title: "7) To Do (Later)",
    subSections: [
      {
        id: "trie-sec-7-sub-1",
        title: "Later",
        topics: [
          t("Design In-Memory File System", "design-in-memory-file-system", "Hard", "", "45 min"),
          t("Maximum Genetic Difference Query", "maximum-genetic-difference-query", "Hard", "", "40 min"),
          t("Design Search Autocomplete System", "design-search-autocomplete-system", "Hard", "", "45 min"),
        ],
      },
    ],
  },
];

const __all = trieSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const trieSheetMeta = {
  id: "trie-typewise",
  title: "Trie (Prefix Tree) Questions Sheet (Type-wise)",
  description:
    "Type-wise Trie question bank covering ~100% of LeetCode trie problems — implementation, prefix/word lookup, autocomplete, trie+backtracking (Word Search II), trie+DP, bit-trie max-XOR & advanced.",
  lastUpdated: "July 9, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
