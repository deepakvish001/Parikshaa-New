import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroHighlight } from "@/components/landing/HeroHighlight";

describe("HeroHighlight", () => {
  it("renders the highlighted text", () => {
    render(<HeroHighlight>freshers</HeroHighlight>);
    expect(screen.getByText("freshers")).toBeInTheDocument();
  });

  it("uses inline (not inline-block) so it wraps cleanly on small screens", () => {
    render(<HeroHighlight>freshers</HeroHighlight>);
    const el = screen.getByText("freshers");
    expect(el.className).toMatch(/\binline\b/);
    expect(el.className).not.toMatch(/\binline-block\b/);
    expect(el.className).not.toMatch(/whitespace-nowrap/);
  });

  it("clones box decoration so ring + tint repeat on each wrapped line", () => {
    render(<HeroHighlight>freshers</HeroHighlight>);
    const el = screen.getByText("freshers");
    expect(el.className).toContain("[box-decoration-break:clone]");
    expect(el.className).toContain("[-webkit-box-decoration-break:clone]");
  });

  it("uses semantic design tokens (works in light + dark themes)", () => {
    render(<HeroHighlight>freshers</HeroHighlight>);
    const el = screen.getByText("freshers");
    // token-based colors — no hardcoded text-white / bg-black
    expect(el.className).toContain("text-foreground");
    expect(el.className).toContain("bg-primary/15");
    expect(el.className).toContain("ring-primary/25");
    expect(el.className).not.toMatch(/text-(white|black|gray-\d)/);
  });

  it("allows long words to break instead of overflowing", () => {
    render(<HeroHighlight>internationalization</HeroHighlight>);
    const el = screen.getByText("internationalization");
    expect(el.className).toContain("break-words");
  });
});
