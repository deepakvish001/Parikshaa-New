export interface RoadmapResource {
  rating?: string;
  name: string;
  url?: string;
  description: string;
}

export interface RoadmapSection {
  id: string;
  /** Short label used as heading (e.g. "Books"). */
  title: string;
  /** Alias of title kept as the canonical "content name". */
  name?: string;
  /** Alias of title kept as the semantic "heading". */
  heading?: string;
  /** Full intro paragraph (joined). Backwards-compat field. */
  intro: string;
  /** First sentence of intro — safe to show truncated on cards. */
  shortDescription?: string;
  /** Remaining sentences of intro — revealed on expand. Empty if intro is one sentence. */
  longDescription?: string;
  resources: RoadmapResource[];
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const findClosingParen = (value: string, openParenIndex: number) => {
  let depth = 1;
  for (let i = openParenIndex + 1; i < value.length; i += 1) {
    if (value[i] === "\\") {
      i += 1;
      continue;
    }
    if (value[i] === "(") depth += 1;
    if (value[i] === ")") depth -= 1;
    if (depth === 0) return i;
  }
  return -1;
};

const replaceMarkdownLinks = (value: string) => {
  let output = "";
  let i = 0;

  while (i < value.length) {
    const isImage = value[i] === "!" && value[i + 1] === "[";
    const linkStart = isImage ? i + 1 : i;

    if (value[linkStart] === "[") {
      const closeBracket = value.indexOf("]", linkStart + 1);
      const openParen = closeBracket >= 0 ? closeBracket + 1 : -1;

      if (closeBracket >= 0 && value[openParen] === "(") {
        const closeParen = findClosingParen(value, openParen);
        if (closeParen >= 0) {
          if (!isImage) output += value.slice(linkStart + 1, closeBracket);
          i = closeParen + 1;
          continue;
        }
      }
    }

    output += value[i];
    i += 1;
  }

  return output;
};

const stripInlineMd = (s: string) =>
  replaceMarkdownLinks(s)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const extractFirstMarkdownLink = (cell: string): { label: string; url: string } | null => {
  for (let i = 0; i < cell.length; i += 1) {
    if (cell[i] !== "[" || cell[i - 1] === "!") continue;
    const closeBracket = cell.indexOf("]", i + 1);
    const openParen = closeBracket >= 0 ? closeBracket + 1 : -1;
    if (closeBracket < 0 || cell[openParen] !== "(") continue;
    const closeParen = findClosingParen(cell, openParen);
    if (closeParen < 0) continue;
    return {
      label: cell.slice(i + 1, closeBracket),
      url: cell.slice(openParen + 1, closeParen),
    };
  }
  return null;
};

const parseLinkCell = (cell: string): { name: string; url?: string } => {
  const link = extractFirstMarkdownLink(cell);
  if (link) return { name: stripInlineMd(link.label), url: link.url };
  return { name: stripInlineMd(cell) };
};

/**
 * Parse a sanitized awesome-list markdown into sections. Each `##` heading
 * becomes a section; its markdown tables become RoadmapResource rows.
 */
export function parseRoadmapSections(md: string): RoadmapSection[] {
  const lines = md.split("\n");
  const sections: RoadmapSection[] = [];
  let current: RoadmapSection | null = null;
  let introBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (!current || tableBuffer.length < 2) {
      tableBuffer = [];
      return;
    }
    const header = tableBuffer[0]
      .split("|")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    const rows = tableBuffer.slice(2); // skip header + separator
    const nameIdx = Math.max(0, header.findIndex((h) => /name|title|resource|link/.test(h)));
    const descIdx = header.findIndex((h) => /desc|about|note/.test(h));
    const rateIdx = header.findIndex((h) => /☆|star|rating|score/.test(h));
    const linkIdx = header.findIndex((h) => /link|url|website/.test(h));
    for (const row of rows) {
      const cells = row
        .split("|")
        .map((c) => c.trim())
        .filter((c, i, arr) => !(i === 0 && c === "") && !(i === arr.length - 1 && c === ""));
      if (cells.length === 0) continue;
      const { name, url } = parseLinkCell(cells[nameIdx] ?? cells[0] ?? "");
      const fallbackUrl = linkIdx >= 0 ? parseLinkCell(cells[linkIdx] ?? "").url : undefined;
      if (!name) continue;
      current.resources.push({
        name,
        url: url ?? fallbackUrl,
        description: descIdx >= 0 ? stripInlineMd(cells[descIdx] ?? "") : "",
        rating: rateIdx >= 0 ? stripInlineMd(cells[rateIdx] ?? "") : undefined,
      });
    }
    tableBuffer = [];
  };

  const splitIntro = (full: string): { shortDescription: string; longDescription: string } => {
    if (!full) return { shortDescription: "", longDescription: "" };
    // Split on sentence boundary (., !, ?) followed by space + capital / end.
    const m = /^(.+?[.!?])(\s+)(.+)$/s.exec(full);
    if (!m) return { shortDescription: full, longDescription: "" };
    return { shortDescription: m[1].trim(), longDescription: m[3].trim() };
  };

  const flushIntro = () => {
    if (!current) return;
    if (introBuffer.length === 0) return;
    const intro = introBuffer.join(" ").replace(/\s+/g, " ").trim();
    const { shortDescription, longDescription } = splitIntro(intro);
    current.intro = intro;
    current.shortDescription = shortDescription;
    current.longDescription = longDescription;
    introBuffer = [];
  };

  for (const raw of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(raw);
    if (heading) {
      flushTable();
      flushIntro();
      if (current) sections.push(current);
      const title = stripInlineMd(heading[1]);
      current = {
        id: slugify(title),
        title,
        name: title,
        heading: title,
        intro: "",
        shortDescription: "",
        longDescription: "",
        resources: [],
      };
      continue;
    }
    if (!current) continue;

    if (/^\|.*\|$/.test(raw.trim())) {
      // Freeze the intro at the first table so later blockquotes describing
      // sub-tables don't get appended into the section overview.
      flushIntro();
      tableBuffer.push(raw.trim());
      continue;
    }
    if (tableBuffer.length) flushTable();

    // ignore sub-headings for intro; blockquotes ARE the intro in awesome-lists
    if (/^#{3,6}\s/.test(raw)) continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    // Only collect intro content before the first table has been seen.
    if (current.resources.length || current.intro) continue;
    const cleaned = trimmed.startsWith(">") ? trimmed.replace(/^>+\s?/, "") : trimmed;
    if (cleaned) introBuffer.push(stripInlineMd(cleaned));
  }
  flushTable();
  flushIntro();
  if (current) sections.push(current);

  // Drop empty sections (no intro AND no resources), then guarantee non-undefined
  // string fields so the UI can render safely without extra null checks.
  return sections
    .filter((s) => s.intro || s.resources.length)
    .map((s) => ({
      ...s,
      name: s.name ?? s.title,
      heading: s.heading ?? s.title,
      shortDescription: s.shortDescription ?? s.intro ?? "",
      longDescription: s.longDescription ?? "",
    }));
}
