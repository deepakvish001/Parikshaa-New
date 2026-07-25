export type CellState =
  | "idle"
  | "active"
  | "window"
  | "compare"
  | "found"
  | "sorted"
  | "eliminated";

export interface Cell {
  value: number | string;
  state: CellState;
  label?: string;
}

export interface Pointer {
  name: string;
  index: number;
  color: string;
}

/** A single stack frame in a call-stack scene (Python Tutor style). */
export interface CallFrame {
  id: string;
  title: string;
  vars?: { name: string; value: string | number }[];
  /** active = currently executing, idle = paused higher on stack, returned = popped */
  state: "active" | "idle" | "returned";
  returns?: string | number;
}

/** A call-stack style scene rendered on the right stage. */
export interface CallScene {
  mainBlock?: { vars: { name: string; value: string | number }[] };
  frames: CallFrame[];
  /** Return label to draw on the connector coming *up* to the parent (index in frames of the child). */
  returnFromChild?: { childIndex: number; label: string };
  /** Output panel content to render above the stage. */
  output?: string;
  /** Optional dashed entry arrow from main block to first call frame. */
  entryArrow?: boolean;
}

export interface AlgoFrame {
  cells: Cell[];
  pointers: Pointer[];
  explain: string;
  op?: string;
  /** 0-based index of the highlighted code line for this step. */
  pcLine?: number;
  /** Key/value state to show in the inspector panel. */
  inspect?: Record<string, string | number | boolean>;
  /** Call-stack scene. When present, the stage renders it instead of the cells row. */
  scene?: CallScene;
  /** Short code snippet mirrored under "Explanation of this code:". */
  codeSnippet?: string;
}

/** Language label shown in the top language dropdown per algorithm. */
export const CODE_LANGUAGE: Record<string, string> = {
  "two-pointers": "Python",
  "sliding-window": "Python",
  "binary-search": "Python",
  "bubble-sort": "Python",
  "recursion-factorial": "Python",
};

/** Human-readable topic label shown in the top topic dropdown. */
export const CODE_TOPIC: Record<string, string> = {
  "two-pointers": "Two Pointers",
  "sliding-window": "Sliding Window",
  "binary-search": "Binary Search",
  "bubble-sort": "Bubble Sort",
  "recursion-factorial": "Recursion",
};

/** Real (or pseudo) code shown alongside the animation. Line indexes are 0-based. */
export const CODE_LINES: Record<string, string[]> = {
  "two-pointers": [
    "l = 0",
    "r = n - 1",
    "while l < r:",
    "  s = a[l] + a[r]",
    "  if s == target: return (l, r)",
    "  if s < target: l += 1",
    "  else:          r -= 1",
  ],
  "sliding-window": [
    "sum = sum(a[0..k-1])",
    "best = sum",
    "for end in k..n-1:",
    "  sum += a[end] - a[end-k]",
    "  best = max(best, sum)",
    "return best",
  ],
  "binary-search": [
    "lo, hi = 0, n - 1",
    "while lo <= hi:",
    "  mid = (lo + hi) / 2",
    "  if a[mid] == target: return mid",
    "  if a[mid] < target: lo = mid + 1",
    "  else:               hi = mid - 1",
    "return -1",
  ],
  "bubble-sort": [
    "for pass in 0..n-2:",
    "  for j in 0..n-pass-2:",
    "    if a[j] > a[j+1]:",
    "      swap(a[j], a[j+1])",
    "  # largest element bubbled to end",
  ],
  "recursion-factorial": [
    "def factorial(x):",
    '    """This is a recursive function',
    '    to find the factorial of an integer"""',
    "",
    "    if x == 1:",
    "        return 1",
    "    else:",
    "        return (x * factorial(x-1))",
    "",
    "",
    "num = 4",
    'print("The factorial of", num, "is", factorial(num))',
  ],
};

/** Backward-compat alias. */
export const PSEUDOCODE = CODE_LINES;

