// Section headings to drop entirely (case-insensitive, matched loosely).
export const DROP_SECTIONS = [
  "table of contents",
  "contents",
  "contributing",
  "contribution",
  "how to contribute",
  "license",
  "licence",
  "copyright",
  "credits",
  "author",
  "authors",
  "contributors",
  "sponsor",
  "sponsors",
  "donate",
  "support",
  "star history",
  "changelog",
  "disclaimer",
];

/**
 * Clean an "awesome-list" style markdown so only the useful curated sections
 * remain. Strips intro chatter, badges, ToC, contribution / license /
 * copyright sections, and any stray copyright / shield.io noise lines.
 */
export function sanitizeRoadmapMarkdown(src: string): string {
  const lines = src.split("\n");
  const kept: string[] = [];
  let skipping = false;
  let seenFirstSection = false;
  // If the doc has no top-level sections, don't gate on "first section seen".
  const hasSections = /^#{2,3}\s+/m.test(src);
  if (!hasSections) seenFirstSection = true;


  for (const raw of lines) {
    const line = raw;

    const headingMatch = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].replace(/[*_`]/g, "").trim().toLowerCase();

      if (level >= 2) seenFirstSection = true;

      const shouldDrop = DROP_SECTIONS.some(
        (d) => title === d || title.startsWith(`${d} `) || title.endsWith(` ${d}`),
      );

      if (shouldDrop) {
        skipping = true;
        continue;
      }
      if (level <= 2) skipping = false;
    }

    if (skipping) continue;
    if (!seenFirstSection) continue;

    if (/©|copyright\s*\(c\)|all rights reserved/i.test(line)) continue;
    if (/shields\.io|badge\.svg|awesome\.re|img\.shields/i.test(line)) continue;

    kept.push(line);
  }

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Short plain-text preview extracted from cleaned markdown. */
export function roadmapPreview(src: string, maxChars = 200): string {
  const cleaned = sanitizeRoadmapMarkdown(src)
    .replace(/^#{1,6}\s+.*$/gm, "") // headings
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
    .replace(/[`*_>|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > maxChars ? `${cleaned.slice(0, maxChars).trim()}…` : cleaned;
}
