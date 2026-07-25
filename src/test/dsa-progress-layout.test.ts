import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guardrail: the DSA Progress right-rail widget must never re-introduce
 * bottom-clipping. This test locks in the CSS + JSX contract so future
 * refactors keep:
 *   1. overflow visible on the card (no clipped stats)
 *   2. a min-height on the stats/body containers so the "0 of 1195" ring
 *      and Easy/Medium/Hard rows always fit across breakpoints
 *   3. the shared rr-progress-* class hooks on the JSX
 */
describe("DSA Progress widget layout", () => {
  const css = readFileSync(resolve(__dirname, "../index.css"), "utf8");
  const tsx = readFileSync(
    resolve(__dirname, "../components/learn/RightRailWidgets.tsx"),
    "utf8",
  );

  it("card uses overflow-visible so stats never clip", () => {
    expect(tsx).toMatch(/rr-progress-card[^"]*overflow-visible/);
    expect(css).toMatch(/\.rr-progress-card\s*\{[^}]*overflow:\s*visible/);
  });

  it("stats container reserves a min-height for all 3 difficulty rows", () => {
    const stats = css.match(/\.rr-progress-stats\s*\{[^}]*\}/g)?.join("\n") ?? "";
    expect(stats).toMatch(/min-height:\s*\d/);
    expect(stats).toMatch(/flex-direction:\s*column/);
  });

  it("body container reserves a min-height so ring + stats fit", () => {
    const body = css.match(/\.rr-progress-body\s*\{[^}]*\}/g)?.join("\n") ?? "";
    expect(body).toMatch(/min-height:\s*\d/);
  });

  it("JSX wires the shared rr-progress-* class hooks", () => {
    expect(tsx).toContain("rr-progress-header");
    expect(tsx).toContain("rr-progress-body");
    expect(tsx).toContain("rr-progress-ring");
    expect(tsx).toContain("rr-progress-stats");
  });
});
