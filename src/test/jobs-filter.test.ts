import { describe, it, expect } from "vitest";
import {
  filterJobs,
  jobMatchesCategory,
  computeCategoryCounts,
  type JobLike,
  type CategoryLike,
} from "@/pages/jobs/filter";

const mk = (o: Partial<JobLike>): JobLike => ({
  id: o.id ?? Math.random().toString(),
  company: o.company ?? "Acme",
  title: o.title ?? "Software Engineer",
  role_type: o.role_type ?? "Fresher",
  location: o.location ?? "Remote",
  is_remote: o.is_remote ?? false,
  tags: o.tags ?? [],
  posted_at: o.posted_at ?? new Date().toISOString(),
});

const engineering: CategoryLike = {
  slug: "engineering",
  keywords: ["engineer", "developer", "software"],
};

describe("filterJobs", () => {
  const jobs: JobLike[] = [
    mk({ id: "1", company: "Google", title: "Backend Engineer Intern", role_type: "Internship", is_remote: true, tags: ["node"] }),
    mk({ id: "2", company: "Figma", title: "Product Designer", role_type: "Fresher", is_remote: false, tags: ["figma"] }),
    mk({ id: "3", company: "Stripe", title: "Frontend Developer", role_type: "Fresher", is_remote: true, tags: ["react"] }),
  ];

  it("returns all jobs by default", () => {
    expect(filterJobs(jobs)).toHaveLength(3);
  });

  it("narrows results by search query (hero search behaviour)", () => {
    const res = filterJobs(jobs, { query: "google" });
    expect(res.map((j) => j.id)).toEqual(["1"]);
  });

  it("combines search with an active category", () => {
    const res = filterJobs(jobs, { query: "intern", category: engineering });
    expect(res.map((j) => j.id)).toEqual(["1"]);
  });

  it("respects role + remote filters alongside search", () => {
    const res = filterJobs(jobs, { query: "e", role: "Fresher", remoteOnly: true });
    expect(res.map((j) => j.id)).toEqual(["3"]);
  });

  it("returns empty when category has no matching jobs", () => {
    const design: CategoryLike = { slug: "design", keywords: ["designer"] };
    const res = filterJobs(jobs, { query: "engineer", category: design });
    expect(res).toHaveLength(0);
  });

  it("simulates refresh: new job list flows straight through the filter", () => {
    const refreshed = [...jobs, mk({ id: "4", company: "Vercel", title: "DX Engineer", role_type: "Fresher", is_remote: true })];
    const res = filterJobs(refreshed, { query: "vercel" });
    expect(res.map((j) => j.id)).toEqual(["4"]);
  });

  it("jobMatchesCategory matches on title keywords", () => {
    expect(jobMatchesCategory(jobs[0], engineering)).toBe(true);
    expect(jobMatchesCategory(jobs[1], engineering)).toBe(false);
  });
});

describe("category integration (tile click → listings)", () => {
  const design: CategoryLike = { slug: "design", keywords: ["design", "ui", "ux"] };
  const data: CategoryLike = { slug: "data", keywords: ["data", "analyst", "ml"] };
  const cats = [engineering, design, data];

  const jobs: JobLike[] = [
    mk({ id: "e1", title: "Backend Engineer", role_type: "Fresher", is_remote: true }),
    mk({ id: "e2", title: "Frontend Developer", role_type: "Internship", is_remote: false }),
    mk({ id: "d1", title: "Product Designer", role_type: "Fresher", is_remote: false }),
    mk({ id: "a1", title: "Data Analyst", role_type: "Internship", is_remote: true }),
  ];

  it("clicking a category tile narrows the visible list", () => {
    // simulate: user clicks Engineering tile → category becomes engineering
    const visible = filterJobs(jobs, { category: engineering });
    expect(visible.map((j) => j.id).sort()).toEqual(["e1", "e2"]);
  });

  it("counts reflect the currently applied search/role/remote filters", () => {
    const counts = computeCategoryCounts(jobs, cats, {
      role: "Fresher",
      remoteOnly: true,
    });
    expect(counts).toEqual({ engineering: 1, design: 0, data: 0 });
  });

  it("counts update when the search query changes", () => {
    const before = computeCategoryCounts(jobs, cats);
    const after = computeCategoryCounts(jobs, cats, { query: "data" });
    expect(before.data).toBe(1);
    expect(after.engineering).toBe(0);
    expect(after.data).toBe(1);
  });

  it("selected category with no matching jobs yields empty state", () => {
    // Design + Internship only → empty
    const visible = filterJobs(jobs, { category: design, role: "Internship" });
    expect(visible).toEqual([]);
  });

  it("clearing the category (Back to categories) restores the full list", () => {
    const inCategory = filterJobs(jobs, { category: engineering });
    const cleared = filterJobs(jobs, { category: null });
    expect(inCategory.length).toBeLessThan(cleared.length);
    expect(cleared).toHaveLength(jobs.length);
  });
});

describe("internships category", () => {
  const internships: CategoryLike = {
    slug: "internships",
    keywords: ["intern", "internship", "trainee", "summer intern"],
  };

  const jobs: JobLike[] = [
    mk({ id: "i1", title: "Backend Intern", role_type: "Internship" }),
    mk({ id: "i2", title: "Data Science Trainee", role_type: "Internship" }),
    mk({ id: "i3", title: "Summer Intern - Product", role_type: "Internship" }),
    mk({ id: "f1", title: "Frontend Engineer", role_type: "Fresher" }),
    mk({ id: "f2", title: "Product Designer", role_type: "Fresher" }),
  ];

  it("filters to intern / trainee roles only", () => {
    const res = filterJobs(jobs, { category: internships });
    expect(res.map((j) => j.id).sort()).toEqual(["i1", "i2", "i3"]);
  });

  it("count badge reflects only internships (via role_type keyword match)", () => {
    const counts = computeCategoryCounts(jobs, [internships]);
    expect(counts.internships).toBe(3);
  });

  it("matches on role_type even when the title has no 'intern' keyword", () => {
    const stealthIntern = mk({ id: "i4", title: "Junior Analyst", role_type: "Internship" });
    // role_type "Internship" contains "intern" so keyword match still works
    expect(jobMatchesCategory(stealthIntern, internships)).toBe(true);
  });

  it("excludes fresher/full-time roles from the internships category", () => {
    expect(jobMatchesCategory(jobs[3], internships)).toBe(false);
    expect(jobMatchesCategory(jobs[4], internships)).toBe(false);
  });

  it("respects active search + remote filters inside the internships category", () => {
    const remoteIntern = mk({ id: "i5", title: "Remote Backend Intern", role_type: "Internship", is_remote: true });
    const all = [...jobs, remoteIntern];
    const res = filterJobs(all, { category: internships, remoteOnly: true, query: "backend" });
    expect(res.map((j) => j.id)).toEqual(["i5"]);
  });
});

