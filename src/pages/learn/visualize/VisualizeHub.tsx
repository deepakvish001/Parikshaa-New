import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Play, Sparkles, Star, History } from "lucide-react";
import { VISUALIZE_TRACKS, VISUALIZE_ALGOS } from "./_data";
import TwoPointersMini from "./mini/TwoPointersMini";
import { useVisualizeFavorites } from "./useVisualizeFavorites";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const LAST_KEY = "parikshaa:visualize:last:v1";

type LastSession = { algoId: string; step: number };

export default function VisualizeHub() {
  const { favorites, toggle, isFavorite } = useVisualizeFavorites();
  const favAlgos = VISUALIZE_ALGOS.filter((a) => favorites.includes(a.id));
  const { user } = useAuth();
  const [last, setLast] = useState<LastSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(LAST_KEY);
      return raw ? (JSON.parse(raw) as LastSession) : null;
    } catch {
      return null;
    }
  });

  // Cross-device: hydrate from most-recently-updated cloud row.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("visualize_progress")
        .select("algo_id, step, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.algo_id && VISUALIZE_ALGOS.some((a) => a.id === data.algo_id)) {
        setLast({ algoId: data.algo_id, step: data.step ?? 0 });
      }
    })();
  }, [user]);

  const lastAlgo = last ? VISUALIZE_ALGOS.find((a) => a.id === last.algoId) : null;


  return (
    <div className="absolute inset-0 overflow-y-auto bg-transparent text-foreground">
      <Helmet>
        <title>Visualize — Watch algorithms think | Parikshaa</title>
        <meta
          name="description"
          content="Interactive, animated walkthroughs of DSA, LLD, Networking and OS concepts. Step through pointers, trees, DP tables and more — one frame at a time."
        />
        <link rel="canonical" href="https://www.parikshaa.org/learn/visualize" />
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 md:px-6 pt-4 pb-16 space-y-10">
        <Link
          to="/learn"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Learn
        </Link>

        {/* Hero */}
        <section className="grid md:grid-cols-[1.1fr_1fr] gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            <div className="text-[11px] tracking-[0.24em] uppercase text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Watch the algorithm think
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Algorithms you can{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                see.
              </span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed">
              Every pattern, stepped through one frame at a time — pointers gliding,
              trees recursing, DP tables filling in. Press play and watch the idea unfold.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/learn/visualize/algo/two-pointers"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black font-medium text-sm hover:opacity-90 transition shadow-lg shadow-orange-500/20"
              >
                <Play className="h-4 w-4 fill-current" />
                Start with DSA
              </Link>
              <Link
                to="/learn/visualize/code"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm font-medium hover:border-amber-500/70 hover:bg-amber-500/15 transition"
              >
                <Code2 className="h-4 w-4" />
                Paste your code
              </Link>
              <a
                href="#tracks"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/60 bg-card/40 text-sm hover:border-primary/50 hover:text-primary transition"
              >
                Choose a track
              </a>

            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-2xl border border-amber-500/20 bg-card/40 p-5 md:p-6 backdrop-blur-sm shadow-2xl shadow-orange-500/5"
          >
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-4">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <div>two-pointers · target 14</div>
            </div>
            <TwoPointersMini />
          </motion.div>
        </section>

        {/* Continue where you left off — cross-device via cloud, local fallback */}
        {lastAlgo && last && (
          <section>
            <Link
              to={`/learn/visualize/algo/${lastAlgo.id}?step=${last.step}`}
              className="group flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent hover:border-amber-500/60 transition p-4 sm:p-5"
            >
              <div className="h-10 w-10 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
                <History className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] tracking-[0.2em] uppercase text-amber-400/90">
                  Continue where you left off
                </div>
                <div className="font-semibold truncate group-hover:text-amber-300 transition">
                  {lastAlgo.title}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  Step {last.step + 1} · {lastAlgo.track}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          </section>
        )}

        {/* Favorites — quick-resume list */}

        {favAlgos.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  Your favorites
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Resume your most-used visualizers in one click.
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {favAlgos.length} saved
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {favAlgos.map((a) => (
                <div
                  key={a.id}
                  className="relative rounded-xl border border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 transition p-4"
                >
                  <Link
                    to={`/learn/visualize/algo/${a.id}`}
                    className="block space-y-1.5 pr-8"
                  >
                    <div className="text-[10px] tracking-wider uppercase text-amber-400/90">
                      {a.track}
                    </div>
                    <div className="font-semibold hover:text-amber-400 transition">
                      {a.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {a.blurb}
                    </div>
                  </Link>
                  <button
                    onClick={() => toggle(a.id)}
                    aria-label="Remove from favorites"
                    className="absolute top-3 right-3 rounded-md p-1.5 text-amber-400 hover:bg-amber-500/15 transition focus-parikshaa"
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tracks */}
        <section id="tracks" className="space-y-6 pt-4">

          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Pick a track</h2>
            <p className="text-muted-foreground mt-2">
              Each track teaches concepts the same way — by animating them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {VISUALIZE_TRACKS.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link
                  to={`/learn/visualize/${t.id}`}
                  className="group block h-full rounded-2xl border border-border/40 bg-card/40 hover:bg-card/60 hover:border-amber-500/40 transition-all p-6 md:p-7 space-y-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight group-hover:text-amber-400 transition">
                        {t.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full border tracking-wider uppercase font-medium ${
                        t.status === "LIVE"
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                          : t.status === "NEW"
                          ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                          : "border-border/60 bg-card/60 text-muted-foreground"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-md border border-border/50 bg-background/40 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 text-sm">
                    <span className="text-muted-foreground">{t.meta}</span>
                    <span className="inline-flex items-center gap-1 text-amber-400 font-medium group-hover:gap-2 transition-all">
                      Enter <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured algorithms */}
        <section className="space-y-6 pt-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Featured visualizers
            </h2>
            <p className="text-muted-foreground mt-2">
              Jump straight into an animation.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {VISUALIZE_ALGOS.map((a, i) => {
              const fav = isFavorite(a.id);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="relative"
                >
                  <Link
                    to={`/learn/visualize/algo/${a.id}`}
                    className="group block h-full rounded-xl border border-border/40 bg-card/40 hover:border-amber-500/40 hover:bg-card/60 transition p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between pr-6">
                      <span className="text-[10px] tracking-wider uppercase text-muted-foreground">
                        {a.track}
                      </span>
                      <Play className="h-3.5 w-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <div className="font-semibold group-hover:text-amber-400 transition">
                      {a.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {a.blurb}
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(a.id);
                    }}
                    aria-pressed={fav}
                    aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                    className={`absolute top-3 right-3 rounded-md p-1.5 transition focus-parikshaa ${
                      fav
                        ? "text-amber-400 hover:bg-amber-500/15"
                        : "text-muted-foreground/60 hover:text-amber-400 hover:bg-amber-500/10"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${fav ? "fill-current" : ""}`} />
                  </button>
                </motion.div>
              );
            })}

          </div>
        </section>
      </div>
    </div>
  );
}
