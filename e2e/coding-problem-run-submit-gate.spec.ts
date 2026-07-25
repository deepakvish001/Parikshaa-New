import { test, expect, Page } from "@playwright/test";

const openFirstProblemSlug = async (page: Page) => {
  await page.goto("/library/problems", { waitUntil: "domcontentloaded" });
  const firstLink = page.locator('a[href^="/library/problems/"]').first();
  if (!(await firstLink.count())) return null;
  const href = await firstLink.getAttribute("href");
  const m = href?.match(/\/library\/problems\/([^/?#]+)/);
  return m?.[1] ?? null;
};

test.describe("Coding problem — guest Run/Submit SignInGate", () => {
  test("Run shows the run-specific sign-in gate", async ({ page }) => {
    const slug = await openFirstProblemSlug(page);
    test.skip(!slug, "No published problems available");

    await page.goto(`/library/problems/${slug}`, { waitUntil: "domcontentloaded" });

    // The Run button lives in the top toolbar / floating action bar.
    const runBtn = page.getByRole("button", { name: /^run( code)?/i }).first();
    await runBtn.click();

    const gate = page.locator('[data-testid="sign-in-gate"][data-action="run"]');
    await expect(gate).toBeVisible();
    await expect(gate).toContainText(/sign in to run your code/i);
    await expect(gate).toContainText(/execute your solution/i);
    await expect(gate.getByRole("button", { name: /sign in to run code/i })).toBeVisible();
    await expect(gate.getByRole("button", { name: /create account to run code/i })).toBeVisible();
  });

  test("Submit shows the submit-specific sign-in gate", async ({ page }) => {
    const slug = await openFirstProblemSlug(page);
    test.skip(!slug, "No published problems available");

    await page.goto(`/library/problems/${slug}`, { waitUntil: "domcontentloaded" });

    const submitBtn = page.getByRole("button", { name: /^submit( solution)?/i }).first();
    await submitBtn.click();

    const gate = page.locator('[data-testid="sign-in-gate"][data-action="submit"]');
    await expect(gate).toBeVisible();
    await expect(gate).toContainText(/sign in to submit your solution/i);
    await expect(gate).toContainText(/track your progress/i);
    await expect(gate.getByRole("button", { name: /sign in to submit/i })).toBeVisible();
    await expect(gate.getByRole("button", { name: /create account to submit/i })).toBeVisible();
  });
});
