import { motion } from "framer-motion";
import { Check, X, Sparkles, ArrowRight, MessageCircle } from "lucide-react";
import { HeroStyleHeading, Highlight, Shimmer, Muted } from "./HeroStyleHeading";
import { scrollToHash } from "@/lib/smoothScroll";
import { trackEvent } from "@/lib/analytics";

type Row = {
  kicker: string;
  feature: string;
  parikshaa: string;
  others: string;
  hero?: boolean;
};

const rows: Row[] = [
  {
    kicker: "01",
    feature: "What you pay",
    parikshaa: "₹0 forever — every sheet, mock and rank",
    others: "₹4k–₹40k plans + trial pop-ups",
    hero: true,
  },
  {
    kicker: "02",
    feature: "How you're proctored",
    parikshaa: "AI eye + phone side-camera + tamper log",
    others: "Honor-system mocks · no room sweep",
  },
  {
    kicker: "03",
    feature: "What you can prep",
    parikshaa: "DSA · CP · SQL · System Design · Aptitude",
    others: "One topic silo, static PDFs",
  },
  {
    kicker: "04",
    feature: "Company intel",
    parikshaa: "18+ mass recruiters · fresh drops weekly",
    others: "Year-old question banks",
  },
  {
    kicker: "05",
    feature: "When you're stuck",
    parikshaa: "Real mentors reply in 1 business day",
    others: "Bot templates or paid upsell",
  },
  {
    kicker: "06",
    feature: "How progress compounds",
    parikshaa: "SRS · XP · Streaks · PRS score",
    others: "Plain checkbox trackers",
  },
];

function YesCell({ text }: { text: string }) {
  return (
    <span className="flex min-w-0 items-start gap-2 text-foreground">
      <span
        aria-hidden
        className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 ring-1 ring-inset ring-primary/30"
      >
        <Check className="h-3 w-3 text-primary" />
      </span>
      <span className="sr-only">Parikshaa: included — </span>
      <span className="leading-snug">{text}</span>
    </span>
  );
}

function NoCell({ text }: { text: string }) {
  return (
    <span className="flex min-w-0 items-start gap-2 text-muted-foreground">
      <span
        aria-hidden
        className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted/40 ring-1 ring-inset ring-border/60"
      >
        <X className="h-3 w-3 text-rose-500/70" />
      </span>
      <span className="sr-only">Others: gap — </span>
      <span className="leading-snug">{text}</span>
    </span>
  );
}

