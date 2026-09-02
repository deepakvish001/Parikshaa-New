import { Star, Quote, ShieldCheck, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { SectionEyebrow } from "./SectionEyebrow";

const trustedBy = [
  "IIT Delhi",
  "BITS Pilani",
  "NIT Warangal",
  "VIT Vellore",
  "PES University",
  "IIIT Hyderabad",
  "Razorpay",
  "Swiggy",
];

const items = [
  {
    quote:
      "Cracked my SDE-1 at a product company. The DSA journal + patterns kept me on track for 90 days straight.",
    name: "Priya S.",
    role: "SDE-1 · Fintech",
    initials: "PS",
    tag: "DSA · 90-day streak",
  },
  {
    quote:
      "We ran campus placements for 800 students. Proctoring caught tab switches instantly — no more disputes.",
    name: "Rohit V.",
    role: "TPO · Engineering College",
    initials: "RV",
    tag: "Campus placement",
  },
  {
    quote:
      "Went from LeetCode-anxious to shipping systems. The role-based interview bank was a cheat code.",
    name: "Ananya P.",
    role: "Full-stack Engineer",
    initials: "AP",
    tag: "Interview prep",
  },
];

const stats = [
  { k: "4.9", v: "Avg. rating" },
  { k: "92%", v: "Placement rate" },
  { k: "10k+", v: "Learners" },
  { k: "200+", v: "Colleges" },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="relative isolate overflow-hidden border-t border-border/50 px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
      {/* faint diagonal streaks — matches hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <SectionEyebrow kicker="04" label="Social Proof / Trusted Nationwide" />
          </div>

          {/* rating chip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 backdrop-blur-sm"
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-primary">
              4.9 / 5 · 2,400+ verified reviews
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            className="mx-auto max-w-[18ch] text-[38px] font-bold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-5xl md:text-6xl lg:text-[72px]"
          >
            Built for{" "}
            <span className="relative inline-block px-2 py-0.5">
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/25"
              />
              real
            </span>{" "}
            <span
              className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent"
              style={{ backgroundSize: "200% auto", animation: "apex-shimmer 6s linear infinite" }}
            >
              outcomes.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Students land offers. Colleges run clean placement drives. Recruiters
            hire faster with proctored, verifiable rounds.
          </motion.p>

          {/* trust signals */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Proctoring audited
            </span>
            <span className="h-1 w-1 rounded-full bg-border/80" />
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              92% placement lift
            </span>
            <span className="h-1 w-1 rounded-full bg-border/80" />
            <span>SOC2-ready infra</span>
          </motion.div>
        </div>


        {/* Stats strip — borders like hub grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-14 grid grid-cols-2 border-y border-border/60 sm:grid-cols-4"
        >
          {stats.map((s, i) => (
            <div
              key={s.v}
              className={
                "flex flex-col items-center gap-1 py-6 text-center " +
                (i < stats.length - 1
                  ? "sm:border-r sm:border-r-border/60 "
                  : "") +
                (i < 2 ? "border-b border-b-border/60 sm:border-b-0 " : "") +
                (i === 0 ? "border-r border-r-border/60 sm:border-r " : "") +
                (i === 2 ? "border-r border-r-border/60 sm:border-r " : "")
              }
            >
              <div
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl"
              >
                {s.k}
              </div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground/80">
                {s.v}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Testimonial cards — border-formed grid to match Core Stack / Why */}
        <div className="mt-16 grid grid-cols-1 border-t border-border/60 md:grid-cols-3 lg:mt-20">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              className={
                "group relative border-b border-border/60 " +
                "md:[&:nth-child(3n)]:border-r-0 md:border-r md:border-r-border/60"
              }
            >
              <div className="relative flex h-full min-h-[240px] flex-col justify-between overflow-hidden p-8 transition-colors duration-300 hover:bg-card/40 sm:p-10">
                {/* hover wash */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/[0.14] blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
                <Quote
                  aria-hidden
                  className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 rotate-6 text-primary/[0.06] transition-transform duration-500 group-hover:scale-110"
                  strokeWidth={1}
                />

                {/* top row: number + stars */}
                <div className="relative flex items-start justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/70">
                    {String(i + 1).padStart(2, "0")} / Story
                  </span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>

                {/* quote */}
                <div className="relative mt-10">
                  <blockquote
                    style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                    className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary"
                  >
                    "{t.quote}"
                  </blockquote>

                  <figcaption className="mt-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full border border-primary/40 bg-primary/10 text-[11px] font-bold text-primary">
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-foreground">{t.name}</div>
                        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground/80">
                          {t.role}
                        </div>
                      </div>
                    </div>
                    <span className="hidden shrink-0 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/90 sm:inline-block">
                      {t.tag}
                    </span>
                  </figcaption>
                </div>
              </div>
            </motion.figure>
          ))}
        </div>

        {/* Trusted-by strip */}
        <div className="mt-16 border-t border-border/60 pt-10">
          <p className="text-center font-mono text-[10.5px] uppercase tracking-[0.28em] text-muted-foreground/70">
            Trusted by learners & teams at
          </p>
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <motion.div
              className="flex w-max gap-10 whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
            >
              {[...trustedBy, ...trustedBy].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                  className="text-lg font-semibold tracking-[-0.01em] text-muted-foreground/70 transition-colors hover:text-foreground sm:text-xl"
                >
                  {name}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

      </div>

    </section>
  );
}

export default Testimonials;
