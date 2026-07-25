import { describe, it, expect } from "vitest";
import {
  BRAND_PALETTE,
  MULTICOLOR_PALETTE,
  TOPIC_FALLBACK_CLASSNAME,
  colorForTopic,
} from "@/config/topicBadgePalette";

describe("colorForTopic", () => {
  it("returns the same color for the same topic across calls", () => {
    const a = colorForTopic("Dynamic Programming");
    const b = colorForTopic("Dynamic Programming");
    expect(a).toBe(b);
  });

  it("normalizes casing and surrounding whitespace", () => {
    expect(colorForTopic("Array")).toBe(colorForTopic("array"));
    expect(colorForTopic("Array")).toBe(colorForTopic("  ARRAY  "));
    expect(colorForTopic("Hash Table")).toBe(colorForTopic("hash table"));
  });

  it("distributes across multiple palette entries for varied topics", () => {
    const topics = [
      "Array", "String", "Tree", "Graph", "Math", "Dynamic Programming",
      "Greedy", "Sorting", "Trie", "Backtracking", "Heap", "Stack",
    ];
    const unique = new Set(topics.map((t) => colorForTopic(t)));
    expect(unique.size).toBeGreaterThan(1);
  });

  it("falls back to a neutral color for empty / invalid input", () => {
    expect(colorForTopic("")).toBe(TOPIC_FALLBACK_CLASSNAME);
    expect(colorForTopic("   ")).toBe(TOPIC_FALLBACK_CLASSNAME);
    expect(colorForTopic(null)).toBe(TOPIC_FALLBACK_CLASSNAME);
    expect(colorForTopic(undefined)).toBe(TOPIC_FALLBACK_CLASSNAME);
    expect(colorForTopic(123 as unknown as string)).toBe(TOPIC_FALLBACK_CLASSNAME);
  });

  it("honors a caller-supplied palette (brand vs multicolor)", () => {
    const brand = colorForTopic("Array", BRAND_PALETTE);
    const multi = colorForTopic("Array", MULTICOLOR_PALETTE);
    expect(BRAND_PALETTE.some((e) => e.className === brand)).toBe(true);
    expect(MULTICOLOR_PALETTE.some((e) => e.className === multi)).toBe(true);
  });
});
