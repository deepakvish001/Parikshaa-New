import { ReactNode, useState } from "react";
import { IdentityCard, IdentityData } from "./IdentityCard";
import { DsaProgressCard } from "./DsaProgressCard";
import { SubjectProgressCard, SkillsCard } from "./SubjectAndSkillsCards";
import { SubmissionsHeatmapCard } from "./SubmissionsHeatmapCard";
import { CodingProfilesCard, CodingHandles } from "./CodingProfilesCard";

import { GitHubInsightsCard } from "./GitHubInsightsCard";
import { RatingsOverTimeCard } from "./RatingsOverTimeCard";
import { AchievementsShowcaseCard } from "./AchievementsShowcaseCard";
import { ProjectsHubCard } from "./ProjectsHubCard";
import { useByteskillProfileStats } from "@/hooks/useByteskillProfileStats";
import { useLeetCodeProfile, extractLeetCodeUsername } from "@/hooks/useLeetCodeProfile";
import { useCodingPlatformsStats } from "@/hooks/useCodingPlatformsStats";
import { useGithubInsights } from "@/hooks/useGithubInsights";
import { useHackerRankBadges } from "@/hooks/useHackerRankBadges";
import { derivePlatformAchievements } from "@/lib/platformAchievements";

import { langColor } from "@/lib/githubLanguageColors";
import {
  BigStatCard, ContestRankingsCard, ActiveDaysCard,
  DsaTopicAnalysisCard,
} from "./CodolioCards";
import { Sigma } from "lucide-react";


export interface ProfileShellProps {
  userId: string;
  identity: IdentityData;
  actions: ReactNode;
  handles: CodingHandles;
  /** Optional handle to use for live LeetCode data fetch when handles.leetcode is empty. */
  leetcodeFetchHandle?: string | null;
  skills: string[];
  subjects: { label: string; percent: number }[];
  isPublic?: boolean;
}

