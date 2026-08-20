import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TableOfContents } from "../TableOfContents";

const items = [
  { depth: 2, text: "Alpha", id: "alpha" },
  { depth: 3, text: "Alpha One", id: "alpha-one" },
  { depth: 2, text: "Beta", id: "beta" },
];

/** scrollToHeading resolves ids against the real document. */
function setupHeadings() {
  document.body.innerHTML = "";
  for (const i of items) {
    const h = document.createElement("h2");
    h.id = i.id;
    h.textContent = i.text;
    document.body.appendChild(h);
  }
}

beforeEach(setupHeadings);
afterEach(() => vi.restoreAllMocks());

describe("TableOfContents", () => {
  it("renders all items and indents by heading depth", () => {
    const { container } = render(<TableOfContents items={items} />);
    expect(screen.getByRole("navigation", { name: /table of contents/i })).toBeInTheDocument();

    expect(container.querySelectorAll("a")).toHaveLength(3);

    // Depth drives left padding on the anchor: h2 -> pl-3, h3 -> pl-6.
    expect(screen.getByRole("link", { name: "Alpha One" })).toHaveClass("pl-6");
    expect(screen.getByRole("link", { name: "Alpha" })).toHaveClass("pl-3");
  });

  it("marks the item named by activeId with aria-current=location", () => {
    render(<TableOfContents items={items} activeId="beta" />);
    expect(screen.getByRole("link", { name: "Beta" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(screen.getByRole("link", { name: "Alpha" })).not.toHaveAttribute("aria-current");
  });

  it("Enter key scrolls to the heading and moves focus to it", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const beta = document.getElementById("beta")!;
    const focus = vi.spyOn(beta, "focus").mockImplementation(() => {});

    render(<TableOfContents items={items} />);
    fireEvent.keyDown(screen.getByRole("link", { name: "Beta" }), { key: "Enter" });

    expect(scrollTo).toHaveBeenCalled();
    // Focus moves without yanking the viewport a second time.
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    // The heading is made programmatically focusable for the jump.
    expect(beta.getAttribute("tabindex")).toBe("-1");
  });

  it("Space key behaves the same as Enter", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<TableOfContents items={items} />);
    fireEvent.keyDown(screen.getByRole("link", { name: "Beta" }), { key: " " });
    expect(scrollTo).toHaveBeenCalled();
  });

  it("renders nothing for fewer than three items", () => {
    const { container } = render(<TableOfContents items={items.slice(0, 2)} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the items list is empty", () => {
    const { container } = render(<TableOfContents items={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
