import { Navigate, useParams } from "react-router-dom";
import Jobs from "./Jobs";
import JobDetail from "./JobDetail";

// Category slugs — kept in sync with CATEGORIES in src/pages/Jobs.tsx and
// scripts/job-sitemap-fixtures.mjs. If the URL param matches one of these,
// render the category listing; otherwise treat it as a job-detail slug.
const CATEGORY_SLUGS = new Set([
  "internships",
  "engineering",
  "design",
  "data",
  "product",
  "marketing",
  "sales",
  "support",
  "finance",
]);

// Job-detail slugs always end in a UUID.
const UUID_TAIL =
  /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Dispatcher for /jobs/:categoryOrSlug.
 *  - Known category slug → <Jobs /> (with the category active).
 *  - Slug ending in a UUID → <JobDetail />.
 *  - Anything else → fall through to <Jobs /> (unknown category = show all).
 */
export default function JobsOrDetailDispatcher() {
  const { categoryOrSlug = "" } = useParams();
  if (CATEGORY_SLUGS.has(categoryOrSlug)) return <Jobs />;
  if (UUID_TAIL.test(categoryOrSlug)) return <JobDetail />;
  return <Jobs />;
}

/** /jobs/category/:categorySlug → /jobs/:categorySlug (permanent redirect) */
export function LegacyCategoryRedirect() {
  const { categorySlug = "" } = useParams();
  const qs = typeof window !== "undefined" ? window.location.search : "";
  return <Navigate to={`/jobs/${categorySlug}${qs}`} replace />;
}
