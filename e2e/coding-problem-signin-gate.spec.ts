import { test, expect, Page } from "@playwright/test";

const openFirstProblemSlug = async (page: Page) => {
  await page.goto("/library/problems", { waitUntil: "domcontentloaded" });
  const firstLink = page.locator('a[href^="/library/problems/"]').first();
  if (!(await firstLink.count())) return null;
  const href = await firstLink.getAttribute("href");
  const m = href?.match(/\/library\/problems\/([^/?#]+)/);
  return m?.[1] ?? null;
};

test.describe("Coding problem — guest SignInGate", () => {
  test("Notes tab shows the sign-in gate for guests", async ({ page }) => {
    const slug = await openFirstProblemSlug(page);
    test.skip(!slug, "No published problems available");

    await page.goto(`/library/problems/${slug}`, {
      waitUntil: "domcontentloaded",
    });

    const notes = page.getByRole("tab", { name: /notes/i }).first();
    test.skip(!(await notes.count()), "Notes tab not present");
    await notes.click();

    const gate = page.locator('[data-testid="sign-in-gate"][data-action="notes"]');
    await expect(gate).toBeVisible();
    await expect(gate).toContainText(/sign in to write notes/i);
    await expect(
      gate.getByRole("button", { name: /sign in to write notes/i }),
    ).toBeVisible();
    await expect(
      gate.getByRole("button", { name: /create account to write notes/i }),
    ).toBeVisible();
  });

  test("Discussion tab shows the sign-in gate for guests", async ({ page }) => {
    const slug = await openFirstProblemSlug(page);
    test.skip(!slug, "No published problems available");

    await page.goto(`/library/problems/${slug}`, {
      waitUntil: "domcontentloaded",
    });

    const discussion = page.getByRole("tab", { name: /discussion/i }).first();
    test.skip(!(await discussion.count()), "Discussion tab not present");
    await discussion.click();

    const gate = page
      .locator('[data-testid="sign-in-gate"][data-action="discussion"]')
      .first();
    await expect(gate).toBeVisible();
    await expect(gate).toContainText(/sign in to join the discussion/i);
    await expect(
      gate.getByRole("button", { name: /sign in to comment/i }),
    ).toBeVisible();
    await expect(
      gate.getByRole("button", { name: /create account to comment/i }),
    ).toBeVisible();
  });
});
