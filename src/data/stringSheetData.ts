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
  id: `str-${++__id}`,
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

export const stringSheetSections: Section[] = [
  {
    id: "str-sec-0",
    title: "0) String Basics / Manipulation",
    subSections: [
      {
        id: "str-sec-0-sub-1",
        title: "Warm-up",
        topics: [
          t("Reverse String", "reverse-string", "Easy", "2-ptr base", "10 min"),
          t("Reverse String II", "reverse-string-ii", "Easy", "Chunk of 2k", "15 min"),
          t("Reverse Words in a String", "reverse-words-in-a-string", "Medium", "IMP · trim + reverse"),
          t("Reverse Words in a String III", "reverse-words-in-a-string-iii", "Easy", "", "15 min"),
          t("Reverse Vowels of a String", "reverse-vowels-of-a-string", "Easy", "", "15 min"),
          t("Length of Last Word", "length-of-last-word", "Easy", "", "10 min"),
          t("To Lower Case", "to-lower-case", "Easy", "", "10 min"),
          t("Defanging an IP Address", "defanging-an-ip-address", "Easy", "", "10 min"),
          t("Goal Parser Interpretation", "goal-parser-interpretation", "Easy", "", "10 min"),
          t("Split a String in Balanced Strings", "split-a-string-in-balanced-strings", "Easy", "", "10 min"),
          t("Determine if String Halves Are Alike", "determine-if-string-halves-are-alike", "Easy", "", "10 min"),
          t("Truncate Sentence", "truncate-sentence", "Easy", "", "10 min"),
          t("Shuffle String", "shuffle-string", "Easy", "", "10 min"),
        ],
      },
    ],
  },
  {
    id: "str-sec-1",
    title: "1) Two Pointers (Palindrome / Reverse / Compare)",
    subSections: [
      {
        id: "str-sec-1-sub-1",
        title: "Two pointers",
        topics: [
          { ...t("Valid Palindrome", "valid-palindrome", "Easy", "IMP · base", "15 min"), startHere: true },
          t("Valid Palindrome II", "valid-palindrome-ii", "Easy", "IMP · skip 1 char", "20 min"),
          t("Is Subsequence", "is-subsequence", "Easy", "2-ptr match", "15 min"),
          t("Merge Strings Alternately", "merge-strings-alternately", "Easy", "", "15 min"),
          t("Reverse Only Letters", "reverse-only-letters", "Easy", "", "15 min"),
          t("String Compression", "string-compression", "Medium", "IMP · in-place, read/write ptr"),
          t("Long Pressed Name", "long-pressed-name", "Easy", "", "15 min"),
          t("Backspace String Compare", "backspace-string-compare", "Easy", "2-ptr from back (also Stack)", "20 min"),
          t("Compare Version Numbers", "compare-version-numbers", "Medium", "Parse tokens"),
        ],
      },
    ],
  },
  {
    id: "str-sec-2",
    title: "2) Sliding Window (Strings)",
    subSections: [
      {
        id: "str-sec-2-sub-1",
        title: "Sliding window on strings",
        topics: [
          { ...t("Longest Substring Without Repeating Characters", "longest-substring-without-repeating-characters", "Medium", "IMP · base"), startHere: true },
          t("Longest Repeating Character Replacement", "longest-repeating-character-replacement", "Medium", "window − maxFreq ≤ k"),
          t("Find All Anagrams in a String", "find-all-anagrams-in-a-string", "Medium", "IMP · freq window"),
          t("Permutation in String", "permutation-in-string", "Medium"),
          t("Maximum Number of Vowels in a Substring of Given Length", "maximum-number-of-vowels-in-a-substring-of-given-length", "Medium", "Fixed window"),
          t("Substrings of Size Three with Distinct Characters", "substrings-of-size-three-with-distinct-characters", "Easy", "", "15 min"),
          t("Get Equal Substrings Within Budget", "get-equal-substrings-within-budget", "Medium", "Cost window"),
          t("Number of Substrings Containing All Three Characters", "number-of-substrings-containing-all-three-characters", "Medium", "Count via left-shrink"),
          t("Longest Substring with At Most Two Distinct Characters", "longest-substring-with-at-most-two-distinct-characters", "Medium", "Premium"),
          t("Longest Substring with At Most K Distinct Characters", "longest-substring-with-at-most-k-distinct-characters", "Medium", "Premium"),
          t("Minimum Window Substring", "minimum-window-substring", "Hard", "IMP", "35 min"),
          t("Substring with Concatenation of All Words", "substring-with-concatenation-of-all-words", "Hard", "word-window + hashmap", "40 min"),
        ],
      },
    ],
  },
  {
    id: "str-sec-3",
    title: "3) Hashing / Frequency (Anagrams & Counting)",
    subSections: [
      {
        id: "str-sec-3-sub-1",
        title: "Hashing",
        topics: [
          { ...t("Valid Anagram", "valid-anagram", "Easy", "IMP · base", "15 min"), startHere: true },
          t("Group Anagrams", "group-anagrams", "Medium", "IMP · key = count/sorted"),
          t("Ransom Note", "ransom-note", "Easy", "", "15 min"),
          t("Find the Difference", "find-the-difference", "Easy", "XOR or freq", "10 min"),
          t("First Unique Character in a String", "first-unique-character-in-a-string", "Easy", "IMP", "15 min"),
          t("Isomorphic Strings", "isomorphic-strings", "Easy", "Two maps", "20 min"),
          t("Word Pattern", "word-pattern", "Easy", "Bijection map", "20 min"),
          t("Determine if Two Strings Are Close", "determine-if-two-strings-are-close", "Medium"),
          t("Find Words That Can Be Formed by Characters", "find-words-that-can-be-formed-by-characters", "Easy", "", "15 min"),
          t("Maximum Number of Balloons", "maximum-number-of-balloons", "Easy", "", "15 min"),
          t("Sort Characters By Frequency", "sort-characters-by-frequency", "Medium", "Bucket sort"),
          t("Custom Sort String", "custom-sort-string", "Medium"),
          t("Minimum Number of Steps to Make Two Strings Anagram", "minimum-number-of-steps-to-make-two-strings-anagram", "Medium"),
          t("Longest Palindrome", "longest-palindrome", "Easy", "Count odd freqs", "15 min"),
        ],
      },
    ],
  },
  {
    id: "str-sec-4",
    title: "4) String Matching (strStr / KMP / Rabin-Karp)",
    subSections: [
      {
        id: "str-sec-4-sub-1",
        title: "Pattern matching",
        topics: [
          { ...t("Find the Index of the First Occurrence in a String", "find-the-index-of-the-first-occurrence-in-a-string", "Easy", "IMP · learn KMP here", "30 min"), startHere: true },
          t("Repeated Substring Pattern", "repeated-substring-pattern", "Easy", "KMP failure fn", "20 min"),
          t("Longest Happy Prefix", "longest-happy-prefix", "Hard", "Pure KMP LPS", "30 min"),
          t("Rotate String", "rotate-string", "Easy", "(s+s).contains(t)", "15 min"),
          t("Repeated String Match", "repeated-string-match", "Medium"),
          t("Shortest Palindrome", "shortest-palindrome", "Hard", "KMP on s+#+rev(s)", "35 min"),
          t("Longest Duplicate Substring", "longest-duplicate-substring", "Hard", "binary search + Rabin-Karp", "40 min"),
        ],
      },
    ],
  },
  {
    id: "str-sec-5",
    title: "5) Palindrome",
    subSections: [
      {
        id: "str-sec-5-sub-1",
        title: "5.1 Expand-Around-Center / Basic",
        topics: [
          { ...t("Longest Palindromic Substring", "longest-palindromic-substring", "Medium", "IMP · expand center"), startHere: true },
          t("Palindromic Substrings", "palindromic-substrings", "Medium", "IMP · count centers"),
          t("Break a Palindrome", "break-a-palindrome", "Medium", "Greedy"),
          t("Remove Palindromic Subsequences", "remove-palindromic-subsequences", "Easy", "Trick (answer ≤ 2)", "10 min"),
        ],
      },
      {
        id: "str-sec-5-sub-2",
        title: "5.2 Palindrome DP / Partition",
        topics: [
          { ...t("Longest Palindromic Subsequence", "longest-palindromic-subsequence", "Medium", "IMP · = LCS with reverse"), startHere: true },
          t("Palindrome Partitioning", "palindrome-partitioning", "Medium", "IMP · backtracking"),
          t("Palindrome Partitioning II", "palindrome-partitioning-ii", "Hard", "DP min cuts", "35 min"),
          t("Minimum Insertion Steps to Make a String Palindrome", "minimum-insertion-steps-to-make-a-string-palindrome", "Hard", "n − LPS", "30 min"),
          t("Valid Palindrome III", "valid-palindrome-iii", "Hard", "Premium · LPS DP", "30 min"),
          t("Count Different Palindromic Subsequences", "count-different-palindromic-subsequences", "Hard", "interval DP", "40 min"),
        ],
      },
    ],
  },
  {
    id: "str-sec-6",
    title: "6) Parsing & Stack (String)",
    subSections: [
      {
        id: "str-sec-6-sub-1",
        title: "Parsing",
        topics: [
          { ...t("Valid Parentheses", "valid-parentheses", "Easy", "Base (also Stack)", "15 min"), startHere: true },
          t("Decode String", "decode-string", "Medium", "IMP · nested, 2 stacks"),
          t("Remove All Adjacent Duplicates In String", "remove-all-adjacent-duplicates-in-string", "Easy", "", "15 min"),
          t("Remove All Adjacent Duplicates in String II", "remove-all-adjacent-duplicates-in-string-ii", "Medium", "(char, count) stack"),
          t("Simplify Path", "simplify-path", "Medium"),
          t("Basic Calculator", "basic-calculator", "Hard", "", "35 min"),
          t("Basic Calculator II", "basic-calculator-ii", "Medium", "Precedence"),
          t("Number of Atoms", "number-of-atoms", "Hard", "nested parse", "40 min"),
          t("Mini Parser", "mini-parser", "Medium", "Nested int"),
          t("Ternary Expression Parser", "ternary-expression-parser", "Medium", "Premium · right-to-left"),
          t("Parse Lisp Expression", "parse-lisp-expression", "Hard", "scope + parse", "40 min"),
        ],
      },
    ],
  },
  {
    id: "str-sec-7",
    title: "7) String → Number / Arithmetic / Conversion",
    subSections: [
      {
        id: "str-sec-7-sub-1",
        title: "Conversion",
        topics: [
          { ...t("Roman to Integer", "roman-to-integer", "Easy", "IMP", "20 min"), startHere: true },
          t("Integer to Roman", "integer-to-roman", "Medium", "Greedy value table"),
          t("String to Integer (atoi)", "string-to-integer-atoi", "Medium", "IMP · overflow edge"),
          t("Add Strings", "add-strings", "Easy", "Carry sim", "20 min"),
          t("Add Binary", "add-binary", "Easy", "", "20 min"),
          t("Multiply Strings", "multiply-strings", "Medium", "IMP · grade-school", "30 min"),
          t("Excel Sheet Column Number", "excel-sheet-column-number", "Easy", "Base-26", "15 min"),
          t("Excel Sheet Column Title", "excel-sheet-column-title", "Easy", "Base-26 reverse", "20 min"),
          t("Decode Ways", "decode-ways", "Medium", "IMP · DP"),
          t("Integer to English Words", "integer-to-english-words", "Hard", "chunk by 1000", "35 min"),
        ],
      },
    ],
  },
  {
    id: "str-sec-8",
    title: "8) String DP (Edit Distance / LCS / Matching)",
    subSections: [
      {
        id: "str-sec-8-sub-1",
        title: "String DP",
        topics: [
          { ...t("Longest Common Subsequence", "longest-common-subsequence", "Medium", "IMP · base 2D DP"), startHere: true },
          t("Edit Distance", "edit-distance", "Medium", "IMP · must-do"),
          t("One Edit Distance", "one-edit-distance", "Medium", "Premium · 2-ptr"),
          t("Delete Operation for Two Strings", "delete-operation-for-two-strings", "Medium", "via LCS"),
          t("Minimum ASCII Delete Sum for Two Strings", "minimum-ascii-delete-sum-for-two-strings", "Medium"),
          t("Shortest Common Supersequence", "shortest-common-supersequence", "Hard", "LCS + reconstruct", "35 min"),
          t("Distinct Subsequences", "distinct-subsequences", "Hard", "counting DP", "35 min"),
          t("Interleaving String", "interleaving-string", "Medium", "2D DP"),
          t("Word Break", "word-break", "Medium", "IMP · DP + set"),
          t("Word Break II", "word-break-ii", "Hard", "DP + backtrack", "35 min"),
          t("Wildcard Matching", "wildcard-matching", "Hard", "?/*", "35 min"),
          t("Regular Expression Matching", "regular-expression-matching", "Hard", "IMP · ./*", "40 min"),
          t("Scramble String", "scramble-string", "Hard", "interval + memo", "40 min"),
        ],
      },
    ],
  },
  {
    id: "str-sec-9",
    title: "9) Trie (Prefix Tree)",
    subSections: [
      {
        id: "str-sec-9-sub-1",
        title: "Trie",
        topics: [
          { ...t("Implement Trie (Prefix Tree)", "implement-trie-prefix-tree", "Medium", "IMP · base"), startHere: true },
          t("Design Add and Search Words Data Structure", "design-add-and-search-words-data-structure", "Medium", "IMP · . = DFS"),
          t("Implement Trie II (Prefix Tree)", "implement-trie-ii-prefix-tree", "Medium", "Premium · prefix counts"),
          t("Map Sum Pairs", "map-sum-pairs", "Medium"),
          t("Replace Words", "replace-words", "Medium", "Shortest root"),
          t("Longest Word in Dictionary", "longest-word-in-dictionary", "Medium"),
          t("Search Suggestions System", "search-suggestions-system", "Medium", "IMP · autocomplete"),
          t("Word Search II", "word-search-ii", "Hard", "IMP · trie + backtrack", "40 min"),
          t("Stream of Characters", "stream-of-characters", "Hard", "reversed trie", "35 min"),
          t("Maximum XOR of Two Numbers in an Array", "maximum-xor-of-two-numbers-in-an-array", "Medium", "Bit-trie (also Array)"),
          t("Concatenated Words", "concatenated-words", "Hard", "trie + DP", "40 min"),
          t("Palindrome Pairs", "palindrome-pairs", "Hard", "trie of reverses", "40 min"),
        ],
      },
    ],
  },
  {
    id: "str-sec-10",
    title: "10) Greedy / Constructive (Strings)",
    subSections: [
      {
        id: "str-sec-10-sub-1",
        title: "Greedy",
        topics: [
          t("Largest Odd Number in String", "largest-odd-number-in-string", "Easy", "Rightmost odd digit", "10 min"),
          t("Maximum 69 Number", "maximum-69-number", "Easy", "First 6→9", "10 min"),
          t("Increasing Decreasing String", "increasing-decreasing-string", "Easy", "", "15 min"),
          t("Optimal Partition of String", "optimal-partition-of-string", "Medium", "Greedy + set"),
          { ...t("Partition Labels", "partition-labels", "Medium", "IMP · last index"), startHere: true },
          t("Minimum Deletions to Make Character Frequencies Unique", "minimum-deletions-to-make-character-frequencies-unique", "Medium"),
          t("Reorganize String", "reorganize-string", "Medium", "IMP · max-heap greedy"),
          t("Remove Duplicate Letters", "remove-duplicate-letters", "Medium", "IMP · monotonic stack — also Stack §4.3"),
          t("Smallest Subsequence of Distinct Characters", "smallest-subsequence-of-distinct-characters", "Medium", "Same as above"),
          t("Remove K Digits", "remove-k-digits", "Medium", "Monotonic stack (also Stack §4.3)"),
        ],
      },
    ],
  },
  {
    id: "str-sec-11",
    title: "11) Advanced / Hard",
    subSections: [
      {
        id: "str-sec-11-sub-1",
        title: "Advanced",
        topics: [
          t("Text Justification", "text-justification", "Hard", "greedy line-fill + spacing", "40 min"),
          t("Strange Printer", "strange-printer", "Hard", "interval DP", "35 min"),
          t("Distinct Echo Substrings", "distinct-echo-substrings", "Hard", "hashing", "40 min"),
          t("Minimum Window Subsequence", "minimum-window-subsequence", "Hard", "Premium · 2-ptr/DP", "35 min"),
        ],
      },
    ],
  },
  {
    id: "str-sec-12",
    title: "12) To Do (Later)",
    subSections: [
      {
        id: "str-sec-12-sub-1",
        title: "Later",
        topics: [
          t("Basic Calculator III", "basic-calculator-iii", "Hard", "", "35 min"),
          t("Basic Calculator IV", "basic-calculator-iv", "Hard", "", "40 min"),
          t("Encode and Decode Strings", "encode-and-decode-strings", "Medium"),
          t("Number of Ways to Form a Target String Given a Dictionary", "number-of-ways-to-form-a-target-string-given-a-dictionary", "Hard", "", "35 min"),
          t("Word Squares", "word-squares", "Hard", "", "35 min"),
        ],
      },
    ],
  },
];

const __all = stringSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const stringSheetMeta = {
  id: "string-typewise",
  title: "String Questions Sheet (Type-wise)",
  description:
    "Type-wise String question bank (basic → advanced) — two pointers, sliding window, hashing, KMP/Rabin-Karp, palindromes, parsing, conversion, string DP, Trie, greedy & advanced.",
  lastUpdated: "July 8, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
