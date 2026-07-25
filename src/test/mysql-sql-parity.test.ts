import { describe, it, expect } from "vitest";
import { LANGUAGES, isSQLLang, getLanguageById } from "@/data/codingProblemsData";
import { getExecLimitsForLang } from "@/lib/coding/executionLimits";

describe("MySQL / SQL parity for DB problems", () => {
  it("exposes both sql and mysql in the language dropdown", () => {
    const ids = LANGUAGES.map((l) => l.id);
    expect(ids).toContain("sql");
    expect(ids).toContain("mysql");
  });

  it("treats mysql as a SQL language", () => {
    expect(isSQLLang("sql")).toBe(true);
    expect(isSQLLang("mysql")).toBe(true);
    expect(isSQLLang("python")).toBe(false);
  });

  it("routes both sql and mysql to the same monaco/judge0 config", () => {
    const sql = getLanguageById("sql");
    const mysql = getLanguageById("mysql");
    expect(mysql.monaco).toBe(sql.monaco);
    expect(mysql.judge0Id).toBe(sql.judge0Id);
  });

  it("applies identical execution limits (SQLite engine) to sql and mysql", () => {
    const sqlLimits = getExecLimitsForLang("sql");
    const mysqlLimits = getExecLimitsForLang("mysql");
    expect(mysqlLimits.language).toBe("SQLite");
    expect(mysqlLimits).toEqual(sqlLimits);
  });
});
