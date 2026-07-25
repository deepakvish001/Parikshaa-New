import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain-JS ESM module shared with scripts/generate-jobs-sitemap.mjs
import {
  BASE_URL as FIXTURE_BASE_URL,
  CATEGORY_SLUGS,
  expectedJobLocs,
  fetchActiveJobs,
  jobSlug,
} from "../scripts/job-sitemap-fixtures.mjs";

const DEBUG_DIR = join(process.cwd(), "test-results", "seo-debug");
function dumpFile(name: string, body: string): string {
  mkdirSync(DEBUG_DIR, { recursive: true });
  const safe = name.replace(/[^a-z0-9._-]+/gi, "_").slice(0, 120);
  const path = join(DEBUG_DIR, `${Date.now()}-${safe}`);
  writeFileSync(path, body, "utf8");
  return path;
}

/**
 * SEO regression suite for the Jobs area.
 *
 * Verifies:
 *  - Every category route sets canonical + og:url to the path-based slug URL.
 *  - Every legacy entry point (query, /jobs/internships, trailing slash) redirects
 *    to the canonical slug URL with correct head tags.
 *  - Paginated views (?page=2, ?page=3) keep canonical/og:url/JSON-LD stable.
 *  - Job detail routes canonicalize to <slug>-<uuid>.
 *  - robots.txt and sitemap.xml are served correctly and the sitemap matches
 *    the expected fixture set exactly.
 *
 * All redirects are client-side (Vite SPA, no server 301/308), so we assert on
 * the final URL and head tags after navigation settles.
 */

// The build's canonical origin. Override via SEO_BASE_URL for preview/staging.
const CANONICAL_ORIGIN = process.env.SEO_BASE_URL ?? FIXTURE_BASE_URL;
const CATEGORIES = CATEGORY_SLUGS as readonly string[];

async function readHead(page: Page) {
  return page.evaluate(() => ({
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute("content") ?? null,
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? null,
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? null,
    twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute("content") ?? null,
    twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ?? null,
  }));
}

/**
 * Robust JSON-LD extraction:
 *  - Reads every <script type="application/ld+json"> block.
 *  - Handles arrays (`[{...},{...}]`) and `@graph` wrappers by flattening.
 *  - Reports invalid JSON with the offending script index + snippet so a
 *    failing assertion later gives an actionable error, not just `undefined`.
 */
async function readJsonLd(page: Page, label = "page"): Promise<any[]> {
  const raw = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (s) => s.textContent ?? "",
    ),
  );
  const parsedNodes: any[] = [];
  const parseErrors: Array<{ index: number; error: string }> = [];
  raw.forEach((text, i) => {
    if (!text.trim()) return;
    try {
      const parsed = JSON.parse(text);
      const nodes = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.["@graph"])
          ? parsed["@graph"]
          : [parsed];
      for (const n of nodes) if (n && typeof n === "object") parsedNodes.push(n);
    } catch (err) {
      parseErrors.push({ index: i, error: (err as Error).message });
    }
  });
  if (parseErrors.length > 0) {
    const dumpPath = dumpFile(
      `${label}-jsonld-raw.txt`,
      raw.map((t, i) => `--- block #${i} ---\n${t}`).join("\n\n"),
    );
    throw new Error(
      `JSON-LD parse failures on ${label}: ${JSON.stringify(parseErrors)}. ` +
        `Raw blocks dumped to ${dumpPath}.`,
    );
  }
  // Attach raw+parsed dump lazily on later assertion failure via findByType.
  (parsedNodes as any).__raw = raw;
  (parsedNodes as any).__label = label;
  return parsedNodes;
}

function findByType(blocks: any[], type: string, url = "<unknown>"): any {
  const match = blocks.find((b) => b?.["@type"] === type);
  if (!match) {
    const seen = blocks.map((b) => b?.["@type"] ?? "<no @type>").join(", ") || "<none>";
    const label = (blocks as any).__label ?? url;
    const raw: string[] = (blocks as any).__raw ?? [];
    const dumpPath = dumpFile(
      `${label}-jsonld-missing-${type}.json`,
      JSON.stringify({ url, expectedType: type, seen, raw, parsed: blocks }, null, 2),
    );
    throw new Error(
      `Expected JSON-LD @type="${type}" on ${url}, but found: [${seen}]. ` +
        `Full raw+parsed dump: ${dumpPath}.`,
    );
  }
  return match;
}

