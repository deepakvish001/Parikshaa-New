# The Complete DSA Roadmap — Zero to FAANG

A curated `pattern-wise` journey from absolute beginner to FAANG-ready — 4 levels, 17 sheets, 24 core patterns, and a phase-by-phase study plan.

Ye ek single north-star document hai. Isme **kya**, **kis order mein**, aur **kaise** karna hai — sab hai. Har topic ka apna detailed sheet alag hai; ye document unhe ek sequence mein baandhta hai.

> **Core philosophy — "Derive karo, ratta mat maaro":** DSA yaad karne ki cheez nahi. Har problem ek pattern ka roop hai. Tumhe ~24 patterns pehchaanne aane chahiye — problem dekhte hi pata chal jaaye "yeh sliding window hai" ya "yeh binary-search-on-answer hai". Pattern pakda, to solution 80% ho gaya.

> **FAANG ka sach:** interview mein naye problems aate hain, par woh inhi 24 patterns ke variations hote hain. Isliye 500 random problems ratne se better hai — 24 patterns ko deeply samajhna aur har ek ke 15-20 representative problems solve karna.


## The Journey — 4 Levels

> Absolute beginner se FAANG-ready tak — chaar levels ki ladder. Koi level skip mat karo; har level agle ka neev hai.

| ☆ | Name | Description |
| --- | --- | --- |
| ★ | [Level 0 — Problem Solving Foundation](/learn/sheets/problem-solving-foundation) | "Kuch nahi aata" se "code likh sakta hoon" tak. if-else → loops → patterns → digits → primes → strings → arrays → matrices. 301 curated problems. |
| ★★ | [Level 1 — Thinking Foundation (Recursion)](/learn/sheets/recursion-typewise) | Recursion = poori advanced DSA ki jadd. Base cases, divide & conquer, aur Trees/Backtracking/DP ka bridge. |
| ★★★ | [Level 2 — Core Data Structures & Patterns](/learn/sheets/array-typewise) | Arrays, Binary Search, Strings, LL, Stack, Queue, Heap, Bit, Trie, Binary Tree, Math — 11 sheets. |
| ★★★ | [Level 3 — The FAANG Differentiators](/learn/sheets/dp-typewise) | Backtracking, Greedy, Graph, Dynamic Programming. Yahi 4 topics medium-to-hard interviews decide karte hain. |


## The Complete Sequence — 17 Sheets

> Exact order in which to attempt the 17 sheets. Total realistic timeline: ~4-6 months consistent (roz 2-3 hrs). Depth > speed.

| ☆ | Name | Description |
| --- | --- | --- |
| L0 | [Problem Solving Foundation](/learn/sheets/problem-solving-foundation) | Coding-thinking zero se. ~3-4 weeks. |
| L1 | [Recursion 🪆](/learn/sheets/recursion-typewise) | Trees/Backtracking/DP ki jadd. ~1-2 weeks. |
| L2 | [Arrays 🔢](/learn/sheets/array-typewise) | Sabse zyada tested — prefix, 2-pointer, sliding window. ~2 weeks. |
| L2 | [Binary Search 🔍](/learn/sheets/binary-search-typewise) | Classic + binary-search-on-answer (high ROI). ~1 week. |
| L2 | [Strings 🔤](/learn/sheets/string-typewise) | 2-pointer, KMP, string DP. ~1-2 weeks. |
| L2 | [Linked List 🔗](/learn/sheets/linked-list-typewise) | Pointers, reversal, fast-slow. ~1 week. |
| L2 | [Stack 📚](/learn/sheets/stack-typewise) | Monotonic stack (very common). ~1 week. |
| L2 | [Queue 📥](/learn/sheets/queue-typewise) | BFS, deque, topological sort. ~1 week. |
| L2 | [Heap / Priority Queue 🔺](/learn/sheets/heap-typewise) | Top-K, two heaps, K-way merge. ~1 week. |
| L2 | [Bit Manipulation ⚡](/learn/sheets/bit-typewise) | XOR tricks, bitmasks. ~3-4 days. |
| L2 | [Trie 🔠](/learn/sheets/trie-typewise) | Prefix trees, bit-trie for max XOR. ~3-4 days. |
| L2 | [Binary Tree & BST 🌳](/learn/sheets/binary-tree-typewise) | Traversals, LCA, tree DP. ~2 weeks. |
| L2 | [Math & Number Theory ➗](/learn/sheets/math-typewise) | GCD, Sieve, mod, combinatorics (also useful for GATE). ~1 week. |
| L3 | [Backtracking 🔙](/learn/sheets/backtracking-typewise) | Subsets, permutations, N-Queens. ~1 week. |
| L3 | [Greedy 🪙](/learn/sheets/greedy-typewise) | Intervals, exchange argument. ~1 week. |
| L3 | [Graph 🕸️](/learn/sheets/graph-typewise) | DFS/BFS, Union-Find, Dijkstra, MST. ~2-3 weeks. |
| L3 | [Dynamic Programming 🧩](/learn/sheets/dp-typewise) | Knapsack, grid, LIS, interval, bitmask. ~3-4 weeks. |


