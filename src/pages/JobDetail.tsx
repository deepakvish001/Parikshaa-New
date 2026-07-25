import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, ExternalLink, Briefcase, GraduationCap,
  Building2, Clock, Sparkles, Share2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { jobSlug, parseJobSlug } from "@/lib/jobSlug";

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
  expires_at: string | null;
};

export default function JobDetail() {
  // Route now accepts an SEO slug (e.g. "frontend-intern-at-acme-<uuid>").
  // We accept the current dispatcher param (`categoryOrSlug`), the older
  // `slug` param, and the legacy `/jobs/:id` UUID URL — parseJobSlug
  // returns the raw UUID either way.
  const {
    categoryOrSlug,
    slug: legacySlug,
    id: legacyId,
  } = useParams<{ categoryOrSlug?: string; slug?: string; id?: string }>();
  const slug = categoryOrSlug ?? legacySlug;
  const jobId = parseJobSlug(slug ?? legacyId);
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_openings")
        .select("*")
        .eq("id", jobId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) toast.error(error.message);
      if (!data) setNotFound(true);
      setJob(data as Job | null);
      setLoading(false);
    })();
  }, [jobId]);

  // Redirect legacy /jobs/<uuid> → /jobs/<slug-with-uuid> for SEO canonical URL
  useEffect(() => {
    if (!job) return;
    const canonical = jobSlug(job);
    if (slug && slug !== canonical) {
      navigate(`/jobs/${canonical}`, { replace: true });
    }
  }, [job, slug, navigate]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: job?.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-64 animate-pulse rounded-xl border border-border/60 bg-card/40" />
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Opening not found</h1>
        <p className="mt-2 text-muted-foreground">
          This opening may have expired or been removed.
        </p>
        <Link to="/jobs">
          <Button className="mt-6"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  const desc = (job.description ?? "").trim();
  const canonicalUrl = `https://www.parikshaa.org/jobs/${jobSlug(job)}`;
  const locBits = [job.location, job.is_remote ? "Remote" : null].filter(Boolean).join(" · ");
  const pageTitle = `${job.title} at ${job.company}${locBits ? ` (${locBits})` : ""} · Parikshaa Jobs`;
  const metaDesc =
    (desc.replace(/\s+/g, " ").slice(0, 155) ||
      `Apply for ${job.title} at ${job.company}${locBits ? ` — ${locBits}` : ""}. ${job.role_type} opening on Parikshaa.`).slice(0, 160);
  const ogImage = job.company_logo_url ?? "https://www.parikshaa.org/og-image.png";
  const employmentType = job.role_type === "Internship" ? "INTERN" : "FULL_TIME";

  const jobPostingLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    identifier: { "@type": "PropertyValue", name: "Parikshaa", value: job.id },
    title: job.title,
    description: desc || `${job.role_type} opening at ${job.company}`,
    datePosted: job.posted_at,
    validThrough:
      job.expires_at ??
      new Date(new Date(job.posted_at).getTime() + 60 * 24 * 3600 * 1000).toISOString(),
    employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      logo: job.company_logo_url ?? undefined,
    },
    ...(job.is_remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "IN" },
        }
      : job.location
        ? {
            jobLocation: {
              "@type": "Place",
              address: {
                "@type": "PostalAddress",
                addressLocality: job.location,
                addressCountry: "IN",
              },
            },
          }
        : {}),
    ...(job.salary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "INR",
            value: { "@type": "QuantitativeValue", value: job.salary, unitText: "YEAR" },
          },
        }
      : {}),
    url: canonicalUrl,
    directApply: false,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Jobs", item: "https://www.parikshaa.org/jobs" },
      { "@type": "ListItem", position: 2, name: job.company, item: canonicalUrl },
      { "@type": "ListItem", position: 3, name: job.title, item: canonicalUrl },
    ],
  };

  return (
    <>
      <Helmet prioritizeSeoTags>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
        <meta property="og:title" content={`${job.title} at ${job.company}`} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Parikshaa" />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${job.title} at ${job.company}`} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify(jobPostingLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All openings
        </Link>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60">
                  {job.company_logo_url ? (
                    <img src={job.company_logo_url} alt={`${job.company} logo`} className="h-12 w-12 rounded object-contain" />
                  ) : job.role_type === "Internship" ? (
                    <GraduationCap className="h-7 w-7 text-primary" />
                  ) : (
                    <Briefcase className="h-7 w-7 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{job.title}</h1>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                      <Building2 className="h-3.5 w-3.5" /> {job.company}
                    </span>
                    {job.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Posted {formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })}
                    </span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="uppercase">{job.role_type}</Badge>
                    {job.is_remote && <Badge variant="outline">Remote</Badge>}
                    {job.salary && <Badge variant="outline">{job.salary}</Badge>}
                    <Badge variant="outline" className="capitalize">Source: {job.source}</Badge>
                    {job.tags?.slice(0, 5).map((t) => (
                      <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 gap-2 sm:flex-col">
                <Link to={`/jobs/${jobSlug(job)}/apply`}>
                  <Button className="w-full gap-1.5">
                    Apply Now <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" onClick={share} className="gap-1.5">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-4 w-4" /> About this role
              </h2>
              {desc ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {desc}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Full description not available. Click <b>Apply Now</b> to view the complete listing on {job.company}'s page.
                </p>
              )}
            </div>

            <div className="mt-8 border-t border-border/60 pt-6">
                <Link to={`/jobs/${jobSlug(job)}/apply`}>
                <Button size="lg" className="w-full gap-1.5 sm:w-auto">
                  Apply on {job.company} <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
