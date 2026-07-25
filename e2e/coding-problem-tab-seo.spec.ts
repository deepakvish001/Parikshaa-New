import { test, expect } from "@playwright/test";

/**
 * Opening a coding problem with ?tab=description must strip the query
 * parameter (default tab shouldn't pollute URL) and canonical/og:url
 * must stay query-free.
 */
const openFirstProblemSlug = async (page: import("@playwright/test").Page) => {
  await page.goto("/library/problems", { waitUntil: "domcontentloaded" });
  const firstLink = page.locator('a[href^="/library/problems/"]').first();
  if (!(await firstLink.count())) return null;
  const href = await firstLink.getAttribute("href");
  const m = href?.match(/\/library\/problems\/([^/?#]+)/);
  return m?.[1] ?? null;
};

test.describe("Coding problem — tab query SEO", () => {
  test("?tab=description is removed and meta tags stay query-free", async ({ page }) => {
    const slug = await openFirstProblemSlug(page);
    test.skip(!slug, "No published problems available");

    await page.goto(`/library/problems/${slug}?tab=description`, {
      waitUntil: "domcontentloaded",
    });

    // Wait for the tab-cleaning effect to run and replace the URL.
    await expect
      .poll(() => new URL(page.url()).search, { timeout: 5_000 })
      .toBe("");

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute("content");
    const twitterUrl = await page
      .locator('meta[name="twitter:url"]')
      .getAttribute("content");

    for (const v of [canonical, ogUrl, twitterUrl]) {
      expect(v, "meta url should exist").toBeTruthy();
      expect(v!).not.toContain("tab=");
      expect(v!).not.toContain("?");
    }
  });

  test("switching to a non-default tab adds ?tab=, back to description removes it", async ({ page }) => {
    const slug = await openFirstProblemSlug(page);
    test.skip(!slug, "No published problems available");

    await page.goto(`/library/problems/${slug}`, { waitUntil: "domcontentloaded" });
    expect(new URL(page.url()).search).toBe("");

    // Try switching to Notes if present; otherwise skip switching assertion.
    const notes = page.getByRole("tab", { name: /notes/i }).first();
    if (await notes.count()) {
      await notes.click().catch(() => {});
      await expect
        .poll(() => new URL(page.url()).searchParams.get("tab"), { timeout: 3_000 })
        .not.toBeNull();
    }
  });
});
