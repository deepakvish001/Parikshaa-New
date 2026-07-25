import { describe, it, expect } from "vitest";
import { parseRoadmapSections } from "@/lib/roadmaps/parseSections";

describe("parseRoadmapSections", () => {
  it("captures blockquote intros as the section overview", () => {
    const md = [
      "## Books",
      "> Recommended books for competitive programming.",
      "",
      "| ☆ | Name | Description |",
      "| --- | --- | --- |",
      "| ★★★ | [CLRS](https://x) | Bible of algorithms. |",
    ].join("\n");
    const [sec] = parseRoadmapSections(md);
    expect(sec.title).toBe("Books");
    expect(sec.intro).toBe("Recommended books for competitive programming.");
    expect(sec.shortDescription).toBe("Recommended books for competitive programming.");
    expect(sec.longDescription).toBe("");
    expect(sec.resources).toHaveLength(1);
    expect(sec.resources[0]).toMatchObject({
      name: "CLRS",
      url: "https://x",
      description: "Bible of algorithms.",
      rating: "★★★",
    });
  });

  it("splits multi-sentence intros into short + long descriptions", () => {
    const md = [
      "## Judges",
      "> Practice on real judges. Codeforces and AtCoder run weekly rounds.",
      "",
      "| Name | Description |",
      "| --- | --- |",
      "| [CF](https://codeforces.com) | Weekly rounds. |",
    ].join("\n");
    const [sec] = parseRoadmapSections(md);
    expect(sec.shortDescription).toBe("Practice on real judges.");
    expect(sec.longDescription).toBe("Codeforces and AtCoder run weekly rounds.");
    expect(sec.intro).toContain("Practice on real judges.");
    expect(sec.intro).toContain("Codeforces and AtCoder");
  });

  it("mirrors title into name + heading aliases", () => {
    const md = "## Tutorial Websites\n> Great tutorials.\n";
    const [sec] = parseRoadmapSections(md);
    expect(sec.name).toBe("Tutorial Websites");
    expect(sec.heading).toBe("Tutorial Websites");
    expect(sec.id).toBe("tutorial-websites");
  });

  it("joins multi-line blockquotes and plain paragraphs into one intro", () => {
    const md = [
      "## Camps",
      "> Training camps around the world.",
      "> Some are free, most are invite-only.",
      "",
      "Extra plain paragraph.",
    ].join("\n");
    const [sec] = parseRoadmapSections(md);
    expect(sec.intro).toBe(
      "Training camps around the world. Some are free, most are invite-only. Extra plain paragraph.",
    );
  });

  it("ignores sub-headings but keeps them out of intro", () => {
    const md = [
      "## Books",
      "> Curated reads.",
      "### Books for Algorithms",
      "",
      "| Name | Description |",
      "| --- | --- |",
      "| [Book](https://x) | Great. |",
    ].join("\n");
    const [sec] = parseRoadmapSections(md);
    expect(sec.intro).toBe("Curated reads.");
    expect(sec.resources).toHaveLength(1);
  });

  it("drops sections with no intro and no resources", () => {
    const md = ["## Empty", "", "## Kept", "> Has intro."].join("\n");
    const secs = parseRoadmapSections(md);
    expect(secs.map((s) => s.title)).toEqual(["Kept"]);
  });

  it("handles tables without a description column", () => {
    const md = [
      "## Judges",
      "> Practice sites.",
      "",
      "| Name |",
      "| --- |",
      "| [CF](https://codeforces.com) |",
    ].join("\n");
    const [sec] = parseRoadmapSections(md);
    expect(sec.resources[0]).toMatchObject({ name: "CF", url: "https://codeforces.com" });
    expect(sec.resources[0].description).toBe("");
  });

  it("strips inline markdown (backticks, bold, italics) from intro and cells", () => {
    const md = [
      "## Tools",
      "> Use **fast** `IDEs` and *editors*.",
      "",
      "| Name | Description |",
      "| --- | --- |",
      "| [`vim`](https://vim.org) | **Modal** editor. |",
    ].join("\n");
    const [sec] = parseRoadmapSections(md);
    expect(sec.intro).toBe("Use fast IDEs and editors.");
    expect(sec.resources[0].name).toBe("vim");
    expect(sec.resources[0].description).toBe("Modal editor.");
  });

  it("renders markdown links as clean text in intros and descriptions", () => {
    const md = [
      "## Community",
      "> Visit [Competitive Programming - Quora](https://www.quora.com/topic/Competitive-Programming) ([Top 10 Most Viewed Writers](https://www.quora.com/topic/Competitive-Programming/writers)).",
      "",
      "| Name | Description |",
      "| --- | --- |",
      "| [Bill Poucher](https://www.quora.com/profile/Bill-Poucher) | Executive Director of [ACM-ICPC](https://icpc.baylor.edu). |",
    ].join("\n");
    const [sec] = parseRoadmapSections(md);
    expect(sec.intro).toBe("Visit Competitive Programming - Quora (Top 10 Most Viewed Writers).");
    expect(sec.resources[0].name).toBe("Bill Poucher");
    expect(sec.resources[0].description).toBe("Executive Director of ACM-ICPC.");
  });

  it("handles markdown links whose URLs contain parentheses", () => {
    const md = [
      "## References",
      "> Read [Paper](https://example.com/archive(v2)/paper).",
      "",
      "| Name | Description |",
      "| --- | --- |",
      "| [Guide](https://example.com/path(with-parentheses)) | Covers [advanced topics](https://example.com/a(b)c). |",
    ].join("\n");
    const [sec] = parseRoadmapSections(md);
    expect(sec.intro).toBe("Read Paper.");
    expect(sec.resources[0]).toMatchObject({
      name: "Guide",
      url: "https://example.com/path(with-parentheses)",
      description: "Covers advanced topics.",
    });
  });

  it("keeps the first blockquote intro and does not mix later table blockquotes into the section overview", () => {
    const md = [
      "## Other Awesome Resources",
      "",
      "### Articles",
      "> Informative and helpful articles",
      "",
      "| Subject |",
      "| --- |",
      "| [Overview of Programming Contests](https://example.com/overview) |",
      "",
      "### FAQs",
      "> Fine answers to frequently-asked questions",
      "",
      "| Question |",
      "| --- |",
      "| [How do I start competitive programming?](https://example.com/start) |",
      "",
      "### Awesome Lists",
      "> Relevant awesome lists",
      "",
      "| Name | Link |",
      "| --- | --- |",
      "| C++ Books | [The Definitive C++ Book Guide and List - Stack Overflow](https://stackoverflow.com/questions/388242/the-definitive-c-book-guide-and-list) |",
    ].join("\n");
    const [sec] = parseRoadmapSections(md);
    expect(sec.intro).toBe("Informative and helpful articles");
    expect(sec.intro).not.toContain("Fine answers");
    expect(sec.intro).not.toContain("Relevant awesome lists");
    expect(sec.resources.map((r) => r.name)).toEqual([
      "Overview of Programming Contests",
      "How do I start competitive programming?",
      "C++ Books",
    ]);
    expect(sec.resources[2].url).toBe(
      "https://stackoverflow.com/questions/388242/the-definitive-c-book-guide-and-list",
    );
  });

  it("does not append later plain text or blockquotes after resources have started", () => {
    const md = [
      "## Lists",
      "> Primary intro.",
      "",
      "| Name | Description |",
      "| --- | --- |",
      "| [One](https://example.com/one) | First resource. |",
      "",
      "> Later table helper that should stay out.",
      "Extra paragraph that should also stay out.",
      "",
      "| Name | Description |",
      "| --- | --- |",
      "| [Two](https://example.com/two) | Second resource. |",
    ].join("\n");
    const [sec] = parseRoadmapSections(md);
    expect(sec.intro).toBe("Primary intro.");
    expect(sec.resources).toHaveLength(2);
  });
});