function assertAbsoluteUrl(value: string | null, label: string, url: string): void {
  if (!value) {
    throw new Error(`${label} is missing on ${url} (got null/empty).`);
  }
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      throw new Error(`bad protocol ${u.protocol}`);
    }
  } catch (err) {
    throw new Error(
      `${label} on ${url} is not an absolute URL. Got: "${value}" (${(err as Error).message}).`,
    );
  }
}

/**
 * Wait for the jobs list to stabilize so ItemList counts and card counts
 * agree. We: (1) wait for network idle, then (2) poll until the number of
 * "View …" rows is stable across two consecutive samples (300 ms apart).
 * This is stricter than networkidle alone (React can still be rendering
 * after the last request finishes).
 */
async function waitForStableRowCount(page: Page, timeoutMs = 8000): Promise<number> {
  await page.waitForLoadState("networkidle");
  const rows = page.locator('button[aria-label^="View "]');
  const deadline = Date.now() + timeoutMs;
  let last = -1;
  while (Date.now() < deadline) {
    const c = await rows.count().catch(() => 0);
    if (c === last && c >= 0) return c;
    last = c;
    await page.waitForTimeout(300);
  }
  return last;
}

type HeadTags = Awaited<ReturnType<typeof readHead>>;

/**
 * Logs every SEO-relevant meta tag with its exact value BEFORE assertions run,
 * so a failing test's stdout always contains the ground-truth head state.
 */
function logMeta(url: string, head: HeadTags): void {
  const rows = [
    ["canonical", head.canonical],
    ["og:url", head.ogUrl],
    ["og:title", head.ogTitle],
    ["og:image", head.ogImage],
    ["twitter:card", head.twitterCard],
    ["twitter:image", head.twitterImage],
  ]
    .map(([k, v]) => `    ${String(k).padEnd(14)} = ${v === null ? "<null>" : JSON.stringify(v)}`)
    .join("\n");
  // eslint-disable-next-line no-console
  console.info(`[SEO meta @ ${url}]\n${rows}`);
}

/**
 * Side-by-side canonical + og:url assertion. On failure prints:
 *   pageUrl | tag | expected | actual
 * so the mismatch is obvious without re-running with --debug.
 */
function expectHead(
  url: string,
  head: HeadTags,
  expected: { canonical: string; ogUrl?: string },
): void {
  const ogUrl = expected.ogUrl ?? expected.canonical;
  const rows = [
    { tag: "canonical", expected: expected.canonical, actual: head.canonical },
    { tag: "og:url", expected: ogUrl, actual: head.ogUrl },
  ];
  const bad = rows.filter((r) => r.actual !== r.expected);
  if (bad.length === 0) return;
  const pad = (s: string, n: number) => s.padEnd(n);
  const table = [
    `SEO head mismatch on ${url}:`,
    `  ${pad("tag", 12)} ${pad("expected", 60)} actual`,
    `  ${pad("---", 12)} ${pad("---", 60)} ---`,
    ...rows.map(
      (r) =>
        `  ${pad(r.tag, 12)} ${pad(String(r.expected), 60)} ${JSON.stringify(r.actual)}` +
        (r.actual === r.expected ? "" : "   <-- MISMATCH"),
    ),
  ].join("\n");
  throw new Error(table);
}

