import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Building2,
  Clock,
  Share2,
  ArrowUpRight,
  X,
  Code2,
  Palette,
  BarChart3,
  Megaphone,
  Headphones,
  DollarSign,
  Package,
  ChevronLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { HeroAmbientBackdrop } from "@/components/landing/HeroAmbientBackdrop";
import { SectionEyebrow } from "@/components/landing/SectionEyebrow";
import { HeroHighlight } from "@/components/landing/HeroHighlight";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { jobSlug } from "@/lib/jobSlug";

type Job = {
  id: string;
  company: string;
  title: string;
  role_type: string;
  location: string | null;
  is_remote: boolean;
  apply_url: string;
  description: string | null;
  tags: string[];
  source: string;
  company_logo_url: string | null;
  salary: string | null;
  posted_at: string;
};

const ROLE_FILTERS = ["All", "Internship", "Fresher", "Entry"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];

type Category = {
  slug: string;
  label: string;
  icon: typeof Code2;
  keywords: string[];
};

const CATEGORIES: Category[] = [
  { slug: "internships", label: "Internships", icon: GraduationCap, keywords: ["intern", "internship", "trainee", "summer intern"] },
  { slug: "engineering", label: "Engineering", icon: Code2, keywords: ["engineer", "developer", "software", "backend", "frontend", "fullstack", "sde", "programmer", "devops", "qa", "sre"] },
  { slug: "design", label: "Design", icon: Palette, keywords: ["design", "ui", "ux", "graphic", "visual", "product design", "figma"] },
  { slug: "data", label: "Data & AI", icon: BarChart3, keywords: ["data", "analyst", "analytics", "ml", "machine learning", "ai", "scientist", "bi"] },
  { slug: "product", label: "Product", icon: Package, keywords: ["product manager", "product", "pm", "associate product"] },
  { slug: "marketing", label: "Marketing", icon: Megaphone, keywords: ["marketing", "seo", "content", "copywriter", "social media", "growth", "brand"] },
  { slug: "sales", label: "Sales & BD", icon: Briefcase, keywords: ["sales", "business development", "bd", "account", "partnerships"] },
  { slug: "support", label: "Support & Ops", icon: Headphones, keywords: ["support", "customer", "operations", "ops", "service"] },
  { slug: "finance", label: "Finance", icon: DollarSign, keywords: ["finance", "accounting", "audit", "tax", "financial"] },
];
import { filterJobs, jobMatchesCategory, scoreJob, computeCategoryCounts } from "@/pages/jobs/filter";


