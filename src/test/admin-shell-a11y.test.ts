import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * A11y + responsive smoke checks for the admin shell. Cheap file-scan
 * assertions instead of a heavy render tree — the AdminShell brings ~20
 * providers so we validate contracts rather than mount it.
 */
const shell = readFileSync(
  resolve(__dirname, "../components/admin/AdminShell.tsx"),
  "utf8",
);
const header = readFileSync(
  resolve(__dirname, "../components/admin/AdminPageHeader.tsx"),
  "utf8",
);

describe("admin shell a11y & responsive contract", () => {
  it("main region has landmark, id target for skip link, and aria-live", () => {
    expect(shell).toMatch(/id="admin-main"/);
    expect(shell).toMatch(/aria-label="Admin content"/);
    expect(shell).toMatch(/aria-live="polite"/);
  });

  it("provides a keyboard-only skip link to admin content", () => {
    expect(shell).toMatch(/href="#admin-main"/);
    expect(shell).toMatch(/sr-only\s+focus:not-sr-only/);
  });

  it("route transition respects prefers-reduced-motion", () => {
    expect(shell).toMatch(/motion-reduce:animate-none/);
  });

  it("top bar uses responsive horizontal padding", () => {
    expect(shell).toMatch(/px-2[^"]*sm:px-6/);
  });

  it("main content uses responsive padding scales", () => {
    expect(shell).toMatch(/px-3\s+py-4\s+sm:px-6\s+sm:py-6\s+lg:px-8/);
  });

  it("breadcrumb nav is labelled", () => {
    expect(shell).toMatch(/aria-label="Breadcrumb"/);
  });
});

describe("AdminPageHeader responsive", () => {
  it("uses responsive title sizing", () => {
    expect(header).toMatch(/text-xl[^"]*sm:text-2xl/);
  });

  it("uses a flat sales-ops layout (no orb, no gradient card)", () => {
    expect(header).not.toMatch(/rounded-full bg-\[radial-gradient/);
    expect(header).toMatch(/border-b border-border/);
  });
});

