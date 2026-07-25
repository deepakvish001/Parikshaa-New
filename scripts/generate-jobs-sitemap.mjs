// Postbuild: enrich dist/sitemap.xml with /jobs, /jobs/<slug>, and
// /jobs/<title>-at-<company>-<uuid> entries pulled from Supabase.
// Shares CATEGORY_SLUGS + slugify + fetchActiveJobs with the Playwright SEO
// spec via scripts/job-sitemap-fixtures.mjs so both stay perfectly in sync.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  BASE_URL,
  CATEGORY_SLUGS,
  fetchActiveJobs,
  jobSlug,
} from "./job-sitemap-fixtures.mjs";

const distPath = resolve("dist/sitemap.xml");
const publicPath = resolve("public/sitemap.xml");
const sourcePath = existsSync(distPath) ? distPath : publicPath;

if (!existsSync(sourcePath)) {
  console.warn("[jobs-sitemap] No base sitemap found, skipping.");
  process.exit(0);
}

function buildEntry(loc, lastmod, changefreq = "weekly", priority = "0.7") {
  const lm = lastmod ? `<lastmod>${lastmod.split("T")[0]}</lastmod>` : "";
  return `  <url><loc>${loc}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

const xml = readFileSync(sourcePath, "utf8");
const jobs = await fetchActiveJobs();

const jobsIndexEntry = buildEntry(`${BASE_URL}/jobs`, undefined, "daily", "0.9");
const categoryEntries = CATEGORY_SLUGS.map((slug) =>
  buildEntry(`${BASE_URL}/jobs/${slug}`, undefined, "daily", "0.8"),
);
const categorySet = new Set(CATEGORY_SLUGS);
const jobEntries = jobs
  .filter((j) => j?.id && j?.title && j?.company)
  .map((j) => ({ j, slug: jobSlug(j) }))
  // Never let a detail URL shadow a category route on the flat /jobs/<slug> scheme
  .filter(({ slug }) => !categorySet.has(slug))
  .map(({ j, slug }) =>
    buildEntry(`${BASE_URL}/jobs/${slug}`, j.posted_at, "weekly", "0.6"),
  );

// Strip any existing /jobs entries to keep the sitemap idempotent
const cleaned = xml
  .split("\n")
  .filter((l) => !/<loc>[^<]*\/jobs(\/[^<]*)?<\/loc>/.test(l))
  .join("\n");

const newBlock = [jobsIndexEntry, ...categoryEntries, ...jobEntries].join("\n");
const enriched = cleaned.replace("</urlset>", `${newBlock}\n</urlset>`);

mkdirSync(dirname(distPath), { recursive: true });
writeFileSync(distPath, enriched);
console.log(
  `[jobs-sitemap] Wrote ${distPath} with ${CATEGORY_SLUGS.length} categories and ${jobEntries.length} job${jobEntries.length === 1 ? "" : "s"}.`,
);
