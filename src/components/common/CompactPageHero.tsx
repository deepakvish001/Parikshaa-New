import { ReactNode } from "react";

interface CompactPageHeroProps {
  kicker: string;
  eyebrowLabel: string;
  title: ReactNode;
  subtext?: ReactNode;
  headingId?: string;
  as?: "h1" | "h2";
}

/**
 * Compact page hero used across secondary pages (Settings, PublicProfile, etc.)
 * so they share the exact section rhythm — eyebrow chip + Space Grotesk heading + subtext —
 * that the home page uses at every breakpoint.
 */
export const CompactPageHero = ({
  kicker,
  eyebrowLabel,
  title,
  subtext,
  headingId,
  as = "h1",
}: CompactPageHeroProps) => {
  const Heading = as as any;
  return (
    <section className="border-b border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3 sm:pt-5 sm:pb-4 md:pt-6 md:pb-5">
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
          <span
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/60 bg-card/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-muted-foreground whitespace-nowrap max-w-full overflow-hidden"
          >
            <span className="text-primary shrink-0">{kicker}</span>
            <span className="opacity-60 shrink-0">·</span>
            <span className="truncate">{eyebrowLabel}</span>
          </span>
        </div>
        <Heading
          id={headingId}
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight"
        >
          {title}
        </Heading>
        {subtext && (
          <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1 max-w-2xl line-clamp-2">
            {subtext}
          </p>
        )}
      </div>
    </section>
  );
};

export default CompactPageHero;
