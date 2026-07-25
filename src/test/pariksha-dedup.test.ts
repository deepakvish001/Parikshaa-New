import { describe, it, expect } from "vitest";
import { dedupeSectionItems } from "@/pages/learn/LearnHub";

describe("dedupeSectionItems", () => {
  it("removes items with duplicate title+route", () => {
    const items = [
      { title: "Arrays", subtitle: "", primary: { label: "Open", to: "/a" } },
      { title: "Arrays", subtitle: "", primary: { label: "Open", to: "/a" } },
      { title: "Strings", subtitle: "", primary: { label: "Open", to: "/s" } },
    ];
    const out = dedupeSectionItems(items);
    expect(out).toHaveLength(2);
    expect(out.map((i) => i.title)).toEqual(["Arrays", "Strings"]);
  });

  it("keeps items with same title but different routes", () => {
    const items = [
      { title: "Arrays", subtitle: "", primary: { label: "Open", to: "/a1" } },
      { title: "Arrays", subtitle: "", primary: { label: "Open", to: "/a2" } },
    ];
    expect(dedupeSectionItems(items)).toHaveLength(2);
  });
});
