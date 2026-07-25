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
  id: `math-${++__id}`,
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

export const mathSheetSections: Section[] = [
  {
    id: "math-sec-0",
    title: "0) Digit Manipulation / Arithmetic Basics",
    subSections: [
      {
        id: "math-sec-0-sub-1",
        title: "Digit basics",
        topics: [
          { ...t("Reverse Integer", "reverse-integer", "Medium", "IMP (overflow handling)"), startHere: true },
          t("Palindrome Number", "palindrome-number", "Easy", "IMP (reverse half)"),
          t("Plus One", "plus-one", "Easy", "IMP (carry propagation)"),
          t("Happy Number", "happy-number", "Easy", "IMP (cycle detection — Floyd)"),
          t("Add Digits", "add-digits", "Easy", "IMP (digital root O(1))"),
          t("Self Dividing Numbers", "self-dividing-numbers", "Easy"),
          t("Integer Replacement", "integer-replacement", "Medium", "IMP (greedy on bits)"),
          t("Nth Digit", "nth-digit", "Medium", "IMP (find range by digit-length)"),
          t("Number of Steps to Reduce a Number to Zero", "number-of-steps-to-reduce-a-number-to-zero", "Easy"),
          t("Smallest Value of the Rearranged Number", "smallest-value-of-the-rearranged-number", "Medium"),
        ],
      },
    ],
  },
  {
    id: "math-sec-1",
    title: "1) GCD / LCM (Euclid's Algorithm)",
    subSections: [
      {
        id: "math-sec-1-sub-1",
        title: "GCD / LCM",
        topics: [
          { ...t("Greatest Common Divisor of Strings", "greatest-common-divisor-of-strings", "Easy", "IMP (GCD on lengths)"), startHere: true },
          t("Find Greatest Common Divisor of Array", "find-greatest-common-divisor-of-array", "Easy", "GCD(min, max)"),
          t("Water and Jug Problem", "water-and-jug-problem", "Medium", "IMP (Bézout: solvable iff z % gcd == 0)"),
          t("Simplified Fractions", "simplified-fractions", "Medium", "Coprime pairs"),
          t("Fraction Addition and Subtraction", "fraction-addition-and-subtraction", "Medium", "LCM of denominators"),
          t("Replace Non-Coprime Numbers in Array", "replace-non-coprime-numbers-in-array", "Hard", "Stack + GCD/LCM", "35 min"),
          t("Nth Magical Number", "nth-magical-number", "Hard", "H, LCM + BS", "35 min"),
          t("Number of Different Subsequences GCDs", "number-of-different-subsequences-gcds", "Hard", "H, iterate over possible GCDs", "35 min"),
        ],
      },
    ],
  },
  {
    id: "math-sec-2",
    title: "2) Prime Numbers (Sieve / Primality / Factorization)",
    subSections: [
      {
        id: "math-sec-2-sub-1",
        title: "Primes & Sieve",
        topics: [
          { ...t("Count Primes", "count-primes", "Medium", "IMP (Sieve of Eratosthenes)"), startHere: true },
          t("Ugly Number", "ugly-number", "Easy", "Divide out 2/3/5"),
          t("Ugly Number II", "ugly-number-ii", "Medium", "IMP (3-pointer / heap)"),
          t("Perfect Squares", "perfect-squares", "Medium", "Lagrange / DP"),
          t("2 Keys Keyboard", "2-keys-keyboard", "Medium", "IMP (sum of prime factors)"),
          t("Prime Arrangements", "prime-arrangements", "Easy", "Count primes × factorials"),
          t("Closest Prime Numbers in Range", "closest-prime-numbers-in-range", "Medium", "Sieve + scan"),
          t("Distinct Prime Factors of Product of Array", "distinct-prime-factors-of-product-of-array", "Medium", "Factorize each"),
          t("Smallest Value After Replacing With Sum of Prime Factors", "smallest-value-after-replacing-with-sum-of-prime-factors", "Medium"),
          t("Largest Component Size by Common Factor", "largest-component-size-by-common-factor", "Hard", "H, prime factor + Union-Find", "35 min"),
        ],
      },
    ],
  },
  {
    id: "math-sec-3",
    title: "3) Modular Arithmetic & Fast Exponentiation",
    subSections: [
      {
        id: "math-sec-3-sub-1",
        title: "Fast power & modular",
        topics: [
          { ...t("Pow(x, n)", "powx-n", "Medium", "IMP (binary exponentiation)"), startHere: true },
          t("Super Pow", "super-pow", "Medium", "IMP (modular exp + digit-by-digit)"),
          t("Count Good Numbers", "count-good-numbers", "Medium", "IMP (fast power mod 1e9+7)"),
          t("The kth Factor of n", "the-kth-factor-of-n", "Medium", "Divisor enumeration"),
          t("Product of the Last K Numbers", "product-of-the-last-k-numbers", "Medium", "Prefix product"),
          t("Fancy Sequence", "fancy-sequence", "Hard", "H, modular inverse (Fermat)", "35 min"),
        ],
      },
    ],
  },
  {
    id: "math-sec-4",
    title: "4) Combinatorics (nCr / Pascal / Catalan)",
    subSections: [
      {
        id: "math-sec-4-sub-1",
        title: "Combinatorics",
        topics: [
          { ...t("Pascal's Triangle", "pascals-triangle", "Easy", "IMP (nCr build-up)"), startHere: true },
          t("Pascal's Triangle II", "pascals-triangle-ii", "Easy", "O(k) space"),
          t("Unique Paths", "unique-paths", "Medium", "IMP (C(m+n, n) closed form)"),
          t("Unique Binary Search Trees", "unique-binary-search-trees", "Medium", "IMP (Catalan number)"),
          t("Count All Valid Pickup and Delivery Options", "count-all-valid-pickup-and-delivery-options", "Hard", "Product recurrence mod", "35 min"),
          t("Handshakes That Don't Cross", "handshakes-that-dont-cross", "Medium", "H, Catalan"),
          t("Number of Ways to Reorder Array to Get Same BST", "number-of-ways-to-reorder-array-to-get-same-bst", "Hard", "H, nCr + recursion", "35 min"),
          t("Poor Pigs", "poor-pigs", "Hard", "H, base/counting insight", "35 min"),
        ],
      },
    ],
  },
  {
    id: "math-sec-5",
    title: "5) Number Base Conversion",
    subSections: [
      {
        id: "math-sec-5-sub-1",
        title: "Base conversion",
        topics: [
          { ...t("Base 7", "base-7", "Easy", "Repeated mod/divide"), startHere: true },
          t("Excel Sheet Column Number", "excel-sheet-column-number", "Easy", "IMP (base-26)"),
          t("Excel Sheet Column Title", "excel-sheet-column-title", "Easy", "IMP (base-26, 1-indexed twist)"),
          t("Roman to Integer", "roman-to-integer", "Easy", "IMP"),
          t("Integer to Roman", "integer-to-roman", "Medium", "Greedy value table"),
          t("Fraction to Recurring Decimal", "fraction-to-recurring-decimal", "Medium", "IMP (long division + cycle detect)"),
          t("Number of Digit One", "number-of-digit-one", "Hard", "H, digit math", "35 min"),
        ],
      },
    ],
  },
  {
    id: "math-sec-6",
    title: "6) Divisors & Factors",
    subSections: [
      {
        id: "math-sec-6-sub-1",
        title: "Divisors",
        topics: [
          { ...t("Four Divisors", "four-divisors", "Medium", "Sum divisors up to √n"), startHere: true },
          t("Three Divisors", "three-divisors", "Easy", "Perfect square of prime"),
          t("Perfect Number", "perfect-number", "Easy", "Sum proper divisors"),
          t("Check if Number is a Sum of Powers of Three", "check-if-number-is-a-sum-of-powers-of-three", "Medium", "Base-3 digits ∈ {0,1}"),
          t("Bulb Switcher", "bulb-switcher", "Medium", "IMP (only perfect squares stay on → √n)"),
          t("Consecutive Numbers Sum", "consecutive-numbers-sum", "Hard", "H, odd-divisor counting", "35 min"),
          t("Factorial Trailing Zeroes", "factorial-trailing-zeroes", "Medium", "IMP (count factors of 5)"),
        ],
      },
    ],
  },
  {
    id: "math-sec-7",
    title: "7) Geometry",
    subSections: [
      {
        id: "math-sec-7-sub-1",
        title: "Geometry",
        topics: [
          { ...t("Check If It Is a Straight Line", "check-if-it-is-a-straight-line", "Easy", "IMP (cross product, no division)"), startHere: true },
          t("Valid Boomerang", "valid-boomerang", "Easy", "Collinearity check"),
          t("Minimum Time Visiting All Points", "minimum-time-visiting-all-points", "Easy", "Chebyshev distance"),
          t("Rectangle Overlap", "rectangle-overlap", "Easy", "Projection check"),
          t("Rectangle Area", "rectangle-area", "Medium", "Inclusion-exclusion"),
          t("Minimum Area Rectangle", "minimum-area-rectangle", "Medium", "IMP (diagonal pairs in set)"),
          t("Max Points on a Line", "max-points-on-a-line", "Hard", "H, slope map", "35 min"),
          t("Erect the Fence", "erect-the-fence", "Hard", "H, convex hull (Andrew's monotone chain)", "40 min"),
        ],
      },
    ],
  },
  {
    id: "math-sec-8",
    title: "8) Random & Probability (Sampling)",
    subSections: [
      {
        id: "math-sec-8-sub-1",
        title: "Sampling",
        topics: [
          { ...t("Shuffle an Array", "shuffle-an-array", "Medium", "IMP (Fisher-Yates)"), startHere: true },
          t("Random Pick with Weight", "random-pick-with-weight", "Medium", "IMP (prefix sum + BS)"),
          t("Random Pick Index", "random-pick-index", "Medium", "IMP (reservoir sampling)"),
          t("Linked List Random Node", "linked-list-random-node", "Medium", "Reservoir sampling"),
          t("Implement Rand10() Using Rand7()", "implement-rand10-using-rand7", "Medium", "IMP (rejection sampling)"),
          t("Generate Random Point in a Circle", "generate-random-point-in-a-circle", "Medium", "H, rejection / polar"),
          t("Random Point in Non-overlapping Rectangles", "random-point-in-non-overlapping-rectangles", "Medium", "H, weighted by area"),
        ],
      },
    ],
  },
  {
    id: "math-sec-9",
    title: "9) Advanced / Hard",
    subSections: [
      {
        id: "math-sec-9-sub-1",
        title: "Advanced",
        topics: [
          { ...t("Ugly Number III", "ugly-number-iii", "Medium", "H, IMP (BS + inclusion-exclusion + LCM)"), startHere: true },
          t("Preimage Size of Factorial Zeroes Function", "preimage-size-of-factorial-zeroes-function", "Hard", "H, BS on trailing zeros", "35 min"),
          t("Minimum Moves to Equal Array Elements II", "minimum-moves-to-equal-array-elements-ii", "Medium", "IMP (median minimizes L1)"),
          t("Bulb Switcher II", "bulb-switcher-ii", "Medium", "Pattern insight (≤ 8 states)"),
          t("Permutation Sequence", "permutation-sequence", "Hard", "H, factorial number system", "35 min"),
          t("Count Array Pairs Divisible by K", "count-array-pairs-divisible-by-k", "Hard", "H, GCD counting", "35 min"),
        ],
      },
    ],
  },
  {
    id: "math-sec-10",
    title: "10) To Do (Later)",
    subSections: [
      {
        id: "math-sec-10-sub-1",
        title: "To Do",
        topics: [
          t("Super Ugly Number", "super-ugly-number", "Medium"),
          t("Find the Derangement of An Array", "find-the-derangement-of-an-array", "Medium"),
          t("Queries on Number of Points Inside a Circle", "queries-on-number-of-points-inside-a-circle", "Medium"),
          t("Largest Triangle Area", "largest-triangle-area", "Easy"),
          t("Random Flip Matrix", "random-flip-matrix", "Medium"),
        ],
      },
    ],
  },
];

const __all = mathSheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const mathSheetMeta = {
  id: "math-typewise",
  title: "Math / Number Theory Questions Sheet (Type-wise)",
  description:
    "Type-wise Math & Number Theory question bank covering ~100% of LeetCode math problems — digit manipulation, GCD/LCM (Euclid), Sieve/primes, fast exponentiation & modular inverse, combinatorics (Pascal/Catalan), base conversion, divisors, geometry, sampling & advanced hard.",
  lastUpdated: "July 9, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
