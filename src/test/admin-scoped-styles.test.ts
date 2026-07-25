import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guardrail: the admin cockpit inherits Parikshaa's amber home theme.
 * The `.admin-surface` scoped block must NOT redefine brand tokens
 * (--primary, --background, --card, --sidebar-*, --accent, --ring) —
 * otherwise the admin panel drifts away from the landing page look.
 */
describe("admin scoped styles", () => {
  const css = readFileSync(resolve(__dirname, "../index.css"), "utf8");

  it("does not override brand tokens inside .admin-surface", () => {
    // Extract every rule block that targets .admin-surface / [data-admin-scope]
    const scopedRules = css.match(
      /(?:\.admin-surface|\[data-admin-scope="true"\])[^{}]*\{[^{}]*\}/g,
    ) ?? [];
    const overrides = scopedRules.filter((block) =>
      /--(primary|background|card|sidebar|accent|ring)\s*:/.test(block),
    );
    expect(overrides).toEqual([]);
  });

  it("declares an .admin-surface scope for admin-only polish", () => {
    expect(css).toMatch(/\.admin-surface\s*\{/);
  });

  it("provides prefers-reduced-motion overrides scoped to admin", () => {
    expect(css).toMatch(
      /prefers-reduced-motion:\s*reduce[\s\S]{0,200}\.admin-surface/,
    );
  });
});
