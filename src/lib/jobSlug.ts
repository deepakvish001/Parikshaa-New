// SEO-friendly slug helpers for jobs and categories.
// Job URL format:  /jobs/<title>-at-<company>-<uuid>
// Category URL:    /jobs/<slug>   (e.g. /jobs/internships, /jobs/engineering)

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function slugify(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function jobSlug(job: {
  id: string;
  title: string;
  company: string;
}): string {
  const t = slugify(job.title) || "role";
  const c = slugify(job.company) || "company";
  return `${t}-at-${c}-${job.id}`;
}

/** Extract the job UUID from a slug or return the raw value if it's already a UUID. */
export function parseJobSlug(slugOrId: string | undefined | null): string | null {
  if (!slugOrId) return null;
  const m = slugOrId.match(UUID_RE);
  return m ? m[0] : slugOrId;
}
