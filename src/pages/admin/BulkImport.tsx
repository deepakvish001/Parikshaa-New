import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileJson, CheckCircle2, AlertTriangle, Database } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CODING_PROBLEMS } from "@/data/codingProblemsData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const ProblemSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topics: z.array(z.string()).default([]),
  description: z.string().default(""),
  examples: z
    .array(z.object({ input: z.string(), output: z.string(), explanation: z.string().optional() }))
    .default([]),
  constraints: z.array(z.string()).default([]),
  hints: z.array(z.string()).default([]),
  cpu_time_limit_sec: z.number().optional(),
  memory_limit_kb: z.number().optional(),
  is_published: z.boolean().default(false),
  starter_code: z.record(z.string(), z.string()).default({}),
  reference_solution: z.record(z.string(), z.string()).default({}),
  sample_tests: z.array(z.object({ input: z.string(), expected: z.string() })).default([]),
  hidden_tests: z.array(z.object({ input: z.string(), expected: z.string() })).default([]),
  sql_spec: z
    .object({
      schema_sql: z.string(),
      seed_sql: z.string(),
      reference_query: z.string(),
      order_matters: z.boolean(),
      starter: z.string(),
    })
    .nullable()
    .optional(),
  companies: z
    .array(
      z.object({
        name: z.string().min(1),
        domain: z.string().min(1),
        frequency: z.number().min(0).max(100).optional(),
      }),
    )
    .optional(),
});

interface RowIssue {
  path: string;
  message: string;
}
type Row = {
  ok: boolean;
  data?: any;
  error?: string;
  issues?: RowIssue[];
  raw: any;
  index: number;
};