## The 24 Core Patterns

> FAANG interviews ka ~90% inhi 24 patterns pe khada hai. Har pattern ka recognition signal (kab pehchano) + kaunse sheet mein hai — table mein.

| Category | Name | Description |
| --- | --- | --- |
| Foundational | Recursion / Divide & Conquer | "smaller subproblem mein toota ja sakta hai" — Recursion sheet. |
| Foundational | Prefix Sum | "subarray sum / range sum baar-baar" — Array §1. |
| Foundational | Two Pointers | "sorted array, pair/triplet, ya converge" — Array §2, String §1. |
| Foundational | Sliding Window | "contiguous subarray/substring with condition" — Array §3, String §2. |
| Foundational | Fast & Slow Pointers | "cycle detect, middle, linked list" — LL §3. |
| Foundational | In-place LL Reversal | "reverse linked list / part of it" — LL §1. |
| Core | Hashing (Map/Set) | "seen before? count? O(1) lookup?" — Array §5, String §3. |
| Core | Binary Search | "sorted, ya 'minimize max / maximize min'" — Binary Search. |
| Core | Monotonic Stack | "next greater/smaller, histogram" — Stack §4. |
| Core | Merge Intervals | "overlapping intervals, meetings" — Array §7. |
| Core | Cyclic Sort | "numbers 1..n, missing/duplicate" — Array §10. |
| Core | Top K Elements | "K largest/smallest/frequent" — Heap §1. |
| Core | K-way Merge | "K sorted lists/arrays" — Heap §3. |
| Core | Two Heaps | "median of stream, balance halves" — Heap §4. |
| Core | Bit Manipulation / XOR | "single number, toggle, subsets as mask" — Bit Manip. |
| Core | Trie | "prefix queries, autocomplete, max XOR" — Trie. |
| Trees & Graphs | Tree DFS / BFS | "tree traversal, path, level order" — Binary Tree. |
| Trees & Graphs | Tree DP | "har node do states return karta hai" — Binary Tree §11. |
| Trees & Graphs | Graph DFS / BFS | "connected components, shortest path (unweighted)" — Graph §1-2. |
| Trees & Graphs | Topological Sort | "dependencies, ordering, DAG" — Queue §3, Graph §3. |
| Trees & Graphs | Union-Find | "connectivity, grouping, cycle (undirected)" — Graph §4. |
| Trees & Graphs | Dijkstra / Shortest Path | "weighted shortest path" — Graph §6-8. |
| Differentiators | Backtracking | "generate all / find all combinations" — Backtracking. |
| Differentiators | Greedy | "local best → global best (prove it!)" — Greedy. |
| Differentiators | Dynamic Programming | "optimal + overlapping subproblems + choices" — DP. |


## Phase-by-Phase Study Plan

> Roughly 6 months, split into four phases. Har phase ka goal + kya karna hai — table mein.

| Phase | Name | Description |
| --- | --- | --- |
| Weeks 1-6 | Phase 1 — Foundation | Level 0 + Recursion. Har concept kaagaz pe likho before coding. Yeh phase rush mat karo — yehi neev hai. |
| Weeks 7-16 | Phase 2 — Core Structures | Arrays → Binary Search → Strings → LL → Stack → Queue → Heap → Bit → Trie → Binary Tree → Math. Pehle pattern samjho, phir IMP problems. Har problem: 30 min khud → hint → solution → agle din bina dekhe dobara likho. |
| Weeks 17-26 | Phase 3 — Advanced | Backtracking → Greedy → Graph → DP. DP mein top-down + memo se shuru phir bottom-up. Graph ke 8 algorithms ka template ek baar likho, phir apply. |
| Weeks 27+ | Phase 4 — Interview Prep | Mixed practice (Blind 75 / NeetCode 150), 2-3 mock interviews/week (Pramp, interviewing.io), aur target company ke tagged problems. Bolte hue solve karo. |


