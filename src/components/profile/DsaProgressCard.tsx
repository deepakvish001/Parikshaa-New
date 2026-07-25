import { useMemo, useState } from "react";
import { ProfileCard, EmptyCard, SourcePill } from "./ProfileCard";
import type { ByteskillStats } from "@/hooks/useByteskillProfileStats";
import type { LeetCodeProfile } from "@/hooks/useLeetCodeProfile";

const COLORS = { easy: "#22c55e", medium: "#f59e0b", hard: "#ef4444" };

function Donut({ easy, medium, hard, easyTotal, mediumTotal, hardTotal }: {
  easy: number; medium: number; hard: number;
  easyTotal: number; mediumTotal: number; hardTotal: number;
}) {
  const total = easy + medium + hard;
  const grandTotal = easyTotal + mediumTotal + hardTotal;
  const R = 60, C = 2 * Math.PI * R;
  const segs = [
    { v: easy, c: COLORS.easy, t: easyTotal },
    { v: medium, c: COLORS.medium, t: mediumTotal },
    { v: hard, c: COLORS.hard, t: hardTotal },
  ];
  let offset = 0;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={R} stroke="hsl(var(--muted))" strokeOpacity="0.35" strokeWidth="10" fill="none" />
        {segs.map((s, i) => {
          if (!s.t) return null;
          const frac = s.t > 0 ? s.v / s.t : 0;
          const arc = (frac * C) / 3; // each difficulty takes one third of the ring
          const dash = `${arc} ${C}`;
          const rotateOffset = (i * C) / 3;
          const el = (
            <circle
              key={i}
              cx="80" cy="80" r={R}
              stroke={s.c}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={-rotateOffset}
              style={{ transition: "stroke-dasharray 600ms ease" }}
            />
          );
          offset += arc;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-3xl font-bold tabular-nums text-foreground">{total}</div>
          <div className="text-[11px] text-muted-foreground border-t border-border/60 mt-1 pt-1">{grandTotal}</div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  byteskill: ByteskillStats;
  leetcode?: LeetCodeProfile | null;
  leetcodeLoading?: boolean;
  hasLeetcode: boolean;
}

export function DsaProgressCard({ byteskill, leetcode, leetcodeLoading, hasLeetcode }: Props) {
  const [source, setSource] = useState<"byteskill" | "leetcode">("byteskill");

  const lcStats = useMemo(() => {
    const m = leetcode?.matchedUser?.submitStatsGlobal?.acSubmissionNum ?? [];
    const totals = leetcode?.allQuestionsCount ?? [];
    const get = (d: string) => m.find((x) => x.difficulty === d)?.count ?? 0;
    const totGet = (d: string) => totals.find((x) => x.difficulty === d)?.count ?? 0;
    return {
      easy: get("Easy"), medium: get("Medium"), hard: get("Hard"),
      easyTotal: totGet("Easy"), mediumTotal: totGet("Medium"), hardTotal: totGet("Hard"),
    };
  }, [leetcode]);

  const showing = source === "leetcode" ? lcStats : {
    easy: byteskill.difficulty.easy.solved,
    medium: byteskill.difficulty.medium.solved,
    hard: byteskill.difficulty.hard.solved,
    easyTotal: byteskill.difficulty.easy.total,
    mediumTotal: byteskill.difficulty.medium.total,
    hardTotal: byteskill.difficulty.hard.total,
  };

  return (
    <ProfileCard
      title="DSA Progress"
      rightSlot={
        <SourcePill
          options={[
            { value: "byteskill", label: "Parikshaa" },
            { value: "leetcode", label: "LeetCode" },
          ]}
          value={source}
          onChange={(v) => setSource(v as any)}
        />
      }
    >
      {source === "leetcode" && !hasLeetcode ? (
        <EmptyCard message="Add a LeetCode handle in Settings to see live progress" />
      ) : source === "leetcode" && leetcodeLoading ? (
        <div className="h-[160px] grid place-items-center text-xs text-muted-foreground">Fetching LeetCode…</div>
      ) : (

        <div className="flex flex-col items-center gap-3">
          <Donut {...showing} />
          <div className="grid grid-cols-3 gap-3 text-[11px] w-full">
            {[
              { k: "Easy", v: showing.easy, t: showing.easyTotal, c: COLORS.easy },
              { k: "Medium", v: showing.medium, t: showing.mediumTotal, c: COLORS.medium },
              { k: "Hard", v: showing.hard, t: showing.hardTotal, c: COLORS.hard },
            ].map((d) => (
              <div key={d.k} className="flex items-center gap-1.5 justify-center">
                <span className="h-2 w-2 rounded-full" style={{ background: d.c }} />
                <span className="text-muted-foreground">{d.k}</span>
                <span className="font-medium tabular-nums">{d.v}/{d.t || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ProfileCard>
  );
}