const formatWhen = (iso: string) => {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const diff = Date.now() - d;
  const day = 86400000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  const days = Math.floor(diff / day);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const JobRow = memo(function JobRow({
  job,
  onSelect,
}: {
  job: Job;
  onSelect: (j: Job) => void;
}) {
  const navigate = useNavigate();
  const href = `/jobs/${jobSlug(job)}`;
  const go = () => navigate(href);
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
      aria-label={`View ${job.title} at ${job.company}`}
      className="group relative block overflow-hidden rounded-xl border border-border/60 bg-card/50 backdrop-blur-md p-4 sm:p-5 transition hover:border-amber-400/40 hover:bg-card/70 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-amber-500/0 via-amber-500/[0.04] to-orange-500/0" />
      </div>

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/70">
            {job.company_logo_url ? (
              <img src={job.company_logo_url} alt="" className="h-8 w-8 rounded object-contain" />
            ) : job.role_type === "Internship" ? (
              <GraduationCap className="h-5 w-5 text-amber-400" />
            ) : (
              <Briefcase className="h-5 w-5 text-amber-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold leading-tight text-foreground group-hover:text-amber-200 transition-colors">
                {job.title}
              </h3>
              <Badge className="border-amber-400/30 bg-amber-500/10 text-amber-200 text-[10px] uppercase hover:bg-amber-500/15">
                {job.role_type}
              </Badge>
              {job.is_remote && (
                <Badge variant="outline" className="text-[10px] border-border/60">
                  Remote
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground truncate">
              <span className="font-medium text-foreground/85">{job.company}</span>
              {job.location && (
                <>
                  <span className="mx-1.5 opacity-60">·</span>
                  <MapPin className="inline h-3 w-3 -mt-0.5" /> {job.location}
                </>
              )}
              {job.salary && (
                <>
                  <span className="mx-1.5 opacity-60">·</span>
                  {job.salary}
                </>
              )}
              <span className="mx-1.5 opacity-60">·</span>
              <span className="text-muted-foreground/80">{formatWhen(job.posted_at)}</span>
            </p>
          </div>
        </div>

        <Link
          to={`/jobs/${jobSlug(job)}/apply`}
          className="shrink-0 self-start sm:self-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400"
          >
            Apply <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
});

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams<{ categoryOrSlug?: string; categorySlug?: string }>();
  const navigate = useNavigate();

  const PAGE_SIZES = [10, 20, 50] as const;
  type PageSize = (typeof PAGE_SIZES)[number];

  // --- URL-driven state --------------------------------------------------
  const query = searchParams.get("q") ?? "";
  const roleParam = (searchParams.get("role") ?? "All") as RoleFilter;
  const role: RoleFilter = (ROLE_FILTERS as readonly string[]).includes(roleParam)
    ? roleParam
    : "All";
  const remoteOnly = searchParams.get("remote") === "1";
  const sort: "newest" | "match" =
    searchParams.get("sort") === "match" ? "match" : "newest";
  const pageSize: PageSize = (() => {
    const n = Number(searchParams.get("size"));
    return (PAGE_SIZES as readonly number[]).includes(n) ? (n as PageSize) : 20;
  })();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  // Prefer path param (/jobs/:categoryOrSlug) for SEO, fall back to legacy
  // /jobs/category/:categorySlug and ?category=.
  const pathParam = params.categoryOrSlug ?? params.categorySlug;
  const categorySlug = pathParam ?? searchParams.get("category");
  const activeCategory = CATEGORIES.find((c) => c.slug === categorySlug) ?? null;

  const patchParams = (
    updates: Record<string, string | number | null | undefined>,
  ) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(updates)) {
          if (v === null || v === undefined || v === "") next.delete(k);
          else next.set(k, String(v));
        }
        return next;
      },
      { replace: true },
    );
  };

  const setQuery = (v: string) => patchParams({ q: v, page: null });
  const setRole = (v: RoleFilter) =>
    patchParams({ role: v === "All" ? null : v, page: null });
  const setRemoteOnly = (v: boolean) =>
    patchParams({ remote: v ? "1" : null, page: null });
  const setSort = (v: "newest" | "match") =>
    patchParams({ sort: v === "newest" ? null : v, page: null });
  const setPageSize = (v: PageSize) =>
    patchParams({ size: v === 20 ? null : v, page: null });
  const setCategory = (slug: string | null) => {
    // Drop legacy ?category= if present and switch to path-based route
    const next = new URLSearchParams(searchParams);
    next.delete("category");
    next.delete("page");
    const qs = next.toString();
    navigate(
      (slug ? `/jobs/${slug}` : "/jobs") + (qs ? `?${qs}` : ""),
      { replace: true },
    );
  };
  // ---------------------------------------------------------------------

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Job | null>(null);

  const shareJob = async (j: Job) => {
    const url = `${window.location.origin}/jobs/${jobSlug(j)}`;
    try {
      if (navigator.share) await navigator.share({ title: j.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {}
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_openings")
      .select("*")
      .eq("is_active", true)
      .order("posted_at", { ascending: false })
      .limit(300);
    if (error) toast.error(error.message);
    setJobs((data ?? []) as Job[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Legacy redirect: /jobs?category=<slug> → /jobs/<slug> (SEO canonical path)
  useEffect(() => {
    const legacy = searchParams.get("category");
    if (legacy && !pathParam) {
      const next = new URLSearchParams(searchParams);
      next.delete("category");
      const qs = next.toString();
      navigate(`/jobs/${legacy}` + (qs ? `?${qs}` : ""), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathParam]);


  const filtered = useMemo(
    () =>
      filterJobs(jobs, {
        query,
        role,
        remoteOnly,
        category: activeCategory,
        sort,
      }),
    [jobs, query, role, remoteOnly, sort, activeCategory],
  );


  // Counts reflect the currently applied search/role/remote filters
  // (but ignore the selected category so each tile shows its own total).
  const categoryCounts = useMemo(
    () => computeCategoryCounts(jobs, CATEGORIES, { query, role, remoteOnly }),
    [jobs, query, role, remoteOnly],
  );


  const activeFilterCount =
    (query.trim() ? 1 : 0) + (role !== "All" ? 1 : 0) + (remoteOnly ? 1 : 0);
  const clearFilters = () =>
    patchParams({ q: null, role: null, remote: null, page: null });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Clamp page to the valid range whenever totals shift (filters, size, refetch)
  useEffect(() => {
    if (page < 1) {
      patchParams({ page: null });
    } else if (page > totalPages) {
      patchParams({ page: totalPages <= 1 ? null : totalPages });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages, filtered.length]);

  // Brief skeleton flash on page/size change for perceptible feedback
  const [pageSwitching, setPageSwitching] = useState(false);
  useEffect(() => {
    setPageSwitching(true);
    const t = setTimeout(() => setPageSwitching(false), 180);
    return () => clearTimeout(t);
  }, [page, pageSize, sort, role, remoteOnly, query]);

  const visibleJobs = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const pageNumbers = useMemo(() => {
    const pages: (number | "…")[] = [];
    const win = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - win && i <= page + win)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "…") {
        pages.push("…");
      }
    }
    return pages;
  }, [page, totalPages]);

  const listTopRef = useRef<HTMLDivElement | null>(null);
  // Move focus to the list top on page / size change (skip initial mount)
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    // Wait a tick so the new page content is in the DOM
    const t = requestAnimationFrame(() => {
      listTopRef.current?.focus({ preventScroll: false });
    });
    return () => cancelAnimationFrame(t);
  }, [page, pageSize]);

  const goToPage = (n: number) => {
    const next = Math.min(Math.max(1, n), totalPages);
    patchParams({ page: next === 1 ? null : next });
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showSkeleton = loading || pageSwitching;

  // Announced status: page X of Y, N results
  const statusMessage = loading
    ? "Loading jobs…"
    : filtered.length === 0
      ? "No jobs match the current filters."
      : `Showing page ${page} of ${totalPages}, ${filtered.length} ${filtered.length === 1 ? "opening" : "openings"} total.`;



  const stats = useMemo(() => {
    const companies = new Set(jobs.map((j) => j.company)).size;
    const remote = jobs.filter((j) => j.is_remote).length;
    const internships = jobs.filter((j) => j.role_type === "Internship").length;
    return { total: jobs.length, companies, remote, internships };
  }, [jobs]);

  const seoTitle = activeCategory
    ? `${activeCategory.label} Internships & Fresher Jobs · Parikshaa`
    : "Internships & Fresher Jobs · Parikshaa";
  const seoDesc = activeCategory
    ? `Latest ${activeCategory.label.toLowerCase()} internships and fresher jobs from top companies, refreshed daily.`
    : "Real internship and fresher openings from top companies, refreshed daily. Filter by role, location and remote.";
  const canonicalPath = activeCategory
    ? `/jobs/${activeCategory.slug}`
    : "/jobs";

  const canonicalUrl = `https://www.parikshaa.org${canonicalPath}`;

  // Rich-snippet schema: CollectionPage + ItemList of the currently visible openings.
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seoTitle,
    description: seoDesc,
    url: canonicalUrl,
    ...(activeCategory && { about: activeCategory.label }),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: filtered.slice(0, 25).map((j, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.parikshaa.org/jobs/${jobSlug(j)}`,
        name: `${j.title} at ${j.company}`,
      })),
    },
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>
      </Helmet>

      <HeroAmbientBackdrop>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
          {/* Hero — mirrors home page ApexHero styling */}
          <section
            id="jobs-hero"
            className="relative isolate overflow-hidden px-2 pb-6 pt-14 sm:pt-16 lg:pb-8"
          >
            {/* Radial rays backdrop */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] opacity-[0.35]"
              style={{
                background:
                  "radial-gradient(ellipse 60% 55% at 50% 0%, hsl(var(--primary)/0.28), transparent 65%)",
              }}
            />
            {/* Faint diagonal streaks */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
                maskImage:
                  "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
              }}
            />

            <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
              {/* Eyebrow */}
              <div className="mb-3">
                <SectionEyebrow kicker="01" label="The Opportunities Board" />
              </div>

              {/* Compact headline */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                className="[text-wrap:balance] max-w-[18ch] text-[26px] font-bold leading-[1.08] tracking-[-0.03em] text-foreground sm:max-w-[22ch] sm:text-4xl md:text-5xl lg:text-[56px]"
              >
                Internships &amp; jobs <HeroHighlight>freshers</HeroHighlight> are{" "}
                <span
                  className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
                  style={{ backgroundSize: "200% auto", animation: "apex-shimmer 6s linear infinite" }}
                >
                  landing
                </span>{" "}
                <span className="text-foreground">right now.</span>
              </motion.h1>



              {/* Subhead */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="[text-wrap:pretty] mt-3 max-w-xl px-2 text-[13px] leading-relaxed text-muted-foreground sm:px-0 sm:text-sm"
              >
                <span className="font-semibold text-foreground">
                  {stats.total.toLocaleString()}+ curated openings
                </span>
                <span aria-hidden> · </span>refreshed daily
                <span className="hidden sm:inline">
                  <span aria-hidden> · </span>filter by role, remote or category
                </span>
                .
              </motion.p>


              {/* Search CTA row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="mt-5 w-full max-w-2xl"
                role="search"
                aria-label="Search jobs"
              >

                <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:gap-3">
                  <div className="relative min-w-0 flex-1">
                    <label htmlFor="jobs-search" className="sr-only">
                      Search jobs by title, company, location or tag
                    </label>
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="jobs-search"
                      type="search"
                      inputMode="search"
                      autoComplete="off"
                      placeholder="Search jobs, skills, companies…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-12 w-full truncate rounded-xl border-border/60 bg-card/50 pl-11 pr-11 text-base backdrop-blur-sm focus-visible:ring-amber-400/40 sm:text-sm"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={load}
                    disabled={loading}
                    aria-label="Refresh jobs"
                    className="h-12 w-full shrink-0 justify-center gap-2 rounded-xl border-border/60 bg-card/50 hover:border-amber-400/40 sm:w-auto sm:px-5"
                  >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">Refresh</span>
                  </Button>
                </div>

              </motion.div>

              {/* Hero live results / loading skeleton */}
              <div
                className="mt-3 flex min-h-[1.25rem] w-full max-w-2xl items-center justify-center gap-x-4 gap-y-1 text-center text-[11px] text-muted-foreground"
                aria-live="polite"
                aria-busy={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400/70" />
                    <span className="inline-block h-2.5 w-32 animate-pulse rounded bg-muted/60" />
                  </div>
                ) : query.trim() ? (
                  <span>
                    <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                    {filtered.length === 1 ? "match" : "matches"} for
                    <span className="text-amber-300"> "{query.trim()}"</span>
                  </span>
                ) : (
                  <>
                    <span>
                      <span className="font-bold text-foreground">{stats.companies}</span> companies
                    </span>
                    <span className="h-2.5 w-px bg-border/70" />
                    <span>
                      <span className="font-bold text-foreground">{stats.remote}</span> remote
                    </span>
                    <span className="h-2.5 w-px bg-border/70" />
                    <span>
                      <span className="font-bold text-foreground">{stats.internships}</span> internships
                    </span>
                  </>
                )}
              </div>

            </div>
          </section>



          {!activeCategory ? (
            <section aria-label="Job categories" className="mt-10">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <SectionEyebrow kicker="02" label="Browse by Category" />
                  <h2
                    style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                    className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
                  >
                    Pick your <span className="text-amber-400">lane</span>.
                  </h2>
                </div>
                <span className="hidden sm:block text-xs text-muted-foreground">
                  {loading ? "Loading counts…" : `${jobs.length} openings across ${CATEGORIES.length} tracks`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {CATEGORIES.map((c, idx) => {
                  const Icon = c.icon;
                  const count = categoryCounts[c.slug] ?? 0;
                  const empty = !loading && count === 0;
                  return (
                    <motion.button
                      key={c.slug}
                      type="button"
                      onClick={() => setCategory(c.slug)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.03 * idx }}
                      whileHover={{ y: -3 }}
                      aria-label={`${c.label} — ${count} openings`}
                      className={cn(
                        "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40",
                        "border-border/60 bg-card/50 backdrop-blur-md hover:border-amber-400/50 hover:bg-card/70 hover:shadow-[0_20px_60px_-30px_hsl(var(--primary)/0.55)]",
                        empty && "opacity-70",
                      )}
                    >
                      {/* Amber corner glow */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-amber-400/25 to-orange-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                      />
                      {/* Diagonal streak */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08]"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(-30deg, transparent 0 22px, hsl(var(--primary)/0.6) 22px 23px)",
                        }}
                      />

                      <div className="relative flex items-start justify-between gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/25 bg-gradient-to-br from-amber-500/15 to-orange-500/5 text-amber-300 transition group-hover:border-amber-400/50 group-hover:text-amber-200">
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-300" />
                      </div>

                      <div className="relative mt-5">
                        <h3
                          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                          className="text-base font-bold tracking-tight text-foreground group-hover:text-amber-100 transition-colors"
                        >
                          {c.label}
                        </h3>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          {loading ? (
                            <span className="inline-block h-5 w-10 animate-pulse rounded bg-muted/60" />
                          ) : (
                            <span className="text-2xl font-bold tabular-nums text-amber-400 group-hover:text-amber-300">
                              {count}
                            </span>
                          )}
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            {count === 1 ? "opening" : "openings"}
                          </span>
                        </div>
                      </div>

                      {/* Bottom accent line */}
                      <div
                        aria-hidden
                        className="absolute inset-x-5 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-amber-400/70 via-orange-400/70 to-transparent transition-transform duration-500 group-hover:scale-x-100"
                      />
                    </motion.button>
                  );
                })}
              </div>
            </section>

          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-md"
              >
                {/* Amber corner glow to match hero */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-amber-400/25 to-orange-500/10 blur-3xl"
                />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setCategory(null)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:border-amber-400/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                    >
                      <ChevronLeft className="h-3 w-3" /> All categories
                    </button>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-300">
                        <activeCategory.icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h2
                          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                          className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight"
                        >
                          {activeCategory.label}{" "}
                          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                            openings
                          </span>
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {loading
                            ? "Loading openings…"
                            : "Curated roles matching this category, refreshed daily."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:self-end">
                    <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2 text-center">
                      <span className="block text-[10px] uppercase tracking-wider text-amber-300/80">
                        In this track
                      </span>
                      {loading ? (
                        <span className="mt-1 inline-block h-5 w-10 animate-pulse rounded bg-muted/60" />
                      ) : (
                        <span className="text-xl font-bold tabular-nums text-amber-300">
                          {categoryCounts[activeCategory.slug] ?? 0}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>


          {/* Filter bar */}
          <motion.section

            role="search"
            aria-label="Filter jobs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mt-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-md p-3 sm:p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="group"
                aria-label="Role filter"
                className="flex flex-wrap items-center gap-2"
              >
                {ROLE_FILTERS.map((r) => {
                  const active = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40",
                        active
                          ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                          : "border-border/60 bg-background/40 text-muted-foreground hover:border-amber-400/40 hover:text-foreground",
                      )}
                    >
                      {r}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  aria-pressed={remoteOnly}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40",
                    remoteOnly
                      ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                      : "border-border/60 bg-background/40 text-muted-foreground hover:border-amber-400/40 hover:text-foreground",
                  )}
                >
                  Remote only
                </button>
              </div>
            </div>

            {/* Sort + status row */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">

              <div
                role="group"
                aria-label="Sort results"
                className="flex items-center gap-1.5 text-xs"
              >
                <span className="text-muted-foreground mr-1">Sort:</span>
                {(
                  [
                    { id: "newest", label: "Newest" },
                    { id: "match", label: "Best match" },
                  ] as const
                ).map((opt) => {
                  const active = sort === opt.id;
                  const disabled = opt.id === "match" && !query.trim();
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSort(opt.id)}
                      aria-pressed={active}
                      disabled={disabled}
                      title={disabled ? "Type a search query to enable" : undefined}
                      className={cn(
                        "rounded-full border px-2.5 py-1 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 disabled:opacity-40 disabled:cursor-not-allowed",
                        active
                          ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                          : "border-border/60 bg-background/40 text-muted-foreground hover:border-amber-400/40 hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div
                role="status"
                aria-live="polite"
                className="text-xs text-muted-foreground"
              >
                {loading
                  ? "Loading jobs…"
                  : `${filtered.length} ${filtered.length === 1 ? "opening" : "openings"}`}
                {activeFilterCount > 0 && !loading && (
                  <>
                    {" "}
                    ·{" "}
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="font-semibold text-amber-300 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 rounded"
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.section>

          {/* List */}
          <div
            ref={listTopRef}
            id="jobs-list"
            tabIndex={-1}
            role="region"
            aria-label="Job openings"
            aria-busy={showSkeleton}
            className="mt-6 scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 rounded-xl"
          >
            {/* SR-only live status — always mounted so updates are announced */}
            <p id="jobs-status" role="status" aria-live="polite" className="sr-only">
              {statusMessage}
            </p>

            {showSkeleton ? (
              <ul aria-hidden="true" className="grid gap-3">

                {Array.from({ length: 6 }).map((_, i) => (
                  <li
                    key={i}
                    className="animate-pulse rounded-xl border border-border/60 bg-card/40 p-4 sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-lg bg-muted/40" />
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <div className="h-4 w-2/5 rounded bg-muted/40" />
                          <div className="h-4 w-16 rounded bg-muted/30" />
                        </div>
                        <div className="h-3 w-3/5 rounded bg-muted/30" />
                      </div>
                      <div className="h-8 w-20 rounded bg-muted/30" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-md p-10 sm:p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10">
                  {activeCategory ? (
                    <activeCategory.icon className="h-6 w-6 text-amber-300" aria-hidden="true" />
                  ) : (
                    <Building2 className="h-6 w-6 text-amber-300" aria-hidden="true" />
                  )}
                </div>
                <h2 className="mt-4 text-base font-semibold text-foreground">
                  {activeCategory
                    ? `No ${activeCategory.label} openings${activeFilterCount > 0 ? " match your filters" : " right now"}`
                    : activeFilterCount > 0
                      ? "No openings match your filters"
                      : "No openings available yet"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                  {activeCategory
                    ? "Try clearing filters or head back to browse another category."
                    : activeFilterCount > 0
                      ? "Try a different keyword, switch role, or turn off Remote only."
                      : "New internship and fresher jobs will appear here as soon as they are fetched."}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="border-amber-400/40 text-amber-200 hover:bg-amber-500/10"
                    >
                      Clear all filters
                    </Button>
                  )}
                  {activeCategory && (
                    <Button
                      size="sm"
                      onClick={() => setCategory(null)}
                      className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Back to categories
                    </Button>
                  )}
                </div>
              </div>

            ) : (
              <>
                <div className="grid gap-3">
                  {visibleJobs.map((j) => (
                    <JobRow key={j.id} job={j} onSelect={setSelected} />
                  ))}
                </div>

                <nav
                  aria-label="Jobs pagination"
                  className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
                >
                  <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–
                      {Math.min(page * pageSize, filtered.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-foreground">
                      {filtered.length}
                    </span>
                    {totalPages > 1 && (
                      <>
                        {" "}· Page{" "}
                        <span className="font-semibold text-foreground">{page}</span>{" "}
                        of {totalPages}
                      </>
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="jobs-page-size"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span>Per page</span>
                      <select
                        id="jobs-page-size"
                        value={pageSize}
                        onChange={(e) =>
                          setPageSize(Number(e.target.value) as PageSize)
                        }
                        aria-describedby="jobs-page-size-hint jobs-status"
                        className="h-8 rounded-md border border-border/60 bg-background/40 px-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                      >
                        {PAGE_SIZES.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <span id="jobs-page-size-hint" className="sr-only">
                        Choose how many job openings to show per page. Changing this
                        resets to page one and moves focus back to the top of the list.
                      </span>
                    </label>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(page - 1)}
                          disabled={page === 1}
                          aria-label="Go to previous page"
                          className="h-8 border-border/60 bg-background/40"
                        >
                          Prev
                        </Button>
                        {pageNumbers.map((p, i) =>
                          p === "…" ? (
                            <span
                              key={`e-${i}`}
                              className="px-2 text-xs text-muted-foreground"
                              aria-hidden="true"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={p}
                              type="button"
                              onClick={() => goToPage(p)}
                              aria-current={p === page ? "page" : undefined}
                              aria-label={
                                p === page
                                  ? `Page ${p}, current page`
                                  : `Go to page ${p}`
                              }
                              className={cn(
                                "h-8 min-w-8 rounded-md border px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40",
                                p === page
                                  ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                                  : "border-border/60 bg-background/40 text-muted-foreground hover:border-amber-400/40 hover:text-foreground",
                              )}
                            >
                              {p}
                              {p === page && (
                                <span className="sr-only"> (current)</span>
                              )}
                            </button>
                          ),
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(page + 1)}
                          disabled={page === totalPages}
                          aria-label="Go to next page"
                          className="h-8 border-border/60 bg-background/40"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </nav>
              </>
            )}
          </div>
            </>
          )}
        </div>




        <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-xl overflow-y-auto border-l border-border/60 bg-background/95 backdrop-blur-xl"
          >
            {selected && (
              <>
                <SheetHeader className="text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/70">
                      {selected.company_logo_url ? (
                        <img
                          src={selected.company_logo_url}
                          alt=""
                          className="h-9 w-9 rounded object-contain"
                        />
                      ) : selected.role_type === "Internship" ? (
                        <GraduationCap className="h-6 w-6 text-amber-400" />
                      ) : (
                        <Briefcase className="h-6 w-6 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <SheetTitle
                        style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                        className="text-xl leading-tight"
                      >
                        {selected.title}
                      </SheetTitle>
                      <SheetDescription className="mt-1 text-sm">
                        <span className="font-medium text-foreground/85">
                          {selected.company}
                        </span>
                        {selected.location && (
                          <>
                            <span className="mx-1.5 opacity-60">·</span>
                            <MapPin className="inline h-3 w-3 -mt-0.5" />{" "}
                            {selected.location}
                          </>
                        )}
                      </SheetDescription>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge className="border-amber-400/30 bg-amber-500/10 text-amber-200 text-[10px] uppercase hover:bg-amber-500/15">
                      {selected.role_type}
                    </Badge>
                    {selected.is_remote && (
                      <Badge variant="outline" className="text-[10px] border-border/60">
                        Remote
                      </Badge>
                    )}
                    {selected.salary && (
                      <Badge variant="outline" className="text-[10px] border-border/60">
                        {selected.salary}
                      </Badge>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatWhen(selected.posted_at)}
                    </span>
                  </div>
                </SheetHeader>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    to={`/jobs/${jobSlug(selected)}/apply`}
                    className="flex-1 min-w-[160px]"
                    onClick={() => setSelected(null)}
                  >
                    <Button className="w-full gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400">
                      Apply now <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => shareJob(selected)}
                    className="gap-1.5 border-border/60"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                  <Link to={`/jobs/${jobSlug(selected)}`} onClick={() => setSelected(null)}>
                    <Button variant="ghost" className="gap-1.5">
                      Full page <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {selected.tags?.length > 0 && (
                  <div className="mt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Skills & tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border/60 bg-card/50 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    About the role
                  </p>
                  {selected.description ? (
                    <div
                      className="prose prose-sm prose-invert max-w-none text-sm text-foreground/85 [&_a]:text-amber-300"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selected.description, { USE_PROFILES: { html: true }, FORBID_TAGS: ["style","script","iframe","object","embed","form"], FORBID_ATTR: ["style","onerror","onload","onclick"] }) }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No description provided. Use the Apply button to view the full posting.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 p-3 text-[11px] text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  Sourced from <span className="font-medium text-foreground/80">{selected.source}</span>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </HeroAmbientBackdrop>
    </>
  );
}