/** Sitemap diff reporter — dumps missing + extra loc entries, writes full sets. */
function diffSitemapSets(
  actual: Set<string>,
  expected: Set<string>,
  label: string,
): void {
  const missing = [...expected].filter((u) => !actual.has(u)).sort();
  const extra = [...actual].filter((u) => !expected.has(u)).sort();
  if (missing.length === 0 && extra.length === 0) return;
  const dumpPath = dumpFile(
    `${label}-sitemap-diff.json`,
    JSON.stringify(
      { missing, extra, expected: [...expected].sort(), actual: [...actual].sort() },
      null,
      2,
    ),
  );
  const preview = (arr: string[]) =>
    arr.slice(0, 10).map((u) => `    - ${u}`).join("\n") +
    (arr.length > 10 ? `\n    …(+${arr.length - 10} more)` : "");
  throw new Error(
    `Sitemap ${label} mismatch: ${missing.length} missing, ${extra.length} extra.\n` +
      `  Missing (in expected, not in sitemap):\n${preview(missing) || "    <none>"}\n` +
      `  Extra (in sitemap, not expected):\n${preview(extra) || "    <none>"}\n` +
      `  Full diff written to ${dumpPath}.`,
  );
}



test.describe("Jobs SEO — canonical & og:url", () => {
  test("index route sets canonical to /jobs", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page).toHaveURL(/\/jobs$/);
    const head = await readHead(page);
    logMeta("/jobs", head);
    expectHead("/jobs", head, { canonical: `${CANONICAL_ORIGIN}/jobs` });
  });

  for (const slug of CATEGORIES) {
    test(`category "${slug}" canonicalizes to /jobs/${slug}`, async ({ page }) => {
      await page.goto(`/jobs/${slug}`);
      const head = await readHead(page);
      logMeta(`/jobs/${slug}`, head);
      expectHead(`/jobs/${slug}`, head, {
        canonical: `${CANONICAL_ORIGIN}/jobs/${slug}`,
      });
    });
  }

  // Every legacy entry point must end up at the same canonical target.
  const legacyRedirects: Array<{ label: string; from: string; to: RegExp; canonical: string }> = [
    {
      label: "?category=engineering",
      from: "/jobs?category=engineering",
      to: /\/jobs\/engineering(\?|$)/,
      canonical: `${CANONICAL_ORIGIN}/jobs/engineering`,
    },
    {
      label: "?category=internships + extra params",
      from: "/jobs?category=internships&remote=1",
      to: /\/jobs\/internships\?.*remote=1/,
      canonical: `${CANONICAL_ORIGIN}/jobs/internships`,
    },
    {
      label: "/jobs/internships (canonical)",
      from: "/jobs/internships",
      to: /\/jobs\/internships$/,
      canonical: `${CANONICAL_ORIGIN}/jobs/internships`,
    },
    {
      label: "/jobs/category/engineering (legacy path)",
      from: "/jobs/category/engineering",
      to: /\/jobs\/engineering(\?|$)/,
      canonical: `${CANONICAL_ORIGIN}/jobs/engineering`,
    },
    {
      label: "/jobs/category/internships (legacy path)",
      from: "/jobs/category/internships",
      to: /\/jobs\/internships(\?|$)/,
      canonical: `${CANONICAL_ORIGIN}/jobs/internships`,
    },
    {
      label: "/jobs/ (trailing slash)",
      from: "/jobs/",
      to: /\/jobs\/?$/,
      canonical: `${CANONICAL_ORIGIN}/jobs`,
    },
  ];

  for (const r of legacyRedirects) {
    test(`legacy ${r.label} → canonical og:url`, async ({ page }) => {
      await page.goto(r.from);
      await page.waitForURL(r.to);
      const head = await readHead(page);
      logMeta(`legacy ${r.from}`, head);
      expectHead(`legacy ${r.from}`, head, { canonical: r.canonical });
      expect(head.ogTitle, `og:title empty on legacy ${r.from}`).toBeTruthy();
    });
  }

  test("job detail sets canonical to slug URL when jobs are present", async ({ page }) => {
    await page.goto("/jobs");
    // Wait for at least one Apply link — indicates the list has hydrated.
    const applyLinks = page.locator('a:has-text("Apply")');
    const count = await applyLinks.count().catch(() => 0);
    test.skip(count === 0, "No jobs available in this environment to canonicalize.");

    // Grab the first row's "Full page" link via the sheet flow — fall back to
    // navigating directly to a slugged URL derived from the DOM if available.
    const firstRow = page.locator('button[aria-label^="View "]').first();
    await firstRow.click();
    const fullPage = page.getByRole("link", { name: /full page/i });
    await fullPage.click();
    await page.waitForURL(/\/jobs\/[a-z0-9-]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    const head = await readHead(page);
    expect(head.canonical).toMatch(
      /^https:\/\/www\.parikshaa\.org\/jobs\/.+-[0-9a-f-]{36}$/,
    );
    expect(head.ogUrl).toBe(head.canonical);
  });
});

