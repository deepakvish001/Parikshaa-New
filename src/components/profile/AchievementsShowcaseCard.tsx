import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileCard, EmptyCard } from "./ProfileCard";
import AchievementBadge, { achievements } from "@/components/AchievementBadge";
import {
  PlatformBadge,
  TONE_CLASSES,
  PLATFORM_LABEL,
} from "@/lib/platformAchievements";
import { cn } from "@/lib/utils";

interface EarnedRow {
  achievement_id: string;
  earned_at: string;
}

export interface LeetCodeBadgeItem {
  id: string;
  displayName: string;
  icon: string;
  hoverText?: string;
  creationDate?: string;
  category?: string;
}

export interface GithubAchievementItem {
  slug: string;
  name: string;
  image: string;
  tier?: number;
}

interface Props {
  userId: string;
  /** Optional badges derived from external coding platforms (LeetCode, GitHub, etc.). */
  platformBadges?: PlatformBadge[];
  /** Loading flag for external badge sources, so we can show a skeleton instead of "empty". */
  platformLoading?: boolean;
  /** Raw LeetCode badges (with logo icons) from the LC profile. */
  leetcodeBadges?: LeetCodeBadgeItem[];
  /** Raw GitHub achievement icons scraped from the public GH profile. */
  githubBadges?: GithubAchievementItem[];
}

// LeetCode + GitHub already render as real logo grids above (LogoBadgesPanel),
// so we only show milestone chips for the platforms that don't have raw icons.
const PLATFORM_ORDER: PlatformBadge["platform"][] = ["codeforces", "codechef", "geeksforgeeks", "hackerrank"];

const PLATFORM_ACCENT: Record<PlatformBadge["platform"], { glow: string; ring: string; text: string }> = {
  leetcode:      { glow: "from-amber-500/15 to-transparent",   ring: "border-amber-400/30",   text: "text-amber-300" },
  github:        { glow: "from-orange-500/15 to-transparent",  ring: "border-orange-400/30",  text: "text-orange-300" },
  codeforces:    { glow: "from-rose-500/15 to-transparent",    ring: "border-rose-400/30",    text: "text-rose-300" },
  codechef:      { glow: "from-emerald-500/15 to-transparent", ring: "border-emerald-400/30", text: "text-emerald-300" },
  geeksforgeeks: { glow: "from-emerald-500/15 to-transparent", ring: "border-emerald-400/30", text: "text-emerald-300" },
  hackerrank:    { glow: "from-amber-500/15 to-transparent",     ring: "border-amber-400/30",     text: "text-amber-300" },
};


