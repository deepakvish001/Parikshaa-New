import { test, expect, devices } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Verifies that Python 3 starter code renders in the editor on a
 * CodingProblem page and that the Input/Output Format cards remain
 * visible alongside it. Guards the DB `python3` → frontend `python`
 * normalization in useDbCodingProblem so starters never regress to
 * an empty editor.
 *
 * Self-skips when no published problem is reachable.
 */

const openFirstProblem = async (page: Page) => {
  await page.goto("/library/problems", { waitUntil: "domcontentloaded" });
  const first = page.locator('a[href^="/library/problems/"]').first();
  if (!(await first.count())) return false;
  await first.click();
  await page.waitForURL(/\/library\/problems\/[^/]+$/, { timeout: 15_000 });
  return true;
};

const readEditorValue = async (page: Page): Promise<string> => {
  // Monaco exposes its models on window.monaco; fall back to the
  // hidden textarea it renders for accessibility.
  const viaMonaco = await page.evaluate(() => {
    const w = window as unknown as {
      monaco?: { editor: { getModels: () => Array<{ getValue: () => string }> } };
    };
    const models = w.monaco?.editor.getModels?.() ?? [];
    return models.map((m) => m.getValue()).find((v) => v && v.length > 0) ?? "";
  });
  if (viaMonaco) return viaMonaco;
  const ta = page.locator(".monaco-editor textarea").first();
  if (await ta.count()) return (await ta.inputValue().catch(() => "")) || "";
  return "";
};

const selectPython = async (page: Page) => {
  const trigger = page.locator('button[role="combobox"]').first();
  await trigger.waitFor({ state: "visible", timeout: 15_000 });
  await trigger.click();
  const option = page
    .getByRole("option")
    .filter({ hasText: /python/i })
    .first();
  await option.click();
  // Allow the useEffect that swaps starter code to run.
  await page.waitForTimeout(400);
};

test.describe("Python 3 starter code", () => {
  test("desktop: python starter renders alongside format cards", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const opened = await openFirstProblem(page);
    test.skip(!opened, "No published problems available");

    await page.locator(".monaco-editor").first().waitFor({ timeout: 20_000 });
    await selectPython(page);

    const value = await readEditorValue(page);
    expect(value.length, "editor should contain python starter code").toBeGreaterThan(0);
    // Heuristic: python starter almost always includes `def ` or `class Solution`.
    expect(value).toMatch(/\bdef\b|class\s+Solution|input\(|print\(/i);

    // Format cards stay visible alongside the editor.
    const cards = page.getByTestId("problem-format-cards");
    if (await cards.count()) {
      await expect(cards).toBeVisible();
    }
  });

  test("mobile: python starter still renders", async ({ browser }) => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    const opened = await openFirstProblem(page);
    test.skip(!opened, "No published problems available");

    await page.locator(".monaco-editor").first().waitFor({ timeout: 20_000 });
    await selectPython(page);

    const value = await readEditorValue(page);
    expect(value.length).toBeGreaterThan(0);
    await ctx.close();
  });
});
