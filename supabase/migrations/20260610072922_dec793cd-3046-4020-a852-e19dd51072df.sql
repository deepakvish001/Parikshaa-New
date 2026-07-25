
DO $$
DECLARE
  r RECORD;
  t TEXT;
  tags TEXT[];
BEGIN
  FOR r IN SELECT slug, title FROM public.coding_problems WHERE 'java-dsa' = ANY(topics) LOOP
    t := lower(r.title);
    tags := ARRAY[]::TEXT[];

    IF t ~ 'linked ?list|linkedlist' THEN tags := tags || ARRAY['Linked List']; END IF;
    IF t ~ 'avl' THEN tags := tags || ARRAY['AVL Tree','Tree']; END IF;
    IF t ~ '\mbst\M|binary search tree' THEN tags := tags || ARRAY['Binary Search Tree','Tree']; END IF;
    IF t ~ 'segment tree' THEN tags := tags || ARRAY['Segment Tree','Tree']; END IF;
    IF t ~ '\mbit\M|fenwick' THEN tags := tags || ARRAY['Binary Indexed Tree']; END IF;
    IF t ~ 'trie' THEN tags := tags || ARRAY['Trie','String']; END IF;
    IF t ~ 'generic tree|n-?ary tree' THEN tags := tags || ARRAY['Generic Tree','Tree']; END IF;
    IF t ~ '\mbt\M|binary tree|\mtree\M|preorder|inorder|postorder|level order|boundary|top view|bottom view|left view|right view|diameter|\mlca\M|lowest common ancestor|morris' THEN tags := tags || ARRAY['Tree']; END IF;
    IF t ~ 'graph|\mbfs\M|\mdfs\M|dijkstra|bellman|kruskal|\mprim\M|tarjan|kosaraju|topological|articulation|bridge|\mmst\M|bipartite|hungarian|max flow|edmonds|floyd|warshall|union find|disjoint set|\mdsu\M|connected component' THEN tags := tags || ARRAY['Graph']; END IF;
    IF t ~ 'stack|bracket|next greater|histogram|celebrity|infix|postfix|trapping rain' THEN tags := tags || ARRAY['Stack']; END IF;
    IF t ~ 'queue|deque' THEN tags := tags || ARRAY['Queue']; END IF;
    IF t ~ 'sliding window|window' THEN tags := tags || ARRAY['Sliding Window']; END IF;
    IF t ~ 'heap|priority queue|median.*stream|k largest|k smallest|kth largest|kth smallest' THEN tags := tags || ARRAY['Heap']; END IF;
    IF t ~ 'hash|anagram|frequenc' THEN tags := tags || ARRAY['Hash Table']; END IF;

    IF t ~ '\mdp\M|dynamic|knapsack|\mlcs\M|\mlis\M|coin change|climb stairs|matrix chain|\mmcm\M|egg drop|catalan|wildcard|edit distance|palindrome partition|rod cutting|longest common|longest increasing|subset sum|partition equal|target sum|paint house|paint fence|burst balloon|optimal bst|word break|interleav|distinct subseq|count.*ways|tile|domino|boolean parenthes' THEN tags := tags || ARRAY['Dynamic Programming']; END IF;
    IF t ~ 'backtrack|n-?queens|sudoku|permutation|combination|subset|knight|rat in a maze|word search|maze|crossword' THEN tags := tags || ARRAY['Backtracking']; END IF;
    IF t ~ 'greedy|activity|huffman|gas station|jump game|fractional knapsack|merge interval|interval' THEN tags := tags || ARRAY['Greedy']; END IF;
    IF t ~ 'binary search|lower bound|upper bound|aggressive cows|book allocat|painter|capacity to ship|allocat|koko|peak element|search.*rotated|median of two|sqrt' THEN tags := tags || ARRAY['Binary Search']; END IF;
    IF t ~ 'two pointer|3 ?sum|4 ?sum|container with|pair sum|remove duplicate|trapping' THEN tags := tags || ARRAY['Two Pointers']; END IF;
    IF t ~ 'sort|merge sort|quick sort|bubble|insertion sort|selection sort|radix|counting sort|bucket|wiggle|pancake' THEN tags := tags || ARRAY['Sorting']; END IF;
    IF t ~ '\mbit\M|\mxor\M|power of two|power of 2|bitmask|count.*bits|gray code|hamming|set bit|binary exponent' THEN tags := tags || ARRAY['Bit Manipulation']; END IF;
    IF t ~ 'recursion|recursive|hanoi|fibonacci|factorial' THEN tags := tags || ARRAY['Recursion']; END IF;
    IF t ~ 'kmp|rabin|z[- ]algorithm|manacher|suffix array|string match|pattern match|substring|palindrom|reverse.*string|longest palindrom' THEN tags := tags || ARRAY['String']; END IF;
    IF t ~ 'string|character|\mword\M|sentence|encode|decode|compress' THEN tags := tags || ARRAY['String']; END IF;
    IF t ~ '\mgcd\M|\mlcm\M|prime|sieve|modular|euler|fermat|factor|divisor|chinese remainder|catalan|fibonacci|any base|number theory|exponent' THEN tags := tags || ARRAY['Math']; END IF;
    IF t ~ 'matrix|2d array|spiral|rotate.*matrix|grid|island|flood fill' THEN tags := tags || ARRAY['Matrix']; END IF;
    IF t ~ 'array|subarray|kadane|rotate|prefix sum|max sum|min sum|product of array|missing number|duplicate|majority|maximum subarray' THEN tags := tags || ARRAY['Array']; END IF;

    tags := ARRAY(SELECT DISTINCT unnest(tags));

    IF array_length(tags,1) IS NULL THEN
      tags := ARRAY['Array'];
    END IF;

    UPDATE public.coding_problems SET topics = tags, updated_at = now() WHERE slug = r.slug;
  END LOOP;
END $$;
