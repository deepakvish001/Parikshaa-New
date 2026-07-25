import { test, expect } from "@playwright/test";
import {
  BASE_URL,
  fetchActiveJobs,
  jobSlug,
} from "../scripts/job-sitemap-fixtures.mjs";

// Pick the first active job with an apply_url for the happy-path checks, and
// (if one exists) a job without an apply_url for the empty-state check.
async function pickJobs() {
  const jobs = await fetchActiveJobs();
  const withUrl = jobs.find(
    (j: any) => j?.id && j?.title && j?.company && j?.apply_url,
  );
  const withoutUrl = jobs.find(
    (j: any) => j?.id && j?.title && j?.company && !j?.apply_url,
  );
  return { withUrl, withoutUrl };
}

test.describe("Jobs — Apply flow", () => {
  test("both Apply buttons navigate to /jobs/<slug>/apply in the same page", async ({ page }) => {
    const { withUrl } = await pickJobs();
    test.skip(!withUrl, "No active job with apply_url available");
    const slug = jobSlug(withUrl!);
    const detailUrl = `/jobs/${slug}`;
    await page.goto(detailUrl, { waitUntil: "domcontentloaded" });

    const applyButtons = page.getByRole("link", { name: /apply (now|on )/i });
    const count = await applyButtons.count();
    expect(count, "expected two apply CTAs on the detail page").toBeGreaterThanOrEqual(2);

    for (let i = 0; i < Math.min(count, 2); i++) {
      if (i > 0) {
        await page.goto(detailUrl, { waitUntil: "domcontentloaded" });
      }
      const link = applyButtons.nth(i);
      const href = await link.getAttribute("href");
      expect(href).toBe(`/jobs/${slug}/apply`);

      await link.click({ modifiers: [] });
      await page.waitForURL(`**/jobs/${slug}/apply`);
      expect(new URL(page.url()).pathname).toBe(`/jobs/${slug}/apply`);
    }
  });

  test("countdown UI: Continue is disabled until 0, then enables", async ({ page }) => {
    const { withUrl } = await pickJobs();
    test.skip(!withUrl, "No active job with apply_url available");
    const slug = jobSlug(withUrl!);

    await page.goto(`/jobs/${slug}/apply`, { waitUntil: "domcontentloaded" });

    const continueBtn = page.getByTestId("apply-continue");
    await expect(continueBtn).toBeDisabled();
    const countdown = page.getByTestId("apply-countdown");
    await expect(countdown).toHaveText(/^[1-9]s$/);

    // Countdown is 4s; give it a comfortable margin.
    await expect(continueBtn).toBeEnabled({ timeout: 8000 });
    await expect(continueBtn).toHaveText(new RegExp(`Continue to ${withUrl!.company}`));
  });

  test("empty state when the job has no apply_url", async ({ page }) => {
    const { withoutUrl } = await pickJobs();
    test.skip(
      !withoutUrl,
      "No active job without apply_url — empty-state path not exercisable",
    );
    const slug = jobSlug(withoutUrl!);
    await page.goto(`/jobs/${slug}/apply`, { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/No application link available/i)).toBeVisible();
    await expect(page.getByTestId("apply-continue")).toHaveCount(0);
  });
});
