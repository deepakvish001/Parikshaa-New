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
  id: `arr-${++__id}`,
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

export const arraySheetSections: Section[] = [
  {
    id: "arr-sec-0",
    title: "0) Array Basics / Warm-up",
    subSections: [
      {
        id: "arr-sec-0-sub-1",
        title: "Warm-up",
        topics: [
          t("Concatenation of Array", "concatenation-of-array", "Easy", "Traversal", "10 min"),
          t("Build Array from Permutation", "build-array-from-permutation", "Easy", "In-place trick (follow-up)", "15 min"),
          t("Shuffle the Array", "shuffle-the-array", "Easy", "", "10 min"),
          t("Richest Customer Wealth", "richest-customer-wealth", "Easy", "2D traversal", "10 min"),
          t("Kids With the Greatest Number of Candies", "kids-with-the-greatest-number-of-candies", "Easy", "", "10 min"),
          t("Number of Good Pairs", "number-of-good-pairs", "Easy", "Count via hashing", "15 min"),
          t("How Many Numbers Are Smaller Than the Current Number", "how-many-numbers-are-smaller-than-the-current-number", "Easy", "Counting sort idea", "15 min"),
          t("Create Target Array in the Given Order", "create-target-array-in-the-given-order", "Easy", "Insertion", "10 min"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-1",
    title: "1) Prefix Sum & Difference Array",
    subSections: [
      {
        id: "arr-sec-1-sub-1",
        title: "1.1 1D Prefix Sum",
        topics: [
          { ...t("Running Sum of 1d Array", "running-sum-of-1d-array", "Easy", "Base", "10 min"), startHere: true },
          t("Find Pivot Index", "find-pivot-index", "Easy", "IMP", "15 min"),
          t("Find the Middle Index in Array", "find-the-middle-index-in-array", "Easy", "Same as pivot", "15 min"),
          t("Left and Right Sum Differences", "left-and-right-sum-differences", "Easy", "", "10 min"),
          t("Range Sum Query - Immutable", "range-sum-query-immutable", "Easy", "Design", "15 min"),
          t("Product of Array Except Self", "product-of-array-except-self", "Medium", "IMP · prefix×suffix, no division"),
        ],
      },
      {
        id: "arr-sec-1-sub-2",
        title: "1.2 Prefix Sum + HashMap (Subarray patterns)",
        topics: [
          { ...t("Subarray Sum Equals K", "subarray-sum-equals-k", "Medium", "IMP · base pattern"), startHere: true },
          t("Contiguous Array", "contiguous-array", "Medium", "Map 0→−1"),
          t("Subarray Sums Divisible by K", "subarray-sums-divisible-by-k", "Medium", "Remainder buckets"),
          t("Continuous Subarray Sum", "continuous-subarray-sum", "Medium"),
          t("Count Number of Nice Subarrays", "count-number-of-nice-subarrays", "Medium", "Odd count = prefix"),
          t("Binary Subarrays With Sum", "binary-subarrays-with-sum", "Medium"),
          t("Maximum Size Subarray Sum Equals k", "maximum-size-subarray-sum-equals-k", "Medium", "Premium"),
        ],
      },
      {
        id: "arr-sec-1-sub-3",
        title: "1.3 2D Prefix Sum",
        topics: [
          { ...t("Range Sum Query 2D - Immutable", "range-sum-query-2d-immutable", "Medium", "IMP · base 2D"), startHere: true },
          t("Matrix Block Sum", "matrix-block-sum", "Medium"),
          t("Number of Submatrices That Sum to Target", "number-of-submatrices-that-sum-to-target", "Hard", "2D + hashmap", "35 min"),
          t("Count Square Submatrices with All Ones", "count-square-submatrices-with-all-ones", "Medium", "DP"),
        ],
      },
      {
        id: "arr-sec-1-sub-4",
        title: "1.4 Difference Array (Range Update)",
        topics: [
          t("Range Addition", "range-addition", "Medium", "Premium · base diff array"),
          { ...t("Corporate Flight Bookings", "corporate-flight-bookings", "Medium", "IMP"), startHere: true },
          t("Car Pooling", "car-pooling", "Medium", "Diff / sweep"),
          t("Range Addition II", "range-addition-ii", "Easy", "", "15 min"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-2",
    title: "2) Two Pointers",
    subSections: [
      {
        id: "arr-sec-2-sub-1",
        title: "2.1 Opposite Ends (converging)",
        topics: [
          { ...t("Two Sum II - Input Array Is Sorted", "two-sum-ii-input-array-is-sorted", "Medium", "Base"), startHere: true },
          t("3Sum", "3sum", "Medium", "IMP · sort + 2ptr", "30 min"),
          t("3Sum Closest", "3sum-closest", "Medium"),
          t("4Sum", "4sum", "Medium", "Generalize k-sum", "30 min"),
          t("Container With Most Water", "container-with-most-water", "Medium", "IMP"),
          t("Trapping Rain Water", "trapping-rain-water", "Hard", "IMP · also Stack sheet", "35 min"),
          t("Valid Palindrome", "valid-palindrome", "Easy", "", "15 min"),
          t("Sort Colors", "sort-colors", "Medium", "IMP · Dutch flag, 3-way"),
          t("Boats to Save People", "boats-to-save-people", "Medium", "Greedy + 2ptr"),
        ],
      },
      {
        id: "arr-sec-2-sub-2",
        title: "2.2 Same Direction (Read / Write pointer)",
        topics: [
          { ...t("Remove Duplicates from Sorted Array", "remove-duplicates-from-sorted-array", "Easy", "Base write-ptr", "15 min"), startHere: true },
          t("Remove Duplicates from Sorted Array II", "remove-duplicates-from-sorted-array-ii", "Medium", "Keep ≤2"),
          t("Remove Element", "remove-element", "Easy", "", "10 min"),
          t("Move Zeroes", "move-zeroes", "Easy", "IMP", "15 min"),
          t("Merge Sorted Array", "merge-sorted-array", "Easy", "Fill from back", "15 min"),
          t("Squares of a Sorted Array", "squares-of-a-sorted-array", "Easy", "2ptr from ends", "15 min"),
          t("Sort Array By Parity", "sort-array-by-parity", "Easy", "", "10 min"),
          t("Duplicate Zeros", "duplicate-zeros", "Easy", "", "15 min"),
          t("Rearrange Array Elements by Sign", "rearrange-array-elements-by-sign", "Medium"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-3",
    title: "3) Sliding Window",
    subSections: [
      {
        id: "arr-sec-3-sub-1",
        title: "3.1 Fixed Window",
        topics: [
          { ...t("Maximum Average Subarray I", "maximum-average-subarray-i", "Easy", "Base", "15 min"), startHere: true },
          t("Maximum Number of Vowels in a Substring of Given Length", "maximum-number-of-vowels-in-a-substring-of-given-length", "Medium"),
          t("Find All Anagrams in a String", "find-all-anagrams-in-a-string", "Medium", "IMP · freq window"),
          t("Permutation in String", "permutation-in-string", "Medium"),
          t("Substrings of Size Three with Distinct Characters", "substrings-of-size-three-with-distinct-characters", "Easy", "", "15 min"),
          t("K Radius Subarray Averages", "k-radius-subarray-averages", "Medium", "Window + prefix"),
          t("Defuse the Bomb", "defuse-the-bomb", "Easy", "Circular window", "15 min"),
          t("Maximum Points You Can Obtain from Cards", "maximum-points-you-can-obtain-from-cards", "Medium", "Invert: min middle window"),
        ],
      },
      {
        id: "arr-sec-3-sub-2",
        title: "3.2 Variable Window (Longest / Shortest)",
        topics: [
          { ...t("Longest Substring Without Repeating Characters", "longest-substring-without-repeating-characters", "Medium", "IMP · base"), startHere: true },
          t("Minimum Size Subarray Sum", "minimum-size-subarray-sum", "Medium", "IMP · shortest"),
          t("Longest Repeating Character Replacement", "longest-repeating-character-replacement", "Medium", "window − maxFreq ≤ k"),
          t("Max Consecutive Ones III", "max-consecutive-ones-iii", "Medium", "At most k zeros"),
          t("Fruit Into Baskets", "fruit-into-baskets", "Medium", "At most 2 types"),
          t("Longest Subarray of 1's After Deleting One Element", "longest-subarray-of-1s-after-deleting-one-element", "Medium"),
          t("Subarray Product Less Than K", "subarray-product-less-than-k", "Medium"),
          t("Longest Substring with At Most Two Distinct Characters", "longest-substring-with-at-most-two-distinct-characters", "Medium", "Premium"),
          t("Longest Substring with At Most K Distinct Characters", "longest-substring-with-at-most-k-distinct-characters", "Medium", "Premium"),
          t("Minimum Window Substring", "minimum-window-substring", "Hard", "IMP", "35 min"),
        ],
      },
      {
        id: "arr-sec-3-sub-3",
        title: "3.3 Count Subarrays (At-Most-K trick)",
        topics: [
          { ...t("Subarrays with K Different Integers", "subarrays-with-k-different-integers", "Hard", "IMP · atMost(k) − atMost(k−1)", "35 min"), startHere: true },
          t("Number of Substrings Containing All Three Characters", "number-of-substrings-containing-all-three-characters", "Medium"),
          t("Count Number of Nice Subarrays", "count-number-of-nice-subarrays", "Medium", "Also §1.2"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-4",
    title: "4) Kadane / Maximum Subarray (DP on arrays)",
    subSections: [
      {
        id: "arr-sec-4-sub-1",
        title: "Kadane family",
        topics: [
          { ...t("Maximum Subarray", "maximum-subarray", "Medium", "IMP · base Kadane"), startHere: true },
          t("Maximum Sum Circular Subarray", "maximum-sum-circular-subarray", "Medium", "Total − minKadane"),
          t("Maximum Product Subarray", "maximum-product-subarray", "Medium", "IMP · track min & max"),
          t("Best Time to Buy and Sell Stock", "best-time-to-buy-and-sell-stock", "Easy", "IMP · min-so-far", "20 min"),
          t("Best Time to Buy and Sell Stock II", "best-time-to-buy-and-sell-stock-ii", "Medium", "Greedy"),
          t("Maximum Absolute Sum of Any Subarray", "maximum-absolute-sum-of-any-subarray", "Medium", "max & min Kadane"),
          t("Longest Turbulent Subarray", "longest-turbulent-subarray", "Medium"),
          t("K-Concatenation Maximum Sum", "k-concatenation-maximum-sum", "Medium"),
          t("Maximum Sum of 3 Non-Overlapping Subarrays", "maximum-sum-of-3-non-overlapping-subarrays", "Hard", "", "35 min"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-5",
    title: "5) Hashing (HashMap / HashSet)",
    subSections: [
      {
        id: "arr-sec-5-sub-1",
        title: "Hashing",
        topics: [
          { ...t("Two Sum", "two-sum", "Easy", "IMP · base", "15 min"), startHere: true },
          t("Contains Duplicate", "contains-duplicate", "Easy", "", "10 min"),
          t("Contains Duplicate II", "contains-duplicate-ii", "Easy", "Index window", "15 min"),
          t("Contains Duplicate III", "contains-duplicate-iii", "Hard", "Bucketing", "35 min"),
          t("Intersection of Two Arrays", "intersection-of-two-arrays", "Easy", "", "10 min"),
          t("Intersection of Two Arrays II", "intersection-of-two-arrays-ii", "Easy", "Freq map", "15 min"),
          t("Longest Consecutive Sequence", "longest-consecutive-sequence", "Medium", "IMP · O(n) set"),
          t("Group Anagrams", "group-anagrams", "Medium", "Key = sorted/count"),
          t("4Sum II", "4sum-ii", "Medium", "Split into 2+2"),
          t("Max Points on a Line", "max-points-on-a-line", "Hard", "slope map", "35 min"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-6",
    title: "6) Sorting-Based",
    subSections: [
      {
        id: "arr-sec-6-sub-1",
        title: "Sorting",
        topics: [
          t("Sort an Array", "sort-an-array", "Medium", "IMP · implement merge/quick sort", "30 min"),
          t("Maximum Product of Three Numbers", "maximum-product-of-three-numbers", "Easy", "Watch negatives", "15 min"),
          t("Largest Number", "largest-number", "Medium", "Custom comparator"),
          t("H-Index", "h-index", "Medium", "Sort or counting"),
          t("Relative Sort Array", "relative-sort-array", "Easy", "", "15 min"),
          t("Sort Array By Parity II", "sort-array-by-parity-ii", "Easy", "", "10 min"),
          t("Height Checker", "height-checker", "Easy", "", "10 min"),
          t("Array Partition", "array-partition", "Easy", "Sort greedy", "15 min"),
          t("Reduce Array Size to The Half", "reduce-array-size-to-the-half", "Medium", "Freq sort greedy"),
          t("Maximum Gap", "maximum-gap", "Medium", "bucket/radix sort", "30 min"),
          t("Car Fleet", "car-fleet", "Medium", "Sort + stack (also Stack sheet)"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-7",
    title: "7) Intervals / Sweep Line",
    subSections: [
      {
        id: "arr-sec-7-sub-1",
        title: "Intervals",
        topics: [
          { ...t("Merge Intervals", "merge-intervals", "Medium", "IMP · base"), startHere: true },
          t("Insert Interval", "insert-interval", "Medium", "IMP"),
          t("Non-overlapping Intervals", "non-overlapping-intervals", "Medium", "Greedy by end"),
          t("Minimum Number of Arrows to Burst Balloons", "minimum-number-of-arrows-to-burst-balloons", "Medium", "Same as above"),
          t("Meeting Rooms", "meeting-rooms", "Easy", "Premium", "15 min"),
          t("Meeting Rooms II", "meeting-rooms-ii", "Medium", "Premium · IMP min-heap / sweep"),
          t("Interval List Intersections", "interval-list-intersections", "Medium", "2ptr"),
          t("My Calendar I", "my-calendar-i", "Medium"),
          t("My Calendar II", "my-calendar-ii", "Medium", "Overlap counting"),
          t("Divide Intervals Into Minimum Number of Groups", "divide-intervals-into-minimum-number-of-groups", "Medium", "= max overlap"),
          t("Employee Free Time", "employee-free-time", "Hard", "Premium", "35 min"),
          t("Minimum Interval to Include Each Query", "minimum-interval-to-include-each-query", "Hard", "sort + heap", "35 min"),
          t("The Skyline Problem", "the-skyline-problem", "Hard", "sweep + heap", "40 min"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-8",
    title: "8) Binary Search",
    subSections: [
      {
        id: "arr-sec-8-sub-1",
        title: "8.1 Classic",
        topics: [
          { ...t("Binary Search", "binary-search", "Easy", "Base template", "15 min"), startHere: true },
          t("Search Insert Position", "search-insert-position", "Easy", "Lower bound", "15 min"),
          t("First Bad Version", "first-bad-version", "Easy", "", "15 min"),
          t("Guess Number Higher or Lower", "guess-number-higher-or-lower", "Easy", "", "10 min"),
          t("Find First and Last Position of Element in Sorted Array", "find-first-and-last-position-of-element-in-sorted-array", "Medium", "IMP · lower+upper bound"),
        ],
      },
      {
        id: "arr-sec-8-sub-2",
        title: "8.2 Rotated / Mountain",
        topics: [
          { ...t("Search in Rotated Sorted Array", "search-in-rotated-sorted-array", "Medium", "IMP"), startHere: true },
          t("Search in Rotated Sorted Array II", "search-in-rotated-sorted-array-ii", "Medium", "Duplicates edge"),
          t("Find Minimum in Rotated Sorted Array", "find-minimum-in-rotated-sorted-array", "Medium", "IMP"),
          t("Find Minimum in Rotated Sorted Array II", "find-minimum-in-rotated-sorted-array-ii", "Hard", "", "30 min"),
          t("Find Peak Element", "find-peak-element", "Medium", "IMP"),
          t("Peak Index in a Mountain Array", "peak-index-in-a-mountain-array", "Medium"),
          t("Find in Mountain Array", "find-in-mountain-array", "Hard", "", "35 min"),
        ],
      },
      {
        id: "arr-sec-8-sub-3",
        title: "8.3 Binary Search on Answer",
        topics: [
          { ...t("Koko Eating Bananas", "koko-eating-bananas", "Medium", "IMP · base 'min rate'"), startHere: true },
          t("Capacity To Ship Packages Within D Days", "capacity-to-ship-packages-within-d-days", "Medium", "IMP"),
          t("Minimum Number of Days to Make m Bouquets", "minimum-number-of-days-to-make-m-bouquets", "Medium"),
          t("Find the Smallest Divisor Given a Threshold", "find-the-smallest-divisor-given-a-threshold", "Medium"),
          t("Magnetic Force Between Two Balls", "magnetic-force-between-two-balls", "Medium", "Maximize min gap"),
          t("Split Array Largest Sum", "split-array-largest-sum", "Hard", "IMP", "35 min"),
          t("Find K-th Smallest Pair Distance", "find-k-th-smallest-pair-distance", "Hard", "BS + 2ptr count", "35 min"),
          t("Kth Smallest Element in a Sorted Matrix", "kth-smallest-element-in-a-sorted-matrix", "Medium", "BS on value"),
          t("Median of Two Sorted Arrays", "median-of-two-sorted-arrays", "Hard", "IMP · partition BS", "40 min"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-9",
    title: "9) Matrix / 2D Array",
    subSections: [
      {
        id: "arr-sec-9-sub-1",
        title: "Matrix",
        topics: [
          { ...t("Set Matrix Zeroes", "set-matrix-zeroes", "Medium", "IMP · O(1) space"), startHere: true },
          t("Spiral Matrix", "spiral-matrix", "Medium", "IMP · boundaries"),
          t("Spiral Matrix II", "spiral-matrix-ii", "Medium"),
          t("Rotate Image", "rotate-image", "Medium", "IMP · transpose+reverse"),
          t("Search a 2D Matrix", "search-a-2d-matrix", "Medium", "Flatten BS"),
          t("Search a 2D Matrix II", "search-a-2d-matrix-ii", "Medium", "IMP · staircase"),
          t("Diagonal Traverse", "diagonal-traverse", "Medium"),
          t("Matrix Diagonal Sum", "matrix-diagonal-sum", "Easy", "", "10 min"),
          t("Transpose Matrix", "transpose-matrix", "Easy", "", "10 min"),
          t("Toeplitz Matrix", "toeplitz-matrix", "Easy", "", "10 min"),
          t("Reshape the Matrix", "reshape-the-matrix", "Easy", "", "10 min"),
          t("Valid Sudoku", "valid-sudoku", "Medium", "Hash rows/cols/boxes"),
          t("Game of Life", "game-of-life", "Medium", "IMP · in-place encode"),
          t("Rotating the Box", "rotating-the-box", "Medium", "Gravity + rotate"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-10",
    title: "10) Cyclic Sort / Index-as-Hash",
    subSections: [
      {
        id: "arr-sec-10-sub-1",
        title: "Cyclic sort",
        topics: [
          t("Missing Number", "missing-number", "Easy", "Sum / XOR / cyclic", "15 min"),
          { ...t("Find All Numbers Disappeared in an Array", "find-all-numbers-disappeared-in-an-array", "Easy", "IMP · negate index", "20 min"), startHere: true },
          t("Find All Duplicates in an Array", "find-all-duplicates-in-an-array", "Medium", "Negate index"),
          t("Set Mismatch", "set-mismatch", "Easy", "", "15 min"),
          t("Find the Duplicate Number", "find-the-duplicate-number", "Medium", "IMP · Floyd's cycle"),
          t("First Missing Positive", "first-missing-positive", "Hard", "IMP · place at index", "35 min"),
          t("Couples Holding Hands", "couples-holding-hands", "Hard", "cyclic swaps / union-find", "35 min"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-11",
    title: "11) Greedy on Arrays",
    subSections: [
      {
        id: "arr-sec-11-sub-1",
        title: "Greedy",
        topics: [
          { ...t("Jump Game", "jump-game", "Medium", "IMP · farthest reach"), startHere: true },
          t("Jump Game II", "jump-game-ii", "Medium", "IMP · BFS-levels greedy"),
          t("Gas Station", "gas-station", "Medium", "IMP"),
          t("Assign Cookies", "assign-cookies", "Easy", "", "15 min"),
          t("Lemonade Change", "lemonade-change", "Easy", "", "15 min"),
          t("Maximum Units on a Truck", "maximum-units-on-a-truck", "Easy", "", "15 min"),
          t("Two City Scheduling", "two-city-scheduling", "Medium", "Sort by diff"),
          t("Partition Labels", "partition-labels", "Medium", "IMP · last index"),
          t("Queue Reconstruction by Height", "queue-reconstruction-by-height", "Medium", "Sort + insert"),
          t("Candy", "candy", "Hard", "two passes", "35 min"),
          t("Task Scheduler", "task-scheduler", "Medium", "Greedy + freq (also Heap)"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-12",
    title: "12) Bit Manipulation on Arrays",
    subSections: [
      {
        id: "arr-sec-12-sub-1",
        title: "Bit tricks",
        topics: [
          { ...t("Single Number", "single-number", "Easy", "IMP · XOR", "15 min"), startHere: true },
          t("Single Number II", "single-number-ii", "Medium", "Bit-count %3"),
          t("Single Number III", "single-number-iii", "Medium", "XOR + split by set bit"),
          t("XOR Queries of a Subarray", "xor-queries-of-a-subarray", "Medium", "Prefix XOR"),
          t("Maximum XOR of Two Numbers in an Array", "maximum-xor-of-two-numbers-in-an-array", "Medium", "Bit-trie"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-13",
    title: "13) Voting (Boyer-Moore Majority)",
    subSections: [
      {
        id: "arr-sec-13-sub-1",
        title: "Majority",
        topics: [
          { ...t("Majority Element", "majority-element", "Easy", "IMP · Boyer-Moore", "20 min"), startHere: true },
          t("Majority Element II", "majority-element-ii", "Medium", "⌊n/3⌋ → 2 candidates"),
          t("Online Majority Element In Subarray", "online-majority-element-in-subarray", "Hard", "random + BIT", "40 min"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-14",
    title: "14) In-Place Rearrangement",
    subSections: [
      {
        id: "arr-sec-14-sub-1",
        title: "Rearrangement",
        topics: [
          { ...t("Next Permutation", "next-permutation", "Medium", "IMP · must-do algorithm"), startHere: true },
          t("Rotate Array", "rotate-array", "Medium", "IMP · reverse trick"),
          t("Pancake Sorting", "pancake-sorting", "Medium"),
          t("Wiggle Sort", "wiggle-sort", "Medium", "Premium"),
          t("Wiggle Sort II", "wiggle-sort-ii", "Medium", "Virtual indexing"),
          t("Array Nesting", "array-nesting", "Medium", "Cycle length"),
          t("Max Chunks To Make Sorted", "max-chunks-to-make-sorted", "Medium", "prefix max = index"),
          t("Max Chunks To Make Sorted II", "max-chunks-to-make-sorted-ii", "Hard", "prefixMax ≤ suffixMin", "30 min"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-15",
    title: "15) Subsequence (LIS family)",
    subSections: [
      {
        id: "arr-sec-15-sub-1",
        title: "LIS family",
        topics: [
          { ...t("Longest Increasing Subsequence", "longest-increasing-subsequence", "Medium", "IMP · patience / BS O(n log n)"), startHere: true },
          t("Number of Longest Increasing Subsequence", "number-of-longest-increasing-subsequence", "Medium", "DP length + count"),
          t("Russian Doll Envelopes", "russian-doll-envelopes", "Hard", "2D LIS", "35 min"),
          t("Maximum Length of Pair Chain", "maximum-length-of-pair-chain", "Medium", "Greedy/LIS"),
          t("Arithmetic Slices", "arithmetic-slices", "Medium", "DP on diff"),
          t("Longest Arithmetic Subsequence", "longest-arithmetic-subsequence", "Medium", "DP + map"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-16",
    title: "16) Advanced (BIT / Merge-Sort Counting / Design)",
    subSections: [
      {
        id: "arr-sec-16-sub-1",
        title: "Advanced",
        topics: [
          { ...t("Range Sum Query - Mutable", "range-sum-query-mutable", "Medium", "IMP · BIT / segment tree"), startHere: true },
          t("Count of Smaller Numbers After Self", "count-of-smaller-numbers-after-self", "Hard", "IMP · merge sort / BIT", "40 min"),
          t("Reverse Pairs", "reverse-pairs", "Hard", "merge sort", "35 min"),
          t("Count of Range Sum", "count-of-range-sum", "Hard", "prefix + merge sort", "40 min"),
          t("Random Pick with Weight", "random-pick-with-weight", "Medium", "Prefix + BS"),
          t("Random Pick Index", "random-pick-index", "Medium", "Reservoir sampling"),
          t("Shuffle an Array", "shuffle-an-array", "Medium", "Fisher-Yates"),
          t("Insert Delete GetRandom O(1)", "insert-delete-getrandom-o1", "Medium", "IMP · array + map"),
          t("Insert Delete GetRandom O(1) - Duplicates allowed", "insert-delete-getrandom-o1-duplicates-allowed", "Hard", "", "35 min"),
        ],
      },
    ],
  },
  {
    id: "arr-sec-17",
    title: "17) To Do (Later)",
    subSections: [
      {
        id: "arr-sec-17-sub-1",
        title: "Later",
        topics: [
          t("Create Sorted Array through Instructions", "create-sorted-array-through-instructions", "Hard", "", "35 min"),
          t("Max Value of Equation", "max-value-of-equation", "Hard", "", "35 min"),
          t("Constrained Subsequence Sum", "constrained-subsequence-sum", "Hard", "", "35 min"),
          t("Sum of Subarray Minimums", "sum-of-subarray-minimums", "Medium"),
          t("Sliding Window Maximum", "sliding-window-maximum", "Hard", "", "30 min"),
        ],
      },
    ],
  },
];

const __all = arraySheetSections.flatMap((s) => s.subSections.flatMap((ss) => ss.topics));

export const arraySheetMeta = {
  id: "array-typewise",
  title: "Array Questions Sheet (Type-wise)",
  description:
    "Type-wise Array question bank (basic → advanced) — prefix sum, two pointers, sliding window, Kadane, hashing, intervals, binary search, matrix, cyclic sort, greedy, bits, voting, in-place, LIS & BIT.",
  lastUpdated: "July 8, 2026",
  totalProblems: __all.length,
  completed: 0,
  easy: __all.filter((x) => x.difficulty === "Easy").length,
  medium: __all.filter((x) => x.difficulty === "Medium").length,
  hard: __all.filter((x) => x.difficulty === "Hard").length,
};
