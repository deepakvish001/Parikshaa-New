import { test, expect } from "@playwright/test";

/**
 * Visual regression for ApexFooter background layers.
 *
 * Captures the footer at mobile / tablet / desktop widths so that any drift
 * in radial glow, diagonal streak opacity, shimmer timing, or layer ordering
 * shows up as a pixel diff against the committed baseline.
 *
 * Baselines are written on the first run (`--update-snapshots`) and are
 * intentionally scoped to the footer element only to avoid false positives
 * from unrelated hero/marquee animation frames above it.
 */
const viewports = [
  { name: "mobile", width: 390, height: 900 },
  { name: "tablet", width: 834, height: 1000 },
  { name: "desktop", width: 1440, height: 1000 },
];

for (const vp of viewports) {
  test(`ApexFooter visual — ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Freeze animations so the shimmer/marquee don't produce flaky diffs.
    await page.addStyleTag({
      content: `*, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
      }`,
    });

    const footer = page.locator("footer#footer");
    await footer.scrollIntoViewIfNeeded();
    // Let in-view framer-motion transitions settle.
    await page.waitForTimeout(400);

    await expect(footer).toHaveScreenshot(`apex-footer-${vp.name}.png`, {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
}
