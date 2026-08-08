import competitiveProgrammingMd from "@/content/roadmaps/competitive-programming.md?raw";
import completeDsaRoadmapMd from "@/content/roadmaps/complete-dsa-roadmap.md?raw";
import cProgrammingCompleteMd from "@/content/roadmaps/c-programming-complete.md?raw";
import { Swords, Code2, Cpu, Database, Globe, Layers, Terminal, Map as MapIcon, type LucideIcon } from "lucide-react";

export interface Roadmap {
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
  icon: LucideIcon;
  accent: string; // tailwind gradient classes
  readingTime: string;
  content: string; // markdown
}

export const roadmaps: Roadmap[] = [
  {
    slug: "complete-dsa-roadmap",
    title: "The Complete DSA Roadmap — Zero to FAANG",
    description:
      "North-star document — 4 levels, 17 sheets, 24 core patterns, phase-by-phase study plan & FAANG checklist. Derive karo, ratta mat maaro.",
    category: "DSA",
    difficulty: "Beginner",
    tags: ["dsa", "patterns", "faang", "roadmap", "beginner-to-advanced"],
    icon: MapIcon,
    accent: "from-amber-500/20 to-orange-500/20",
    readingTime: "4–6 months",
    content: completeDsaRoadmapMd,
  },
  {
    slug: "c-programming-complete",
    title: "C Programming — Complete Sheet (Zero to Hero)",
    description:
      "Absolute beginner → confident C programmer. 13 modules of theory + must-code + gotchas, culminating in beginner/intermediate/advanced projects.",
    category: "Programming Languages",
    difficulty: "Beginner",
    tags: ["c", "programming", "beginner", "pointers", "memory", "gate"],
    icon: Terminal,
    accent: "from-amber-500/20 to-orange-500/20",
    readingTime: "6–8 weeks",
    content: cProgrammingCompleteMd,
  },
  {
    slug: "competitive-programming",
    title: "Competitive Programming",
    description:
      "A hand-picked path from your first contest to ICPC finals — syllabi, tutorial sites, open courses, books, judges, camps, tools, and communities, all organised section by section with star ratings and short notes on each resource.",
    category: "Competitive Programming",
    difficulty: "Advanced",
    tags: ["cp", "algorithms", "data-structures", "contests", "icpc", "codeforces"],
    icon: Swords,
    accent: "from-amber-500/20 to-orange-500/20",
    readingTime: "30 min read",
    content: competitiveProgrammingMd,
  },
];



export const roadmapCategories = [
  "All",
  "Competitive Programming",
  "DSA",
  "Programming Languages",
  "System Design",
  "Web Development",
  "Backend",
  "AI / ML",
] as const;

// Placeholder icon exports so future roadmaps can reuse.
export const roadmapIconLibrary = { Swords, Code2, Cpu, Database, Globe, Layers, Terminal };

export function getRoadmapBySlug(slug: string): Roadmap | undefined {
  return roadmaps.find((r) => r.slug === slug);
}