/** Two Pointers on sorted array to find pair summing to target. */
function twoPointers(): AlgoFrame[] {
  const arr = [1, 4, 6, 8, 11, 15];
  const target = 14;
  const frames: AlgoFrame[] = [];
  let l = 0;
  let r = arr.length - 1;
  const mkCells = (li: number, ri: number, found = false): Cell[] =>
    arr.map((v, i) => ({
      value: v,
      state:
        found && (i === li || i === ri)
          ? "found"
          : i === li || i === ri
          ? "active"
          : "idle",
    }));
  frames.push({
    cells: mkCells(l, r),
    pointers: [
      { name: "L", index: l, color: "#fb923c" },
      { name: "R", index: r, color: "#38bdf8" },
    ],
    explain: `Start with L at the smallest and R at the largest value. Target is ${target}.`,
    op: `L=${l} R=${r} sum=${arr[l] + arr[r]}`,
    pcLine: 1,
    codeSnippet: "r = n - 1",
    inspect: { L: l, R: r, "a[L]": arr[l], "a[R]": arr[r], sum: arr[l] + arr[r], target },
  });
  while (l < r) {
    const sum = arr[l] + arr[r];
    if (sum === target) {
      frames.push({
        cells: mkCells(l, r, true),
        pointers: [
          { name: "L", index: l, color: "#34d399" },
          { name: "R", index: r, color: "#34d399" },
        ],
        explain: `${arr[l]} + ${arr[r]} = ${target}. Found the pair in O(n) time.`,
        op: `sum = ${target} ✓`,
        pcLine: 4,
        codeSnippet: "if s == target: return (l, r)",
        inspect: { L: l, R: r, sum, target, result: "found" },
      });
      break;
    }
    if (sum < target) {
      l++;
      frames.push({
        cells: mkCells(l, r),
        pointers: [
          { name: "L", index: l, color: "#fb923c" },
          { name: "R", index: r, color: "#38bdf8" },
        ],
        explain: `${sum} < ${target}. We need a bigger sum, so move L right.`,
        op: `L=${l} R=${r} sum=${arr[l] + arr[r]}`,
        pcLine: 5,
        codeSnippet: "if s < target: l += 1",
        inspect: { L: l, R: r, "a[L]": arr[l], "a[R]": arr[r], sum: arr[l] + arr[r], target },
      });
    } else {
      r--;
      frames.push({
        cells: mkCells(l, r),
        pointers: [
          { name: "L", index: l, color: "#fb923c" },
          { name: "R", index: r, color: "#38bdf8" },
        ],
        explain: `${sum} > ${target}. We need a smaller sum, so move R left.`,
        op: `L=${l} R=${r} sum=${arr[l] + arr[r]}`,
        pcLine: 6,
        codeSnippet: "else:          r -= 1",
        inspect: { L: l, R: r, "a[L]": arr[l], "a[R]": arr[r], sum: arr[l] + arr[r], target },
      });
    }
  }
  return frames;
}

/** Sliding window: max sum of window of size k. */
function slidingWindow(): AlgoFrame[] {
  const arr = [2, 1, 5, 1, 3, 2, 7, 1];
  const k = 3;
  const frames: AlgoFrame[] = [];
  let sum = 0;
  for (let i = 0; i < k; i++) sum += arr[i];
  let best = sum;
  let bestStart = 0;
  const mk = (s: number, e: number): Cell[] =>
    arr.map((v, i) => ({
      value: v,
      state: i >= s && i <= e ? "window" : "idle",
      label: i === s ? "start" : i === e ? "end" : undefined,
    }));
  frames.push({
    cells: mk(0, k - 1),
    pointers: [{ name: "sum", index: k - 1, color: "#fb923c" }],
    explain: `Build the first window of size ${k}. Sum = ${sum}.`,
    op: `sum=${sum} best=${best}`,
    pcLine: 0,
    codeSnippet: "sum = sum(a[0..k-1])",
    inspect: { k, start: 0, end: k - 1, sum, best },
  });
  for (let end = k; end < arr.length; end++) {
    const start = end - k + 1;
    sum += arr[end] - arr[end - k];
    if (sum > best) {
      best = sum;
      bestStart = start;
    }
    frames.push({
      cells: mk(start, end),
      pointers: [{ name: "sum", index: end, color: "#fb923c" }],
      explain: `Slide right: add ${arr[end]}, drop ${arr[end - k]}. Sum = ${sum}. Best so far ${best}.`,
      op: `sum=${sum} best=${best}`,
      pcLine: 3,
      codeSnippet: "sum += a[end] - a[end-k]",
      inspect: { start, end, added: arr[end], dropped: arr[end - k], sum, best },
    });
  }
  frames.push({
    cells: arr.map((v, i) => ({
      value: v,
      state: i >= bestStart && i < bestStart + k ? "found" : "idle",
    })),
    pointers: [{ name: "max", index: bestStart, color: "#34d399" }],
    explain: `Maximum sum of any window of size ${k} is ${best}. Each element visited once → O(n).`,
    op: `answer = ${best}`,
    pcLine: 5,
    codeSnippet: "return best",
    inspect: { bestStart, k, answer: best },
  });
  return frames;
}

