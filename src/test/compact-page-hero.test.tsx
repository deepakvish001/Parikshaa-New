import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompactPageHero } from "@/components/common/CompactPageHero";

describe("CompactPageHero (shared hero used by home + /u/:username)", () => {
  it("uses Space Grotesk for the heading and JetBrains Mono for the eyebrow", () => {
    render(
      <CompactPageHero
        kicker="01"
        eyebrowLabel="Profile / @tester"
        title="Test User"
        subtext="hello world"
      />,
    );

    const heading = screen.getByRole("heading", { name: "Test User" });
    expect(heading.getAttribute("style") || "").toMatch(/Space Grotesk/i);

    const eyebrow = screen.getByText("Profile / @tester").parentElement;
    expect(eyebrow?.getAttribute("style") || "").toMatch(/JetBrains Mono/i);
  });

  it("renders kicker + eyebrow label + subtext and uses semantic tokens (no hardcoded colors)", () => {
    const { container } = render(
      <CompactPageHero
        kicker="00"
        eyebrowLabel="My Account / Settings"
        title="Settings"
        subtext="Manage your profile."
      />,
    );

    expect(screen.getByText("00")).toBeInTheDocument();
    expect(screen.getByText("My Account / Settings")).toBeInTheDocument();
    expect(screen.getByText("Manage your profile.")).toBeInTheDocument();

    // Guardrail: no non-brand hex colors leaked into the shared hero
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
});
