/**
 * Coding-problem topic tag validator.
 *
 * Flags any remaining generic / placeholder / suspicious topic tags on the
 * `coding_problems` table after the Java-DSA → algorithmic-topic remap.
 *
 * Usage (from project root):
 *   bun run scripts/validate-coding-topics.ts
 *
 * Requires PG* env vars to be set (already provided in the Lovable sandbox).
 * Exits non-zero if any problem fails validation so it can gate CI.
 */
import { spawnSync } from "node:child_process";

type Row = { slug: string; title: string; topics: string[] };

// Tags that are NOT algorithmic topics and should never appear post-migration.
const PLACEHOLDER_TAGS = new Set([
  "java-dsa",
  "java dsa",
  "Java DSA",
  "dsa",
  "DSA",
  "misc",
  "Misc",
  "other",
  "Other",
  "uncategorized",
  "Uncategorized",
  "todo",
  "TODO",
]);

// Tags that are too generic to describe a problem on their own.
const GENERIC_TAGS = new Set([
  "Basics",
  "Advanced",
  "Loops",
  "Patterns",
  "Foundation",
  "Fundamentals",
]);

// Abbreviations / casing inconsistencies that should be normalized.
const NORMALIZE_MAP: Record<string, string> = {
  array: "Array",
  string: "String",
  dp: "Dynamic Programming",
  DP: "Dynamic Programming",
  bit: "Binary Indexed Tree",
  BIT: "Binary Indexed Tree",
  bst: "Binary Search Tree",
};

function runQuery(sql: string): Row[] {
  const res = spawnSync(
    "psql",
    ["-At", "-F", "\u0001", "-c", sql.replace(/\s+/g, " ")],
    { encoding: "utf8" },
  );
  if (res.status !== 0) {
    console.error(res.stderr);
    process.exit(2);
  }
  return res.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [slug, title, topicsJson] = line.split("\u0001");
      return { slug, title, topics: JSON.parse(topicsJson) as string[] };
    });
}

const rows = runQuery(`
  SELECT slug, title, to_json(topics)::text
  FROM public.coding_problems
  ORDER BY slug
`);

type Issue = { slug: string; title: string; kind: string; detail: string };
const issues: Issue[] = [];

for (const row of rows) {
  if (!row.topics || row.topics.length === 0) {
    issues.push({
      slug: row.slug,
      title: row.title,
      kind: "empty",
      detail: "no topics assigned",
    });
    continue;
  }

  const seen = new Set<string>();
  for (const t of row.topics) {
    if (typeof t !== "string" || t.trim() === "") {
      issues.push({ slug: row.slug, title: row.title, kind: "blank", detail: `"${t}"` });
      continue;
    }
    if (PLACEHOLDER_TAGS.has(t)) {
      issues.push({ slug: row.slug, title: row.title, kind: "placeholder", detail: t });
    }
    if (GENERIC_TAGS.has(t) && row.topics.length === 1) {
      issues.push({
        slug: row.slug,
        title: row.title,
        kind: "too-generic",
        detail: `only tag is "${t}"`,
      });
    }
    if (NORMALIZE_MAP[t]) {
      issues.push({
        slug: row.slug,
        title: row.title,
        kind: "needs-normalize",
        detail: `"${t}" → "${NORMALIZE_MAP[t]}"`,
      });
    }
    if (seen.has(t)) {
      issues.push({
        slug: row.slug,
        title: row.title,
        kind: "duplicate",
        detail: `"${t}" appears more than once`,
      });
    }
    seen.add(t);
  }
}

const totals = new Map<string, number>();
for (const t of rows.flatMap((r) => r.topics ?? [])) {
  totals.set(t, (totals.get(t) ?? 0) + 1);
}

console.log(`Scanned ${rows.length} coding problems.`);
console.log(`Distinct topic tags: ${totals.size}.`);

if (issues.length === 0) {
  console.log("✓ No placeholder, generic, or malformed topic tags found.");
  process.exit(0);
}

console.log(`\n⚠ Found ${issues.length} issue(s):\n`);
const byKind = new Map<string, Issue[]>();
for (const i of issues) {
  if (!byKind.has(i.kind)) byKind.set(i.kind, []);
  byKind.get(i.kind)!.push(i);
}
for (const [kind, list] of byKind) {
  console.log(`[${kind}] ${list.length}`);
  for (const i of list.slice(0, 25)) {
    console.log(`  ${i.slug.padEnd(45)}  ${i.detail}`);
  }
  if (list.length > 25) console.log(`  …and ${list.length - 25} more`);
  console.log("");
}

process.exit(1);
