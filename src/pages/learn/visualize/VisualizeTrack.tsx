import { Link, useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { VISUALIZE_TRACKS, VISUALIZE_ALGOS } from "./_data";

export default function VisualizeTrack() {
  const { trackId } = useParams();
  const track = VISUALIZE_TRACKS.find((t) => t.id === trackId);
  if (!track) return <Navigate to="/learn/visualize" replace />;
  const algos = VISUALIZE_ALGOS.filter((a) => track.algos.includes(a.id));

  return (
    <div className="absolute inset-0 overflow-y-auto bg-transparent text-foreground">
      <Helmet>
        <title>{track.title} | Visualize | Parikshaa</title>
        <meta name="description" content={track.description} />
      </Helmet>
      <div className="mx-auto max-w-6xl px-4 md:px-6 pt-4 pb-16 space-y-8">
        <Link
          to="/learn/visualize"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Visualize
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="text-[11px] tracking-[0.24em] uppercase text-amber-400">
            {track.status} · {track.subtitle}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{track.title}</h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            {track.description}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {track.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-md border border-border/50 bg-card/40 text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.header>

        {algos.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-card/40 p-10 text-center space-y-3">
            <div className="text-lg font-semibold">Coming soon</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We're animating this track next. In the meantime, dive into the DSA
              visualizers — same pacing, same craft.
            </p>
            <Link
              to="/learn/visualize/dsa"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-medium hover:opacity-90 transition"
            >
              Explore DSA Visual <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {algos.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/learn/visualize/algo/${a.id}`}
                  className="group block h-full rounded-xl border border-border/40 bg-card/40 hover:border-amber-500/40 hover:bg-card/60 transition p-5 space-y-3"
                >
                  <div className="flex items-center justify-between text-[10px] tracking-wider uppercase text-muted-foreground">
                    <span>{a.track}</span>
                    <Play className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg font-semibold group-hover:text-amber-400 transition">
                    {a.title}
                  </div>
                  <p className="text-sm text-muted-foreground">{a.blurb}</p>
                  <div className="text-xs text-muted-foreground pt-1">
                    Problem: {a.problem}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
