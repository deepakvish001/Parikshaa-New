// Static, single-line hints for every roadmap problem (Beginner + Experienced).
// Kept intentionally short — one nudge each, no spoilers.

export const PROBLEM_HINTS: Record<string, string> = {
  // ---- Arrays & Hashing ----
  "contains-duplicate": "Use a hash set — return true the moment you see a repeat.",
  "two-sum": "Store each number's index in a map; check for target − num in one pass.",
  "find-all-numbers-disappeared-in-an-array": "Mark index nums[i]−1 negative; unmarked indices are missing.",
  "missing-number": "Sum 0..n and subtract the array sum, or XOR indices with values.",
  "majority-element": "Boyer–Moore voting: one candidate, one counter, single pass.",
  "valid-anagram": "Compare character-count arrays of length 26 (or sorted strings).",
  "product-of-array-except-self": "Two sweeps: prefix products left→right, then suffix right→left.",
  "find-all-duplicates-in-an-array": "Flip nums[abs(x)−1] negative; a second visit means duplicate.",
  "group-anagrams": "Key each word by its sorted letters (or 26-count tuple) into a map.",
  "encode-and-decode-strings": "Prefix each string with its length and a delimiter, e.g. '4#word'.",
  "longest-consecutive-sequence": "Put nums in a set; start counting only when num−1 is absent.",

  // ---- Two Pointers ----
  "move-zeroes": "Write pointer for non-zeros; fill the tail with zeros afterward.",
  "squares-of-a-sorted-array": "Merge from both ends into the result back-to-front by largest square.",
  "backspace-string-compare": "Walk both strings from the end, skipping chars per pending '#'.",
  "valid-palindrome": "Two pointers, skip non-alphanumerics, compare lowercase chars.",
  "3sum": "Sort, fix i, two-pointer the rest; skip duplicates at every step.",
  "3sum-closest": "Sort, fix i, two-pointer; track the sum with the smallest |sum−target|.",
  "container-with-most-water": "Two pointers from the ends; always move the shorter line inward.",
  "sort-colors": "Dutch national flag: low/mid/high pointers, swap in one pass.",

  // ---- Sliding Window ----
  "maximum-average-subarray-i": "Fixed window of size k: add the new, drop the old, track max sum.",
  "is-subsequence": "Two pointers; advance s only on match, advance t always.",
  "best-time-to-buy-and-sell-stock": "Track the running minimum price and best price − min so far.",
  "longest-substring-without-repeating-characters": "Grow right, shrink left past the last seen duplicate index.",
  "minimum-size-subarray-sum": "Expand right for sum ≥ target, then shrink left to minimize length.",
  "longest-repeating-character-replacement": "Window is valid while (len − maxFreq) ≤ k.",
  "permutation-in-string": "Slide a fixed window and compare 26-length frequency arrays.",
  "fruit-into-baskets": "Longest window containing at most 2 distinct values (freq map).",
  "subarray-product-less-than-k": "Sliding window of product < k; add (right−left+1) per step.",
  "minimum-window-substring": "Expand until it covers t, shrink while still valid; track best window.",

  // ---- Stack ----
  "valid-parentheses": "Push openers, pop and match on closers; empty stack at end means valid.",

  // ---- Linked Lists ----
  "reverse-linked-list": "Iterate with prev/curr/next; flip curr.next = prev each step.",
  "middle-of-the-linked-list": "Fast/slow pointers — slow is the middle when fast reaches the end.",
  "linked-list-cycle": "Floyd's tortoise and hare; they meet iff there's a cycle.",
  "merge-two-sorted-lists": "Dummy head, splice the smaller of the two current nodes each step.",
  "remove-linked-list-elements": "Use a dummy node so head deletions are handled uniformly.",
  "remove-duplicates-from-sorted-list": "Compare curr.val with curr.next.val; skip forward on match.",
  "palindrome-linked-list": "Find middle, reverse second half, then compare halves node by node.",
  "remove-nth-node-from-end-of-list": "Two pointers spaced by n; use a dummy node to remove head safely.",
  "reorder-list": "Find middle, reverse second half, then interleave the two halves.",
  "merge-k-sorted-lists": "Min-heap of the current head of each list, or divide-and-conquer merge.",

  // ---- Binary Search ----
  "binary-search": "Classic lo/hi/mid; move the bound based on nums[mid] vs target.",
  "find-smallest-letter-greater-than-target": "Binary search for the first letter strictly greater than target.",
  "peak-index-in-a-mountain-array": "Binary search: if arr[mid] < arr[mid+1], peak is on the right.",
  "search-in-rotated-sorted-array": "Binary search — decide which half is sorted, then check target's range.",
  "find-minimum-in-rotated-sorted-array": "Binary search; compare nums[mid] with nums[hi] to pick the half.",
  "search-a-2d-matrix": "Treat the matrix as one sorted list; binary search on row*cols+col.",
  "find-peak-element": "Binary search: climb toward the larger neighbor.",

  // ---- Trees ----
  "maximum-depth-of-binary-tree": "Recurse: 1 + max(depth(left), depth(right)).",
  "minimum-depth-of-binary-tree": "BFS level order — return depth of first leaf you hit.",
  "same-tree": "Recurse in lockstep; both null OK, one null or values differ ⇒ false.",
  "invert-binary-tree": "Swap left and right, then recurse into each child.",
  "path-sum": "DFS while subtracting node.val; check target at leaves.",
  "subtree-of-another-tree": "At each node in s, run a sameTree check against t.",
  "binary-tree-paths": "DFS carrying the current path; emit it whenever you hit a leaf.",
  "merge-two-binary-trees": "Recurse: if both exist, sum values; else return the non-null child.",
  "average-of-levels-in-binary-tree": "BFS level by level; push sum/count per level.",
  "binary-tree-level-order-traversal": "Standard BFS with a queue; collect nodes level by level.",
  "validate-binary-search-tree": "DFS with (min, max) bounds and tighten them as you recurse.",
  "lowest-common-ancestor-of-a-binary-search-tree": "Walk down: go left if both < node, right if both > node, else you're at LCA.",
  "kth-smallest-element-in-a-bst": "Inorder traversal (iterative stack) — stop at the k-th pop.",
  "construct-binary-tree-from-preorder-and-inorder-traversal": "Root = first preorder; split inorder around it, recurse on halves.",
  "binary-tree-maximum-path-sum": "DFS returns best downward gain; update global with left+node+right.",
  "serialize-and-deserialize-binary-tree": "Preorder with '#' for nulls; deserialize by consuming tokens.",

  // ---- Tries ----
  "implement-trie-prefix-tree": "Node = children map + isEnd flag; walk chars for insert/search/prefix.",
  "design-add-and-search-words-data-structure": "Trie with DFS; on '.', try every child.",
  "word-search-ii": "Build a trie of words, then DFS the board pruning by trie prefixes.",

  // ---- Heap / Priority Queue ----
  "kth-largest-element-in-an-array": "Min-heap of size k — top of the heap is the answer.",
  "top-k-frequent-elements": "Bucket sort by frequency, or min-heap of size k on counts.",
  "k-closest-points-to-origin": "Max-heap of size k on squared distance; pop when it overflows.",
  "kth-smallest-element-in-a-sorted-matrix": "Min-heap of row heads, or binary search on value range.",
  "find-median-from-data-stream": "Two heaps: max-heap for lower half, min-heap for upper half.",

  // ---- Intervals ----
  "meeting-rooms": "Sort by start; if any start < previous end, rooms clash.",
  "meeting-rooms-ii": "Sort starts and ends; sweep counting overlaps, track max.",
  "merge-intervals": "Sort by start; append or merge with the last interval in the result.",
  "insert-interval": "Copy strictly-left, merge overlapping with newInterval, copy strictly-right.",
  "non-overlapping-intervals": "Greedy by earliest end time; drop any interval that overlaps.",
  "interval-list-intersections": "Two pointers; intersect = [max(starts), min(ends)] when valid.",

  // ---- Matrix ----
  "convert-1d-array-into-2d-array": "Row = i / n, col = i % n — fill in a single pass.",
  "range-sum-query-immutable": "Precompute prefix sums; range sum = pre[r+1] − pre[l].",
  "set-matrix-zeroes": "Use first row/col as markers; handle their own zero flags separately.",
  "spiral-matrix": "Shrink four boundaries (top/bottom/left/right) each layer.",
  "rotate-image": "Transpose in place, then reverse each row.",
  "word-search": "DFS from each cell; mark visited by mutating, restore on backtrack.",

  // ---- Graphs ----
  "number-of-islands": "DFS/BFS from each unvisited land cell; count how many times you start.",
  "pacific-atlantic-water-flow": "BFS/DFS inward from both oceans; intersection of reachable sets.",
  "graph-valid-tree": "Tree iff edges = n−1 and it's fully connected (BFS/DFS or Union-Find).",
  "number-of-connected-components-in-an-undirected-graph": "Union-Find each edge; answer is remaining distinct roots.",
  "course-schedule": "Topological sort — if BFS processes all nodes, no cycle.",
  "clone-graph": "DFS/BFS with an old→new node map to handle cycles.",
  "alien-dictionary": "Build char graph from adjacent-word first-diffs, then topological sort.",

  // ---- Dynamic Programming ----
  "climbing-stairs": "dp[i] = dp[i−1] + dp[i−2] — it's Fibonacci.",
  "house-robber": "dp[i] = max(dp[i−1], dp[i−2] + nums[i]).",
  "house-robber-ii": "Run house-robber twice: skip first, then skip last; take max.",
  "longest-palindromic-substring": "Expand around each center (odd and even) and keep the longest.",
  "palindromic-substrings": "Expand around every center; count each valid palindrome.",
  "decode-ways": "dp[i] uses one-digit (1..9) and two-digit (10..26) predecessors.",
  "coin-change": "1D DP: dp[a] = min(dp[a], dp[a−c] + 1) over all coins c.",
  "maximum-product-subarray": "Track running max and min (negatives can flip); update per element.",
  "word-break": "dp[i] true if some j<i has dp[j] and s[j..i] in dict.",
  "longest-increasing-subsequence": "Patience sorting with binary search into 'tails' array (O(n log n)).",
  "longest-common-subsequence": "2D DP: match ⇒ dp[i−1][j−1]+1, else max of skipping either char.",
  "unique-paths": "dp[i][j] = dp[i−1][j] + dp[i][j−1] with first row/col = 1.",
  "combination-sum-iv": "1D DP over target; sum dp[t − num] for each num (order matters).",

  // ---- Greedy ----
  "maximum-subarray": "Kadane's — reset the running sum whenever it drops below zero.",
  "jump-game": "Track the farthest reachable index; fail if i ever exceeds it.",

  // ---- Bit Manipulation ----
  "number-of-1-bits": "Repeatedly n &= n−1; count how many times before n hits 0.",
  "counting-bits": "dp[i] = dp[i >> 1] + (i & 1).",
  "reverse-bits": "Shift result left, OR in n's lowest bit, shift n right — 32 times.",
  "sum-of-two-integers": "Loop: sum = a XOR b, carry = (a AND b) << 1, until carry is 0.",
};