export function ParikshaaVsOthers() {
  const handleCta = (label: string, href: string) => {
    trackEvent("cta_click", { label, href, location: "comparison" });
    scrollToHash(href);
  };

  return (
    <section
      id="comparison"
      aria-labelledby="comparison-heading"
      className="relative w-full overflow-hidden px-4 py-24 sm:px-6 sm:py-28 md:py-32"
    >
      {/* Ambient orbs — mirrors the hero atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[10%] top-[60%] -z-10 h-[280px] w-[280px] rounded-full bg-orange-500/10 blur-[100px]"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col">
        <HeroStyleHeading
          eyebrowKicker="03"
          eyebrowLabel="Head to Head / Why Students Switch"
          headingId="comparison-heading"
          as="h2"
          subheadPrimary="Same prep goal. Radically different economics."
          subheadSecondary=" Six honest checkpoints where legacy platforms bill you — and where Parikshaa just ships."
        >
          <span className="block">
            Why pay for <Muted>what should be</Muted>
          </span>
          <span className="block">
            <Highlight>free</Highlight> &amp; <Shimmer>shipped weekly?</Shimmer>
          </span>
        </HeroStyleHeading>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative mx-auto mt-12 w-full max-w-4xl sm:mt-16"
        >
          {/* Outer glow to echo hero button aura */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-[26px] bg-gradient-to-b from-primary/40 via-primary/10 to-transparent opacity-70 blur-[2px]"
          />

          <div className="relative overflow-hidden rounded-[24px] border border-border/70 bg-card/70 shadow-[0_30px_80px_-40px_hsl(var(--primary)/0.55)] backdrop-blur-xl">
            {/* ================= Desktop / tablet: semantic table ================= */}
            <table
              className="hidden w-full border-collapse text-sm sm:table"
              aria-describedby="comparison-heading"
            >
              <caption className="sr-only">
                Feature-by-feature comparison of Parikshaa versus other placement prep platforms
              </caption>
              <thead>
                <tr className="border-b border-border/60 bg-background/50 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  <th scope="col" className="w-[60px] px-6 py-4 font-mono text-primary/70">#</th>
                  <th scope="col" className="px-6 py-4">Criterion</th>
                  <th scope="col" className="px-6 py-4 text-primary">
                    <span className="inline-flex items-center gap-2">
                      <span
                        style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                        className="text-[12px] font-bold tracking-[0.14em]"
                      >
                        Parikshaa
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary ring-1 ring-inset ring-primary/25">
                        <Sparkles className="h-2.5 w-2.5" aria-hidden />
                        Free
                      </span>
                    </span>
                  </th>
                  <th scope="col" className="px-6 py-4">The Others</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.feature}
                    tabIndex={0}
                    className={`focus-parikshaa border-b border-border/40 align-top outline-none transition-colors last:border-b-0 hover:bg-primary/[0.03] focus-visible:bg-primary/[0.06] ${
                      row.hero ? "bg-primary/[0.04]" : ""
                    }`}
                  >
                    <td className="px-6 py-5 font-mono text-xs font-bold tracking-[0.14em] text-primary/70">
                      {row.kicker}
                    </td>
                    <th
                      scope="row"
                      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                      className="px-6 py-5 text-left font-bold tracking-[-0.01em] text-foreground"
                    >
                      {row.feature}
                    </th>
                    <td className="px-6 py-5">
                      <YesCell text={row.parikshaa} />
                    </td>
                    <td className="px-6 py-5">
                      <NoCell text={row.others} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ================= Mobile: stacked cards ================= */}
            <ul className="divide-y divide-border/40 sm:hidden" aria-label="Parikshaa vs Others comparison">
              {rows.map((row) => (
                <li
                  key={row.feature}
                  tabIndex={0}
                  className={`focus-parikshaa space-y-3 px-4 py-5 outline-none transition-colors focus-visible:bg-primary/[0.06] ${
                    row.hero ? "bg-primary/[0.04]" : ""
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      aria-hidden
                      className="font-mono text-[11px] font-bold tracking-[0.14em] text-primary/70"
                    >
                      {row.kicker}
                    </span>
                    <h3
                      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                      className="text-[15px] font-bold tracking-[-0.01em] text-foreground"
                    >
                      {row.feature}
                    </h3>
                  </div>
                  <div className="space-y-2 pl-1">
                    <div>
                      <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-primary/80">
                        Parikshaa
                      </p>
                      <YesCell text={row.parikshaa} />
                    </div>
                    <div>
                      <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                        The Others
                      </p>
                      <NoCell text={row.others} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer meta strip */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/60 bg-background/40 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80 sm:px-6 sm:py-4 sm:text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-primary">
                <Sparkles className="h-3 w-3" aria-hidden />
                Built with students · Not for exit
              </span>
              <span aria-hidden className="h-1 w-1 rounded-full bg-border" />
              <span>No cards · No trials · No lock-in</span>
            </div>
          </div>
        </motion.div>

        {/* ================= CTA under the table — hero-matched ================= */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mx-auto mt-10 flex w-full max-w-3xl flex-col items-center gap-4 text-center sm:mt-12"
        >
          <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            <span className="font-semibold text-foreground">Ready to switch?</span> Start prepping in the next 60 seconds — or talk to a mentor first.
          </p>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <button
              type="button"
              onClick={() => handleCta("Start free", "#final-cta")}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[12px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary)/0.9)] transition-all hover:bg-primary/90 hover:shadow-[0_0_60px_-4px_hsl(var(--primary))] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Start prepping on Parikshaa for free"
            >
              Start prepping free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => handleCta("Talk to a mentor", "#mentor-desk")}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card/60 px-6 text-[12px] font-bold uppercase tracking-[0.14em] text-foreground backdrop-blur-sm transition-all hover:border-primary/50 hover:text-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Talk to a Parikshaa mentor at the Mentor Desk"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Talk to a mentor
            </button>
          </div>

          <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
            No card · Reply in 1 business day
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default ParikshaaVsOthers;