/** Binary search for a target. */
function binarySearch(): AlgoFrame[] {
  const arr = [1, 3, 5, 7, 9, 12, 15, 18, 21, 25];
  const target = 15;
  const frames: AlgoFrame[] = [];
  let lo = 0;
  let hi = arr.length - 1;
  const mk = (lo: number, hi: number, mid: number, found = false): Cell[] =>
    arr.map((v, i) => {
      let state: CellState = "idle";
      if (i < lo || i > hi) state = "eliminated";
      if (i === mid) state = found ? "found" : "active";
      return { value: v, state };
    });
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) {
      frames.push({
        cells: mk(lo, hi, mid, true),
        pointers: [
          { name: "lo", index: lo, color: "#fb923c" },
          { name: "mid", index: mid, color: "#34d399" },
          { name: "hi", index: hi, color: "#38bdf8" },
        ],
        explain: `arr[mid] = ${arr[mid]} equals target ${target}. Found in O(log n) steps.`,
        op: `lo=${lo} mid=${mid} hi=${hi} ✓`,
        pcLine: 3,
        codeSnippet: "if a[mid] == target: return mid",
        inspect: { lo, mid, hi, "a[mid]": arr[mid], target, result: "found" },
      });
      break;
    }
    const less = arr[mid] < target;
    frames.push({
      cells: mk(lo, hi, mid),
      pointers: [
        { name: "lo", index: lo, color: "#fb923c" },
        { name: "mid", index: mid, color: "#f59e0b" },
        { name: "hi", index: hi, color: "#38bdf8" },
      ],
      explain: less
        ? `arr[mid] = ${arr[mid]} < ${target}. Discard the left half.`
        : `arr[mid] = ${arr[mid]} > ${target}. Discard the right half.`,
      op: `lo=${lo} mid=${mid} hi=${hi}`,
      pcLine: less ? 4 : 5,
      codeSnippet: less ? "if a[mid] < target: lo = mid + 1" : "else:               hi = mid - 1",
      inspect: { lo, mid, hi, "a[mid]": arr[mid], target },
    });
    if (less) lo = mid + 1;
    else hi = mid - 1;
  }
  return frames;
}

