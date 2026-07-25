import type { Meta, StoryObj } from "@storybook/react";
import { HeroHighlight } from "./HeroHighlight";

/**
 * HeroHighlight stories.
 *
 * Note: Storybook isn't currently installed in this project. This CSF3
 * file is ready to load as soon as `@storybook/react` is added — no
 * changes needed. Until then, unit coverage lives in
 * `src/test/hero-highlight.test.tsx`.
 *
 * Use the toolbar "backgrounds" control (or your Storybook theme
 * switcher) to flip between light and dark surfaces and confirm the
 * amber ring + tint stay legible.
 */
const meta: Meta<typeof HeroHighlight> = {
  title: "Landing/HeroHighlight",
  component: HeroHighlight,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#030305" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof HeroHighlight>;

/** Single-word usage — the default hero treatment (e.g. "freshers"). */
export const SingleWord: Story = {
  render: () => (
    <h1
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
      className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
    >
      Internships &amp; jobs <HeroHighlight>freshers</HeroHighlight> are landing.
    </h1>
  ),
};

/** Short word inline, to check ring padding / vertical rhythm. */
export const ShortWord: Story = {
  render: () => (
    <p className="text-2xl text-foreground">
      Built for <HeroHighlight>you</HeroHighlight> from day one.
    </p>
  ),
};

/**
 * Long word that would overflow a narrow container without `break-words`.
 * Resize the Storybook canvas to confirm the pill wraps cleanly.
 */
export const LongWordWrapping: Story = {
  render: () => (
    <div className="max-w-[220px] text-2xl leading-tight text-foreground">
      Prep for <HeroHighlight>internationalization</HeroHighlight> interviews.
    </div>
  ),
};

/**
 * Multi-line wrap — confirms `box-decoration-break: clone` repeats
 * the tint + ring on every wrapped line instead of drawing one big pill.
 */
export const MultiLineWrap: Story = {
  render: () => (
    <div className="max-w-[280px] text-2xl leading-snug text-foreground">
      Roles for <HeroHighlight>frontend and backend freshers</HeroHighlight> across India.
    </div>
  ),
};

/** Side-by-side contrast check on both theme surfaces. */
export const ContrastCheck: Story = {
  parameters: { backgrounds: { disable: true } },
  render: () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-lg bg-[#030305] p-6 text-3xl font-bold text-foreground">
        Dark · <HeroHighlight>freshers</HeroHighlight>
      </div>
      <div className="rounded-lg bg-white p-6 text-3xl font-bold text-[#0a0a0a]">
        Light · <HeroHighlight>freshers</HeroHighlight>
      </div>
    </div>
  ),
};

/** Punctuation-wrapped word — quotes, comma, parentheses shouldn't break the pill. */
export const PunctuationWrapped: Story = {
  render: () => (
    <p className="text-2xl text-foreground">
      Hiring (<HeroHighlight>freshers</HeroHighlight>), "<HeroHighlight>interns</HeroHighlight>," and more.
    </p>
  ),
};

/** Whitespace-only children — the pill should collapse gracefully, no visible artefact. */
export const WhitespaceOnly: Story = {
  render: () => (
    <p className="text-2xl text-foreground">
      before<HeroHighlight> </HeroHighlight>after
    </p>
  ),
};

/** Empty children — should render nothing visible, no errors. */
export const EmptyChildren: Story = {
  render: () => (
    <p className="text-2xl text-foreground">
      empty:[<HeroHighlight>{""}</HeroHighlight>]
    </p>
  ),
};

/** Hyphenated / slash-separated words — must stay in a single pill. */
export const HyphenatedWord: Story = {
  render: () => (
    <p className="text-2xl text-foreground">
      Roles for <HeroHighlight>full-stack/front-end</HeroHighlight> engineers.
    </p>
  ),
};

/** Very narrow viewport (320px) to prove wrap + overflow behaviour on mobile. */
export const NarrowViewport: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => (
    <div className="w-[280px] text-xl leading-tight text-foreground">
      Internships &amp; jobs <HeroHighlight>freshers</HeroHighlight> are landing right now.
    </div>
  ),
};

