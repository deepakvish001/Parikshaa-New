import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Search, Map as MapIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { roadmaps, roadmapCategories } from "@/data/roadmapsData";
import { roadmapPreview } from "@/lib/roadmaps/sanitize";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;


const DIFF_TONE: Record<string, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Advanced: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function Roadmaps() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roadmaps.filter((r) => {
      const catOk = category === "All" || r.category === category;
      const qOk =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      return catOk && qOk;
    });
  }, [query, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    setPage(1);
  }, [query, category]);
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);


  return (
    <div className="min-h-svh w-full">
      {/* HERO — mirrors ApexHero styling */}
      <section className="relative isolate overflow-hidden px-4 pb-8 pt-16 sm:px-6 sm:pt-20 lg:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] opacity-[0.35]"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 50% 0%, hsl(var(--primary)/0.28), transparent 65%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
            maskImage:
              "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
          }}
        />

        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center gap-4"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <Sparkles className="h-3 w-3" />
              Roadmaps & Curated Resources
            </div>
            <h1 className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Structured roadmaps to master{" "}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                every skill
              </span>
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
              Hand-picked learning paths and community-curated resource lists. Pick a track,
              follow the roadmap end-to-end, and level up.
            </p>

            <div className="mt-5 flex w-full max-w-2xl flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roadmaps, topics, tags…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 h-11 bg-card/40 backdrop-blur"
                />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {roadmapCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    category === c
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TABLE */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">All roadmaps</h2>
            <p className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "track" : "tracks"} available
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-10 text-center">
            <MapIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No roadmaps match your filters yet. More coming soon.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm">
              {/* Desktop table */}
              <div className="hidden md:block">
                <table
                  className="w-full text-sm"
                  aria-label="Roadmaps catalogue"
                >
                  <caption className="sr-only">
                    List of roadmaps with category, difficulty, estimated time, tags and open action.
                  </caption>
                  <thead className="border-b border-border/50 bg-background/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-5 py-3 text-left font-semibold">#</th>
                      <th scope="col" className="px-5 py-3 text-left font-semibold">Roadmap</th>
                      <th scope="col" className="px-5 py-3 text-left font-semibold">Category</th>
                      <th scope="col" className="px-5 py-3 text-left font-semibold">Level</th>
                      <th scope="col" className="px-5 py-3 text-left font-semibold">Time</th>
                      <th scope="col" className="px-5 py-3 text-left font-semibold">Tags</th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((r, i) => {
                      const Icon = r.icon;
                      const rowIndex = pageStart + i + 1;
                      return (
                        <motion.tr
                          key={r.slug}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          className="group border-b border-border/40 last:border-b-0 transition hover:bg-primary/[0.04] focus-within:bg-primary/[0.04]"
                        >
                          <th
                            scope="row"
                            className="px-5 py-4 text-left text-xs font-normal text-muted-foreground tabular-nums"
                          >
                            {String(rowIndex).padStart(2, "0")}
                          </th>
                          <td className="px-5 py-4">
                            <Link
                              to={`/roadmaps/${r.slug}`}
                              aria-label={`Open ${r.title} roadmap`}
                              className="flex items-start gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                            >
                              <div
                                className={cn(
                                  "h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center ring-1 ring-white/5",
                                  r.accent,
                                )}
                              >
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground group-hover:text-primary transition">
                                  {r.title}
                                </div>
                                <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                  {roadmapPreview(r.description, 140)}
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                            {r.category}
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase tracking-wide",
                                DIFF_TONE[r.difficulty],
                              )}
                            >
                              {r.difficulty}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                            {r.readingTime}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1">
                              {r.tags.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="rounded-full border border-border/50 bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              to={`/roadmaps/${r.slug}`}
                              aria-label={`Open ${r.title}`}
                              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                            >
                              Open <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked rows — touch-friendly, semantic list */}
              <ul
                className="md:hidden divide-y divide-border/40"
                aria-label="Roadmaps catalogue"
              >
                {pageItems.map((r, i) => {
                  const Icon = r.icon;
                  const rowIndex = pageStart + i + 1;
                  return (
                    <li key={r.slug}>
                      <Link
                        to={`/roadmaps/${r.slug}`}
                        aria-label={`Open ${r.title} roadmap`}
                        className="flex min-h-[88px] items-start gap-3 p-4 active:bg-primary/[0.08] hover:bg-primary/[0.04] focus-visible:bg-primary/[0.04] focus-visible:outline-none"
                      >
                        <div
                          className={cn(
                            "h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center ring-1 ring-white/5",
                            r.accent,
                          )}
                        >
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {String(rowIndex).padStart(2, "0")}
                            </span>
                            <span className="font-semibold text-foreground">{r.title}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {roadmapPreview(r.description, 140)}
                          </p>
                          <dl className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <dt className="sr-only">Level</dt>
                              <dd>
                                <Badge
                                  variant="outline"
                                  className={cn("text-[10px] uppercase", DIFF_TONE[r.difficulty])}
                                >
                                  {r.difficulty}
                                </Badge>
                              </dd>
                            </div>
                            <div className="flex items-center gap-1">
                              <dt className="sr-only">Category</dt>
                              <dd>{r.category}</dd>
                            </div>
                            <div className="flex items-center gap-1">
                              <dt className="sr-only">Time</dt>
                              <dd>{r.readingTime}</dd>
                            </div>
                          </dl>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                aria-label="Roadmaps pagination"
                className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)}
                  </span>{" "}
                  of <span className="font-medium text-foreground">{filtered.length}</span>
                </p>
                <div className="flex items-center gap-2 self-end">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-border/60 bg-card/40 px-3 text-xs font-medium transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-border/60 bg-card/40 px-3 text-xs font-medium transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );

}
