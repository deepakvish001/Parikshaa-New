import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult } from "./_shared";
import { dbmsSections, dbmsMeta } from "../../../data/dbmsData";
import { cnSections, cnMeta } from "../../../data/cnData";
import { osSections, osMeta } from "../../../data/osData";
import type { Section } from "../../../data/dsaLevel1Types";

type BuiltinSheet = {
  slug: string;
  route: string;
  meta: {
    id: string;
    title: string;
    description: string;
    lastUpdated: string;
    totalProblems: number;
    completed: number;
    easy: number;
    medium: number;
    hard: number;
  };
  sections: Section[];
};

const BUILTIN_SHEETS: Record<string, BuiltinSheet> = {
  "dbms-sheet": {
    slug: "dbms-sheet",
    route: "/learn/sheets/dbms-sheet",
    meta: dbmsMeta,
    sections: dbmsSections,
  },
  "cn-sheet": {
    slug: "cn-sheet",
    route: "/learn/sheets/cn-sheet",
    meta: cnMeta,
    sections: cnSections,
  },
  "os-sheet": {
    slug: "os-sheet",
    route: "/learn/sheets/os-sheet",
    meta: osMeta,
    sections: osSections,
  },
};

const normalize = (value: string) => value.trim().toLowerCase();

const summarizeSheet = (sheet: BuiltinSheet) => ({
  slug: sheet.slug,
  route: sheet.route,
  title: sheet.meta.title,
  description: sheet.meta.description,
  totalProblems: sheet.meta.totalProblems,
  difficulty: {
    easy: sheet.meta.easy,
    medium: sheet.meta.medium,
    hard: sheet.meta.hard,
  },
  sections: sheet.sections.map((section) => ({
    id: section.id,
    title: section.title,
    subSectionCount: section.subSections.length,
    topicCount: section.subSections.reduce((total, sub) => total + sub.topics.length, 0),
  })),
});

export const listBuiltinSheetsTool = defineTool({
  name: "list_builtin_sheets",
  title: "List built-in learning sheets",
  description:
    "List static frontend sheets that exist at /learn/sheets/:slug, such as DBMS, CN, and OS. Use this when user_folders has no DB row for an existing app sheet.",
  inputSchema: {
    search: z.string().optional().describe("Optional title/slug search."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ search }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const q = search ? normalize(search) : "";
    const sheets = Object.values(BUILTIN_SHEETS)
      .filter((sheet) => !q || normalize(`${sheet.slug} ${sheet.meta.title}`).includes(q))
      .map(summarizeSheet);
    return jsonResult(`Found ${sheets.length} built-in sheet(s).`, sheets);
  },
});

export const getBuiltinSheetTool = defineTool({
  name: "get_builtin_sheet",
  title: "Get built-in sheet details",
  description:
    "Return the actual static sheet content rendered by /learn/sheets/:slug, including sections, sub-sections, and topics. Supports optional topic search to keep responses compact.",
  inputSchema: {
    slug: z.string().min(1).describe("Sheet slug, for example dbms-sheet, cn-sheet, or os-sheet."),
    topic_search: z.string().optional().describe("Optional filter across section, sub-section, and topic titles."),
    include_topics: z.boolean().optional().describe("Defaults to true. Set false for structure only."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ slug, topic_search, include_topics }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const key = normalize(slug);
    const sheet = BUILTIN_SHEETS[key];
    if (!sheet) {
      return errResult(`Unknown built-in sheet "${slug}". Call list_builtin_sheets first.`);
    }

    const includeTopics = include_topics ?? true;
    const q = topic_search ? normalize(topic_search) : "";
    const sections = sheet.sections
      .map((section) => {
        const sectionMatches = q && normalize(section.title).includes(q);
        const subSections = section.subSections
          .map((subSection) => {
            const subMatches = q && normalize(subSection.title).includes(q);
            const topics = includeTopics
              ? subSection.topics.filter(
                  (topic) =>
                    !q ||
                    sectionMatches ||
                    subMatches ||
                    normalize(`${topic.id} ${topic.title} ${topic.note}`).includes(q),
                )
              : [];
            return {
              id: subSection.id,
              title: subSection.title,
              prerequisites: subSection.prerequisites ?? [],
              topicCount: includeTopics ? topics.length : subSection.topics.length,
              topics: includeTopics ? topics : undefined,
            };
          })
          .filter((subSection) => !q || sectionMatches || normalize(subSection.title).includes(q) || subSection.topicCount > 0);

        return {
          id: section.id,
          title: section.title,
          subSections,
        };
      })
      .filter((section) => !q || normalize(section.title).includes(q) || section.subSections.length > 0);

    return jsonResult(`Built-in sheet "${sheet.meta.title}" (${sheet.route}).`, {
      slug: sheet.slug,
      route: sheet.route,
      meta: sheet.meta,
      sections,
    });
  },
});