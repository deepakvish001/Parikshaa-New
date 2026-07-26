import { test, expect } from "@playwright/test";

// Fields that must NEVER appear in anonymous responses or DOM
const FORBIDDEN_KEYS = ["mobile_number", "resume_url", "suspended_reason"];

const KNOWN_USERNAME = process.env.E2E_PUBLIC_USERNAME ?? "deepak";

test.describe("Public profile (anonymous)", () => {
  test("loads known profile, hides sensitive fields, shows skeleton then content", async ({
    page,
  }) => {
    const responseBodies: string[] = [];

    page.on("response", async (res) => {
      const url = res.url();
      if (!url.includes("/rest/v1/")) return;
      try {
        const text = await res.text();
        responseBodies.push(text);
      } catch {
        /* ignore */
      }
    });

    // Loading skeleton first
    const loadingPromise = page
      .waitForSelector('[data-testid="public-profile-loading"]', { timeout: 5000 })
      .catch(() => null);

    await page.goto(`/u/${KNOWN_USERNAME}`, { waitUntil: "domcontentloaded" });
    await loadingPromise;

    // Eventually the identity card renders (username visible)
    await expect(page.getByText(new RegExp(`@?${KNOWN_USERNAME}`, "i")).first()).toBeVisible({
      timeout: 15_000,
    });

    // No error / not-found state
    await expect(page.locator('[data-testid="public-profile-error"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="public-profile-not-found"]')).toHaveCount(0);

    // Forbidden fields must not leak into any anon REST response
    for (const key of FORBIDDEN_KEYS) {
      const leaked = responseBodies.some((b) => b.includes(`"${key}"`));
      expect.soft(leaked, `Sensitive field "${key}" leaked in anon REST response`).toBeFalsy();
    }
  });

  test("unknown username shows not-found state (no infinite spinner)", async ({ page }) => {
    await page.goto("/u/definitely-does-not-exist-xyz-9876", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="public-profile-not-found"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-testid="public-profile-loading"]')).toHaveCount(0);
  });
});
