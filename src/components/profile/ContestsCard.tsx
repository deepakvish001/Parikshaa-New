import { ProfileCard, EmptyCard } from "./ProfileCard";
import type { LeetCodeProfile } from "@/hooks/useLeetCodeProfile";
import { Trophy } from "lucide-react";

export function ContestsCard({ leetcode, hasLeetcode, isPublic }: {
  leetcode?: LeetCodeProfile | null;
  hasLeetcode: boolean;
  isPublic?: boolean;
}) {
  const r = leetcode?.userContestRanking;
  const recent = (leetcode?.userContestRankingHistory ?? [])
    .filter((c) => c.attended)
    .slice(-5)
    .reverse();

  return (
    <ProfileCard title="Contests">
      {!hasLeetcode ? (
        <EmptyCard message={isPublic ? "No contests connected" : "Edit profile to add contests"} />
      ) : !r ? (
        <EmptyCard message="No contest history yet" />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-500/15 grid place-items-center">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums">{Math.round(r.rating)}</div>
              <div className="text-[11px] text-muted-foreground">
                Top {r.topPercentage.toFixed(1)}% · {r.attendedContestsCount} contests
              </div>
            </div>
          </div>
          {recent.length > 0 && (
            <ul className="space-y-1.5">
              {recent.map((c, i) => (
                <li key={i} className="flex items-center justify-between text-[12px] border-t border-border/40 pt-1.5">
                  <span className="truncate pr-2">{c.contest.title}</span>
                  <span className="tabular-nums text-muted-foreground">#{c.ranking}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </ProfileCard>
  );
}