/** Shared LinkedIn-style profile layout used by both private and public pages. */
export function ProfileShell({
  userId,
  identity,
  actions,
  handles,
  leetcodeFetchHandle,
  skills,
  subjects,
  isPublic,
}: ProfileShellProps) {
  const byteskill = useByteskillProfileStats(userId);
  const lcHandle = extractLeetCodeUsername(handles.leetcode) ?? extractLeetCodeUsername(leetcodeFetchHandle);
  const lcQuery = useLeetCodeProfile(lcHandle);
  const hasLeetcode = !!lcHandle;
  const platformStats = useCodingPlatformsStats({
    codeforces: handles.codeforces,
    codechef: handles.codechef,
    geeksforgeeks: handles.geeksforgeeks,
    hackerrank: handles.hackerrank,
  });
  const ghQuery = useGithubInsights(handles.github);
  const hrBadgesQuery = useHackerRankBadges(handles.hackerrank);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const ghLanguageSkills = (ghQuery.data?.languages ?? []).map((l) => ({
    name: l.name,
    color: langColor(l.name),
    count: l.count,
    percent: l.percent,
    hint: `${l.percent}%`,
  }));

  const platformBadges = derivePlatformAchievements({
    leetcode: lcQuery.data,
    github: ghQuery.data,
    codeforces: platformStats.codeforces?.data,
    codechef: platformStats.codechef?.data,
    geeksforgeeks: platformStats.geeksforgeeks?.data,
    hackerrankBadges: hrBadgesQuery.data?.badges,
  });
  const platformBadgesLoading =
    lcQuery.isLoading || ghQuery.isLoading ||
    !!platformStats.codeforces?.isLoading || !!platformStats.codechef?.isLoading ||
    !!platformStats.geeksforgeeks?.isLoading || hrBadgesQuery.isLoading;


  const localSolved =
    byteskill.difficulty.easy.solved +
    byteskill.difficulty.medium.solved +
    byteskill.difficulty.hard.solved;
  const lcSolved =
    lcQuery.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum?.find((x) => x.difficulty === "All")?.count ?? 0;

  const cfSolved = platformStats.codeforces?.data?.solved.total ?? null;
  const ccSolved = platformStats.codechef?.data?.solved.total ?? null;
  const gfgSolved = platformStats.geeksforgeeks?.data?.solved.total ?? null;
  const hrSolved = platformStats.hackerrank?.data?.solved.total ?? null;

  const extSolvedSum =
    (cfSolved ?? 0) + (ccSolved ?? 0) + (gfgSolved ?? 0) + (hrSolved ?? 0);
  const totalQuestions = localSolved + lcSolved + extSolvedSum;
  const lcActiveDays = lcQuery.data?.matchedUser?.userCalendar?.totalActiveDays ?? 0;
  const totalActiveDays = Math.max(byteskill.activeDays, lcActiveDays);

  // Loading helper so cell shows "…" while a platform is fetching
  const cell = (
    connected: boolean,
    value: number | null,
    loading?: boolean,
  ): number | null => {
    if (!connected) return null;
    if (loading) return null;
    return value;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 sm:px-6 lg:px-8 pt-5 pb-8 sm:pt-6 sm:pb-12 md:pt-8 md:pb-16 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 lg:gap-6 items-start">
          {/* Left: identity — sticky on lg+, scrolls naturally on mobile/tablet.
              `self-start` scopes the sticky region to this grid row, so the
              panel stops exactly where the right column ends. */}
          <aside className="lg:sticky lg:top-6 lg:self-start lg:max-w-[300px] lg:z-10">

            <IdentityCard
              data={identity}
              actions={actions}
              statsUpdatedAt={{
                leetcode: lcQuery.dataUpdatedAt,
                codeforces: platformStats.codeforces?.dataUpdatedAt,
                codechef: platformStats.codechef?.dataUpdatedAt,
                geeksforgeeks: platformStats.geeksforgeeks?.dataUpdatedAt,
                hackerrank: platformStats.hackerrank?.dataUpdatedAt,
              }}
            />
          </aside>

          {/* Right: cards grid — original design preserved, new cards appended */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* === Original layout === */}
            <DsaProgressCard
              byteskill={byteskill}
              leetcode={lcQuery.data}
              leetcodeLoading={lcQuery.isLoading}
              hasLeetcode={hasLeetcode}
            />
            <SubjectProgressCard subjects={subjects} isPublic={isPublic} />
            <SkillsCard
              skills={skills}
              isPublic={isPublic}
              languages={ghLanguageSkills}
              selectedLanguage={selectedLanguage}
              onSelectLanguage={setSelectedLanguage}
              lastUpdated={ghQuery.dataUpdatedAt}
              onRefresh={() => ghQuery.refetch()}
              isRefreshing={ghQuery.isFetching}
            />

            <div className="sm:col-span-2 xl:col-span-3">
              <SubmissionsHeatmapCard
                byteskill={byteskill}
                leetcode={lcQuery.data}
                leetcodeHandle={lcHandle}
                hasLeetcode={hasLeetcode}
                leetcodeLoading={lcQuery.isLoading}
                leetcodeError={lcQuery.error ? String((lcQuery.error as Error).message || lcQuery.error) : null}
              />
            </div>

            <div className="sm:col-span-2 xl:col-span-2">
              <CodingProfilesCard handles={handles} isPublic={isPublic} />
            </div>

            {/* === New additions === */}
            <BigStatCard
              title="Total Questions"
              value={totalQuestions || 0}
              hint={hasLeetcode ? `Parikshaa ${localSolved} + LeetCode ${lcSolved}` : `${localSolved} on Parikshaa`}
              icon={<Sigma className="h-5 w-5" />}
              note={`Total Questions are calculated using data from all platforms. Note that for AtCoder, no data is available.\n\nIn the Fundamentals section, we only consider questions tagged as "School" and "Basic" for GeeksforGeeks, and all questions are included for HackerRank.`}
              breakdown={[
                { label: "Parikshaa", value: localSolved },
                ...(handles.leetcode ? [{ label: "LeetCode", value: hasLeetcode ? lcSolved : null }] : []),
                ...(handles.geeksforgeeks ? [{ label: "GeeksforGeeks", value: cell(true, gfgSolved, platformStats.geeksforgeeks?.isLoading) }] : []),
                ...(handles.codechef ? [{ label: "CodeChef", value: cell(true, ccSolved, platformStats.codechef?.isLoading) }] : []),
                ...(handles.codeforces ? [{ label: "Codeforces", value: cell(true, cfSolved, platformStats.codeforces?.isLoading) }] : []),
                ...(handles.hackerrank ? [{ label: "HackerRank", value: cell(true, hrSolved, platformStats.hackerrank?.isLoading) }] : []),
                ...(handles.atcoder ? [{ label: "AtCoder", value: null, disabled: true, note: "AtCoder does not expose a public stats API, so per-user solved counts can't be fetched automatically. Your handle is still linked on your profile." }] : []),
              ]}
            />



            <div className="sm:col-span-2 xl:col-span-3">
              <RatingsOverTimeCard
                leetcode={lcQuery.data}
                hasLeetcode={hasLeetcode}
                codeforcesHandle={handles.codeforces}
                codechefHandle={handles.codechef}
              />
            </div>

            <div className="sm:col-span-2 xl:col-span-3">
              <GitHubInsightsCard
                handle={handles.github}
                selectedLanguage={selectedLanguage}
                onSelectLanguage={setSelectedLanguage}
              />
            </div>

            <div className="sm:col-span-2 xl:col-span-3">
              <ProjectsHubCard userId={userId} />
            </div>

            <div className="sm:col-span-2 xl:col-span-3">
              <AchievementsShowcaseCard
                userId={userId}
                platformBadges={platformBadges}
                platformLoading={platformBadgesLoading}
                leetcodeBadges={lcQuery.data?.matchedUser?.badges ?? []}
                githubBadges={ghQuery.data?.achievements ?? []}
              />


            </div>

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ContestRankingsCard
                leetcode={lcQuery.data}
                hasLeetcode={hasLeetcode}
                leetcodeLoading={lcQuery.isLoading}
                codechefHandle={handles.codechef}
                codeforcesHandle={handles.codeforces}
                geeksforgeeksHandle={handles.geeksforgeeks}
                hackerrankHandle={handles.hackerrank}
                codeforces={platformStats.codeforces}
                codechef={platformStats.codechef}
                geeksforgeeks={platformStats.geeksforgeeks}
                hackerrank={platformStats.hackerrank}
              />
              <ActiveDaysCard
                activeDays={totalActiveDays || 0}
                maxStreak={byteskill.maxStreak}
                submissionsByDay={byteskill.submissionsByDay}
                note="Total Active Days are calculated using data from all platforms. Note that active-day counts are only available for Parikshaa and LeetCode; other platforms only expose total solved counts."
                breakdown={[
                  { label: "Parikshaa", value: byteskill.activeDays },
                  ...(handles.leetcode ? [{ label: "LeetCode", value: hasLeetcode ? lcActiveDays : null }] : []),
                  ...(handles.geeksforgeeks ? [{ label: "GeeksforGeeks", value: null, note: "Active-day counts aren't exposed by GeeksforGeeks. Only the total solved count is available." }] : []),
                  ...(handles.codechef ? [{ label: "CodeChef", value: null, note: "CodeChef only exposes submissions for the past year, so an accurate all-time active-day count isn't available." }] : []),
                  ...(handles.codeforces ? [{ label: "Codeforces", value: null, note: "Codeforces exposes submissions but not a daily active-day rollup. Only the total solved count is shown." }] : []),
                  ...(handles.hackerrank ? [{ label: "HackerRank", value: null, note: "HackerRank doesn't expose per-user activity calendars publicly." }] : []),
                  ...(handles.atcoder ? [{ label: "AtCoder", value: null, disabled: true, note: "AtCoder does not expose a public stats API, so per-user active-day counts can't be fetched automatically." }] : []),
                ]}
              />

            </div>
            <DsaTopicAnalysisCard byteskill={byteskill} />
          </div>
        </div>
      </main>
    </div>
  );
}
