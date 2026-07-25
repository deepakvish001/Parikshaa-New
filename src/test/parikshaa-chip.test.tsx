import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ParikshaaChip } from "@/components/common/ParikshaaChip";
import { ActionIcon } from "@/components/common/ActionIcon";
import { Plus } from "lucide-react";

/**
 * Brand-guardrail tests for /learn interactive primitives.
 *
 * These tests don't assert pixel-perfect snapshots — JSDOM doesn't
 * evaluate Tailwind. Instead they snapshot the *className strings* the
 * chips/buttons render with, so any future change that introduces a
 * non-brand color (sky/violet/teal/etc.) in an idle / hover / active /
 * selected / focus-visible class will fail loudly here.
 */

const renderChip = (ui: React.ReactElement) =>
  render(<TooltipProvider>{ui}</TooltipProvider>);

const BRAND_TOKENS = ["amber", "orange"];
const FORBIDDEN_TOKENS = [
  "sky-",
  "violet-",
  "fuchsia-",
  "indigo-",
  "cyan-",
  "teal-",
  "pink-",
  "purple-",
  "yellow-",
  "blue-",
  "green-",
  "red-",
];

/** Pull the full className string from the first interactive element. */
const classOf = (container: HTMLElement) => {
  const el = container.querySelector("button, span[data-active], span");
  if (!el) throw new Error("no chip rendered");
  return el.className;
};

const expectBrandSafe = (cls: string) => {
  // every hover/active/selected/focus modifier touched must reference amber or orange
  const stateClasses = cls
    .split(/\s+/)
    .filter((c) =>
      /^(hover:|active:|focus-visible:|focus:|data-\[active=true\]:)/.test(c),
    );
  for (const c of stateClasses) {
    const usesBrand = BRAND_TOKENS.some((t) => c.includes(t));
    const usesNeutral = /(border|bg-muted|bg-transparent|bg-gradient-to|text-foreground|text-muted|ring-offset|outline-none|scale-|opacity-|shadow-)/.test(
      c,
    );
    expect(
      usesBrand || usesNeutral,
      `state class "${c}" must use amber/orange (or a neutral token), full className: ${cls}`,
    ).toBe(true);
  }
  for (const bad of FORBIDDEN_TOKENS) {
    expect(cls.includes(bad), `className must not include "${bad}"`).toBe(false);
  }
};

describe("ParikshaaChip — brand state guardrails", () => {
  it("idle solid chip exposes amber tokens only", () => {
    const { container } = renderChip(<ParikshaaChip>Idle</ParikshaaChip>);
    const cls = classOf(container);
    expect(cls).toContain("focus-parikshaa");
    expectBrandSafe(cls);
  });

  it("selected chip flips data-active and aria-pressed", () => {
    const { container } = renderChip(
      <ParikshaaChip selected>Selected</ParikshaaChip>,
    );
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("data-active")).toBe("true");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expectBrandSafe(btn.className);
  });

  it("outline variant keeps hover/active/selected within orange→amber", () => {
    const { container } = renderChip(
      <ParikshaaChip variant="outline" selected>
        Outline
      </ParikshaaChip>,
    );
    const cls = classOf(container);
    expect(cls).toContain("focus-parikshaa");
    expect(cls).toMatch(/hover:(border|bg|text)-(amber|orange)/);
    expect(cls).toMatch(/active:(bg|text)-(amber|orange)/);
    expect(cls).toMatch(/data-\[active=true\]:(border|bg|text)-(amber|orange)/);
    expectBrandSafe(cls);
  });

  it("ghost variant keeps hover/active within orange→amber", () => {
    const { container } = renderChip(
      <ParikshaaChip variant="ghost">Ghost</ParikshaaChip>,
    );
    const cls = classOf(container);
    expect(cls).toContain("focus-parikshaa");
    expect(cls).toMatch(/hover:(text|bg|border)-(amber|orange)/);
    expect(cls).toMatch(/active:(text|bg)-(amber|orange)/);
    expectBrandSafe(cls);
  });

  it("renders as span when as='span' and skips button-only attrs", () => {
    const { container } = renderChip(
      <ParikshaaChip as="span" variant="ghost" selected>
        Label
      </ParikshaaChip>,
    );
    expect(container.querySelector("button")).toBeNull();
    const span = container.querySelector("span[data-active='true']")!;
    expect(span).not.toBeNull();
    expectBrandSafe(span.className);
  });
});

