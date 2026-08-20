import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import DsaStudio from "../DsaStudio";
import { DSA_TOPICS } from "@/data/dsaStudioData";

const TOTAL_PROBLEMS = 171;

const allProblems = DSA_TOPICS.flatMap((t) =>
  t.groups.flatMap((g) => g.problems.map((p) => ({ ...p, topicId: t.id, topicLabel: t.label }))),
);

beforeEach(() => {
  window.localStorage.clear();
});

// DsaStudio renders <Helmet>, which needs a HelmetProvider ancestor (same
// wrapper LoginMfa.test.tsx uses). The tab is derived from the URL via
// pathToTab(), so the problems tab must be addressed by its own path —
// "/learn/dsa-studio" resolves to the hub tab, which has no problem cards.
const renderApp = (path = "/learn/dsa-studio/problems") =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <DsaStudio />
      </MemoryRouter>
    </HelmetProvider>,
  );

/**
 * The problems tab renders every topic as its own <section data-topic-id>,
 * each with its own "Rendered: x/y" indicator, rather than filtering the page
 * down to one active topic. Per-topic assertions therefore have to be scoped
 * to that topic's section — a document-wide getAllByTestId sees all 171 cards.
 */
const topicSection = (topicId: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(`[data-topic-id="${topicId}"]`);
  if (!el) throw new Error(`no rendered section for topic "${topicId}"`);
  return el;
};

describe("DSA Studio — data integrity", () => {
  it(`contains exactly ${TOTAL_PROBLEMS} problems across all topics`, () => {
    expect(allProblems.length).toBe(TOTAL_PROBLEMS);
  });

  it("each problem has a unique slug", () => {
    const slugs = allProblems.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("each topic.count matches its actual problems length (QA parity)", () => {
    const mismatches = DSA_TOPICS
      .map((t) => ({
        id: t.id,
        expected: t.count,
        actual: t.groups.reduce((s, g) => s + g.problems.length, 0),
      }))
      .filter((r) => r.expected !== r.actual);
    expect(mismatches).toEqual([]);
  });
});

describe("DSA Studio — rendered indicator + grand total", () => {
  it("shows the grand total of 171 indexed problems", () => {
    renderApp();
    const badge = screen.getByTestId("dsa-grand-total");
    expect(badge.textContent).toMatch(new RegExp(`${TOTAL_PROBLEMS}\\s*/\\s*171`));
  });

  it("every topic's Rendered: X/Y indicator matches the cards in its own section", () => {
    renderApp();
    for (const t of DSA_TOPICS) {
      const section = topicSection(t.id);
      const indicator = within(section).getByTestId("dsa-rendered-indicator");
      const [, x, y] = indicator.textContent!.match(/Rendered:\s*(\d+)\s*\/\s*(\d+)/)!;
      const expectedTotal = t.groups.reduce((sum, g) => sum + g.problems.length, 0);

      // Unfiltered, every problem in the topic is on screen.
      expect(within(section).getAllByTestId("dsa-problem-card")).toHaveLength(Number(x));
      expect(Number(x)).toBe(expectedTotal);
      expect(Number(y)).toBe(expectedTotal);
    }
  });

  it("renders every indexed problem across all topic sections", () => {
    renderApp();
    expect(screen.getAllByTestId("dsa-problem-card")).toHaveLength(TOTAL_PROBLEMS);
  });
});

describe("DSA Studio — every problem renders to its detail route", () => {
  it.each(DSA_TOPICS.map((t) => [t.id, t.label] as const))(
    "topic %s renders all problem cards with correct hrefs",
    (topicId) => {
      window.localStorage.setItem(
        "dsaStudio:prefs:v1",
        JSON.stringify({ activeTopic: topicId, activeTab: "problems", search: "", priority: "all" }),
      );
      const { unmount } = renderApp();
      const topic = DSA_TOPICS.find((t) => t.id === topicId)!;
      const expected = topic.groups.flatMap((g) => g.problems);
      const cards = within(topicSection(topicId)).getAllByTestId(
        "dsa-problem-card",
      ) as HTMLAnchorElement[];
      expect(cards.length).toBe(expected.length);
      const renderedSlugs = new Set(cards.map((c) => c.getAttribute("data-slug")));
      for (const p of expected) {
        expect(renderedSlugs.has(p.slug)).toBe(true);
        const card = cards.find((c) => c.getAttribute("data-slug") === p.slug)!;
        expect(card.getAttribute("href")).toBe(`/learn/dsa-studio/${p.slug}`);
      }
      unmount();
    },
  );
});

describe("DSA Studio — filters preserved when navigating to a problem", () => {
  it("active filters/search persist in localStorage so revisiting restores them", () => {
    renderApp();
    const input = screen.getByPlaceholderText(/search by name or number/i) as HTMLInputElement;
    act(() => {
      fireEvent.change(input, { target: { value: "sum" } });
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /^P1$/i }));
    });
    const prefs = JSON.parse(window.localStorage.getItem("dsaStudio:prefs:v1")!);
    expect(prefs.search).toBe("sum");
    expect(prefs.priority).toBe("p1");

    // Click-through: every visible card still routes to its slug
    const cards = screen.getAllByTestId("dsa-problem-card") as HTMLAnchorElement[];
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) {
      const slug = c.getAttribute("data-slug")!;
      expect(c.getAttribute("href")).toBe(`/learn/dsa-studio/${slug}`);
    }
  });
});

describe("DSA Studio — QA mode", () => {
  it("toggling QA mode does not surface mismatches when data is consistent", () => {
    renderApp("/learn/dsa-studio/problems?qa=1");
    // If data integrity test passes, no mismatch panel should be present
    expect(screen.queryByTestId("dsa-qa-mismatches")).toBeNull();
  });
});
