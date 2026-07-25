import { describe, it, expect } from "vitest";
import {
  ProblemSchema,
  TEMPLATE,
  SQL_TEMPLATE,
} from "@/pages/admin/BulkImport";

describe("BulkImport schema", () => {
  it("Coding template parses and includes companies + no sql_spec", () => {
    const rows = JSON.parse(TEMPLATE);
    expect(Array.isArray(rows)).toBe(true);
    for (const r of rows) {
      const res = ProblemSchema.safeParse(r);
      expect(res.success, JSON.stringify(res)).toBe(true);
    }
    const first = rows[0];
    expect(Array.isArray(first.companies)).toBe(true);
    expect(first.companies.length).toBeGreaterThan(0);
    for (const c of first.companies) {
      expect(typeof c.name).toBe("string");
      expect(typeof c.domain).toBe("string");
      expect(typeof c.frequency).toBe("number");
    }
    // Coding template must ship at least one starter + reference language.
    expect(Object.keys(first.starter_code).length).toBeGreaterThan(0);
    expect(Object.keys(first.reference_solution).length).toBeGreaterThan(0);
  });

  it("SQL template parses, ships sql_spec + companies, empty starter/tests", () => {
    const rows = JSON.parse(SQL_TEMPLATE);
    expect(Array.isArray(rows)).toBe(true);
    for (const r of rows) {
      const res = ProblemSchema.safeParse(r);
      expect(res.success, JSON.stringify(res)).toBe(true);
    }
    const first = rows[0];
    expect(first.sql_spec).toBeTruthy();
    expect(typeof first.sql_spec.schema_sql).toBe("string");
    expect(typeof first.sql_spec.seed_sql).toBe("string");
    expect(typeof first.sql_spec.reference_query).toBe("string");
    expect(typeof first.sql_spec.order_matters).toBe("boolean");
    expect(Object.keys(first.starter_code).length).toBe(0);
    expect(first.sample_tests.length).toBe(0);
    expect(first.hidden_tests.length).toBe(0);
    // Companies still work for SQL problems (MySQL routes through same engine).
    expect(Array.isArray(first.companies)).toBe(true);
    expect(first.companies.length).toBeGreaterThan(0);
  });
});

describe("companies validation", () => {
  const base = {
    slug: "x",
    title: "X",
    difficulty: "easy" as const,
  };

  it("accepts a valid companies array", () => {
    const res = ProblemSchema.safeParse({
      ...base,
      companies: [{ name: "Google", domain: "google.com", frequency: 10 }],
    });
    expect(res.success).toBe(true);
  });

  it("accepts companies without frequency (optional)", () => {
    const res = ProblemSchema.safeParse({
      ...base,
      companies: [{ name: "Meta", domain: "meta.com" }],
    });
    expect(res.success).toBe(true);
  });

  it("rejects a company missing name", () => {
    const res = ProblemSchema.safeParse({
      ...base,
      companies: [{ domain: "google.com", frequency: 10 }],
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const paths = res.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("companies.0.name"))).toBe(true);
    }
  });

  it("rejects a company missing domain", () => {
    const res = ProblemSchema.safeParse({
      ...base,
      companies: [{ name: "Google", frequency: 10 }],
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const paths = res.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("companies.0.domain"))).toBe(true);
    }
  });

  it("rejects empty name/domain strings", () => {
    const res = ProblemSchema.safeParse({
      ...base,
      companies: [{ name: "", domain: "", frequency: 5 }],
    });
    expect(res.success).toBe(false);
  });

  it("rejects a negative frequency", () => {
    const res = ProblemSchema.safeParse({
      ...base,
      companies: [{ name: "Google", domain: "google.com", frequency: -1 }],
    });
    expect(res.success).toBe(false);
  });

  it("rejects a non-array companies field", () => {
    const res = ProblemSchema.safeParse({
      ...base,
      companies: "Google",
    });
    expect(res.success).toBe(false);
  });
});

describe("sql_spec validation", () => {
  const base = {
    slug: "sql-1",
    title: "SQL 1",
    difficulty: "medium" as const,
  };

  it("accepts a full sql_spec", () => {
    const res = ProblemSchema.safeParse({
      ...base,
      sql_spec: {
        schema_sql: "CREATE TABLE t(id INT);",
        seed_sql: "INSERT INTO t VALUES (1);",
        reference_query: "SELECT id FROM t;",
        order_matters: false,
        starter: "",
      },
    });
    expect(res.success).toBe(true);
  });

  it("accepts sql_spec: null (coding problem)", () => {
    const res = ProblemSchema.safeParse({ ...base, sql_spec: null });
    expect(res.success).toBe(true);
  });

  it("rejects sql_spec missing required keys", () => {
    const res = ProblemSchema.safeParse({
      ...base,
      sql_spec: { schema_sql: "x" },
    });
    expect(res.success).toBe(false);
  });

  it("rejects sql_spec with wrong types", () => {
    const res = ProblemSchema.safeParse({
      ...base,
      sql_spec: {
        schema_sql: "x",
        seed_sql: "x",
        reference_query: "x",
        order_matters: "yes",
        starter: "",
      },
    });
    expect(res.success).toBe(false);
  });
});
