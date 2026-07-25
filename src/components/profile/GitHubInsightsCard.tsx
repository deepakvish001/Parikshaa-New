import { Github, Star, GitFork, Users, BookOpen, ArrowUpRight, Activity, FolderGit2, X } from "lucide-react";
import { ProfileCard, EmptyCard } from "./ProfileCard";
import { useGithubInsights } from "@/hooks/useGithubInsights";
import { GithubContribHeatmap } from "./GithubContribHeatmap";
import { langColor } from "@/lib/githubLanguageColors";

export function GitHubInsightsCard({
  handle,
  selectedLanguage,
  onSelectLanguage,
}: {
  handle?: string | null;
  selectedLanguage?: string | null;
  onSelectLanguage?: (name: string | null) => void;
}) {
  const { data, isLoading, isError, refetch, isFetching } = useGithubInsights(handle);

  if (!handle) {
    return (
      <ProfileCard
        title="GitHub Insights"
        rightSlot={<Github className="h-4 w-4 text-muted-foreground" />}
      >
        <EmptyCard message="Add a GitHub handle to see your insights" />
      </ProfileCard>
    );
  }

  if (isLoading) {
    return (
      <ProfileCard title="GitHub Insights" rightSlot={<Github className="h-4 w-4 text-muted-foreground" />}>
        <div className="space-y-2 animate-pulse" aria-busy="true">
          <div className="h-16 rounded-xl bg-muted/30" />
          <div className="h-3 rounded bg-muted/30 w-2/3" />
          <div className="h-3 rounded bg-muted/30 w-1/2" />
        </div>
      </ProfileCard>
    );
  }

  if (data?.sync_status === "rate_limited") {
    return (
      <ProfileCard title="GitHub Insights" rightSlot={<Github className="h-4 w-4 text-muted-foreground" />}>
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/[0.06] p-3 text-sm">
          <p className="text-amber-200 font-medium">GitHub rate limit reached</p>
          <p className="text-muted-foreground text-[12px] mt-1">{data.sync_error}</p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-2 text-[12px] text-amber-200 hover:text-amber-100 underline focus-parikshaa rounded disabled:opacity-50"
          >
            {isFetching ? "Retrying…" : "Retry now"}
          </button>
        </div>
      </ProfileCard>
    );
  }

  if (isError || !data || data.sync_status === "error") {
    return (
      <ProfileCard title="GitHub Insights" rightSlot={<Github className="h-4 w-4 text-muted-foreground" />}>
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/[0.06] p-3 text-sm">
          <p className="text-rose-200 font-medium">Couldn't load GitHub data</p>
          <p className="text-muted-foreground text-[12px] mt-1">{data?.sync_error || "The request failed. Please try again."}</p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-2 text-[12px] text-rose-200 hover:text-rose-100 underline focus-parikshaa rounded disabled:opacity-50"
          >
            {isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      </ProfileCard>
    );
  }

  const p = data.profile;
  const stats: { label: string; value: number; icon: React.ReactNode }[] = [
    { label: "Repos",     value: p.public_repos,        icon: <BookOpen className="h-3.5 w-3.5" /> },
    { label: "Followers", value: p.followers,           icon: <Users className="h-3.5 w-3.5" /> },
    { label: "Stars",     value: data.totals.stars,     icon: <Star className="h-3.5 w-3.5" /> },
  ];

  return (
    <ProfileCard
      title="GitHub Insights"
      rightSlot={
        <a
          href={p.html_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[12px] text-amber-200 hover:text-amber-100 focus-parikshaa rounded"
        >
          @{data.handle} <ArrowUpRight className="h-3 w-3" />
        </a>
      }
    >
      {/* Header */}
      <div className="flex items-start gap-3 min-w-0">
        {p.avatar_url ? (
          <img
            src={p.avatar_url}
            alt={`${data.handle} on GitHub`}
            loading="lazy"
            className="h-12 w-12 rounded-xl border border-amber-400/30 shrink-0 object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-400/30 grid place-items-center shrink-0">
            <Github className="h-5 w-5 text-amber-300" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{p.name ?? data.handle}</div>
          {p.bio && <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">{p.bio}</p>}
          {data.contributionsLastYear != null && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-200">
              <Activity className="h-3 w-3" /> {data.contributionsLastYear.toLocaleString()} contributions this year
            </div>
          )}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-amber-400/15 bg-amber-500/[0.04] px-2.5 py-2 text-center"
          >
            <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.icon} {s.label}
            </div>
            <div className="text-lg font-bold tabular-nums text-amber-300">{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Contributions heatmap */}
      {data.contributionsCalendar?.length > 0 && (
        <GithubContribHeatmap calendar={data.contributionsCalendar} />
      )}

      {/* Languages bar — real GitHub colors */}
      {data.languages.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Top languages</p>
            {selectedLanguage && onSelectLanguage && (
              <button
                onClick={() => onSelectLanguage(null)}
                className="inline-flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-200 underline focus-parikshaa rounded"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden bg-card/60 border border-border/40 flex">
            {data.languages.map((l) => (
              <button
                key={l.name}
                type="button"
                onClick={onSelectLanguage ? () => onSelectLanguage(selectedLanguage === l.name ? null : l.name) : undefined}
                style={{
                  width: `${l.percent}%`,
                  backgroundColor: langColor(l.name),
                  opacity: selectedLanguage && selectedLanguage !== l.name ? 0.3 : 1,
                  cursor: onSelectLanguage ? "pointer" : "default",
                }}
                title={`${l.name} · ${l.count} repo${l.count === 1 ? "" : "s"} · ${l.percent}% of stack`}
                aria-label={`Filter by ${l.name}`}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.languages.map((l) => {
              const color = langColor(l.name);
              const active = selectedLanguage === l.name;
              const clickable = !!onSelectLanguage;
              return (
                <button
                  key={l.name}
                  type="button"
                  onClick={clickable ? () => onSelectLanguage!(active ? null : l.name) : undefined}
                  disabled={!clickable}
                  title={`${l.name} · ${l.count} repo${l.count === 1 ? "" : "s"} · ${l.percent}% of stack${clickable ? ` · Click to ${active ? "clear filter" : "filter repos"}` : ""}`}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] focus-parikshaa transition-all ${
                    clickable ? "cursor-pointer hover:scale-105" : "cursor-default"
                  }`}
                  style={{
                    backgroundColor: active ? `${color}30` : `${color}10`,
                    borderColor: active ? color : `${color}55`,
                    color: color,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color, boxShadow: active ? `0 0 6px ${color}` : undefined }}
                  />
                  <span>{l.name}</span>
                  <span className="tabular-nums opacity-80">{l.count}</span>
                  <span className="tabular-nums opacity-60">·</span>
                  <span className="tabular-nums opacity-80">{l.percent}%</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top repos */}
      {data.topRepos.length > 0 && (() => {
        const filteredRepos = selectedLanguage
          ? data.topRepos.filter((r) => r.language === selectedLanguage)
          : data.topRepos;
        return (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Top repos
              {selectedLanguage && (
                <span
                  className="ml-2 inline-flex items-center gap-1 normal-case tracking-normal text-[10px] px-1.5 py-0.5 rounded-full border"
                  style={{
                    color: langColor(selectedLanguage),
                    borderColor: `${langColor(selectedLanguage)}55`,
                    backgroundColor: `${langColor(selectedLanguage)}15`,
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: langColor(selectedLanguage) }} />
                  Filtered by {selectedLanguage}
                  {onSelectLanguage && (
                    <button
                      onClick={(e) => { e.preventDefault(); onSelectLanguage(null); }}
                      className="ml-0.5 hover:opacity-80 focus-parikshaa rounded"
                      aria-label="Clear language filter"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </span>
              )}
            </p>
            <a
              href={`${p.html_url}?tab=repositories`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200 focus-parikshaa rounded"
            >
              <FolderGit2 className="h-3 w-3" /> View all <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          {filteredRepos.length === 0 ? (
            <p className="text-[12px] text-muted-foreground text-center py-3">
              No top repos with {selectedLanguage}
            </p>
          ) : (
          <ul className="space-y-1.5">
            {filteredRepos.slice(0, 4).map((r) => (
              <li key={r.name}>
                <a
                  href={r.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-amber-400/15 bg-amber-500/[0.04] px-3 py-1.5 hover:border-amber-400/40 transition-colors focus-parikshaa min-w-0"
                >
                  <span className="min-w-0 inline-flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                    <span className="text-[13px] text-foreground truncate">{r.name}</span>
                  </span>
                  <span className="shrink-0 inline-flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
                    {r.language && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: langColor(r.language) }} />
                        {r.language}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3" />{r.stargazers_count}</span>
                    <span className="inline-flex items-center gap-0.5"><GitFork className="h-3 w-3" />{r.forks_count}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          )}
          <a
            href={`${p.html_url}?tab=repositories`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1] px-3 py-2 text-[12px] font-medium text-emerald-200 transition-colors focus-parikshaa"
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            View all {p.public_repos} repositories on GitHub
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
        );
      })()}
    </ProfileCard>
  );
}
