import { describe, it, expect } from "vitest";
import { sanitizeRoadmapMarkdown, roadmapPreview } from "@/lib/roadmaps/sanitize";

const SAMPLE = `# Awesome CP [![Awesome](https://cdn.rawgit.com/x/awesome/badge.svg)](https://awesome.re)

Intro paragraph that should be stripped along with the badge above.
Copyright (c) 2024 Some Author. All rights reserved.

## Table of Contents
- [A](#a)
- [B](#b)

## Contributing
Please read CONTRIBUTING.md before opening a PR.

## Tutorial Websites
| Name | Description |
| --- | --- |
| [CP-Algorithms](https://cp-algorithms.com) | Great tutorials |

## License
MIT © 2024 Someone

## Credits
Thanks to everyone.

## Books
Great books listed here.
`;

describe("sanitizeRoadmapMarkdown", () => {
  const cleaned = sanitizeRoadmapMarkdown(SAMPLE);

  it("keeps useful curated sections", () => {
    expect(cleaned).toMatch(/## Tutorial Websites/);
    expect(cleaned).toMatch(/CP-Algorithms/);
    expect(cleaned).toMatch(/## Books/);
  });

  it("drops intro chatter before the first section", () => {
    expect(cleaned).not.toMatch(/Intro paragraph/);
    expect(cleaned).not.toMatch(/^# Awesome CP/m);
  });

  it("drops Table of Contents section", () => {
    expect(cleaned).not.toMatch(/Table of Contents/i);
  });

  it("drops Contributing section", () => {
    expect(cleaned).not.toMatch(/Contributing/i);
    expect(cleaned).not.toMatch(/CONTRIBUTING\.md/);
  });

  it("drops License / Copyright / Credits sections", () => {
    expect(cleaned).not.toMatch(/## License/);
    expect(cleaned).not.toMatch(/MIT ©/);
    expect(cleaned).not.toMatch(/## Credits/);
    expect(cleaned).not.toMatch(/Thanks to everyone/);
  });

  it("strips © / copyright (c) / all rights reserved lines anywhere", () => {
    expect(cleaned).not.toMatch(/©/);
    expect(cleaned).not.toMatch(/copyright \(c\)/i);
    expect(cleaned).not.toMatch(/all rights reserved/i);
  });

  it("strips shields.io / badge.svg / awesome.re noise", () => {
    expect(cleaned).not.toMatch(/shields\.io/);
    expect(cleaned).not.toMatch(/badge\.svg/);
    expect(cleaned).not.toMatch(/awesome\.re/);
  });

  it("collapses excessive blank lines", () => {
    expect(cleaned).not.toMatch(/\n{3,}/);
  });

  it("is idempotent", () => {
    expect(sanitizeRoadmapMarkdown(cleaned)).toBe(cleaned);
  });
});

describe("roadmapPreview", () => {
  it("returns plain text without markdown syntax", () => {
    const p = roadmapPreview(SAMPLE, 500);
    expect(p).not.toMatch(/[#*_`>|]/);
    expect(p).not.toMatch(/©/);
    expect(p).not.toMatch(/shields\.io/);
  });

  it("truncates to maxChars with ellipsis", () => {
    const p = roadmapPreview(SAMPLE, 40);
    expect(p.length).toBeLessThanOrEqual(41);
    expect(p.endsWith("…")).toBe(true);
  });

  it("passes plain descriptions through unchanged", () => {
    expect(roadmapPreview("Curated resources.", 200)).toBe("Curated resources.");
  });
});