describe("ParikshaaChip — semantic tone overrides", () => {
  const cases = [
    { tone: "completed", hue: "emerald", needsBrandSafe: false },
    { tone: "missed", hue: "rose", needsBrandSafe: false },
    { tone: "today", hue: "amber", needsBrandSafe: true },
    { tone: "future", hue: "orange", needsBrandSafe: true },
  ] as const;

  it.each(cases)("$tone tone swaps hue to $hue while keeping shared behavior", ({ tone, hue }) => {
    const { container } = renderChip(
      <ParikshaaChip tone={tone}>x</ParikshaaChip>,
    );
    const cls = container.querySelector("button")!.className;
    // shared focus + transition behavior stays
    expect(cls).toContain("focus-parikshaa");
    expect(cls).toContain("transition-colors");
    // hue family is consistent across idle/hover/active/selected
    expect(cls).toMatch(new RegExp(`(border|bg|text)-${hue}-`));
    expect(cls).toMatch(new RegExp(`hover:(border|bg|text)-${hue}-`));
    // active may dip into the brand orange for brand-family tones (today/future)
    expect(cls).toMatch(new RegExp(`active:(bg|text)-(${hue}|amber|orange)-`));
    expect(cls).toMatch(new RegExp(`data-\\[active=true\\]:(border|bg|text)-(${hue}|amber|orange)-`));
  });

  it("tone='today' includes a stronger ring for emphasis", () => {
    const { container } = renderChip(
      <ParikshaaChip tone="today">today</ParikshaaChip>,
    );
    expect(container.querySelector("button")!.className).toMatch(/ring-1/);
  });

  it("brand tone is the default and matches solid amber/orange combo", () => {
    const { container } = renderChip(<ParikshaaChip>brand</ParikshaaChip>);
    const cls = container.querySelector("button")!.className;
    expect(cls).toMatch(/(amber|orange)-/);
    expectBrandSafe(cls);
  });
});


describe("ActionIcon — focus & brand guardrails", () => {
  it("uses the shared focus-parikshaa class for keyboard focus", () => {
    const { container } = renderChip(
      <ActionIcon icon={Plus} label="Add item" />,
    );
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("focus-parikshaa");
    expect(btn.getAttribute("aria-label")).toBe("Add item");
  });

  it("default tone hover/active uses brand-safe colors", () => {
    const { container } = renderChip(
      <ActionIcon icon={Plus} label="Add" active />,
    );
    const cls = container.querySelector("button")!.className;
    // active state is amber-rooted
    expect(cls).toMatch(/(amber|orange)-/);
    // never the explicitly forbidden hues in state classes
    for (const bad of ["sky-", "violet-", "fuchsia-", "indigo-", "cyan-", "teal-", "pink-", "purple-", "yellow-"]) {
      const stateBad = cls.split(/\s+/).some((c) =>
        /^(hover:|active:|focus-visible:)/.test(c) && c.includes(bad),
      );
      expect(stateBad, `state classes contain forbidden "${bad}"`).toBe(false);
    }
  });

  it("amber tone keeps both base and active in amber/orange", () => {
    const { container, rerender } = renderChip(
      <ActionIcon icon={Plus} label="Add" tone="amber" />,
    );
    expect(container.querySelector("button")!.className).toMatch(/amber/);
    rerender(
      <TooltipProvider>
        <ActionIcon icon={Plus} label="Add" tone="amber" active />
      </TooltipProvider>,
    );
    expect(container.querySelector("button")!.className).toMatch(/amber/);
  });
});

describe("ParikshaaChip — snapshots (idle / selected per variant)", () => {
  it.each([
    ["solid", false],
    ["solid", true],
    ["outline", false],
    ["outline", true],
    ["ghost", false],
    ["ghost", true],
  ] as const)("%s variant (selected=%s)", (variant, selected) => {
    const { container } = renderChip(
      <ParikshaaChip variant={variant} selected={selected}>
        Chip
      </ParikshaaChip>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