## Meta-Skills

> Problems solve karna kaafi nahi — FAANG mein sirf sahi answer nahi, process bhi dekha jaata hai. Yeh 5 skills alag se build karo.

| ☆ | Name | Description |
| --- | --- | --- |
| ★★★ | Pattern Recognition | Problem padhte hi "yeh konsa pattern hai" bolna. Mixed practice zaroori (Phase 4). |
| ★★★ | Complexity Fluency | Har solution ka time & space turant bata sako. Big-O clear ho — O(n), O(n log n), O(2ⁿ), amortized, etc. |
| ★★★ | Communication (Thinking Out Loud) | Interviewer ko apni soch batao: "brute force O(n²)… ab optimize… two pointers se O(n)". Chup-chaap code likhna = red flag. |
| ★★★ | Edge Cases | Empty input, single element, duplicates, overflow, null. Interviewer inhi se test karta hai. |
| ★★★ | Clean Code | Meaningful names, no bugs, dry-run karke verify. Working > clever. |


## Kitne Problems — Realistic Targets

> Milestones beginner se FAANG-confident tak. Quality > quantity — 300 problems deeply understood > 800 dekhe hue.

| ☆ | Name | Description |
| --- | --- | --- |
| ~100 | Comfortable with basics | Level 0-1 done. Simple problems bina panic ke solve. |
| ~250-300 | Foundation done | Core patterns clear, IMP problems dobara solve kar sakte ho. |
| ~400 | Interview-ready (mid) | Level 2 done. Most medium problems solvable in 30-45 min. |
| ~500-600 + mocks | FAANG-confident | Level 3 done. Hard problems attempt kar sakte ho + mocks passed. |


## FAANG Interview Structure

> Typical FAANG loop: OA → phone → onsite → behavioral. Difficulty split usually ~20% easy, ~60% medium, ~20% hard — medium pe sabse zyada focus.

| Stage | Name | Description |
| --- | --- | --- |
| 1 | Online Assessment (OA) | 1-3 problems, timed. Usually medium. Yahan speed + pattern recognition. |
| 2 | Phone / Technical Rounds | 2-4 rounds, 1-2 problems each, 45 min. Live coding + communication. |
| 3 | Onsite / Virtual Loop | 4-6 rounds — DSA (2-3), System Design (senior roles), Behavioral (1-2). |
| 4 | Behavioral | STAR method (Situation-Task-Action-Result). Prep karo — "tell me about a time…" wale sawaal. 8-10 stories ready rakho. |


## Final Checklist — Before You Apply

> Sab tick? To apply karo. Tum ready ho. 🚀

| ☆ | Name | Description |
| --- | --- | --- |
| ☐ | Sheets Complete | Level 0-3 saari sheets complete — IMP problems 2x solved. |
| ☐ | 24 Patterns Recognized | Har pattern problem dekh ke pehchaan sakte ho. |
| ☐ | Big-O Fluent | Har solution ka time & space turant bata sakte ho. |
| ☐ | Talk-While-Solving | Bolte hue (out loud) solve kar sakte ho. |
| ☐ | Mocks Done | 15+ mock interviews diye. |
| ☐ | Curated Lists | Blind 75 / NeetCode 150 complete. |
| ☐ | Company Tags | Target company ke tagged problems solve kiye. |
| ☐ | Behavioral Stories | STAR answers ready — 8-10 stories. |
| ☐ | Resume + LinkedIn | Resume ready, LinkedIn updated. |
| ☐ | Muscle Memory | Edge cases + clean code muscle memory ban gaya. |


## Closing Note

> Ek aakhri baat — discipline, not motivation. Roz 2-3 hrs, 6 din/week, 4-6 months consistent. Ek din problem dekh ke automatically pattern dikhega — us din tum ready ho.

| ☆ | Name | Description |
| --- | --- | --- |
| 💪 | Derive karo, ratta mat maaro | Placement pakka hai. Har pattern samajhte jao, har din thoda better. |
