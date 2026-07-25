import { test, expect, devices } from "@playwright/test";

/**
 * Coding problem page — Input/Output Format cards and Constraints render
 * consistently and align side-by-side on desktop / stack on mobile.
 *
 * Self-skips when no published problem is reachable so the spec is safe
 * to run against any environment.
 */

const openFirstProblem = async (page: import("@playwright/test").Page) => {
  await page.goto("/library/problems", { waitUntil: "domcontentloaded" });
  const firstLink = page
    .locator('a[href^="/library/problems/"]')
    .filter({ hasNot: page.locator("text=/^All$/") })
    .first();
  if (!(await firstLink.count())) return false;
  await firstLink.click();
  await page.waitForURL(/\/library\/problems\/[^/]+$/, { timeout: 15_000 });
  return true;
};

test.describe("Problem format sections", () => {
  test("desktop: format cards align side-by-side and constraints render", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const opened = await openFirstProblem(page);
    test.skip(!opened, "No published problems available");

    const cards = page.getByTestId("problem-format-cards");
    const constraints = page.getByTestId("problem-constraints");

    // Cards are optional per problem; constraints are near-universal.
    if (await cards.count()) {
      const input = page.getByTestId("problem-input-format");
      const output = page.getByTestId("problem-output-format");
      if ((await input.count()) && (await output.count())) {
        const inBox = await input.boundingBox();
        const outBox = await output.boundingBox();
        expect(inBox && outBox).toBeTruthy();
        // Side-by-side on desktop → same top, different x.
        expect(Math.abs((inBox!.y) - (outBox!.y))).toBeLessThan(4);
        expect(outBox!.x).toBeGreaterThan(inBox!.x);
      }
    }
    if (await constraints.count()) {
      await expect(constraints).toBeVisible();
    }
  });

  test("mobile: format cards stack vertically", async ({ browser }) => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    const opened = await openFirstProblem(page);
    test.skip(!opened, "No published problems available");

    const input = page.getByTestId("problem-input-format");
    const output = page.getByTestId("problem-output-format");
    if ((await input.count()) && (await output.count())) {
      const inBox = await input.boundingBox();
      const outBox = await output.boundingBox();
      expect(inBox && outBox).toBeTruthy();
      // Stacked on mobile → output starts below input.
      expect(outBox!.y).toBeGreaterThan(inBox!.y + (inBox!.height - 4));
    }
    await ctx.close();
  });
});