export const TEMPLATE = JSON.stringify(
  [
    {
      slug: "ransom-note",
      title: "Ransom Note",
      difficulty: "easy",
      topics: ["Hash Table", "String", "Counting"],
      description: [
        "Given two strings `ransomNote` and `magazine`, return `true` if `ransomNote` can be",
        "constructed by using the letters from `magazine`, and `false` otherwise.",
        "",
        "Each letter in `magazine` can only be used once in `ransomNote`.",
        "",
        "**Input format:**",
        "- Line 1: string `ransomNote`",
        "- Line 2: string `magazine`",
        "",
        "**Output format:**",
        "- Print `true` or `false`.",
      ].join("\n"),
      examples: [
        {
          input: 'ransomNote = "a", magazine = "b"',
          output: "false",
          explanation: "`magazine` does not contain the letter `a`.",
        },
        {
          input: 'ransomNote = "aa", magazine = "ab"',
          output: "false",
          explanation: "`magazine` has only one `a`, but the note needs two.",
        },
        {
          input: 'ransomNote = "aa", magazine = "aab"',
          output: "true",
          explanation: "`magazine` contains two `a`s, enough to build the note.",
        },
      ],
      constraints: [
        "1 <= ransomNote.length, magazine.length <= 10^5",
        "Both strings consist of lowercase English letters only.",
      ],
      hints: [
        "Count the frequency of each character in `magazine`.",
        "Iterate `ransomNote` and decrement counts; if any goes below zero, return false.",
        "A fixed-size array of length 26 is enough since inputs are lowercase letters.",
      ],
      cpu_time_limit_sec: 2,
      memory_limit_kb: 256000,
      is_published: false,
      starter_code: {
        c: "#include <stdio.h>\n#include <string.h>\n\nint canConstruct(const char* note, const char* mag) {\n    // TODO: implement\n    return 0;\n}\n\nint main() {\n    char note[100001], mag[100001];\n    scanf(\"%s %s\", note, mag);\n    printf(\"%s\\n\", canConstruct(note, mag) ? \"true\" : \"false\");\n    return 0;\n}\n",
        cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nbool canConstruct(string note, string mag) {\n    // TODO: implement\n    return false;\n}\n\nint main() {\n    string note, mag;\n    cin >> note >> mag;\n    cout << (canConstruct(note, mag) ? \"true\" : \"false\") << endl;\n}\n",
        java: "import java.util.*;\n\npublic class Main {\n    static boolean canConstruct(String note, String mag) {\n        // TODO: implement\n        return false;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(canConstruct(sc.next(), sc.next()));\n    }\n}\n",
        python3: "def can_construct(note: str, mag: str) -> bool:\n    # TODO: implement\n    return False\n\nif __name__ == \"__main__\":\n    note = input().strip()\n    mag = input().strip()\n    print(\"true\" if can_construct(note, mag) else \"false\")\n",
        javascript: "function canConstruct(note, mag) {\n  // TODO: implement\n  return false;\n}\n\nconst lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconsole.log(canConstruct(lines[0].trim(), lines[1].trim()) ? 'true' : 'false');\n",
        typescript: "function canConstruct(note: string, mag: string): boolean {\n  // TODO: implement\n  return false;\n}\n\nconst lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconsole.log(canConstruct(lines[0].trim(), lines[1].trim()) ? 'true' : 'false');\n",
        go: "package main\n\nimport (\n\t\"bufio\"\n\t\"fmt\"\n\t\"os\"\n)\n\nfunc canConstruct(note, mag string) bool {\n\t// TODO: implement\n\treturn false\n}\n\nfunc main() {\n\tr := bufio.NewReader(os.Stdin)\n\tvar note, mag string\n\tfmt.Fscan(r, &note)\n\tfmt.Fscan(r, &mag)\n\tif canConstruct(note, mag) {\n\t\tfmt.Println(\"true\")\n\t} else {\n\t\tfmt.Println(\"false\")\n\t}\n}\n",
      },
      reference_solution: {
        c: "#include <stdio.h>\n#include <string.h>\n\nint canConstruct(const char* note, const char* mag) {\n    int cnt[26] = {0};\n    for (int i = 0; mag[i]; ++i) cnt[mag[i]-'a']++;\n    for (int i = 0; note[i]; ++i) if (--cnt[note[i]-'a'] < 0) return 0;\n    return 1;\n}\n\nint main() {\n    char note[100001], mag[100001];\n    scanf(\"%s %s\", note, mag);\n    printf(\"%s\\n\", canConstruct(note, mag) ? \"true\" : \"false\");\n    return 0;\n}\n",
        cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nbool canConstruct(string note, string mag) {\n    array<int,26> cnt{};\n    for (char c : mag) cnt[c-'a']++;\n    for (char c : note) if (--cnt[c-'a'] < 0) return false;\n    return true;\n}\n\nint main() {\n    string note, mag;\n    cin >> note >> mag;\n    cout << (canConstruct(note, mag) ? \"true\" : \"false\") << endl;\n}\n",
        java: "import java.util.*;\n\npublic class Main {\n    static boolean canConstruct(String note, String mag) {\n        int[] cnt = new int[26];\n        for (char c : mag.toCharArray()) cnt[c-'a']++;\n        for (char c : note.toCharArray()) if (--cnt[c-'a'] < 0) return false;\n        return true;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(canConstruct(sc.next(), sc.next()));\n    }\n}\n",
        python3: "from collections import Counter\n\ndef can_construct(note: str, mag: str) -> bool:\n    c = Counter(mag)\n    for ch in note:\n        c[ch] -= 1\n        if c[ch] < 0:\n            return False\n    return True\n\nif __name__ == \"__main__\":\n    note = input().strip()\n    mag = input().strip()\n    print(\"true\" if can_construct(note, mag) else \"false\")\n",
        javascript: "function canConstruct(note, mag) {\n  const cnt = new Array(26).fill(0);\n  for (const c of mag) cnt[c.charCodeAt(0)-97]++;\n  for (const c of note) if (--cnt[c.charCodeAt(0)-97] < 0) return false;\n  return true;\n}\n\nconst lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconsole.log(canConstruct(lines[0].trim(), lines[1].trim()) ? 'true' : 'false');\n",
        typescript: "function canConstruct(note: string, mag: string): boolean {\n  const cnt = new Array(26).fill(0);\n  for (const c of mag) cnt[c.charCodeAt(0)-97]++;\n  for (const c of note) if (--cnt[c.charCodeAt(0)-97] < 0) return false;\n  return true;\n}\n\nconst lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconsole.log(canConstruct(lines[0].trim(), lines[1].trim()) ? 'true' : 'false');\n",
        go: "package main\n\nimport (\n\t\"bufio\"\n\t\"fmt\"\n\t\"os\"\n)\n\nfunc canConstruct(note, mag string) bool {\n\tvar cnt [26]int\n\tfor _, c := range mag { cnt[c-'a']++ }\n\tfor _, c := range note {\n\t\tcnt[c-'a']--\n\t\tif cnt[c-'a'] < 0 { return false }\n\t}\n\treturn true\n}\n\nfunc main() {\n\tr := bufio.NewReader(os.Stdin)\n\tvar note, mag string\n\tfmt.Fscan(r, &note); fmt.Fscan(r, &mag)\n\tif canConstruct(note, mag) { fmt.Println(\"true\") } else { fmt.Println(\"false\") }\n}\n",
      },
      sample_tests: [
        { input: "a\nb", expected: "false" },
        { input: "aa\nab", expected: "false" },
        { input: "aa\naab", expected: "true" },
      ],
      hidden_tests: [
        { input: "abc\ncba", expected: "true" },
        { input: "aabbcc\nabcabcd", expected: "true" },
        { input: "xyz\nxy", expected: "false" },
      ],
      companies: [
        { name: "Google", domain: "google.com", frequency: 12.5 },
        { name: "Amazon", domain: "amazon.com", frequency: 8.3 },
        { name: "Microsoft", domain: "microsoft.com", frequency: 5.1 },
      ],
    },
  ],
  null,
  2,
);

// Full SQL problem template — mirrors the coding template but uses `sql_spec`
// instead of starter/reference/tests. Both SQL and MySQL selections route to
// the same SQLite engine, so a single spec covers both.
export const SQL_TEMPLATE = JSON.stringify(
  [
    {
      slug: "top-3-earners",
      title: "Top 3 Earners",
      difficulty: "medium",
      topics: ["SQL", "Aggregation", "Sorting"],
      description: [
        "You are given an `employees` table. Return the **names** of the top 3",
        "employees by salary, highest first. If fewer than 3 rows exist, return",
        "all of them.",
        "",
        "**Schema:**",
        "```",
        "employees(id INT, name TEXT, salary INT)",
        "```",
      ].join("\n"),
      examples: [
        {
          input: "employees = [(1,'A',100),(2,'B',300),(3,'C',200),(4,'D',250)]",
          output: "B\nD\nC",
          explanation: "Sorted by salary desc: B(300), D(250), C(200).",
        },
      ],
      constraints: [
        "1 <= employees.length <= 10^5",
        "All salaries are non-negative integers.",
      ],
      hints: [
        "Use ORDER BY salary DESC.",
        "Cap the row count with LIMIT 3.",
      ],
      cpu_time_limit_sec: 2,
      memory_limit_kb: 131072,
      is_published: false,
      // SQL problems execute via sql_spec only — leave these empty.
      starter_code: {},
      reference_solution: {},
      sample_tests: [],
      hidden_tests: [],
      sql_spec: {
        schema_sql: "CREATE TABLE employees (id INT, name TEXT, salary INT);",
        seed_sql:
          "INSERT INTO employees VALUES (1,'A',100),(2,'B',300),(3,'C',200),(4,'D',250);",
        reference_query:
          "SELECT name FROM employees ORDER BY salary DESC LIMIT 3;",
        order_matters: true,
        starter: "-- Write your SQL query below\nSELECT name FROM employees\n",
      },
      companies: [
        { name: "Meta", domain: "meta.com", frequency: 9.1 },
        { name: "Uber", domain: "uber.com", frequency: 4.7 },
      ],
    },
  ],
  null,
  2,
);

const BulkImport = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [existingSlugs, setExistingSlugs] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nav = useNavigate();

  const parseRow = (raw: any, index: number): Row => {
    const r = ProblemSchema.safeParse(raw);
    if (r.success) return { ok: true, data: r.data, raw, index };
    const issues: RowIssue[] = r.error.issues.map((i) => ({
      path: i.path.join(".") || "(root)",
      message: i.message,
    }));
    return {
      ok: false,
      error: issues.map((i) => `${i.path}: ${i.message}`).join("; "),
      issues,
      raw,
      index,
    };
  };

  // Detect which slugs already exist in DB so we can label them "Update" vs
  // "New" and prompt the admin before overwriting.
  useEffect(() => {
    const slugs = Array.from(
      new Set(rows.filter((r) => r.ok && r.data?.slug).map((r) => r.data.slug as string)),
    );
    if (slugs.length === 0) {
      setExistingSlugs(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      const CHUNK = 300;
      const found = new Set<string>();
      for (let i = 0; i < slugs.length; i += CHUNK) {
        const chunk = slugs.slice(i, i + CHUNK);
        const { data, error } = await supabase
          .from("coding_problems")
          .select("slug")
          .in("slug", chunk);
        if (error) break;
        (data ?? []).forEach((r: any) => found.add(r.slug));
      }
      if (!cancelled) setExistingSlugs(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const all: any[] = [];
    const failedFiles: string[] = [];
    for (const file of files) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) all.push(...parsed);
        else all.push(parsed);
      } catch (e: any) {
        failedFiles.push(`${file.name}: ${e.message}`);
      }
    }
    if (failedFiles.length > 0) {
      toast({
        title: `Skipped ${failedFiles.length} invalid file${failedFiles.length === 1 ? "" : "s"}`,
        description: failedFiles.join(" • "),
        variant: "destructive",
      });
    }
    if (all.length > 0) {
      setRows(all.map((raw, i) => parseRow(raw, i)));
      toast({
        title: `Loaded ${all.length} problem${all.length === 1 ? "" : "s"}`,
        description: `From ${files.length - failedFiles.length} file${files.length - failedFiles.length === 1 ? "" : "s"}.`,
      });
    }
  };


  const runImport = async (mode: "all" | "skip-existing") => {
    const valid = rows.filter((r) => r.ok);
    const targets =
      mode === "skip-existing"
        ? valid.filter((r) => !existingSlugs.has(r.data.slug))
        : valid;
    if (targets.length === 0) {
      toast({ title: "Nothing to import", description: "All valid rows already exist." });
      return;
    }
    setBusy(true);
    let created = 0;
    let updated = 0;
    let failed = 0;
    for (const r of targets) {
      const wasExisting = existingSlugs.has(r.data.slug);
      const { error } = await supabase.rpc("admin_save_problem", { payload: r.data as any });
      if (error) failed++;
      else if (wasExisting) updated++;
      else created++;
    }
    setBusy(false);
    toast({
      title: "Import complete",
      description: `${created} new · ${updated} updated · ${failed} failed`,
    });
    if (created + updated > 0) nav("/admin/problems");
  };

  const handleImportClick = () => {
    const valid = rows.filter((r) => r.ok);
    if (valid.length === 0) return;
    const overlap = valid.filter((r) => existingSlugs.has(r.data.slug)).length;
    if (overlap > 0) {
      setConfirmOpen(true);
      return;
    }
    void runImport("all");
  };



  const downloadBlob = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const downloadTemplate = () =>
    downloadBlob(TEMPLATE, "coding-problems-template.json");

  const downloadSqlTemplate = () =>
    downloadBlob(SQL_TEMPLATE, "sql-problems-template.json");

  const seedFromStatic = () => {
    const mapped = CODING_PROBLEMS.map((p) => ({
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty.toLowerCase() as "easy" | "medium" | "hard",
      topics: p.topics ?? [],
      description: p.description ?? "",
      examples: (p.examples ?? []).map((e) => ({
        input: e.input,
        output: e.output,
        explanation: e.explanation,
      })),
      constraints: p.constraints ?? [],
      hints: p.hints ?? [],
      cpu_time_limit_sec: p.cpuTimeLimitSec ?? 2,
      memory_limit_kb: p.memoryLimitKb ?? 256000,
      is_published: true,
      starter_code: (p.starterCode ?? {}) as Record<string, string>,
      reference_solution: (p.referenceSolution ?? {}) as Record<string, string>,
      sample_tests: (p.sampleTests ?? []).map((t) => ({ input: t.input, expected: t.expected })),
      hidden_tests: (p.hiddenTests ?? []).map((t) => ({ input: t.input, expected: t.expected })),
      sql_spec: p.sql
        ? {
            schema_sql: p.sql.schema ?? "",
            seed_sql: p.sql.seed ?? "",
            reference_query: p.sql.referenceQuery ?? "",
            order_matters: !!p.sql.orderMatters,
            starter: p.sql.starter ?? "",
          }
        : null,
    }));
    const next: Row[] = mapped.map((raw, i) => parseRow(raw, i));
    setRows(next);
    toast({
      title: "Loaded static seed",
      description: `${next.filter((r) => r.ok).length}/${next.length} problems ready to import.`,
    });
  };

  const validCount = rows.filter((r) => r.ok).length;
  const invalidCount = rows.length - validCount;
  const overwriteCount = rows.filter(
    (r) => r.ok && existingSlugs.has(r.data.slug),
  ).length;
  const newCount = validCount - overwriteCount;

  const downloadJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const downloadReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
      },
      valid: rows
        .filter((r) => r.ok)
        .map((r) => ({ row: r.index + 1, slug: r.raw?.slug, title: r.raw?.title })),
      errors: rows
        .filter((r) => !r.ok)
        .map((r) => ({
          row: r.index + 1,
          slug: r.raw?.slug ?? null,
          title: r.raw?.title ?? null,
          issues: r.issues ?? [],
        })),
    };
    downloadJson(report, "bulk-import-report.json");
  };

  const downloadCorrected = () => {
    // A re-uploadable JSON: keeps every row, fills missing required fields with
    // safe defaults so the admin can finish editing externally instead of
    // starting over. Valid rows pass through unchanged.
    let fixedCount = 0;
    let stillBroken = 0;
    const corrected = rows.map((r) => {
      if (r.ok) return r.data;
      const raw = r.raw && typeof r.raw === "object" ? r.raw : {};
      const candidate = {
        slug: raw.slug || `__fix_me_row_${r.index + 1}`,
        title: raw.title || "(missing — please fill in)",
        difficulty: ["easy", "medium", "hard"].includes(raw.difficulty)
          ? raw.difficulty
          : "medium",
        topics: Array.isArray(raw.topics) ? raw.topics : [],
        description: typeof raw.description === "string" ? raw.description : "",
        examples: Array.isArray(raw.examples) ? raw.examples : [],
        constraints: Array.isArray(raw.constraints) ? raw.constraints : [],
        hints: Array.isArray(raw.hints) ? raw.hints : [],
        cpu_time_limit_sec:
          typeof raw.cpu_time_limit_sec === "number" ? raw.cpu_time_limit_sec : 2,
        memory_limit_kb:
          typeof raw.memory_limit_kb === "number" ? raw.memory_limit_kb : 256000,
        is_published: false,
        starter_code:
          raw.starter_code && typeof raw.starter_code === "object"
            ? raw.starter_code
            : {},
        reference_solution:
          raw.reference_solution && typeof raw.reference_solution === "object"
            ? raw.reference_solution
            : {},
        sample_tests: Array.isArray(raw.sample_tests) ? raw.sample_tests : [],
        hidden_tests: Array.isArray(raw.hidden_tests) ? raw.hidden_tests : [],
        sql_spec: raw.sql_spec ?? null,
      };
      // Re-validate the corrected row against the schema.
      const verify = ProblemSchema.safeParse(candidate);
      if (verify.success) {
        fixedCount++;
        return verify.data;
      }
      stillBroken++;
      return {
        ...candidate,
        __issues: verify.error.issues.map((i) => ({
          path: i.path.join(".") || "(root)",
          message: i.message,
        })),
      };
    });
    downloadJson(corrected, "bulk-import-corrected.json");
    toast({
      title: "Corrected JSON downloaded",
      description:
        stillBroken === 0
          ? `${fixedCount} row${fixedCount === 1 ? "" : "s"} auto-fixed and now match the schema.`
          : `${fixedCount} fixed · ${stillBroken} still need manual edits (see __issues).`,
    });
  };

  const downloadErrorsCsv = () => {
    const escape = (val: unknown) => {
      const s = val == null ? "" : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["row", "slug", "title", "issue_path", "issue_message"];
    const lines: string[] = [header.join(",")];
    rows
      .filter((r) => !r.ok)
      .forEach((r) => {
        const issues = r.issues && r.issues.length > 0
          ? r.issues
          : [{ path: "(root)", message: r.error ?? "Invalid row" }];
        issues.forEach((iss) => {
          lines.push(
            [
              r.index + 1,
              escape(r.raw?.slug ?? ""),
              escape(r.raw?.title ?? ""),
              escape(iss.path),
              escape(iss.message),
            ].join(","),
          );
        });
      });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bulk-import-errors.csv";
    a.click();
  };

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Bulk Import</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={seedFromStatic}>
            <Database className="mr-2 h-4 w-4" /> Load static seed ({CODING_PROBLEMS.length})
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <FileJson className="mr-2 h-4 w-4" /> Coding template
          </Button>
          <Button variant="outline" onClick={downloadSqlTemplate}>
            <Database className="mr-2 h-4 w-4" /> SQL template
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted py-10 text-center transition-colors hover:border-primary">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">Drop or click to upload JSON files</span>
          <span className="text-xs text-muted-foreground">
            Select one or many .json files — each may be a single problem or an array. All are merged.
          </span>
          <input
            type="file"
            accept="application/json,.json"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) handleFiles(files);
              e.target.value = "";
            }}
          />
        </label>
      </Card>


      {rows.length > 0 && (
        <Card className="mt-4 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500">
                {validCount} valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="secondary" className="bg-rose-500/15 text-rose-500">
                  {invalidCount} invalid
                </Badge>
              )}
              {overwriteCount > 0 && (
                <Badge variant="secondary" className="bg-amber-500/15 text-amber-500">
                  {overwriteCount} will update
                </Badge>
              )}
              {newCount > 0 && (
                <Badge variant="secondary" className="bg-sky-500/15 text-sky-500">
                  {newCount} new
                </Badge>
              )}
              <Badge variant="outline">{rows.length} total</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {invalidCount > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={downloadReport}>
                    <FileJson className="mr-2 h-4 w-4" /> Report
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadErrorsCsv}>
                    <FileJson className="mr-2 h-4 w-4" /> Errors CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadCorrected}>
                    <FileJson className="mr-2 h-4 w-4" /> Corrected JSON
                  </Button>
                </>
              )}
              <Button onClick={handleImportClick} disabled={busy || validCount === 0}>
                {busy ? "Importing…" : `Import ${validCount} problems`}
              </Button>
            </div>
          </div>


          {invalidCount > 0 && (
            <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-xs">
              <p className="font-medium text-rose-500">
                {invalidCount} row{invalidCount === 1 ? "" : "s"} failed validation.
              </p>
              <p className="mt-1 text-muted-foreground">
                Click <strong>Corrected JSON</strong> to download a re-uploadable file
                with safe defaults filled in for missing fields, or <strong>Report</strong>{" "}
                for a structured error log you can share.
              </p>
            </div>
          )}

          <div className="max-h-[480px] space-y-1 overflow-y-auto">
            {rows.map((r) => (
              <div
                key={r.index}
                className={`flex items-start gap-2 rounded-md border p-2 text-sm ${
                  r.ok ? "border-emerald-500/30" : "border-rose-500/30 bg-rose-500/5"
                }`}
              >
                {r.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="text-muted-foreground">Row {r.index + 1}</span>
                    <span>— {r.raw?.slug ?? "(no slug)"} — {r.raw?.title ?? "?"}</span>
                    {r.ok && existingSlugs.has(r.data.slug) && (
                      <Badge variant="secondary" className="bg-amber-500/15 text-amber-500">
                        Update
                      </Badge>
                    )}
                    {r.ok && !existingSlugs.has(r.data.slug) && (
                      <Badge variant="secondary" className="bg-sky-500/15 text-sky-500">
                        New
                      </Badge>
                    )}
                  </p>
                  {r.issues && r.issues.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-xs text-rose-500">
                      {r.issues.map((iss, idx) => (
                        <li key={idx}>
                          <code className="rounded bg-rose-500/10 px-1 py-0.5 font-mono">
                            {iss.path}
                          </code>{" "}
                          {iss.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            ))}
          </div>
        </Card>
      )}
    </AdminShell>
  );
};

export default BulkImport;