/** Bubble sort. */
function bubbleSort(): AlgoFrame[] {
  const arr = [5, 3, 8, 1, 4, 2];
  const frames: AlgoFrame[] = [];
  const a = [...arr];
  const n = a.length;
  let swaps = 0;
  const mk = (i: number, j: number, sortedTail: number): Cell[] =>
    a.map((v, idx) => {
      let state: CellState = "idle";
      if (idx >= n - sortedTail) state = "sorted";
      else if (idx === i || idx === j) state = "compare";
      return { value: v, state };
    });
  frames.push({
    cells: mk(-1, -1, 0),
    pointers: [],
    explain: `Bubble sort: repeatedly compare adjacent pairs; the largest value bubbles to the end each pass.`,
    op: `n=${n}`,
    pcLine: 0,
    codeSnippet: "for pass in 0..n-2:",
    inspect: { n, swaps, array: a.join(",") },
  });
  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;
    for (let j = 0; j < n - pass - 1; j++) {
      frames.push({
        cells: mk(j, j + 1, pass),
        pointers: [
          { name: "j", index: j, color: "#fb923c" },
          { name: "j+1", index: j + 1, color: "#38bdf8" },
        ],
        explain: `Compare ${a[j]} and ${a[j + 1]}. ${
          a[j] > a[j + 1] ? "Out of order — swap." : "In order — keep going."
        }`,
        op: `pass=${pass + 1} j=${j}`,
        pcLine: 2,
        codeSnippet: "if a[j] > a[j+1]:",
        inspect: { pass: pass + 1, j, "a[j]": a[j], "a[j+1]": a[j + 1], swaps },
      });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        swaps++;
        frames.push({
          cells: mk(j, j + 1, pass),
          pointers: [
            { name: "j", index: j, color: "#fb923c" },
            { name: "j+1", index: j + 1, color: "#38bdf8" },
          ],
          explain: `Swapped. Array is now [${a.join(", ")}].`,
          op: `swap ${a[j + 1]} ↔ ${a[j]}`,
          pcLine: 3,
          codeSnippet: "swap(a[j], a[j+1])",
          inspect: { pass: pass + 1, j, swaps, array: a.join(",") },
        });
      }
    }
    if (!swapped) break;
  }
  frames.push({
    cells: a.map((v) => ({ value: v, state: "sorted" })),
    pointers: [],
    explain: `Sorted in O(n²) comparisons. Every element is now in its final position.`,
    op: `done`,
    pcLine: 4,
    codeSnippet: "# largest element bubbled to end",
    inspect: { swaps, array: a.join(",") },
  });
  return frames;
}

/**
 * Recursion: factorial(4) traced Python-Tutor style.
 * 19 frames: main block builds → 4 recursive calls push → base case → 4 returns pop → print output.
 */
