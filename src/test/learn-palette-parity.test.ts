import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Visual-regression guardrail: Home, Login, and Signup MUST inherit the
 * /learn page palette by scoping their root under `learn-dark-surface`.
 *
 * This test catches theme drift at review time — if anyone re-introduces
 * hardcoded surface/text/accent colors instead of semantic /learn tokens,
 * the palette breaks and the test fails.
 */

const FILES = [
  "src/pages/Index.tsx",
  "src/pages/Login.tsx",
  "src/pages/Signup.tsx",
  "src/components/AuthLayout.tsx",
  "src/components/landing/ApexNavbar.tsx",
  "src/components/landing/ApexHero.tsx",
  "src/components/landing/AllInOneHub.tsx",
  "src/components/landing/ApexFinalCTA.tsx",
  "src/components/landing/ApexFooter.tsx",
];

const FORBIDDEN_HARDCODED_THEME_CLASSES = [
  /\bbg-(zinc|neutral|slate|black|white|amber|orange)-?\d*/,
  /\btext-(zinc|neutral|slate|black|white|amber|orange)-?\d*/,
  /\bborder-(zinc|neutral|slate|black|white|amber|orange)-?\d*/,
  /\bfrom-(zinc|neutral|slate|black|white|amber|orange)-?\d*/,
  /\bvia-(zinc|neutral|slate|black|white|amber|orange)-?\d*/,
  /\bto-(zinc|neutral|slate|black|white|amber|orange)-?\d*/,
  /\bring-(zinc|neutral|slate|black|white|amber|orange)-?\d*/,
  /\bring-offset-\[#030305\]/,
  /\bbg-\[#030305\]/,
  /\bbg-\[#000000\]/,
];

function read(p: string): string {
  return readFileSync(resolve(process.cwd(), p), "utf8");
}

describe("theme parity with /learn palette", () => {
  it("Index (home) mounts under learn-dark-surface", () => {
    expect(read("src/pages/Index.tsx")).toMatch(/learn-dark-surface/);
  });

  it("AuthLayout (login + signup shell) mounts under learn-dark-surface", () => {
    expect(read("src/components/AuthLayout.tsx")).toMatch(/learn-dark-surface/);
  });

  it.each(FILES)("%s uses semantic /learn palette tokens only", (file) => {
    const src = read(file);
    for (const pattern of FORBIDDEN_HARDCODED_THEME_CLASSES) {
      expect(
        src,
        `${file} contains forbidden hardcoded theme class ${pattern} — use bg-background, text-foreground, text-muted-foreground, bg-card, border-border, or primary tokens instead`,
      ).not.toMatch(pattern);
    }
  });
});
