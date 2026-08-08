import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Clock, Map as MapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getRoadmapBySlug } from "@/data/roadmapsData";
import { sanitizeRoadmapMarkdown } from "@/lib/roadmaps/sanitize";
import { parseRoadmapSections } from "@/lib/roadmaps/parseSections";
import { measure } from "@/lib/roadmaps/perf";
import { RoadmapSheetView } from "@/components/roadmaps/RoadmapSheetView";
import { cn } from "@/lib/utils";


const DIFF_TONE: Record<string, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Advanced: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function RoadmapDetail() {
  const { slug = "" } = useParams();
  const roadmap = getRoadmapBySlug(slug);

  const sections = useMemo(
    () =>
      roadmap
        ? measure(
            "parseSections",
            () => parseRoadmapSections(sanitizeRoadmapMarkdown(roadmap.content)),
            { slug: roadmap.slug },
          )
        : [],
    [roadmap],
  );

  const mountStart = useRef(
    typeof performance !== "undefined" ? performance.now() : Date.now(),
  );
  useEffect(() => {
    if (!roadmap) return;
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const totalResources = sections.reduce((n, s) => n + s.resources.length, 0);
    const durationMs = Math.round((now - mountStart.current) * 100) / 100;
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[roadmap-perf] render", `${durationMs}ms`, {
        slug: roadmap.slug,
        sections: sections.length,
        resources: totalResources,
      });
    }
  }, [roadmap, sections]);




  if (!roadmap) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
        <MapIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Roadmap not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The roadmap you’re looking for doesn’t exist yet.
        </p>
        <Link
          to="/roadmaps"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-2 text-sm hover:border-amber-500/40"
        >
          <ArrowLeft className="h-4 w-4" /> Back to roadmaps
        </Link>
      </div>
    );
  }

  const Icon = roadmap.icon;

  return (
    <div className="min-h-svh w-full">
      {/* Header */}
      <section className="relative border-b border-border/50">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-10">
          <Link
            to="/roadmaps"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All roadmaps
          </Link>

          <div className="mt-4 flex items-start gap-4">
            <div
              className={cn(
                "h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br flex items-center justify-center ring-1 ring-white/5",
                roadmap.accent,
              )}
            >
              <Icon className="h-6 w-6 text-amber-200" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] uppercase tracking-wide", DIFF_TONE[roadmap.difficulty])}
                >
                  {roadmap.difficulty}
                </Badge>
                <span className="text-xs text-muted-foreground">{roadmap.category}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {roadmap.readingTime}
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                {roadmap.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{roadmap.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {roadmap.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border/50 bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content — sheet-style */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
        <RoadmapSheetView slug={roadmap.slug} sections={sections} />
      </section>
    </div>


  );
}
