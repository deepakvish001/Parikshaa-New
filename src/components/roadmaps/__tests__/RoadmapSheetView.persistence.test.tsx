import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { RoadmapSheetView } from "@/components/roadmaps/RoadmapSheetView";
import type { RoadmapSection } from "@/lib/roadmaps/parseSections";

const SLUG = "test-roadmap";
const UI_KEY = `roadmap:ui:${SLUG}`;

const sections: RoadmapSection[] = [
  {
    id: "sec-a",
    title: "Section A",
    name: "Section A",
    heading: "Section A",
    intro: "Alpha overview. More detail about alpha.",
    shortDescription: "Alpha overview.",
    longDescription: "More detail about alpha.",
    resources: [
      { name: "Res A1", url: "https://a1.example", description: "first" },
      { name: "Res A2", url: "https://a2.example", description: "second" },
    ],
  },
  {
    id: "sec-b",
    title: "Section B",
    name: "Section B",
    heading: "Section B",
    intro: "Beta overview.",
    shortDescription: "Beta overview.",
    longDescription: "",
    resources: [{ name: "Res B1", url: "https://b1.example", description: "third" }],
  },
];

describe("RoadmapSheetView persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it("persists pill filter selection to localStorage", () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    fireEvent.click(screen.getByRole("button", { name: /pending/i }));
    const raw = localStorage.getItem(UI_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).status).toBe("pending");
  });

  it("persists expanded/collapsed section state to localStorage", () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    const sectionBHeader = screen
      .getAllByRole("button", { expanded: false })
      .find((el) => el.textContent?.includes("Section B"));
    expect(sectionBHeader).toBeTruthy();
    fireEvent.click(sectionBHeader!);
    const ui = JSON.parse(localStorage.getItem(UI_KEY)!);
    expect(ui.openMap["sec-b"]).toBe(true);
  });

  it("persists Overview 'Read more' toggle across remount", async () => {
    const { unmount } = render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    const overviewReadMore = document.querySelector(
      'button[aria-controls="overview-sec-a-long"]',
    ) as HTMLButtonElement;
    expect(overviewReadMore).toBeTruthy();
    fireEvent.click(overviewReadMore);

    await waitFor(() => {
      const ui = JSON.parse(localStorage.getItem(UI_KEY)!);
      expect(ui.overviewMap["overview-sec-a"]).toBe(true);
    });

    unmount();
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    await waitFor(() => {
      const btn = document.querySelector(
        'button[aria-controls="overview-sec-a-long"]',
      ) as HTMLButtonElement;
      expect(btn).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("renders short + long description fields in Overview", () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    const overviewP = document.getElementById("overview-sec-a-long")!;
    expect(overviewP.textContent).toContain("Alpha overview.");
    expect(overviewP.textContent).not.toContain("More detail about alpha");
    fireEvent.click(
      document.querySelector('button[aria-controls="overview-sec-a-long"]') as HTMLElement,
    );
    expect(overviewP.textContent).toContain("More detail about alpha");
  });

  it("rehydrates pill filter + open sections from localStorage on remount", async () => {
    localStorage.setItem(
      UI_KEY,
      JSON.stringify({ status: "all", openMap: { "sec-a": false, "sec-b": true } }),
    );
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^all$/i })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
    const sectionBHeader = screen
      .getAllByRole("button", { expanded: true })
      .find((el) => el.textContent?.includes("Section B"));
    expect(sectionBHeader).toBeTruthy();
  });

  it("falls back to intro text when shortDescription is missing", () => {
    const legacy: RoadmapSection[] = [
      {
        id: "legacy",
        title: "Legacy",
        intro: "Legacy intro only.",
        resources: [{ name: "R", description: "" }],
      },
    ];
    render(<RoadmapSheetView slug="legacy-slug" sections={legacy} />);
    const overviewP = document.getElementById("overview-legacy-long")!;
    expect(overviewP.textContent).toContain("Legacy intro only.");
  });

  it("shows empty-state overview when intro is missing entirely", () => {
    const empty: RoadmapSection[] = [
      { id: "e", title: "Empty", intro: "", resources: [{ name: "R", description: "" }] },
    ];
    render(<RoadmapSheetView slug="empty-slug" sections={empty} />);
    const overviewP = document.getElementById("overview-e-long")!;
    expect(overviewP.textContent).toMatch(/No overview available/i);
  });

  it("formats section progress labels with compact counts and pluralized resources", async () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    await waitFor(() => {
      expect(screen.getByLabelText("Section A, expanded, 0/2 resources complete")).toBeTruthy();
      expect(screen.getByLabelText("Section B, collapsed, 0/1 resource complete")).toBeTruthy();
    });
    expect(screen.queryByText(/0 of 2 resources complete/i)).not.toBeInTheDocument();
  });

  it("uses a sensible section progress fallback when completion data has not hydrated", () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} isLoading />);
    expect(screen.queryByText(/0 of \d+ resources complete/i)).not.toBeInTheDocument();
  });
});

describe("RoadmapSheetView accessibility — expand/collapse controls", () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it("section triggers expose aria-expanded and aria-controls", () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    const triggers = screen.getAllByRole("button").filter((b) =>
      b.getAttribute("id")?.startsWith("roadmap-section-trigger-"),
    );
    expect(triggers.length).toBe(2);
    for (const t of triggers) {
      expect(t).toHaveAttribute("aria-expanded");
      expect(t.getAttribute("aria-controls")).toMatch(/^roadmap-section-panel-/);
    }
  });

  it("toggles aria-expanded on click", () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    const trigger = document.getElementById("roadmap-section-trigger-sec-b")!;
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("supports Space and Enter keyboard toggling", () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    const trigger = document.getElementById("roadmap-section-trigger-sec-b")!;
    trigger.focus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.keyDown(trigger, { key: " " });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("applies a visible focus ring class to section triggers", () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    const trigger = document.getElementById("roadmap-section-trigger-sec-a")!;
    expect(trigger.className).toMatch(/focus-visible:ring-2/);
    expect(trigger.className).toMatch(/focus-parikshaa/);
  });

  it("linked panel id matches trigger aria-controls when open", () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    const trigger = document.getElementById("roadmap-section-trigger-sec-a")!;
    const controls = trigger.getAttribute("aria-controls")!;
    expect(document.getElementById(controls)).toBeTruthy();
  });

  it("Read more buttons expose aria-expanded and aria-controls", () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    const readMore = document.querySelector(
      'button[aria-controls="overview-sec-a-long"]',
    ) as HTMLButtonElement;
    expect(readMore).toBeTruthy();
    expect(readMore).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(readMore);
    expect(readMore).toHaveAttribute("aria-expanded", "true");
  });

  it("Read more buttons toggle on Space/Enter keys", () => {
    render(<RoadmapSheetView slug={SLUG} sections={sections} />);
    const btn = document.querySelector(
      'button[aria-controls="overview-sec-a-long"]',
    ) as HTMLButtonElement;
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(btn).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(btn, { key: " " });
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });
});
