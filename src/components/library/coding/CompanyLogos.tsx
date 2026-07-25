import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { companiesForSlug, type CompanyRef } from "@/data/problemCompaniesMap";
import { useProblemCompaniesContext } from "@/hooks/useProblemCompanies";
import { cn } from "@/lib/utils";

/**
 * Companies-per-problem cluster.
 *
 * Order of preference for chips:
 *   1. Real "asked in the last 6 months" rows from `problem_companies`
 *      (sorted highest frequency first, de-duplicated by domain).
 *   2. If fewer than `min` real rows exist for a problem, the remaining
 *      slots are filled from the deterministic hash-based fallback so
 *      every row still shows something plausible.
 *
 * `min`/`max` bound the visible chip count. Within that range each problem
 * gets a stable per-slug target so the table looks varied but never jumps
 * between renders. Set `debug` (or `?debugCompanies=1` in the URL) to reveal
 * whether each row is showing real or fallback data.
 */
export function CompanyLogos({
  slug,
  min = 2,
  max = 8,
  topReal,
  size = 20,
  className,
  debug,
}: {
  slug: string;
  /** Minimum number of chips to show (default 2). */
  min?: number;
  /** Maximum number of chips to show (default 8). */
  max?: number;
  /**
   * If set, always show the top-N real companies by frequency
   * (e.g. `topReal={5}`) instead of the per-slug variable count.
   */
  topReal?: number;
  size?: number;
  className?: string;
  debug?: boolean;
}) {
  const realMap = useProblemCompaniesContext();
  const real = realMap?.get(slug) ?? [];

  // Deterministic per-slug target between `min` and `max` (inclusive).
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const lo = Math.max(1, Math.min(min, max));
  const hi = Math.max(lo, max);
  const span = hi - lo + 1;
  const desired = topReal ?? lo + (h % span);

  // Merge real rows first, then fill from fallback, de-duped by domain.
  const seen = new Set<string>();
  const merged: (CompanyRef & { source: "real" | "fallback" })[] = [];
  for (const c of real) {
    if (seen.has(c.domain)) continue;
    seen.add(c.domain);
    merged.push({ ...c, source: "real" });
    if (merged.length >= desired) break;
  }
  if (merged.length < desired) {
    const fillers = companiesForSlug(slug, desired + 4);
    for (const c of fillers) {
      if (seen.has(c.domain)) continue;
      seen.add(c.domain);
      merged.push({ ...c, source: "fallback" });
      if (merged.length >= desired) break;
    }
  }
  const companies = merged.slice(0, desired);

  const debugOn =
    debug ??
    (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debugCompanies") === "1");
  const hasReal = real.length > 0;

  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_LIMIT = 10;
  const overflow = companies.length > COLLAPSED_LIMIT;
  const visible = expanded || !overflow ? companies : companies.slice(0, COLLAPSED_LIMIT);
  const hiddenCount = companies.length - visible.length;

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("flex flex-col items-start gap-1", className)}>
        <div
          className="grid gap-1 grid-cols-3 sm:grid-cols-5"
          style={{ maxWidth: `calc(${size}px * 5 + 0.25rem * 4)` }}
        >
          {visible.map((c) => (
            <Tooltip key={c.domain}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "relative inline-flex items-center justify-center rounded-[6px] bg-zinc-900 overflow-hidden shrink-0 ring-1",
                    debugOn && c.source === "fallback"
                      ? "ring-amber-500"
                      : debugOn && c.source === "real"
                        ? "ring-emerald-500"
                        : "ring-zinc-800",
                  )}
                  style={{ width: size, height: size }}
                  aria-label={c.name}
                >
                  <LogoImg name={c.name} domain={c.domain} size={size} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[220px]">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block text-muted-foreground">
                  asked {c.frequency} times in the last 6 months
                </span>
                {debugOn && (
                  <span
                    className={cn(
                      "mt-1 inline-block rounded px-1 py-0.5 text-[10px] font-semibold",
                      c.source === "real"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400",
                    )}
                  >
                    {c.source}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {overflow && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              {expanded ? "Show less" : `+${hiddenCount} more`}
            </button>
          )}
          {debugOn && (
            <span
              className={cn(
                "rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                hasReal
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/20 text-amber-400",
              )}
              title={hasReal ? "real problem_companies data" : "hash fallback"}
            >
              {hasReal ? "real" : "fallback"}
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// Generate 1–2 letter initials from a company name.
const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Deterministic hue per name so fallback chips look distinct.
const hueFor = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
};

const LOGO_DEV_TOKEN = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as
  | string
  | undefined;

const logoSrc = (domain: string, size: number, bust?: number): string => {
  const px = Math.max(32, size * 2);
  const base = LOGO_DEV_TOKEN
    ? `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=${px}&format=png&retina=true`
    : `https://www.google.com/s2/favicons?sz=${px}&domain=${domain}`;
  return bust ? `${base}&_r=${bust}` : base;
};

type CacheStatus = "ok" | "failed";
const logoCache = new Map<string, CacheStatus>();

function LogoImg({ name, domain, size }: { name: string; domain: string; size: number }) {
  const cached = logoCache.get(domain);
  const [status, setStatus] = useState<"loading" | "ok" | "failed">(
    cached ?? "loading",
  );
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const c = logoCache.get(domain);
    if (c) setStatus(c);
    else setStatus("loading");
    setRetry(0);
  }, [domain]);

  if (status === "failed") {
    const initials = initialsOf(name);
    const hue = hueFor(name);
    return (
      <span
        className="flex items-center justify-center w-full h-full font-bold text-white select-none"
        style={{
          fontSize: Math.max(8, Math.round(size * 0.42)),
          background: `linear-gradient(135deg, hsl(${hue} 60% 40%), hsl(${(hue + 40) % 360} 60% 30%))`,
        }}
        aria-hidden
      >
        {initials}
      </span>
    );
  }

  return (
    <>
      {status === "loading" && (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-800 to-zinc-900"
        />
      )}
      <img
        src={logoSrc(domain, size, retry || undefined)}
        alt={`${name} logo`}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onLoad={() => {
          logoCache.set(domain, "ok");
          setStatus("ok");
        }}
        onError={() => {
          if (retry === 0) {
            setTimeout(() => setRetry(Date.now()), 250);
            return;
          }
          logoCache.set(domain, "failed");
          setStatus("failed");
        }}
        className={cn(
          "relative w-full h-full object-contain p-0.5 bg-white transition-opacity duration-200",
          status === "ok" ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}

export default CompanyLogos;
