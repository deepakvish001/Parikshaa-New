export const zeroTo2300Meta = {
  "id": "zero-to-2300-cp-sheet",
  "title": "Zero to 2300",
  "description": "CodingPariksha CP Sheet — 57 techniques, 1100+ Codeforces problems, very basic → Master",
  "lastUpdated": "2026-08-08",
  "totalProblems": 1126,
  "completed": 0,
  "easy": 0,
  "medium": 0,
  "hard": 0
};

export const zeroTo2300Sections: any[] = [
  {
    "id": "z23-0",
    "title": "Implementation & Simulation",
    "part": "A · Foundations",
    "ratingBand": "800–1200",
    "description": "Sabse pehla skill: statement ko bina soch-vichaar ke **exactly** code mein utaar dena. Yahan koi algorithm nahi hai — sirf loop, condition, aur dhyaan. CP mein 800-rated problems ka 60% yahi hai, aur beginners inhe *algorithm dhoondh ke* kharab karte hain.",
    "keyConcepts": "Statement 'process karo / simulate karo / step by step ye hota hai' bol raha hai, aur constraints itne chhote hain ki jo likha hai wahi kar dena affordable hai. Koi optimization ka ishaara nahi.",
    "resources": "Kuch nahi padhna — sirf saaf code likhne ki practice. Variable names theek rakho, nested if kam karo, off-by-one check karo.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-0",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-1",
    "title": "Math Basics — parity, formulas, patterns",
    "part": "A · Foundations",
    "ratingBand": "800–1200",
    "description": "CP ki aadhi easy problems ek **formula ya observation** hain, algorithm nahi. Parity (even/odd), symmetry, invariants, arithmetic series, min/max ka closed form. Loop chalane se pehle 2 minute paper pe chhote cases likho — n=1,2,3,4 — pattern dikh jaata hai.",
    "keyConcepts": "n bahut bada hai (10^9, 10^18) par input mein sirf 1–3 numbers hain. Ya answer 'kitne tarike / minimum kitne steps' hai aur koi structure nahi. Ya poori problem ek haan/na hai — usually parity ya invariant.",
    "resources": "Chhote cases likh ke OEIS-style pattern dhoondhna; arithmetic/geometric sum; ceil division `(a+b-1)/b`.",
    "notes": "Math / Number Theory sheet (DSA series) — wahan LeetCode angle hai, yahan observation-first CP angle.",
    "subSections": [
      {
        "id": "z23-sub-1",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-2",
    "title": "Brute Force & Complete Search",
    "part": "A · Foundations",
    "ratingBand": "800–1300",
    "description": "Har problem ka pehla honest jawaab: **saare possibilities try karo**. Ye kamzori nahi, baseline hai — aur constraints chhote hon to yahi intended solution hota hai. Aage jaake optimization isi baseline pe lagta hai, isliye pehle brute force *soch* lena habit banao.",
    "keyConcepts": "n ≤ 100 with O(n^3) ok, ya n ≤ 20 (subsets), ya answer ki range chhoti hai (0–1000) to har answer try karo. 'Choose any pair/triple' bhi direct hint hai.",
    "resources": "Nested loops se pairs/triples; `next_permutation`; answer pe loop lagana (fix karo phir verify karo).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-2",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-3",
    "title": "Sortings & Custom Comparators",
    "part": "A · Foundations",
    "ratingBand": "800–1400",
    "description": "Sorting sirf order lagane ke liye nahi — **problem ki structure reveal karne** ke liye hai. Sort karne ke baad greedy obvious ho jaati hai, duplicates paas aa jaate hain, binary search possible ho jaati hai. 'Kis cheez pe sort karun' ka jawaab hi aadhi problem hota hai.",
    "keyConcepts": "Answer input ke order pe depend nahi karta (multiset problem hai) → sort karo. Pairs ko match karna hai, ya k-th smallest, ya 'minimum difference' → sort. Deadline/weight jaise do fields → custom comparator.",
    "resources": "`sort` with lambda; stable_sort; comparator ka strict-weak-ordering rule (never `<=`, warna runtime error); counting sort jab values chhoti hon.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-3",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-4",
    "title": "Greedy — Basics",
    "part": "A · Foundations",
    "ratingBand": "800–1300",
    "description": "Har step pe locally best choice, aur ummeed ye ki wo globally best bhi hai. Greedy easy likhne mein hai, **prove karne mein hard** — aur CP mein ratta yahi maara jaata hai. Beginner level pe pattern yaad rakho: sort karo, phir ek side se le lo.",
    "keyConcepts": "'Minimum operations', 'maximum kitne le sakte ho', 'sabse pehle kya karein' — aur choices ek doosre ko complicated tarah se affect nahi kar rahi. Agar choices aage ke options badalti hain to DP hai, greedy nahi.",
    "resources": "Sort + take pattern; smallest/largest pehle kyun; counter-example dhoondhne ki aadat (greedy ka sabse important muscle).",
    "notes": "Greedy sheet (DSA series) — classical interview greedy problems wahan.",
    "subSections": [
      {
        "id": "z23-sub-4",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-5",
    "title": "Two Pointers & Sliding Window",
    "part": "A · Foundations",
    "ratingBand": "800–1500",
    "description": "Do index ek hi direction mein chal rahe hain aur **kabhi peeche nahi jaate** — isliye O(n^2) ka kaam O(n) mein. Sliding window isi ka special case hai jahan window ek condition maintain karti hai (sum ≤ k, distinct ≤ k). Asli sawaal: 'window kab shrink karun?'",
    "keyConcepts": "Array **sorted** hai + pair/triplet dhoondhna hai → opposite two pointers. 'Longest/shortest subarray such that ...' → variable window. 'Exactly k' → atMost(k) − atMost(k−1) ka trick.",
    "resources": "Opposite-end vs same-direction pointers; monotonicity ki zaroorat (kyun sorted chahiye); atMost trick.",
    "notes": "Array sheet §2–3 (DSA series) mein isi pattern ke LeetCode problems detail mein hain.",
    "subSections": [
      {
        "id": "z23-sub-5",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-6",
    "title": "Prefix Sums, Difference Arrays & Cumulative Tricks",
    "part": "A · Foundations",
    "ratingBand": "900–1500",
    "description": "Ek baar O(n) precompute karo, phir har range query O(1). `pre[r]−pre[l−1]`. Ulta version — **difference array** — range updates O(1) mein karta hai aur end mein ek prefix sum se final array. Prefix XOR, prefix count, prefix min sab isi family mein.",
    "keyConcepts": "Bahut si range sum/count queries, koi update nahi → prefix sum. Bahut se range updates, query end mein → difference array. 'Subarray with sum = k' → prefix sum + hashmap. 2D grid pe rectangle sum → 2D prefix.",
    "resources": "1D prefix → prefix+hashmap → 2D prefix → difference array, isi order mein. **CSES 'Range Queries'** section iska best drill set hai.",
    "notes": " | NOTE: Codeforces pe 'prefix sums' ka official tag nahi hai, isliye ye list `data structures`-tagged easy band se hai jahan intended trick prefix/cumulative hi hota hai. Canonical practice ke liye CSES Range Queries + Codeforces EDU 'Segment Tree' ka pehla step.",
    "subSections": [
      {
        "id": "z23-sub-6",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-7",
    "title": "Binary Search — array pe aur **answer pe**",
    "part": "A · Foundations",
    "ratingBand": "800–1800",
    "description": "Sorted array mein element dhoondhna sirf 10% use hai. Asli power: **binary search on answer**. Agar `check(x)` monotonic hai (x sahi hai to x+1 bhi sahi), to answer pe binary search karo — optimization problem ek decision problem ban jaata hai, jo hamesha aasan hota hai.",
    "keyConcepts": "'Minimum possible maximum' / 'maximum possible minimum' — ye phrase dikhe to 95% binary search on answer hai. Ya 'k din mein poora karna hai, minimum capacity kya ho'. Real numbers pe ho to fixed 100 iterations chalao.",
    "resources": "lower_bound/upper_bound; `while(lo<hi)` invariant likhna (infinite loop yahin hota hai); predicate monotonic hai ya nahi — ye **prove** karo.",
    "notes": "Binary Search sheet (DSA series) — 'BS on answer' ke LeetCode classics (Koko, Split Array) wahan.",
    "subSections": [
      {
        "id": "z23-sub-7",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-8",
    "title": "STL / Containers — set, map, multiset, priority_queue",
    "part": "A · Foundations",
    "ratingBand": "800–1500",
    "description": "Jitni tez tum sahi container chun sakte ho, utni tez tum implement kar sakte ho. `set` = sorted + unique + O(log n) neighbour queries (`lower_bound`). `multiset` = duplicates allowed, erase karte waqt **iterator se erase karo, value se nahi** (warna saare copies ud jaayenge). `priority_queue` = 'har baar current best nikaalo'. `map` = frequency/index lookup.",
    "keyConcepts": "'Insert karte raho aur beech mein minimum/next greater poochho' → set/multiset. 'Har step pe sabse bada uthao' → priority_queue. Values bahut badi hain par count kam → map (coordinate compression ka pehla qadam).",
    "resources": "Har container ki complexity + kab O(1) unordered_map hash-attack pe O(n) ban jaata hai (CF pe custom hash use karo).",
    "notes": "Heap/Priority Queue sheet (DSA series).",
    "subSections": [
      {
        "id": "z23-sub-8",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-9",
    "title": "Strings — Basics",
    "part": "A · Foundations",
    "ratingBand": "800–1400",
    "description": "Beginner-level string problems mein 90% kaam frequency count, character mapping, ya do-pointer comparison hai. `cnt[26]` array tumhara sabse zyada use hone wala tool hai. Anagram, palindrome check, case conversion, token parsing — sab isi mein.",
    "keyConcepts": "Alphabet chhota hai (lowercase only) → frequency array. 'Rearrange karke banana hai' → sirf multiset matter karta hai, order nahi. 'Same prefix/suffix' → direct comparison ya aage KMP.",
    "resources": "`substr`, `find`, `stringstream` se tokenize karna; string concatenation ka hidden O(n^2) trap.",
    "notes": "String sheet (DSA series) — 13 sections wahan.",
    "subSections": [
      {
        "id": "z23-sub-9",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-10",
    "title": "Greedy with Proof — exchange argument",
    "part": "B · Core Techniques",
    "ratingBand": "1300–1700",
    "description": "Yahan se greedy 'guess karke submit' se 'derive karke submit' ban jaati hai. **Exchange argument**: maan lo optimal answer mein tumhari greedy choice nahi hai — dikhao ki usse swap karke answer kharab nahi hota. Isse proof mil jaata hai. Doosra tool: sorting order ko do adjacent elements compare karke derive karna (Job Sequencing / Fractional Knapsack ka asli reason).",
    "keyConcepts": "Greedy ka jawaab do-teen candidate strategies mein confuse ho raha hai → adjacent swap se compare karo. 'Kis order mein karein' → comparator derive karo, guess na karo.",
    "resources": "Exchange argument; adjacent-swap comparator derivation; greedy ke counter-example jaldi dhoondhna.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-10",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-11",
    "title": "Constructive Algorithms — CP ka signature topic",
    "part": "B · Core Techniques",
    "ratingBand": "1100–1800",
    "description": "Yahan tumhe answer *dhoondhna* nahi, **banana** hai: 'aisa array/graph/string bana do jo ye condition satisfy kare'. Interview DSA mein ye topic bilkul nahi aata — aur CF Div2 A/B/C mein har contest mein aata hai. Recipe: chhote cases haath se bana ke pattern dhoondho, ek simple family (all-same, alternating, 1..n) try karo, aur **impossible kab hai** wo separately prove karo.",
    "keyConcepts": "Output mein 'any valid answer' likha hai, ya '-1 if impossible'. Ya statement condition deta hai aur example structure ka hint. Multiple correct answers allowed = constructive.",
    "resources": "Parity/counting invariants se impossibility prove karna; symmetric constructions; n=1,2,3 se induction.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-11",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-12",
    "title": "Number Theory I — divisors, sieve, GCD, modular arithmetic",
    "part": "B · Core Techniques",
    "ratingBand": "800–1500",
    "description": "Char cheezein poori tarah pakdo: (1) divisors O(√n) mein — `i*i<=n` loop, (2) **Sieve of Eratosthenes** O(n log log n) + smallest-prime-factor se O(log n) factorization, (3) `gcd(a,b)` Euclid se + `lcm = a/g*b` (pehle divide, warna overflow), (4) modular arithmetic — add/sub/mul mein `%` kab lagana.",
    "keyConcepts": "'Divisible by', 'coprime', 'answer mod 10^9+7', 'largest prime factor' — direct signals. n ≤ 10^6 aur bahut queries → sieve precompute.",
    "resources": "Sieve → SPF → prime factorization; Euclid; mod add/sub (`(a-b+m)%m`); binary exponentiation `modpow`.",
    "notes": "Math/Number Theory sheet (DSA series).",
    "subSections": [
      {
        "id": "z23-sub-12",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-13",
    "title": "Combinatorics I — counting, nCr, pigeonhole",
    "part": "B · Core Techniques",
    "ratingBand": "1000–1600",
    "description": "Counting ki teen buniyaadi lines: multiply rule (independent choices), add rule (disjoint cases), aur 'poora minus bura' (complementary counting — jab 'at least one' dikhe to yahi socho). nCr chhote n ke liye Pascal triangle se; bade n ke liye factorial + modular inverse (§26 mein).",
    "keyConcepts": "'Kitne tarike', 'number of pairs/subsequences', answer mod 10^9+7. 'At least one' → total − none. Symmetric structure → har element ka contribution alag se count karo (contribution technique — CP ka sabse useful counting trick).",
    "resources": "Multiply/add rule; complementary counting; contribution-to-answer technique; Pascal's triangle.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-13",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-14",
    "title": "Bitmasks & Bit Tricks",
    "part": "B · Core Techniques",
    "ratingBand": "800–1600",
    "description": "Number ko **set ki tarah** dekhna: i-th bit = i-th element present hai ya nahi. Isse subsets pe iterate karna trivial ho jaata hai (`for m in 0..2^n-1`). Saath hi XOR ki do properties CP mein sona hain: `x^x=0` aur XOR associative — isliye 'ek hi element odd baar aaya hai' O(1) space mein.",
    "keyConcepts": "n ≤ 20–24 → subset enumeration ya bitmask DP. 'Pairs with XOR = k' → prefix XOR + map ya trie. AND/OR/XOR ki baat ho → **bit-by-bit independent** socho (30 bits pe alag alag solve karo).",
    "resources": "`__builtin_popcount`, `1<<i`, `x&(x-1)`, subset-of-subset loop `for(s=m; s; s=(s-1)&m)`; bit-independence technique.",
    "notes": "Bit Manipulation sheet (DSA series).",
    "subSections": [
      {
        "id": "z23-sub-14",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-15",
    "title": "Recursion, Backtracking & Subset Enumeration",
    "part": "B · Core Techniques",
    "ratingBand": "1000–1700",
    "description": "Recursion = 'ek decision lo, baaki chhote problem pe bharosa karo'. Backtracking = decision try karo → recurse → **undo** karo. CP mein ye pure form mein kam aata hai (n chhota hona chahiye) par DP aur DFS dono ki jad yahi hai, isliye state design yahin seekhna hai.",
    "keyConcepts": "n ≤ 12 (permutations), n ≤ 20 (subsets). 'Print all', 'count all valid arrangements'. Grid mein path with constraints.",
    "resources": "Recursion tree; state = (index, kya-abhi-tak-liya); pruning kab valid hai; iterative bitmask vs recursive subsets.",
    "notes": "Recursion + Backtracking sheets (DSA series).",
    "subSections": [
      {
        "id": "z23-sub-15",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-16",
    "title": "DP I — 1D, knapsack, LIS, grid",
    "part": "B · Core Techniques",
    "ratingBand": "900–1700",
    "description": "DP ek hi sawaal ka jawaab hai: **'meri state kya hai?'** State wo minimum information hai jisse aage ka answer decide ho jaaye. Uske baad transition likhna mechanical hai. Char foundation families: linear DP (`dp[i]` = i tak ka best), knapsack (`dp[i][w]`), LIS, aur grid paths. Ratta nahi — recurrence khud likho, phir base case, phir order.",
    "keyConcepts": "'Maximum/minimum/count of ways' + choices aage ke options ko affect karti hain (isliye greedy fail) + overlapping subproblems. n ≤ 5000 with O(n^2) allowed → 2D DP ka signal.",
    "resources": "Recurrence → memoization → tabulation → space optimization, isi order mein. Knapsack ki 1D rolling array mein loop **ulta** kyun chalta hai.",
    "notes": "Dynamic Programming sheet (DSA series) — LeetCode DP ka pura landscape wahan.",
    "subSections": [
      {
        "id": "z23-sub-16",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-17",
    "title": "Graphs I — modelling, DFS/BFS, components, bipartite",
    "part": "B · Core Techniques",
    "ratingBand": "1000–1700",
    "description": "CP mein sabse bada graph skill algorithm nahi, **modelling** hai: 'ye problem actually graph hai' pehchanna. States = nodes, allowed moves = edges. Uske baad DFS (connectivity, cycle, components) aur BFS (unweighted shortest path, level-by-level) 80% kaam kar dete hain. Grid bhi graph hai — 4/8 directions.",
    "keyConcepts": "'Connected', 'reachable', 'minimum moves' (unweighted → BFS), 'groups mein baant do', 'do teams mein divide' (→ bipartite check). Ya kuch bhi jahan states ke beech transitions defined hain.",
    "resources": "Adjacency list; visited array ka role; DFS recursion depth (10^5 pe stack overflow — iterative ya `-Wl,--stack`); BFS = shortest path *only* unweighted; bipartite = 2-coloring.",
    "notes": "Graph sheet (DSA series) — 13 sections, algorithm cheat-line ke saath.",
    "subSections": [
      {
        "id": "z23-sub-17",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-18",
    "title": "Trees I — rooting, subtree DP, diameter",
    "part": "B · Core Techniques",
    "ratingBand": "1100–1700",
    "description": "Tree = connected graph with n−1 edges, no cycle — isliye har do nodes ke beech **exactly ek path**. Ye property saari tree problems ki jad hai. Root karke socho: har node ke liye 'mere subtree ka answer' compute karo (bottom-up), phir combine. Diameter = do DFS, ya ek DFS mein top-2 depths.",
    "keyConcepts": "'n nodes, n−1 edges' likha hai → tree hai, cycle ki tension nahi. 'Subtree mein kitne', 'sabse door do nodes', 'edge hataane pe kya hoga'.",
    "resources": "Rooting + parent array; subtree size/sum ek DFS mein; diameter ke dono methods; 'edge remove karne pe do components' ka size trick.",
    "notes": "Binary Tree sheet (DSA series) — wahan binary trees; yahan general rooted trees (CP mein zyada aate hain).",
    "subSections": [
      {
        "id": "z23-sub-18",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-19",
    "title": "DSU (Union–Find) & variants",
    "part": "C · Intermediate",
    "ratingBand": "1300–2000",
    "description": "Ek hi sawaal ka super-fast jawaab: 'ye do cheezein same group mein hain?' Path compression + union by size/rank ke saath practically O(1). CP mein iska sabse bada use **offline trick** hai: edges hataane wali problem ko ulta chala ke edges *jodne* wali bana do — kyunki DSU delete nahi kar sakta, sirf merge.",
    "keyConcepts": "'Same group/component mein hain?', dynamic connectivity, 'edges sorted order mein add karo' (→ Kruskal), 'k-th query ke baad kitne components'. Deletion ho to **reverse time** mein solve karo.",
    "resources": "Path compression + union by size; DSU pe extra info rakhna (size, max, sum); DSU with rollback; small-to-large merging.",
    "notes": "Graph sheet §Union-Find (DSA series).",
    "subSections": [
      {
        "id": "z23-sub-19",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-20",
    "title": "Shortest Paths — Dijkstra, 0-1 BFS, Bellman–Ford, Floyd–Warshall",
    "part": "C · Intermediate",
    "ratingBand": "1400–2200",
    "description": "Poora topic ek decision table hai: unweighted → **BFS**. Edge weights sirf 0 aur 1 → **0-1 BFS** (deque, front pe 0 push, back pe 1). Non-negative weights → **Dijkstra** with priority_queue, O(E log V). Negative edges ya 'at most k edges' → **Bellman–Ford**. All-pairs with V ≤ 400 → **Floyd–Warshall** O(V^3). Galat algorithm chunna = TLE ya WA, dono.",
    "keyConcepts": "'Minimum cost/time to reach' + weights hain → Dijkstra. Weights {0,1} ya {1,2} → 0-1 BFS. 'At most k stops/flights' → Bellman-Ford ya state (node, k). 'Har pair ke beech distance' + chhota V → Floyd.",
    "resources": "Dijkstra kyun negative weights pe toot jaata hai; 0-1 BFS ka proof; Floyd ka k-loop **sabse bahar** kyun; multi-source BFS/Dijkstra.",
    "notes": "Graph sheet — algorithm cheat-line (DSA series).",
    "subSections": [
      {
        "id": "z23-sub-20",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-21",
    "title": "Topological Sort, DAG DP & Strongly Connected Components",
    "part": "C · Intermediate",
    "ratingBand": "1500–2200",
    "description": "DAG (directed acyclic graph) pe cheezein aasaan ho jaati hain: topological order mein process karo aur DP linear ban jaata hai (longest path, count paths — jo general graph mein NP-hard hai). Aur agar graph mein cycles hain? **SCC condense karo** (Kosaraju/Tarjan) — har SCC ek node ban jaata hai aur graph DAG ban jaata hai. Ye 'cycle wali problem ko DAG problem banane' ka standard move hai.",
    "keyConcepts": "'Dependencies / prerequisites / order' → topo sort. 'Cycle detect karo (directed)' → topo sort ka fail hona, ya DFS colors. 'Mutually reachable nodes', '2-SAT', 'condensation' → SCC.",
    "resources": "Kahn's algorithm vs DFS-based topo; DAG pe longest path/counting; Kosaraju (do DFS) ya Tarjan (ek DFS); condensation graph.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-21",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-22",
    "title": "Minimum Spanning Tree — Kruskal & Prim",
    "part": "C · Intermediate",
    "ratingBand": "1500–2200",
    "description": "'Sabko jodne ki minimum cost' = MST. Kruskal = edges sort karo + DSU se cycle avoid karo (implement karna aasaan, isliye CP mein default). Prim = Dijkstra jaisa, dense graph pe better. Do properties jo problems mein exploit hoti hain: **cut property** aur ye ki MST har pair ke path ka **maximum edge minimize** karta hai (minimax path) — bahut si problems isi ek line pe khadi hain.",
    "keyConcepts": "'Minimum cost to connect all', 'network banana hai', 'kuch nodes already connected hain'. Ya 'path ka maximum edge minimize karo' → MST + LCA.",
    "resources": "Kruskal + DSU; cut/cycle property; minimax path property; second-best MST; virtual node trick (extra node se 'build karna' modelling).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-22",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-23",
    "title": "Range Queries — Fenwick (BIT) & Segment Tree",
    "part": "C · Intermediate",
    "ratingBand": "1500–2200",
    "description": "Prefix sum tab tootta hai jab **updates** aane lagte hain. Fenwick tree: point update + prefix query, dono O(log n), code 10 line ka — CP mein sabse zyada type kiya jaane wala DS. Segment tree: zyada general (koi bhi associative merge — min, max, gcd, sum, custom struct) + range update with lazy. Rule: kaam Fenwick se ho raha hai to Fenwick likho, contest mein time bachta hai.",
    "keyConcepts": "'q queries: update + range sum/min' → BIT/segtree. 'Number of inversions' → BIT. 'k-th element in dynamic set' → BIT pe binary search. Values bahut badi → coordinate compression pehle.",
    "resources": "BIT (point update, prefix query) → BIT pe inversion counting → iterative segment tree → merge function design. **Codeforces EDU 'Segment Tree' course** iska best structured source hai.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-23",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-24",
    "title": "DP II — bitmask DP, DP on trees, interval DP, digit DP",
    "part": "C · Intermediate",
    "ratingBand": "1700–2200",
    "description": "Foundation DP ke baad chaar 'state ki shape' seekhni hoti hai: **bitmask DP** (n ≤ 20, state = kaun-kaun visit ho chuke), **tree DP** (state = node + kuch flag, bachchon se merge), **interval DP** (`dp[l][r]`, length pe loop — matrix chain, palindrome partition), aur **digit DP** (number ko digits pe DP, state = position + tight flag + carry/sum). Chaaron ki recognition alag hai, transition nahi.",
    "keyConcepts": "n ≤ 20 + 'visit all' → bitmask (TSP family). Tree diya hai + 'choose nodes with constraint' → tree DP. `dp[l][r]` jab dono ends se operate karna ho → interval DP. '1 se N tak kitne numbers jinme ...' with N ≤ 10^18 → digit DP.",
    "resources": "Bitmask DP ki state design; tree DP mein `dp[v][0/1]`; interval DP mein length-first loop; digit DP ka tight/leading-zero flag.",
    "notes": "DP sheet §advanced (DSA series).",
    "subSections": [
      {
        "id": "z23-sub-24",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-25",
    "title": "Combinatorics II — nCr mod p, inclusion–exclusion, Catalan",
    "part": "C · Intermediate",
    "ratingBand": "1600–2300",
    "description": "Yahan counting industrial ban jaati hai. **nCr mod p**: factorial + inverse factorial precompute (Fermat's little theorem se `inv(x) = x^(p-2)`), phir har nCr O(1). **Inclusion–exclusion**: 'at least one property' ko alternating sum se count karo — bitmask ke saath 2^k terms. Aur classic sequences: Catalan (balanced brackets, BSTs, triangulations), stars-and-bars (n cheezein k boxes mein), derangements.",
    "keyConcepts": "Answer mod 10^9+7 with n up to 10^6 → factorial precompute. 'Divisible by none of these primes' → inclusion-exclusion. Balanced brackets / valid sequences ka count → Catalan. 'x1+x2+...+xk = n non-negative' → stars and bars.",
    "resources": "Modular inverse (Fermat + extended Euclid); factorial precompute; inclusion–exclusion with bitmask; Catalan formula + reflection argument; Lucas theorem (chhote prime).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-25",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-26",
    "title": "Number Theory II — Euler φ, CRT, modular inverse, matrix exponentiation",
    "part": "C · Intermediate",
    "ratingBand": "1600–2300",
    "description": "Chaar advanced tools: **Euler's totient** φ(n) (coprime count, multiplicative — sieve se poora array), **modular inverse** (Fermat jab prime, extended Euclid jab nahi), **CRT** (do congruences ko ek mein merge karo), aur **matrix exponentiation** — koi bhi linear recurrence O(log n) mein (Fibonacci at n=10^18, ya k-step transitions ka count).",
    "keyConcepts": "'Coprime pairs count' → φ / Mobius. 'x ≡ a mod p, x ≡ b mod q' → CRT. Linear recurrence + n up to 10^18 → matrix expo. Division under mod → inverse (kabhi `/` na likho mod mein).",
    "resources": "φ ka sieve; extended Euclid; CRT merge; matrix expo (2x2 Fibonacci se shuru karo, phir k×k); Mobius function ka intro.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-26",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-27",
    "title": "Strings I — Hashing, KMP, Z-function",
    "part": "C · Intermediate",
    "ratingBand": "1400–2100",
    "description": "Teen tools jo string comparison ko O(1)/O(n) bana dete hain. **Polynomial hashing**: kisi bhi substring ka hash O(1) mein → do substrings equal? O(1). (CF pe **do mod use karo aur random base** — anti-hash tests real hain.) **KMP**: prefix-function π[i] = longest proper prefix which is also suffix — pattern matching + 'periodicity' problems. **Z-function**: har position se longest match with prefix — KMP ka aasaan cousin.",
    "keyConcepts": "'Substring occurrences count' → KMP/Z/hashing. 'Kitne distinct substrings' → hashing ya suffix structures (§37). 'Smallest period of string' → π array ki last value. Palindrome checks bahut si positions pe → hashing (forward + reverse).",
    "resources": "Polynomial hashing (collision probability samjho, ratta nahi); prefix function ka meaning aur uska automaton use; Z-function; string periodicity lemma.",
    "notes": "String sheet §pattern matching (DSA series).",
    "subSections": [
      {
        "id": "z23-sub-27",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-28",
    "title": "Game Theory — Nim, Sprague–Grundy, DP games",
    "part": "C · Intermediate",
    "ratingBand": "1000–2200",
    "description": "Do-player optimal play wali problems ka pura structure exist karta hai. Chhote states → **DP/memo pe win-lose**: current state losing hai agar *saare* moves opponent ko winning state pe le jaate hain. Symmetric pile games → **Nim**: XOR of pile sizes ≠ 0 ⟺ first player jeetega. Multiple independent games → **Sprague–Grundy**: har game ka Grundy number nikaalo, phir XOR. Aur bahut si easy problems sirf **parity** hain.",
    "keyConcepts": "'Both play optimally', 'who wins', 'Alice and Bob'. Piles/stones → Nim/Grundy. States chhote → win-lose DP. Answer suspiciously simple lag raha ho → parity check karo pehle.",
    "resources": "Win/lose state DP; Nim theorem (XOR ka proof); Grundy/mex calculation; game decomposition into independent games.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-28",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-29",
    "title": "Probability & Expected Value",
    "part": "C · Intermediate",
    "ratingBand": "1400–2200",
    "description": "Expected value ki do properties se 90% problems nikal jaati hain: **linearity** (E[X+Y] = E[X]+E[Y], independence ki zaroorat nahi — isliye har element ka contribution alag se count karo) aur **conditional expectation** (E = Σ p·E[next state], jo aksar DP ban jaata hai). Probability ko mod 10^9+7 mein 'fraction' ke roop mein rakhna hota hai — modular inverse se.",
    "keyConcepts": "'Expected value / expected number of', 'probability that'. Random shuffle/choice diya hai. Answer as `p·q^(-1) mod 998244353` maanga hai → §26/§27 ke inverse tools chahiye.",
    "resources": "Linearity of expectation (isse pehle kuch nahi); indicator variables; expected value DP (states pe backward); probability mod inverse.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-29",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-30",
    "title": "Sparse Table, LCA & Binary Lifting",
    "part": "D · Advanced",
    "ratingBand": "1700–2400",
    "description": "**Sparse table**: immutable array pe idempotent range query (min/max/gcd) O(1) mein, precompute O(n log n). **Binary lifting**: `up[v][j]` = v ka 2^j-th ancestor → k-th ancestor O(log n), aur **LCA** O(log n). Ek baar LCA aa gaya to tree pe 'path between u,v' wali har problem khul jaati hai (path length, path max, path sum with prefix-from-root).",
    "keyConcepts": "'Path between u and v' pe kuch poochha ja raha hai → LCA. 'k steps upar jao' / functional graph pe 'k jumps' → binary lifting. Static array pe bahut range-min queries → sparse table (segment tree se tez aur simple).",
    "resources": "Sparse table (idempotent kyun zaroori); binary lifting table; LCA via lifting aur via Euler tour + sparse table; path aggregate = f(root→u) + f(root→v) − f(root→lca).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-30",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-31",
    "title": "Trees Advanced — Euler tour, small-to-large, rerooting, HLD, centroid decomposition",
    "part": "D · Advanced",
    "ratingBand": "1900–2500",
    "description": "Paanch techniques jo tree problems ka top tier kholti hain. **Euler tour / flattening**: subtree ek contiguous range ban jaata hai → subtree query = range query (BIT/segtree). **Small-to-large merging**: har node pe sets merge karo chhote se bade mein — total O(n log^2 n). **Rerooting DP**: 'har node ko root maan ke answer' ek hi O(n) mein. **HLD**: path queries ko O(log^2 n) range queries mein todo. **Centroid decomposition**: 'saare paths' wali counting problems.",
    "keyConcepts": "'Subtree pe query + update' → Euler tour + BIT. 'Har node ka answer jab wo root ho' → rerooting. 'Path pe update/query' → HLD. 'Count paths with property (length k, sum s)' → centroid decomposition ya small-to-large.",
    "resources": "tin/tout se subtree range; DSU on tree (small-to-large); rerooting ka in-out DP; HLD chain decomposition; centroid decomposition ka O(n log n) proof.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-31",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-32",
    "title": "Segment Tree Advanced — lazy propagation, merge-sort tree, segment tree on values, Li Chao",
    "part": "D · Advanced",
    "ratingBand": "2000–2600",
    "description": "Segment tree ki asli power extensions mein hai. **Lazy propagation**: range update + range query (assignment, add, min-with). **Merge sort tree / segtree on values**: 'kitne elements ≤ x in range' type queries. **Segment tree descent**: tree pe hi binary search karke first-index-with-property O(log n) mein. **Li Chao tree**: lines ka minimum — CHT ka dynamic version (§35). **Segment tree beats**: range chmin/chmax.",
    "keyConcepts": "Range update + range query dono → lazy. 'Range mein kitne < x' → merge sort tree / offline BIT. 'Pehla index jahan prefix sum ≥ x' → segtree descent, na ki O(log^2). Interval assignment + sum → lazy with assignment tag.",
    "resources": "Lazy push/pull ka discipline (kab push karna zaroori hai); non-commutative lazy compose; segtree descent; merge sort tree vs offline sorting + BIT (offline aksar simpler).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-32",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-33",
    "title": "Sqrt Decomposition & Mo's Algorithm",
    "part": "D · Advanced",
    "ratingBand": "1900–2500",
    "description": "Jab koi clean DS structure nahi banta, to **√n pe bharosa karo**. Sqrt decomposition: array ko √n blocks mein baanto, query = O(√n). **Mo's algorithm**: offline queries ko block order mein sort karke pointers ko incrementally move karo — total O((n+q)√n), aur 'add/remove one element' likhna aasaan hota hai jahan segment tree merge likhna mushkil. Sqrt ka teesra roop: **rebuilding** (√q operations ke baad structure dobara bana lo).",
    "keyConcepts": "Queries **offline** allowed hain + 'range mein distinct count / mode / k-th frequency' — jahan merge define karna mushkil hai. Ya update + query dono hain par structure weird hai → sqrt decomposition. n,q ≈ 10^5 (√ ka comfortable range).",
    "resources": "Block size tuning; Mo's comparator; add/remove function design; Mo's on trees (Euler tour ke saath); sqrt rebuilding pattern.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-33",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-34",
    "title": "DP Optimizations — CHT, divide & conquer, Knuth, SOS, aliens trick",
    "part": "D · Advanced",
    "ratingBand": "2000–2700",
    "description": "O(n^2) DP ko O(n log n) banane ke standard tricks. **Convex Hull Trick / Li Chao**: transition `dp[i] = min(dp[j] + a[j]·b[i])` — lines ka minimum. **Divide & conquer optimization**: jab opt[i] monotonic ho. **Knuth optimization**: interval DP mein `opt[i][j-1] ≤ opt[i][j] ≤ opt[i+1][j]`. **SOS DP (subset sum over subsets)**: 2^n·n mein saare subsets ka aggregate. **Aliens trick (Lagrangian)**: 'exactly k groups' constraint ko penalty se hatao + binary search.",
    "keyConcepts": "Transition mein `min over j` hai aur formula linear-in-i dikh raha hai → CHT. 'Exactly k partitions' + n,k bade → D&C opt ya aliens trick. Bitmask pe 'saare subsets ka sum' → SOS. Quadrangle inequality satisfy ho rahi hai → Knuth.",
    "resources": "Pehle O(n^2) DP likho, phir usme structure dhoondho — optimization *baad* mein aati hai; CHT ka monotonic vs Li Chao; D&C opt ka monotonicity proof; SOS DP ka dimension-wise loop.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-34",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-35",
    "title": "Flows & Matching — max flow, min cut, bipartite matching, MCMF",
    "part": "D · Advanced",
    "ratingBand": "1800–2600",
    "description": "**Max-flow min-cut theorem** CP ka sabse powerful modelling tool hai: 'minimum cost to separate / maximum pairs to match / project selection' jaise bahut se problems ek flow network ban jaate hain. Dinic ka implementation ek baar library mein daal lo. **Bipartite matching** = unit-capacity max flow (Hopcroft–Karp ya Kuhn). **König's theorem**: max matching = min vertex cover — 'minimum rows+columns to cover' wali grid problems isi se. **MCMF** jab cost bhi ho.",
    "keyConcepts": "'Maximum pairs/assignments' with two sides → bipartite matching. 'Minimum vertices/edges to remove to disconnect' → min cut. 'Choose projects with prerequisites for max profit' → project selection (closure). Grid pe rows/columns cover → König.",
    "resources": "Ford–Fulkerson → Dinic; residual graph ka intuition; min cut = max flow; bipartite matching + König/Hall; project selection reduction; MCMF (SPFA-based).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-35",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-36",
    "title": "Strings II — Suffix Array, Suffix Automaton, Aho–Corasick, Manacher",
    "part": "D · Advanced",
    "ratingBand": "1900–2700",
    "description": "String ka heavy artillery. **Manacher**: saare palindromic substrings O(n) mein. **Aho–Corasick**: ek text mein *bahut se* patterns ek saath (trie + KMP failure links). **Suffix array + LCP (Kasai)**: distinct substrings, longest repeated substring, string sorting problems. **Suffix automaton**: sabse powerful — saare distinct substrings ka DAG, O(n) mein banta hai, aur 'count occurrences of every substring' type problems trivially solve karta hai.",
    "keyConcepts": "'Longest palindromic substring' with n = 10^6 → Manacher. 'k patterns, ek text' → Aho–Corasick. 'Number of distinct substrings' / 'k-th smallest substring' → suffix array/automaton. Multiple strings ka common substring → generalized suffix automaton.",
    "resources": "Manacher; Aho–Corasick automaton + suffix links; suffix array (doubling sort) + Kasai LCP; suffix automaton (states = endpos classes) — ye last wala time do, ek baar samajh gaye to bahut kuch khulta hai.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-36",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-37",
    "title": "Computational Geometry",
    "part": "D · Advanced",
    "ratingBand": "1200–2500",
    "description": "Geometry mein 90% kaam do primitives se hota hai: **cross product** (orientation — left/right/collinear, aur area) aur **dot product** (angle/projection). Inhi se: point-in-polygon, segment intersection, **convex hull** (Andrew's monotone chain), closest pair (D&C), rotating calipers. Sabse bada rule: **integer arithmetic mein raho jahan tak possible ho** — floating point comparison CP mein WA ka pakka rasta hai (`long long` cross product use karo, `double` nahi).",
    "keyConcepts": "Points, lines, polygons, area, 'kitne points ek line pe', 'sabse door do points', 'minimum enclosing'. Coordinates integer diye hain → integer geometry possible hai.",
    "resources": "Cross/dot product; orientation test; convex hull (monotone chain); polygon area (shoelace); line-segment intersection; epsilon comparison ka discipline jab float unavoidable ho.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-37",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-38",
    "title": "Interactive Problems",
    "part": "D · Advanced",
    "ratingBand": "1200–2300",
    "description": "Yahan judge tumhare query ka jawaab deta hai — tumhe **limited queries mein** answer nikaalna hai. Do rules jo bhoolne pe har baar 'Idleness limit exceeded' aata hai: har query ke baad **flush** karo (`cout << endl` ya `fflush(stdout)`), aur judge ka response *padho* zaroor. Strategy usually information-theoretic hai: 'log n queries allowed' → binary search, 'n queries' → ek-ek element pooch lo, '2n' → paired comparison.",
    "keyConcepts": "Statement mein 'you may ask at most Q queries', 'interactor'. Query budget hi algorithm bata deta hai: Q ≈ log n → binary search / ternary search; Q ≈ n log n → sorting-like; Q ≈ 2^n mat socho.",
    "resources": "Flush discipline; query budget se algorithm derive karna; binary search on hidden value; local testing ke liye khud ka interactor likhna.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-38",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-39",
    "title": "Divide & Conquer, Meet-in-the-Middle, Ternary Search, Bitset",
    "part": "D · Advanced",
    "ratingBand": "1500–2500",
    "description": "Chaar independent par high-value tools. **Divide & conquer**: merge sort counting (inversions), CDQ divide & conquer, D&C on answer. **Meet-in-the-middle**: n ≤ 40 → do halves mein todo, 2^20 + 2^20 (2^40 nahi). **Ternary search**: unimodal function ka max/min (convex/concave — is baat ko prove karo, guess na karo). **Bitset**: O(n^2/64) — knapsack, reachability, string matching mein constant factor 64x, jo TLE ko AC bana deta hai.",
    "keyConcepts": "n ≤ 40 with subset sum flavour → meet-in-the-middle. Function pehle badhta phir ghatta hai → ternary search. n^2 ≈ 10^9 par operations simple/boolean hain → bitset. 'Count pairs i<j with ...' → merge sort / BIT.",
    "resources": "Merge sort inversion counting; MITM (dono halves + binary search/hashmap); ternary search on integers ka edge case; `std::bitset` operations aur unka 64-bit word trick.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-39",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-40",
    "title": "2-SAT, Expression Parsing & Modelling Oddities",
    "part": "D · Advanced",
    "ratingBand": "1500–2600",
    "description": "**2-SAT**: har variable true/false, constraints 'ya' ke form mein → implication graph banao, SCC nikaalo, ek SCC mein x aur ¬x dono hue to impossible. Ye 'har cheez ke do choices hain aur pairs pe constraints hain' wali problems ka exact tool hai. **Expression parsing**: recursive descent ya shunting-yard — CP mein kam par jab aata hai to poore problem ka core hota hai.",
    "keyConcepts": "'Har item ke do options hain' + 'in dono mein se kam se kam ek' style constraints → 2-SAT. Nested brackets wala formula evaluate karna → parsing. Ye topics rare hain — recognition hi asli value hai, warna contest mein 40 minute barbaad.",
    "resources": "Implication graph + Tarjan SCC se 2-SAT; recursive descent parser; grammar ko code mein map karna.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-40",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-41",
    "title": "FFT / NTT & Polynomial Techniques",
    "part": "D · Advanced",
    "ratingBand": "2000–2800",
    "description": "Do polynomials ka product O(n log n) mein — aur CP mein iska matlab hai: **convolution**. 'Kitne pairs (i,j) with a[i]+b[j] = k for every k' — ye ek polynomial multiplication hai. NTT = FFT modulo 998244353 (isliye wo weird mod har jagah dikhta hai). Aage: polynomial inverse, exp/log, divide & conquer convolution, subset-sum convolution.",
    "keyConcepts": "'For every k, count pairs summing to k'. Bahut se counts ko combine karna hai. Answer mod 998244353 (ye mod NTT-friendly hai — bada hint). String matching with wildcards bhi convolution ban jaata hai.",
    "resources": "DFT intuition (roots of unity); iterative FFT; NTT; convolution ka combinatorial meaning — ye samajhna zyada important hai than implementation (implementation library se aata hai).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-41",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-42",
    "title": "Bridges, Articulation Points & Connectivity Structure",
    "part": "E · Expert / 2300+",
    "ratingBand": "1700–2600",
    "description": "Graph ki 'weak spots' nikaalna. **Bridge** = wo edge jise hataane se components badh jaate hain. **Articulation point** = wahi cheez vertex ke liye. Dono ek hi DFS mein `tin[v]` (discovery time) aur `low[v]` (subtree se kitna upar pahunch sakte ho) se milte hain. Iske aage: **bridge tree / 2-edge-connected components** — bridges ko condense karke graph ek tree ban jaata hai, aur phir tree ke saare tools (LCA, path queries) lag jaate hain. Ye 'cycle wale graph ko tree banane' ka standard move hai.",
    "keyConcepts": "'Kaunsi edge/vertex critical hai', 'ek edge hataane pe disconnect ho jaayega?', 'har pair ke beech kam se kam do disjoint paths hain?' Ya undirected graph pe path queries → bridge tree banao.",
    "resources": "tin/low ka meaning (ratta nahi — kyun kaam karta hai); bridge vs articulation point ka farq; bridge tree construction; biconnected components; block-cut tree.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-42",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-43",
    "title": "Functional Graphs, Euler Path & Cycle Structure",
    "part": "E · Expert / 2300+",
    "ratingBand": "1600–2500",
    "description": "**Functional graph**: har node ka exactly ek outgoing edge (`next[i]`) — structure hamesha 'rho' shape hoti hai: kuch tail phir ek cycle. Isliye 'k steps baad kahan pahunchoge' → binary lifting ya cycle detect + modulo. **Euler path/circuit**: har *edge* exactly ek baar — condition degree pe hai (undirected: 0 ya 2 odd-degree vertices), Hierholzer se construct. Hamiltonian se confuse na karo (wo NP-hard hai, Euler polynomial).",
    "keyConcepts": "'Permutation pe k baar apply karo', 'i ke baad p[i] jaate ho' → functional graph + cycle decomposition. 'Saare edges ek baar traverse karo' → Euler. 'Saare vertices ek baar' → Hamiltonian → bitmask DP (§25), Euler nahi.",
    "resources": "Cycle detection in functional graph (visited-states ya Floyd); permutation cycle decomposition; binary lifting for k-th successor; Euler circuit condition + Hierholzer's algorithm; de Bruijn sequence.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-43",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-44",
    "title": "Coordinate Compression, Offline Processing & Query Sorting",
    "part": "E · Expert / 2300+",
    "ratingBand": "1500–2400",
    "description": "Do sabse under-rated CP skills. **Coordinate compression**: values 10^9 tak hain par distinct values sirf 10^5 → unhe 0..n−1 pe map karo, ab array-based DS use ho sakta hai. **Offline processing**: saare queries pehle padh lo, unhe *apni marzi ke order* mein solve karo (aksar right endpoint pe sort), phir original order mein answer print karo. Bahut si problems jo online mushkil hain, offline mein trivial ho jaati hain — ye ek mindset shift hai jo 1900+ pe zaroori hai.",
    "keyConcepts": "Queries independent hain aur 'forced online' nahi likha → offline soch sakte ho. Values huge par count chhota → compress. 'Distinct in range', 'k-th smallest in range' → offline + BIT ya persistent DS (§47). Sorting + sweep se problem linear ban rahi ho.",
    "resources": "Compression via sort+unique+lower_bound; queries ko (r, l, idx) pe sort karke BIT sweep; 'answer sabse aakhir mein original order mein' pattern; small-to-large offline merging.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-44",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-45",
    "title": "Sweep Line & Event Processing",
    "part": "E · Expert / 2300+",
    "ratingBand": "1500–2500",
    "description": "Ek imaginary line (time ya x-axis) pe left-to-right chalo aur events process karo: +1 start pe, −1 end pe. Intervals ke saare classic sawaal isse nikal jaate hain — maximum overlap, union length, intersection count. Geometry mein bhi wahi: rectangle union area = sweep + segment tree, segment intersections = sweep + set. Trick sirf ye hai: **events ka sahi order define karna** (tie pe start pehle ya end pehle — ye problem-dependent hai aur yahin WA aata hai).",
    "keyConcepts": "Intervals/segments diye hain + 'maximum simultaneous', 'total covered length', 'kitne intersect karte hain'. Booking/meeting rooms. 2D rectangles ka area/union. Time pe events add/remove ho rahe hain.",
    "resources": "Event array (+1/−1) + sort; tie-breaking rules; sweep + multiset (running max/min); sweep + segment tree for area of union; Klee's algorithm.",
    "notes": "Array sheet §7 Intervals/Sweep Line (DSA series) — LeetCode-flavour wahan.",
    "subSections": [
      {
        "id": "z23-sub-45",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-46",
    "title": "Persistent Data Structures & Wavelet Trees",
    "part": "E · Expert / 2300+",
    "ratingBand": "2000–2800",
    "description": "**Persistence** = har update ke baad structure ka purana version bhi zinda rehta hai, kyunki tum poora tree copy nahi karte, sirf **path pe O(log n) naye nodes** banate ho. Isse: 'k-th smallest in range [l,r]' = version_r minus version_l pe descent (classic). 'Time travel queries' — t-th update ke baad ka state. Wavelet tree isi problem ka alternative hai (range k-th, range count ≤ x) aur aksar likhna aasaan hota hai.",
    "keyConcepts": "'k-th smallest/largest in subarray' → persistent segment tree on values. 'Query about state after i-th operation' → persistence. 'Count of elements ≤ x in [l,r]' with online queries (offline nahi allowed) → persistent/wavelet, warna §45 offline kaafi tha.",
    "resources": "Persistent segment tree (node copying, version roots array); prefix-versions ka subtraction trick; persistent DSU; wavelet tree basics; merge sort tree se comparison (kab kaunsa).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-46",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-47",
    "title": "Slope Trick & Convexity in DP",
    "part": "E · Expert / 2300+",
    "ratingBand": "2100–2800",
    "description": "Ek family of problems jahan `dp` function **convex piecewise-linear** hota hai — aur poora function store karne ke bajaye tum sirf uske **slope change points** ek priority_queue mein rakhte ho. 'Array ko non-decreasing banane ki minimum cost' jaisi problems O(n log n) mein khatam. Ye topic 2300+ pe farq banata hai kyunki isse pata chalta hai ki DP ki *shape* bhi ek exploitable property hai, sirf recurrence nahi.",
    "keyConcepts": "Cost function `|a[i] − b[i]|` ya convex hai + 'monotonic banana hai' / 'minimum total adjustment'. DP array plot karo to convex dikh raha hai. Ya 'min cost to make sorted/equal'.",
    "resources": "Convex function ko slope-breakpoints se represent karna; min-heap/max-heap se left aur right part; `f(x) → min(f(y) + |x−y|)` operations; Aliens trick ke saath connection (§35).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-47",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-48",
    "title": "Mobius Inversion, Divisor Sums & Multiplicative Functions",
    "part": "E · Expert / 2300+",
    "ratingBand": "1900–2800",
    "description": "Number theory ka counting side. Basic move: **'exactly k' ko 'at least/multiple of k' se count karo aur ulta subtract karo** — `f(d) = Σ_{d|k} g(k)` type. Isse gcd-counting problems (kitne pairs with gcd = d) O(n log n) mein nikal jaate hain, har baar Mobius likhne ki bhi zaroorat nahi (divisor-sieve subtraction kaafi hai). Uske upar: μ function, Dirichlet convolution, divisor-sum sieve, aur multiplicative function ka linear sieve.",
    "keyConcepts": "'Count pairs with gcd = k / coprime pairs', 'Σ over all pairs of gcd', 'square-free numbers', 'Σ d(i) for i=1..n'. Constraints 10^6–10^7 with many queries → sieve-based precompute.",
    "resources": "Divisor-multiple subtraction (Mobius ka practical roop); μ ki definition aur μ*1 = ε; Dirichlet convolution; linear sieve for multiplicative functions; harmonic-sum complexity O(n log n) ka reason.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-48",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-49",
    "title": "Burnside / Polya — counting up to symmetry",
    "part": "E · Expert / 2300+",
    "ratingBand": "2100–2900",
    "description": "'Rotations/reflections ko same maana jaaye to kitne distinct objects?' — naive counting yahan double-counts karta hai. **Burnside's lemma**: distinct count = (Σ over each symmetry g of fixed points of g) / |G|. Necklace coloring, cube painting, circular arrangements — sab isi ek formula se. CP mein rare hai par jab aata hai to poora problem yahi hota hai, isliye recognition matter karti hai.",
    "keyConcepts": "'Rotations equivalent hain', 'reflections ko same ginna', 'necklace/bracelet', 'cube ke faces color karo'. Circular structure + 'distinct up to rotation'.",
    "resources": "Group actions ka intuition; Burnside statement + necklace pe application (Σ over rotations of k^gcd(n,i)); Polya enumeration theorem; modular division ke saath (|G| ka inverse).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-49",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-50",
    "title": "Randomization — hashing attacks, shuffles, Zobrist, Monte Carlo",
    "part": "E · Expert / 2300+",
    "ratingBand": "1700–2700",
    "description": "Randomness CP mein defensive aur offensive dono hai. **Defensive**: `unordered_map` aur fixed-base hashing pe CF pe log anti-tests banate hain — `mt19937` se random base/seed use karo, warna O(n^2) TLE. **Offensive**: random shuffle se worst-case tod do (quickselect, nth_element), **Zobrist hashing** se sets/multisets ko ek number mein badlo (XOR of random values — 'ye do subtrees same hain?'), aur Monte Carlo se probabilistic checks (birthday paradox se O(√n) hits).",
    "keyConcepts": "Hashing use kar rahe ho + CF pe submit karna hai → randomize karo. 'Do multisets equal hain?' → Zobrist XOR. 'Majority/frequent element' with weird constraints → random sampling. Deterministic solution nahi dikh rahi par 'high probability' kaafi hai.",
    "resources": "`mt19937_64` + `chrono` seed; custom hash for unordered_map; Zobrist hashing (subtree/multiset comparison); random shuffle before greedy/nth_element; birthday-paradox based algorithms.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-50",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-51",
    "title": "Advanced Flows — MCMF, Hall's theorem, project selection, matroids",
    "part": "E · Expert / 2300+",
    "ratingBand": "2100–2900",
    "description": "Flow ka doosra level: **min-cost max-flow** (Johnson potentials ke saath, negative edges handle), **Hall's marriage theorem** (perfect matching kab exist karti hai — 'har subset S ke liye |N(S)| ≥ |S|', ye proofs mein bahut kaam aata hai), **project selection / closure** (profit maximize with prerequisites = min cut), aur **matroid intersection** ka intro. Yahan asli skill algorithm likhna nahi, **problem ko flow network mein translate karna** hai.",
    "keyConcepts": "'Maximum profit with dependencies' → closure/min cut. 'Assign with costs, minimum total cost' → MCMF. 'Perfect matching exist karti hai ya nahi' → Hall's condition (aur aksar iska direct greedy/counting proof mil jaata hai, flow likhne ki zaroorat hi nahi). Bipartite + capacity constraints → flow with lower bounds.",
    "resources": "MCMF (SPFA/Dijkstra with potentials); Hall's theorem + König/Dilworth; project selection reduction; flows with lower bounds; minimum path cover on DAG.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-51",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-52",
    "title": "Linear Recurrences — Kitamasa & Berlekamp–Massey",
    "part": "E · Expert / 2300+",
    "ratingBand": "2200–3000",
    "description": "**Kitamasa**: k-order linear recurrence ka n-th term O(k log k log n) mein (matrix expo se tez jab k bada ho). **Berlekamp–Massey**: sequence ke pehle kuch terms se **recurrence khud discover** karo — CP ka legendary shortcut: chhote n ke liye brute force se 20-30 terms nikaalo, BM chala do, aur agar recurrence mil gayi to n = 10^18 ka answer mil gaya, bina poori problem solve karne ke.",
    "keyConcepts": "Answer ek sequence hai jo n pe depend karta hai + n bahut bada (10^9–10^18) + chhote n ka brute force likhna aasaan hai. Ya explicitly linear recurrence di hai with large k.",
    "resources": "Polynomial mod characteristic polynomial (Kitamasa); Berlekamp–Massey ka usage pattern (brute force → 30 terms → BM → verify); kab BM valid hai aur kab nahi (linear recurrence hona zaroori hai).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-52",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-53",
    "title": "Dynamic Connectivity & Offline D&C on Time",
    "part": "E · Expert / 2300+",
    "ratingBand": "2200–3000",
    "description": "Problem: edges add **aur** remove ho rahe hain, aur connectivity poochhi ja rahi hai. DSU delete nahi kar sakta. Do standard jawaab: (1) **offline divide & conquer on time** — har edge ek time-interval [l,r] mein zinda hai, segment tree on time pe edge daalo, DFS karo **DSU with rollback** ke saath; (2) **Link-Cut Trees / Euler Tour Trees** — online, par heavy. 99% contests mein (1) hi expected hota hai, aur ye technique offline mindset (§45) ka climax hai.",
    "keyConcepts": "'Edge add aur remove dono' + connectivity/component queries. 'i-th se j-th operation ke beech kya tha'. Ya koi bhi problem jahan 'DSU chahiye par delete bhi chahiye'.",
    "resources": "DSU with rollback (union by size, no path compression); segment tree on time + DFS; offline D&C ka framework; LCT ka intro (sirf awareness ke liye).",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-53",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-54",
    "title": "Advanced Constructive & Interactive (Div1 A/B level)",
    "part": "E · Expert / 2300+",
    "ratingBand": "2000–2700",
    "description": "2000+ pe constructive problems ka flavour badal jaata hai: ab tumhe **invariant** dhoondhna hota hai ya ek clever recursive/binary construction. Standard weapons: induction (n−1 ka answer se n banao), divide the structure in halves, extremal element pe kaam karo (sabse bada/chhota pehle fix karo), aur bounds prove karo (lower bound = answer, phir usko achieve karne ki construction do). Interactive advanced mein query budget theek log n ya 2n hota hai — usse algorithm derive hota hai.",
    "keyConcepts": "'Construct any valid' + rating 2000+. 'Minimum number of operations to achieve X' jahan answer ek clean formula hai + construction chahiye. Interactive with tight query limit.",
    "resources": "Lower bound + matching construction ka do-step pattern; induction constructions; extremal argument; adaptive interactor ke saath kaise khelein.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-54",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-55",
    "title": "Tag-blind Mixed Set — 1900–2200 (Expert → Candidate Master)",
    "part": "F · Tag-blind Consolidation",
    "ratingBand": "1900–2200",
    "description": "Ab tak har section ne tumhe **tag bata diya** tha — aur real contest mein yahi missing hota hai. Ye set jaan-boojh ke mixed hai: pehle se nahi pata ki kaunsa tool lagega. Rule: **problem se pehle tag mat dekho.** 20 minute khud socho, phir hi editorial. Har problem ke baad ek line likho: 'kaunsa signal main miss kiya?' — 30-40 aisi lines tumhari rating 2000 se 2200 le jaati hain.",
    "keyConcepts": "Signal dhoondhna hi is section ka exercise hai. Checklist chalao: constraints kya allow karte hain → structure kya hai (array/graph/tree/string) → greedy try karo aur counter-example dhoondho → DP state soch ke dekho → kya kuch monotonic hai (binary search) → kya offline ho sakta hai.",
    "resources": "Kuch naya nahi. Ye consolidation hai — §1–42 ka recall under uncertainty. Yahi CP ka asli skill hai.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-55",
        "title": "Practice Set",
        "topics": []
      }
    ]
  },
  {
    "id": "z23-56",
    "title": "Tag-blind Mixed Set — 2300+ (Master track)",
    "part": "F · Tag-blind Consolidation",
    "ratingBand": "2300–2600",
    "description": "Final boss set. 2300+ problems mein aksar **do techniques compose** hoti hain (segment tree + DP, flow + greedy proof, hashing + D&C) — isliye single-tool recognition kaafi nahi, tumhe layering aani chahiye. Yahan rule badalta hai: 45–60 minute ek problem pe dena normal hai, aur ek din mein ek problem karna bhi progress hai. Editorial padhne ke baad **48 ghante baad dobara** khud se implement karo — retention wahin banta hai.",
    "keyConcepts": "Composition dhoondho: problem ko do parts mein todo — 'ek part kis DS se hoga, doosra kis technique se'. Aur 'reduction' socho: ye problem kis known problem jaisi hai?",
    "resources": "Kuch naya nahi — layering aur reduction. Isi ke saath CF EDU ke dono courses aur AtCoder ARC/AGC ke problems parallel chalao.",
    "notes": "",
    "subSections": [
      {
        "id": "z23-sub-56",
        "title": "Practice Set",
        "topics": []
      }
    ]
  }
];