function recursionFactorial(): AlgoFrame[] {
  const frames: AlgoFrame[] = [];
  const push = (f: AlgoFrame) => frames.push(f);

  // Empty cells — this algo uses `scene` instead of the array row.
  const noCells: Cell[] = [];

  const mainVars = (num = 4) => ({ vars: [{ name: "num", value: num }] });

  // Helper to build the current call-stack of function frames.
  // depth 0 → factorial(4), depth 1 → factorial(3), etc.
  const stack = (
    activeDepth: number,
    filled: boolean[],
    returned: (string | number | undefined)[],
  ): CallFrame[] => {
    return [4, 3, 2, 1].slice(0, filled.length).map((x, d) => ({
      id: `f${x}`,
      title: `factorial(${x})`,
      vars: filled[d] ? [{ name: "x", value: x }] : [],
      state:
        returned[d] !== undefined
          ? "returned"
          : d === activeDepth
          ? "active"
          : "idle",
      returns: returned[d],
    }));
  };

  // Step 1 — num = 4 assigned in main
  push({
    cells: noCells,
    pointers: [],
    pcLine: 10,
    codeSnippet: "num = 4",
    op: "num ← 4",
    explain: "The variable num is assigned the value 4 in the main block.",
    scene: {
      mainBlock: mainVars(4),
      frames: [],
    },
  });

  // Step 2 — reach the print line; factorial(num) needs to be evaluated first
  push({
    cells: noCells,
    pointers: [],
    pcLine: 11,
    codeSnippet: 'print("The factorial of", num, "is", factorial(num))',
    op: "call factorial(num)",
    explain:
      "To evaluate print(), Python first needs factorial(num). The call factorial(4) is prepared.",
    scene: {
      mainBlock: mainVars(4),
      frames: [
        { id: "f4", title: "factorial(4)", vars: [], state: "idle" },
      ],
      entryArrow: true,
    },
  });

  // Step 3 — call factorial(4) — matches reference frame at Step 3
  push({
    cells: noCells,
    pointers: [],
    pcLine: 11,
    codeSnippet: 'print("The factorial of", num, "is", factorial(num))',
    op: "factorial(4)",
    explain: "The function factorial() is called with arguments: 4.",
    scene: {
      mainBlock: mainVars(4),
      frames: [
        { id: "f4", title: "factorial(4)", vars: [], state: "active" },
      ],
      entryArrow: true,
    },
  });

  // Step 4 — enter def; x = 4 bound
  push({
    cells: noCells,
    pointers: [],
    pcLine: 0,
    codeSnippet: "def factorial(x):",
    op: "x = 4",
    explain:
      "Control jumps into factorial(). The parameter x is bound to 4.",
    scene: {
      mainBlock: mainVars(4),
      frames: stack(0, [true], [undefined]),
      entryArrow: true,
    },
  });

  // Step 5 — if x == 1 (False for x=4)
  push({
    cells: noCells,
    pointers: [],
    pcLine: 4,
    codeSnippet: "if x == 1:",
    op: "4 == 1 → False",
    explain:
      "The if statement checks x == 1. Since x is 4, the condition is False, so we take the else branch.",
    scene: {
      mainBlock: mainVars(4),
      frames: stack(0, [true], [undefined]),
      entryArrow: true,
    },
  });

  // Step 6 — return x * factorial(x-1) → call factorial(3)
  push({
    cells: noCells,
    pointers: [],
    pcLine: 7,
    codeSnippet: "return (x * factorial(x-1))",
    op: "call factorial(3)",
    explain:
      "To return x * factorial(x-1), Python must first evaluate factorial(3).",
    scene: {
      mainBlock: mainVars(4),
      frames: [
        ...stack(0, [true], [undefined]),
        { id: "f3", title: "factorial(3)", vars: [], state: "active" },
      ],
      entryArrow: true,
    },
  });

  // Step 7 — matches reference: def entered for factorial(3), x bound
  push({
    cells: noCells,
    pointers: [],
    pcLine: 0,
    codeSnippet: "def factorial(x):",
    op: "x = 3",
    explain:
      "The control of the program jumps to the function factorial(). It is called with arguments: x: 3.",
    scene: {
      mainBlock: mainVars(4),
      frames: stack(1, [true, true], [undefined, undefined]),
      entryArrow: true,
    },
  });

  // Step 8 — if x == 1 (False for x=3)
  push({
    cells: noCells,
    pointers: [],
    pcLine: 4,
    codeSnippet: "if x == 1:",
    op: "3 == 1 → False",
    explain:
      "The if statement evaluates the condition: x == 1. Since x is 3, x == 1 evaluates to False.",
    scene: {
      mainBlock: mainVars(4),
      frames: stack(1, [true, true], [undefined, undefined]),
      entryArrow: true,
    },
  });

  // Step 9 — return factorial(2)
  push({
    cells: noCells,
    pointers: [],
    pcLine: 7,
    codeSnippet: "return (x * factorial(x-1))",
    op: "call factorial(2)",
    explain: "factorial(3) needs the value of factorial(2) before it can return.",
    scene: {
      mainBlock: mainVars(4),
      frames: [
        ...stack(1, [true, true], [undefined, undefined]),
        { id: "f2", title: "factorial(2)", vars: [], state: "active" },
      ],
      entryArrow: true,
    },
  });

  // Step 10 — def factorial for x=2
  push({
    cells: noCells,
    pointers: [],
    pcLine: 0,
    codeSnippet: "def factorial(x):",
    op: "x = 2",
    explain: "Control enters factorial() again with argument x: 2.",
    scene: {
      mainBlock: mainVars(4),
      frames: stack(2, [true, true, true], [undefined, undefined, undefined]),
      entryArrow: true,
    },
  });

  // Step 11 — if x == 1 (False for x=2) — matches reference frame 11 showing factorial(2) active
  push({
    cells: noCells,
    pointers: [],
    pcLine: 4,
    codeSnippet: "if x == 1:",
    op: "2 == 1 → False",
    explain:
      'The if statement evaluates the condition: x == 1. Since x is "2", x == 1 evaluates to False. In this case, the if block doesn\'t execute.',
    scene: {
      mainBlock: mainVars(4),
      frames: stack(2, [true, true, true], [undefined, undefined, undefined]),
      entryArrow: true,
    },
  });

  // Step 12 — return factorial(1)
  push({
    cells: noCells,
    pointers: [],
    pcLine: 7,
    codeSnippet: "return (x * factorial(x-1))",
    op: "call factorial(1)",
    explain: "factorial(2) recursively calls factorial(1).",
    scene: {
      mainBlock: mainVars(4),
      frames: [
        ...stack(2, [true, true, true], [undefined, undefined, undefined]),
        { id: "f1", title: "factorial(1)", vars: [], state: "active" },
      ],
      entryArrow: true,
    },
  });

  // Step 13 — def factorial for x=1
  push({
    cells: noCells,
    pointers: [],
    pcLine: 0,
    codeSnippet: "def factorial(x):",
    op: "x = 1",
    explain: "Control enters factorial() with argument x: 1 — the base case.",
    scene: {
      mainBlock: mainVars(4),
      frames: stack(3, [true, true, true, true], [undefined, undefined, undefined, undefined]),
      entryArrow: true,
    },
  });

  // Step 14 — base case hit, return 1
  push({
    cells: noCells,
    pointers: [],
    pcLine: 5,
    codeSnippet: "return 1",
    op: "return 1",
    explain:
      "x == 1 is True. The base case fires and factorial(1) returns 1 back to its caller.",
    scene: {
      mainBlock: mainVars(4),
      frames: stack(3, [true, true, true, true], [undefined, undefined, undefined, 1]),
      returnFromChild: { childIndex: 3, label: "Returns 1" },
      entryArrow: true,
    },
  });

  // Step 15 — factorial(2) receives 1 and returns 2 (2 * 1)
  push({
    cells: noCells,
    pointers: [],
    pcLine: 7,
    codeSnippet: "return (x * factorial(x-1))",
    op: "return 2 · 1 = 2",
    explain: "factorial(2) receives 1 from factorial(1) and returns 2 * 1 = 2.",
    scene: {
      mainBlock: mainVars(4),
      frames: stack(2, [true, true, true, true], [undefined, undefined, 2, 1]),
      returnFromChild: { childIndex: 2, label: "Returns 2" },
      entryArrow: true,
    },
  });

  // Step 16 — matches reference: "The function return 2." with returns pill between factorial(3) and factorial(2)
  push({
    cells: noCells,
    pointers: [],
    pcLine: 7,
    codeSnippet: "return (x * factorial(x-1))",
    op: "return 3 · 2 = 6",
    explain: "The function return 6. factorial(3) computes 3 * 2 and returns 6.",
    scene: {
      mainBlock: mainVars(4),
      frames: stack(1, [true, true, true, true], [undefined, 6, 2, 1]),
      returnFromChild: { childIndex: 1, label: "Returns 6" },
      entryArrow: true,
    },
  });

  // Step 17 — factorial(4) returns 24
  push({
    cells: noCells,
    pointers: [],
    pcLine: 7,
    codeSnippet: "return (x * factorial(x-1))",
    op: "return 4 · 6 = 24",
    explain: "factorial(4) computes 4 * 6 and returns 24 up to the main block.",
    scene: {
      mainBlock: mainVars(4),
      frames: stack(0, [true, true, true, true], [24, 6, 2, 1]),
      returnFromChild: { childIndex: 0, label: "Returns 24" },
      entryArrow: true,
    },
  });

  // Step 18 — back in main, print resolves
  push({
    cells: noCells,
    pointers: [],
    pcLine: 11,
    codeSnippet: 'print("The factorial of", num, "is", factorial(num))',
    op: "print resolves",
    explain: "factorial(num) has evaluated to 24. print() can now build its output.",
    scene: {
      mainBlock: mainVars(4),
      frames: [
        { id: "fx", title: "factorial(x)", vars: [], state: "idle" },
      ],
    },
  });

  // Step 19 — final output
  push({
    cells: noCells,
    pointers: [],
    pcLine: 11,
    codeSnippet: 'print("The factorial of", num, "is", factorial(num))',
    op: "output: The factorial of 4 is 24",
    explain:
      "The function factorial() returns with value 24. The print() function displays the content inside the parentheses, which can be viewed in the output panel.",
    scene: {
      mainBlock: mainVars(4),
      frames: [
        { id: "fx", title: "factorial(x)", vars: [], state: "idle" },
      ],
      output: "The factorial of 4 is 24",
    },
  });

  return frames;
}

export function buildFrames(id: string): AlgoFrame[] {
  switch (id) {
    case "two-pointers":
      return twoPointers();
    case "sliding-window":
      return slidingWindow();
    case "binary-search":
      return binarySearch();
    case "bubble-sort":
      return bubbleSort();
    case "recursion-factorial":
      return recursionFactorial();
    default:
      return [];
  }
}
