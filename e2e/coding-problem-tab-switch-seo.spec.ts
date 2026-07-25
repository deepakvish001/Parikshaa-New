import { test, expect, Page } from "@playwright/test";

const openFirstProblemSlug = async (page: Page) => {
  await page.goto("/library/problems", { waitUntil: "domcontentloaded" });
  const firstLink = page.locator('a[href^="/library/problems/"]').first();
  if (!(await firstLink.count())) return null;
  const href = await firstLink.getAttribute("href");
  const m = href?.match(/\/library\/problems\/([^/?#]+)/);
  return m?.[1] ?? null;
};

const readMetaUrls = async (page: Page) => ({
  canonical: await page
    .locator('link[rel="canonical"]')
    .getAttribute("href"),
  ogUrl: await page
    .locator('meta[property="og:url"]')
    .getAttribute("content"),
  twitterUrl: await page
    .locator('meta[name="twitter:url"]')
    .getAttribute("content"),
});

const expectAllQueryFree = (vals: (string | null)[]) => {
  for (const v of vals) {
    expect(v, "meta url should exist").toBeTruthy();
    expect(v!).not.toContain("?");
    expect(v!).not.toContain("tab=");
  }
};

test.describe("Coding problem — tab switching SEO", () => {
  test("switching Description → other tab → back keeps meta query-free on Description", async ({
    page,
  }) => {
    const slug = await openFirstProblemSlug(page);
    test.skip(!slug, "No published problems available");

    await page.goto(`/library/problems/${slug}`, {
      waitUntil: "domcontentloaded",
    });
    expect(new URL(page.url()).search).toBe("");
    expectAllQueryFree(Object.values(await readMetaUrls(page)));

    const notes = page.getByRole("tab", { name: /notes/i }).first();
    if (!(await notes.count())) {
      test.skip(true, "Notes tab not present");
      return;
    }
    await notes.click().catch(() => {});
    await expect
      .poll(() => new URL(page.url()).searchParams.get("tab"), {
        timeout: 3_000,
      })
      .not.toBeNull();

    const desc = page.getByRole("tab", { name: /description/i }).first();
    await desc.click().catch(() => {});
    await expect
      .poll(() => new URL(page.url()).search, { timeout: 3_000 })
      .toBe("");

    expectAllQueryFree(Object.values(await readMetaUrls(page)));
  });

  test("extra query params + tab=description → only tab is stripped from URL; meta stays query-free", async ({
    page,
  }) => {
    const slug = await openFirstProblemSlug(page);
    test.skip(!slug, "No published problems available");

    await page.goto(
      `/library/problems/${slug}?ref=share&tab=description&utm_source=test`,
      { waitUntil: "domcontentloaded" },
    );

    // The tab-cleaning effect strips ?tab=description; other params remain in the URL.
    await expect
      .poll(() => new URL(page.url()).searchParams.get("tab"), {
        timeout: 5_000,
      })
      .toBeNull();

    const url = new URL(page.url());
    expect(url.searchParams.get("ref")).toBe("share");
    expect(url.searchParams.get("utm_source")).toBe("test");

    // Meta tags (canonical/og/twitter) must remain fully query-free.
    expectAllQueryFree(Object.values(await readMetaUrls(page)));
  });
});
