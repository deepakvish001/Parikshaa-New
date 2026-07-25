import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseJobSlug } from "@/lib/jobSlug";

type Job = {
  id: string;
  company: string;
  title: string;
  apply_url: string;
  company_logo_url: string | null;
};

const REDIRECT_SECONDS = 4;

export default function JobApply() {
  const { categoryOrSlug } = useParams<{ categoryOrSlug?: string }>();
  const jobId = parseJobSlug(categoryOrSlug);
  const [job, setJob] = useState<Job | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!jobId) {
      setNotFound(true);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("job_openings")
        .select("id,company,title,apply_url,company_logo_url")
        .eq("id", jobId)
        .eq("is_active", true)
        .maybeSingle();
      if (!data) setNotFound(true);
      else setJob(data as Job);
    })();
  }, [jobId]);

  useEffect(() => {
    if (!job?.apply_url) return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [job, countdown]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">This opening is no longer available</h1>
        <Link to="/jobs" className="mt-4 inline-block text-primary underline">
          Browse all jobs
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex max-w-xl items-center justify-center px-4 py-24 text-muted-foreground"
      >
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing your application…
      </div>
    );
  }

  const backHref = categoryOrSlug ? `/jobs/${categoryOrSlug}` : "/jobs";
  const hasApplyUrl = Boolean(job.apply_url && /^https?:\/\//i.test(job.apply_url));
  const canContinue = hasApplyUrl && countdown <= 0;
  const progressPct = Math.round(((REDIRECT_SECONDS - countdown) / REDIRECT_SECONDS) * 100);

  return (
    <>
      <Helmet prioritizeSeoTags>
        <title>{`Apply to ${job.title} at ${job.company} · Parikshaa`}</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={backHref} />
      </Helmet>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to job details
        </Link>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-4">
            {job.company_logo_url ? (
              <img
                src={job.company_logo_url}
                alt={`${job.company} logo`}
                className="h-14 w-14 rounded-lg border border-border/60 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border/60 bg-muted text-lg font-semibold">
                {job.company[0]}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold sm:text-2xl">{job.title}</h1>
              <p className="truncate text-sm text-muted-foreground">{job.company}</p>
            </div>
          </div>

          {!hasApplyUrl ? (
            <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
              <p className="font-medium text-destructive">
                No application link available
              </p>
              <p className="mt-2 text-muted-foreground">
                The employer has not shared a direct apply link for this role yet.
                Please check {job.company}'s careers page directly, or come back to
                the listing later.
              </p>
              <div className="mt-4">
                <Link to={backHref}>
                  <Button variant="outline">Back to job details</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {canContinue ? (
                    <>Ready — continue to {job.company}'s application</>
                  ) : (
                    <>
                      Continue to {job.company}'s official application in{" "}
                      <span
                        className="tabular-nums text-primary"
                        data-testid="apply-countdown"
                        aria-live="polite"
                      >
                        {countdown}s
                      </span>
                    </>
                  )}
                </p>
                <div
                  className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/60"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPct}
                >
                  <div
                    className="h-full bg-primary transition-[width] duration-1000 ease-linear"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-3 text-muted-foreground">
                  Parikshaa never asks for payment to apply. The Continue button
                  activates once the countdown finishes.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <a
                  href={canContinue ? job.apply_url : undefined}
                  rel="noopener noreferrer"
                  className="sm:flex-1"
                  aria-disabled={!canContinue}
                  tabIndex={canContinue ? 0 : -1}
                  onClick={(e) => {
                    if (!canContinue) e.preventDefault();
                  }}
                  data-testid="apply-continue-link"
                >
                  <Button
                    size="lg"
                    className="w-full gap-1.5"
                    disabled={!canContinue}
                    data-testid="apply-continue"
                  >
                    {canContinue ? (
                      <>Continue to {job.company} <ExternalLink className="h-4 w-4" /></>
                    ) : (
                      <>Continue in {countdown}s</>
                    )}
                  </Button>
                </a>
                <Link to={backHref} className="sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