function PlatformPanel({
  platform,
  badges,
}: {
  platform: PlatformBadge["platform"] | "parikshaa";
  badges: PlatformBadge[];
}) {
  const [expanded, setExpanded] = useState(false);
  const accent =
    platform === "parikshaa"
      ? { glow: "from-amber-500/15 to-transparent", ring: "border-amber-400/30", text: "text-amber-300", tile: "border-amber-400/20 bg-amber-500/[0.06]" }
      : { ...PLATFORM_ACCENT[platform], tile: `${PLATFORM_ACCENT[platform].ring.replace("/30", "/20")} bg-card/60` };
  const label = platform === "parikshaa" ? "Parikshaa" : PLATFORM_LABEL[platform];
  const visible = expanded ? badges : badges.slice(0, 12);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card/40 p-3.5",
        accent.ring,
      )}
    >
      <div className={cn("pointer-events-none absolute inset-x-0 -top-12 h-24 bg-gradient-to-b blur-2xl opacity-70", accent.glow)} />
      <div className="relative">
        <div className="flex items-baseline justify-between mb-2.5">
          <div>
            <p className={cn("text-[10px] uppercase tracking-[0.18em] font-bold", accent.text)}>{label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              <span className="text-foreground font-semibold tabular-nums">{badges.length}</span> badge{badges.length === 1 ? "" : "s"} earned
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
          {visible.map((b) => (
            <div
              key={b.id}
              className="group flex flex-col items-center gap-1"
              title={b.hint ? `${b.label} · ${b.hint}` : b.label}
            >
              <div className={cn(
                "relative h-12 w-12 rounded-xl border grid place-items-center overflow-hidden transition-transform group-hover:scale-105",
                accent.tile,
              )}>
                <span aria-hidden className={cn("text-[22px] leading-none", accent.text)}>{b.icon}</span>
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2">
                {b.label}
              </span>
            </div>
          ))}
        </div>
        {badges.length > 12 && (
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors focus-parikshaa rounded"
            >
              {expanded ? "show less" : `··· show more (${badges.length - 12})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


function ParikshaaPanel({ items }: { items: { catalog: typeof achievements[number]; earned_at: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 8);
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-400/30 bg-card/40 p-3.5">
      <div className="pointer-events-none absolute inset-x-0 -top-12 h-24 bg-gradient-to-b from-amber-500/15 to-transparent blur-2xl opacity-70" />
      <div className="relative">
        <div className="flex items-baseline justify-between mb-2.5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-300">Parikshaa</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              <span className="text-foreground font-semibold tabular-nums">{items.length}</span> award{items.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
          {visible.map((it) => (
            <div key={it.catalog.id} className="flex flex-col items-center gap-1">
              <AchievementBadge achievement={it.catalog} earned earnedAt={it.earned_at} size="md" showName={false} />
              <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2">
                {it.catalog.name}
              </span>
            </div>
          ))}
        </div>
        {items.length > 8 && (
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors focus-parikshaa rounded"
            >
              {expanded ? "show less" : `··· show more (${items.length - 8})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function resolveBadgeIcon(icon: string, baseHost: string): string {
  if (!icon) return "";
  if (/^https?:\/\//i.test(icon)) return icon;
  if (icon.startsWith("//")) return `https:${icon}`;
  if (icon.startsWith("/")) return `${baseHost}${icon}`;
  return `${baseHost}/${icon}`;
}

export interface LogoBadgeItem {
  id: string;
  name: string;
  image: string;
  hint?: string;
  tier?: number;
}

function LogoBadgesPanel({
  title,
  badges,
  baseHost,
}: {
  title: string;
  badges: LogoBadgeItem[];
  /** Origin used to resolve relative icon URLs (e.g. "https://leetcode.com"). */
  baseHost: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? badges : badges.slice(0, 12);
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-400/30 bg-card/40 p-3.5">
      <div className="pointer-events-none absolute inset-x-0 -top-12 h-24 bg-gradient-to-b from-amber-500/15 to-transparent blur-2xl opacity-70" />
      <div className="relative">
        <div className="flex items-baseline justify-between mb-2.5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-300">{title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              <span className="text-foreground font-semibold tabular-nums">{badges.length}</span> badge{badges.length === 1 ? "" : "s"} earned
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
          {visible.map((b) => (
            <div
              key={b.id}
              className="group flex flex-col items-center gap-1"
              title={b.hint || b.name}
            >
              <div className="relative h-12 w-12 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] grid place-items-center overflow-hidden transition-transform group-hover:scale-105">
                <img
                  src={resolveBadgeIcon(b.image, baseHost)}
                  alt={b.name}
                  loading="lazy"
                  className="h-9 w-9 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                {b.tier && b.tier > 1 && (
                  <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-black px-1.5 py-px leading-none tabular-nums">
                    ×{b.tier}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2">
                {b.name}
              </span>
            </div>
          ))}
        </div>
        {badges.length > 12 && (
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors focus-parikshaa rounded"
            >
              {expanded ? "show less" : `··· show more (${badges.length - 12})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



export function AchievementsShowcaseCard({ userId, platformBadges = [], platformLoading, leetcodeBadges = [], githubBadges = [] }: Props) {
  const [earned, setEarned] = useState<EarnedRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDenied(false);
    supabase
      .from("user_achievements")
      .select("achievement_id, earned_at")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setDenied(true);
          setEarned([]);
        } else {
          setEarned((data ?? []) as EarnedRow[]);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const items = useMemo(() => {
    if (!earned) return [];
    const byId = new Map(achievements.map((a) => [a.id, a]));
    return earned
      .map((e) => ({ catalog: byId.get(e.achievement_id), earned_at: e.earned_at }))
      .filter((x): x is { catalog: typeof achievements[number]; earned_at: string } => !!x.catalog);
  }, [earned]);

  const grouped = useMemo(() => {
    const g: Record<string, PlatformBadge[]> = {};
    for (const b of platformBadges) (g[b.platform] ||= []).push(b);
    return g;
  }, [platformBadges]);

  const totalCount = items.length + platformBadges.length + leetcodeBadges.length + githubBadges.length;
  const orderedPlatforms = PLATFORM_ORDER.filter((p) => grouped[p]?.length);

  return (
    <ProfileCard
      title="Showcase your Achievements"
      rightSlot={
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {loading ? "…" : `${totalCount} earned`}
        </span>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/20" />
          ))}
        </div>
      ) : totalCount === 0 && !platformLoading ? (
        <EmptyCard
          message={denied ? "Sign in to view this user's achievements" : "Earn your first achievement to see it here"}
        />
      ) : (
        <div className="space-y-3">
          {items.length > 0 && <ParikshaaPanel items={items} />}

          {leetcodeBadges.length > 0 && (
            <LogoBadgesPanel
              title="LeetCode Badges"
              baseHost="https://leetcode.com"
              badges={leetcodeBadges.map((b) => ({
                id: b.id,
                name: b.displayName,
                image: b.icon,
                hint: b.hoverText,
              }))}
            />
          )}

          {githubBadges.length > 0 && (
            <LogoBadgesPanel
              title="GitHub Achievements"
              baseHost="https://github.com"
              badges={githubBadges.map((b) => ({
                id: b.slug,
                name: b.name,
                image: b.image,
                tier: b.tier,
                hint: b.tier && b.tier > 1 ? `${b.name} ×${b.tier}` : b.name,
              }))}
            />
          )}




          {orderedPlatforms.length > 0 && (
            <div className="space-y-3">
              {orderedPlatforms.map((p) => (
                <PlatformPanel key={p} platform={p} badges={grouped[p]} />
              ))}
            </div>
          )}


          {platformLoading && orderedPlatforms.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-muted/20" />
              ))}
            </div>
          )}
        </div>
      )}
    </ProfileCard>
  );
}
