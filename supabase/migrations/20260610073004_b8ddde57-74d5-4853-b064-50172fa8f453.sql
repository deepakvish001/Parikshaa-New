
DO $$
DECLARE
  r RECORD;
  t TEXT;
  tags TEXT[];
BEGIN
  FOR r IN SELECT slug, title FROM public.coding_problems WHERE topics = ARRAY['Array']::TEXT[] LOOP
    t := lower(r.title);
    tags := ARRAY[]::TEXT[];

    IF t ~ 'subarray|kadane|prefix sum|sliding' THEN tags := tags || ARRAY['Array','Sliding Window']; END IF;
    IF t ~ 'subsequence|lis|longest.*subsequence|bitonic' THEN tags := tags || ARRAY['Dynamic Programming']; END IF;
    IF t ~ 'tree|traversal|level.?order|preorder|inorder|postorder|level-order|levelorder|diagonal' THEN tags := tags || ARRAY['Tree']; END IF;
    IF t ~ 'depth first|breadth first|dfs|bfs|hamiltonian|graph|path|cycle|connected' THEN tags := tags || ARRAY['Graph']; END IF;
    IF t ~ 'lazy propagation|segment|range min|range max|range sum|range update|range quer' THEN tags := tags || ARRAY['Segment Tree']; END IF;
    IF t ~ 'hld' THEN tags := tags || ARRAY['Tree','Advanced']; END IF;
    IF t ~ 'centroid' THEN tags := tags || ARRAY['Tree']; END IF;
    IF t ~ 'goldmine|gold mine|stair|count.*ways|count.*encoding|count.*bsts|count numbers|friends pairing|derangement|catalan|k partitions|count of subarrays|inclusion' THEN tags := tags || ARRAY['Dynamic Programming']; END IF;
    IF t ~ 'cryptarithmetic|kpc|knight|n queens|combinations|permutations|crossword|maze|subset|get subsequence|get stair paths|get common' THEN tags := tags || ARRAY['Backtracking']; END IF;
    IF t ~ 'job sequencing|buy and sell|stock|cooldown|merge interval|jump|gas station' THEN tags := tags || ARRAY['Greedy']; END IF;
    IF t ~ 'extended euclidean|euclidean|inverse of a number|inverse modular|arithmetic progression|josephus|number theory|euler|fermat|cipher|chinese' THEN tags := tags || ARRAY['Math']; END IF;
    IF t ~ 'getrandom|iterable|iterator|memory|design' THEN tags := tags || ARRAY['Design']; END IF;
    IF t ~ 'count of smaller' THEN tags := tags || ARRAY['Binary Indexed Tree','Sorting']; END IF;
    IF t ~ 'largest subarray.*0 sum|equal 0s and 1s|sum k' THEN tags := tags || ARRAY['Hash Table','Array']; END IF;
    IF t ~ 'bar chart|grading|display|find element|first index|last index|all indices|difference of two arrays|inverse of an array|largest number|swap' THEN tags := tags || ARRAY['Array']; END IF;

    tags := ARRAY(SELECT DISTINCT unnest(tags));
    IF array_length(tags,1) IS NULL THEN tags := ARRAY['Array']; END IF;

    UPDATE public.coding_problems SET topics = tags, updated_at = now() WHERE slug = r.slug;
  END LOOP;
END $$;
