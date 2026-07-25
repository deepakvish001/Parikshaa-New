/**
 * Curated coding curriculum used by the problem detail sidebar.
 * Each track has folders, each folder has an ordered list of problem slugs.
 * Slugs that don't exist in the DB will simply be hidden in the sidebar.
 */

export interface CurriculumProblem {
  slug: string;
  label: string;
}

export interface CurriculumFolder {
  id: string;
  label: string;
  problems: CurriculumProblem[];
}

export interface CurriculumTrack {
  id: "basic" | "advanced";
  label: string;
  folders: CurriculumFolder[];
}

export const CODING_CURRICULUM: CurriculumTrack[] = [
  {
    id: "basic",
    label: "Basic",
    folders: [
      {
        id: "fundamentals",
        label: "Fundamentals",
        problems: [
          { slug: "two-sum", label: "Two Sum" },
          { slug: "reverse-string", label: "Reverse String" },
          { slug: "palindrome-number", label: "Palindrome Number" },
          { slug: "fizz-buzz", label: "Fizz Buzz" },
        ],
      },
      {
        id: "arrays-basics",
        label: "Arrays Basics",
        problems: [
          { slug: "max-subarray", label: "Maximum Subarray" },
          { slug: "best-time-buy-sell-stock", label: "Best Time to Buy and Sell Stock" },
          { slug: "move-zeroes", label: "Move Zeroes" },
        ],
      },
      {
        id: "strings-basics",
        label: "Strings Basics",
        problems: [
          { slug: "valid-anagram", label: "Valid Anagram" },
          { slug: "valid-parentheses", label: "Valid Parentheses" },
        ],
      },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    folders: [
      {
        id: "fundamentals-adv",
        label: "Fundamentals",
        problems: [
          { slug: "binary-search", label: "Binary Search" },
          { slug: "merge-sorted-array", label: "Merge Sorted Array" },
        ],
      },
      {
        id: "logic-building",
        label: "Logic Building",
        problems: [
          { slug: "search-insert-position", label: "Search insert position" },
          { slug: "floor-ceil-sorted-array", label: "Floor and Ceil in Sorted Array" },
          { slug: "first-last-occurrence", label: "First and last occurrence" },
          { slug: "search-rotated-sorted-array-i", label: "Search in rotated sorted array-I" },
          { slug: "search-rotated-sorted-array-ii", label: "Search in rotated sorted array-II" },
          { slug: "find-minimum-rotated-sorted-array", label: "Find minimum in Rotated Sorted Array" },
          { slug: "find-rotation-count", label: "Find out how many times the array is rotated" },
          { slug: "single-element-sorted-array", label: "Single element in sorted array" },
        ],
      },
      {
        id: "on-answers",
        label: "On answers",
        problems: [
          { slug: "sqrt-x", label: "Sqrt(x)" },
          { slug: "find-peak-element", label: "Find Peak Element" },
          { slug: "koko-eating-bananas", label: "Koko Eating Bananas" },
        ],
      },
      {
        id: "faqs",
        label: "FAQs",
        problems: [
          { slug: "median-two-sorted-arrays", label: "Median of Two Sorted Arrays" },
          { slug: "aggressive-cows", label: "Aggressive Cows" },
        ],
      },
      {
        id: "2d-arrays",
        label: "2D Arrays",
        problems: [
          { slug: "search-2d-matrix", label: "Search a 2D Matrix" },
          { slug: "rotate-image", label: "Rotate Image" },
          { slug: "spiral-matrix", label: "Spiral Matrix" },
          { slug: "set-matrix-zeroes", label: "Set Matrix Zeroes" },
        ],
      },
    ],
  },
];

export const findCurriculumLocation = (slug: string) => {
  for (const track of CODING_CURRICULUM) {
    for (const folder of track.folders) {
      const idx = folder.problems.findIndex((p) => p.slug === slug);
      if (idx !== -1) {
        return { track, folder, index: idx };
      }
    }
  }
  return null;
};

export const allSlugs = (): string[] => {
  const out: string[] = [];
  for (const t of CODING_CURRICULUM) for (const f of t.folders) for (const p of f.problems) out.push(p.slug);
  return out;
};
