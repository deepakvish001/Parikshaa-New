/**
 * Storybook test-runner hooks.
 *
 * Runs axe against every story via @storybook/addon-a11y config.
 * Fails CI on any WCAG 2.1 AA violation (including color-contrast).
 */
import { injectAxe, checkA11y } from "axe-playwright";
import type { TestRunnerConfig } from "@storybook/test-runner";

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await checkA11y(page, "#storybook-root", {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      },
    });
  },
};

export default config;