test.describe("Jobs SEO — JSON-LD structured data", () => {
  test("category page emits CollectionPage + ItemList", async ({ page }) => {
    const url = "/jobs/engineering";
    await page.goto(url);
    await waitForStableRowCount(page);
    const blocks = await readJsonLd(page, page.url());
    const collection = findByType(blocks, "CollectionPage", url);
    expect(collection.mainEntity?.["@type"], `mainEntity should be ItemList on ${url}`).toBe(
      "ItemList",
    );
    expect(collection["@context"]).toBe("https://schema.org");
    expect(collection.url).toBe(`${CANONICAL_ORIGIN}/jobs/engineering`);
    expect(Array.isArray(collection.mainEntity.itemListElement)).toBe(true);
    for (const item of collection.mainEntity.itemListElement) {
      expect(item["@type"]).toBe("ListItem");
      expect(typeof item.position).toBe("number");
      assertAbsoluteUrl(item.url, "ListItem.url", url);
      expect(item.url).toMatch(/\/jobs\//);
      expect(typeof item.name).toBe("string");
    }
  });

  test("job detail emits a valid JobPosting", async ({ page }) => {
    await page.goto("/jobs");
    await waitForStableRowCount(page);
    const rows = page.locator('button[aria-label^="View "]');
    const count = await rows.count().catch(() => 0);
    test.skip(count === 0, "No jobs available to inspect JobPosting JSON-LD.");

    await rows.first().click();
    await page.getByRole("link", { name: /full page/i }).click();
    await page.waitForURL(/\/jobs\/[a-z0-9-]+-[0-9a-f-]{36}$/i);

    const currentUrl = page.url();
    const blocks = await readJsonLd(page, page.url());
    const posting = findByType(blocks, "JobPosting", currentUrl);
    expect(posting["@context"]).toBe("https://schema.org");
    // Required fields per schema.org/JobPosting for Google rich results
    expect(typeof posting.title, `JobPosting.title should be string on ${currentUrl}`).toBe("string");
    expect(typeof posting.description).toBe("string");
    expect(typeof posting.datePosted).toBe("string");
    expect(["INTERN", "FULL_TIME", "PART_TIME", "CONTRACTOR", "TEMPORARY", "OTHER"]).toContain(
      posting.employmentType,
    );
    expect(posting.hiringOrganization?.["@type"]).toBe("Organization");
    expect(typeof posting.hiringOrganization?.name).toBe("string");
    assertAbsoluteUrl(posting.url, "JobPosting.url", currentUrl);
    expect(posting.url).toMatch(/\/jobs\//);
  });
});

test.describe("SEO infrastructure — robots.txt & sitemap.xml", () => {
  test("robots.txt exposes an absolute Sitemap URL matching the build origin", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] ?? "").toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toMatch(/^User-agent:\s*\*/m);

    const sitemapLine = body.match(/^Sitemap:\s+(\S+)\s*$/m);
    expect(sitemapLine, "robots.txt is missing a Sitemap: line").toBeTruthy();
    const sitemapUrl = sitemapLine![1];
    // Must be an absolute https URL — Google ignores relative Sitemap: values.
    expect(sitemapUrl).toMatch(/^https:\/\//);
    const parsed = new URL(sitemapUrl);
    expect(parsed.origin).toBe(CANONICAL_ORIGIN);
    expect(parsed.pathname).toBe("/sitemap.xml");
  });

  test("sitemap.xml matches the expected /jobs fixture set exactly", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] ?? "").toMatch(/xml/);
    const body = await res.text();
    expect(body).toMatch(/<urlset\b/);

    // Expected loc set is computed from the SAME fixtures the generator uses,
    // so this stays green when categories or jobs change (as long as both sides
    // are re-run against the same Supabase snapshot).
    const expected = await expectedJobLocs(CANONICAL_ORIGIN);
    const expectedAll = new Set<string>([
      expected.index,
      ...expected.categories,
      ...expected.details,
    ]);

    const actualJobLocs = Array.from(body.matchAll(/<loc>([^<]+)<\/loc>/g))
      .map((m) => m[1])
      .filter((u) => u.startsWith(`${CANONICAL_ORIGIN}/jobs`));
    const actualSet = new Set(actualJobLocs);

    // Exact match — no missing, no extra, no duplicates. On failure the
    // reporter dumps a full { missing, extra, expected, actual } JSON diff.
    if (actualJobLocs.length !== actualSet.size) {
      const dupes = actualJobLocs.filter((u, i) => actualJobLocs.indexOf(u) !== i);
      const dumpPath = dumpFile("sitemap-duplicates.json", JSON.stringify({ dupes }, null, 2));
      throw new Error(
        `sitemap has ${actualJobLocs.length - actualSet.size} duplicate /jobs loc entries. Dump: ${dumpPath}`,
      );
    }
    diffSitemapSets(actualSet, expectedAll, "jobs");

    // Belt-and-braces: every detail entry is a well-formed slug ending in a UUID.
    const jobSlugRe = new RegExp(
      `^${CANONICAL_ORIGIN.replace(/[.\/]/g, "\\$&")}/jobs/[a-z0-9-]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`,
    );
    for (const u of expected.details) {
      expect(u).toMatch(jobSlugRe);
    }
  });

  test("no job detail slug collides with a /jobs/<category> route", async ({ request }) => {
    // Flat URL scheme: /jobs/<category> and /jobs/<title>-at-<company>-<uuid>
    // share the same parent. A job whose slug happens to equal a category slug
    // would silently shadow the category page — guard against that regression.
    const expected = await expectedJobLocs(CANONICAL_ORIGIN);
    const categorySlugs = new Set(
      expected.categories.map((u) => new URL(u).pathname.replace(/^\/jobs\//, "")),
    );

    const detailSlugs = expected.details.map((u) =>
      new URL(u).pathname.replace(/^\/jobs\//, ""),
    );
    const collisions = detailSlugs.filter((s) => categorySlugs.has(s));
    expect(
      collisions,
      `job detail slug(s) collide with a category route: ${collisions.join(", ")}`,
    ).toEqual([]);

    // And the sitemap itself must not contain any /jobs/<category> loc that
    // also appears in the details list.
    const res = await request.get("/sitemap.xml");
    const body = await res.text();
    const locs = Array.from(body.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    const detailSet = new Set(expected.details);
    const shadowed = expected.categories.filter((c) => detailSet.has(c) || locs.filter((l) => l === c).length > 1);
    expect(shadowed, `category route(s) shadowed by a job detail loc: ${shadowed.join(", ")}`).toEqual([]);
  });
});

test.describe("Jobs SEO — pagination canonicalization", () => {
  // Paginated variants (?page=N, ?size=N, ?sort=…) must all collapse to the
  // category's base canonical URL so Google doesn't index thin duplicates.
  const paginated: Array<{ label: string; url: string; canonical: string }> = [
    {
      label: "category page 2",
      url: "/jobs/engineering?page=2",
      canonical: `${CANONICAL_ORIGIN}/jobs/engineering`,
    },
    {
      label: "category page 3 with size",
      url: "/jobs/engineering?page=3&size=10",
      canonical: `${CANONICAL_ORIGIN}/jobs/engineering`,
    },
    {
      label: "internships page 2",
      url: "/jobs/internships?page=2",
      canonical: `${CANONICAL_ORIGIN}/jobs/internships`,
    },
    {
      label: "index page 2 with sort=match",
      url: "/jobs?page=2&sort=match",
      canonical: `${CANONICAL_ORIGIN}/jobs`,
    },
  ];

  for (const p of paginated) {
    test(`${p.label} keeps canonical, og:url, and JSON-LD stable`, async ({ page }) => {
      await page.goto(p.url);
      await waitForStableRowCount(page);

      const head = await readHead(page);
      logMeta(p.url, head);
      expectHead(p.url, head, { canonical: p.canonical });
      expect(head.ogTitle, `og:title empty on ${p.url}`).toBeTruthy();

      const blocks = await readJsonLd(page, p.label);
      const collection = findByType(blocks, "CollectionPage", p.url);
      expect(collection.mainEntity?.["@type"]).toBe("ItemList");
      expect(collection.url).toBe(p.canonical);
      expect(Array.isArray(collection.mainEntity.itemListElement)).toBe(true);
      for (const item of collection.mainEntity.itemListElement) {
        expect(item["@type"]).toBe("ListItem");
        expect(typeof item.position).toBe("number");
        assertAbsoluteUrl(item.url, "ListItem.url", p.url);
        expect(item.url).toMatch(/\/jobs\//);
      }
    });
  }
});

test.describe("Jobs SEO — list filters keep canonical stable", () => {
  // Common filter permutations across p1 and p2. Filters like remote / location
  // / experience must NOT create indexable duplicates: canonical + og:url must
  // always resolve to the filter-less base URL for the current view.
  const filterCases: Array<{ label: string; url: string; canonical: string }> = [
    { label: "index remote=1",              url: "/jobs?remote=1",                              canonical: `${CANONICAL_ORIGIN}/jobs` },
    { label: "index location=bengaluru p1", url: "/jobs?location=bengaluru",                    canonical: `${CANONICAL_ORIGIN}/jobs` },
    { label: "index location=bengaluru p2", url: "/jobs?location=bengaluru&page=2",             canonical: `${CANONICAL_ORIGIN}/jobs` },
    { label: "index experience=entry",      url: "/jobs?experience=entry",                      canonical: `${CANONICAL_ORIGIN}/jobs` },
    { label: "engineering remote p1",       url: "/jobs/engineering?remote=1",         canonical: `${CANONICAL_ORIGIN}/jobs/engineering` },
    { label: "engineering remote p2",       url: "/jobs/engineering?remote=1&page=2",  canonical: `${CANONICAL_ORIGIN}/jobs/engineering` },
    { label: "engineering experience=mid",  url: "/jobs/engineering?experience=mid",   canonical: `${CANONICAL_ORIGIN}/jobs/engineering` },
    { label: "internships location=remote", url: "/jobs/internships?location=remote",  canonical: `${CANONICAL_ORIGIN}/jobs/internships` },
  ];

  for (const c of filterCases) {
    test(`${c.label} → canonical + og:url = base`, async ({ page }) => {
      await page.goto(c.url);
      await waitForStableRowCount(page);
      const head = await readHead(page);
      logMeta(c.url, head);
      expectHead(c.url, head, { canonical: c.canonical });
    });
  }
});

test.describe("Jobs SEO — social preview tags", () => {
  test("category page exposes absolute og:image + twitter:card", async ({ page }) => {
    const url = "/jobs/engineering";
    await page.goto(url);
    await waitForStableRowCount(page);
    const head = await readHead(page);
    logMeta(url, head);
    expect(head.twitterCard, `twitter:card missing on ${url}`).toBeTruthy();
    expect(
      ["summary", "summary_large_image"],
      `twitter:card must be summary|summary_large_image, got "${head.twitterCard}" on ${url}`,
    ).toContain(head.twitterCard);
    assertAbsoluteUrl(head.ogImage, "og:image", url);
    if (head.twitterImage) {
      assertAbsoluteUrl(head.twitterImage, "twitter:image", url);
      expect(
        head.twitterImage,
        `twitter:image ("${head.twitterImage}") must equal og:image ("${head.ogImage}") on ${url}`,
      ).toBe(head.ogImage);
    }
  });

  test("job detail exposes absolute og:image + twitter:card", async ({ page }) => {
    const jobs = await fetchActiveJobs();
    test.skip(jobs.length === 0, "No jobs available for social-tag assertion.");
    const slug = jobSlug(jobs[0]);
    const url = `/jobs/${slug}`;
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    const head = await readHead(page);
    logMeta(url, head);
    expect(head.twitterCard, `twitter:card missing on ${url}`).toBeTruthy();
    expect(
      ["summary", "summary_large_image"],
      `twitter:card must be summary|summary_large_image, got "${head.twitterCard}" on ${url}`,
    ).toContain(head.twitterCard);
    assertAbsoluteUrl(head.ogImage, "og:image", url);
    if (head.twitterImage) {
      assertAbsoluteUrl(head.twitterImage, "twitter:image", url);
      expect(head.twitterImage).toBe(head.ogImage);
    }
  });
});

test.describe("Jobs SEO — JobPosting reflects visible content on every detail route", () => {
  test("each detail route: JSON-LD title/company/url match visible values", async ({ page }) => {
    const jobs = await fetchActiveJobs();
    test.skip(jobs.length === 0, "No jobs available for per-detail JobPosting sweep.");
    // Cap the sweep so CI stays fast but still covers a representative sample.
    const sample = jobs.slice(0, Math.min(jobs.length, 8));

    for (const j of sample) {
      const slug = jobSlug(j);
      const canonical = `${CANONICAL_ORIGIN}/jobs/${slug}`;
      const url = `/jobs/${slug}`;
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      const head = await readHead(page);
      logMeta(url, head);
      expectHead(url, head, { canonical });

      const blocks = await readJsonLd(page, `detail-${slug}`);
      const posting = findByType(blocks, "JobPosting", url);

      // JSON-LD ↔ canonical URL agreement
      expect(posting.url, `JobPosting.url should equal canonical on ${url}`).toBe(canonical);

      // JSON-LD ↔ fixture data agreement (source of truth for title/company)
      expect(String(posting.title).trim()).toBe(String(j.title).trim());
      expect(String(posting.hiringOrganization?.name).trim()).toBe(String(j.company).trim());

      // JSON-LD ↔ visible DOM agreement
      const bodyText = (await page.textContent("body")) ?? "";
      expect(bodyText).toContain(String(j.title).trim());
      expect(bodyText).toContain(String(j.company).trim());
    }
  });
});

test.describe("Jobs SEO — ItemList accuracy across category & index pagination", () => {
  // Each entry: navigate, then assert ListItem URLs are well-formed job-detail
  // URLs, positions are 1..N contiguous, and the count matches the number of
  // visible job cards on the page.
  const listCases: Array<{ label: string; url: string }> = [
    { label: "engineering p1",         url: "/jobs/engineering" },
    { label: "engineering p2",         url: "/jobs/engineering?page=2" },
    { label: "internships p1",         url: "/jobs/internships" },
    { label: "internships p2",         url: "/jobs/internships?page=2" },
    { label: "index p1",               url: "/jobs" },
    { label: "index p2",               url: "/jobs?page=2" },
  ];

  for (const c of listCases) {
    test(`${c.label}: ItemList URLs + count match rendered cards`, async ({ page }) => {
      await page.goto(c.url);
      const visible = await waitForStableRowCount(page);

      const blocks = await readJsonLd(page, page.url());
      const collection = findByType(blocks, "CollectionPage", c.url);
      expect(collection.mainEntity?.["@type"], `mainEntity should be ItemList on ${c.url}`).toBe(
        "ItemList",
      );

      const items: any[] = collection.mainEntity.itemListElement ?? [];
      // Positions must be 1..N contiguous.
      items.forEach((it, idx) => {
        expect(it["@type"]).toBe("ListItem");
        expect(it.position, `ListItem[${idx}].position on ${c.url}`).toBe(idx + 1);
        assertAbsoluteUrl(it.url, `ListItem[${idx}].url`, c.url);
        expect(it.url, `ListItem[${idx}].url must be slug-<uuid> on ${c.url}`).toMatch(
          /\/jobs\/[a-z0-9-]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      });

      // No duplicate URLs inside a single ItemList.
      const urls = items.map((i) => i.url);
      expect(new Set(urls).size, `duplicate ItemList URLs on ${c.url}`).toBe(urls.length);

      // Count matches visible job rows once the list has hydrated (stable count).
      if (visible > 0) {
        expect(
          items.length,
          `ItemList count (${items.length}) != rendered rows (${visible}) on ${c.url}`,
        ).toBe(visible);
      }
    });
  }
});
