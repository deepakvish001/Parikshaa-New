// Stub: daily leaderboard removed.
export type DailyLeaderboardEntry = {
  userId: string;
  username: string | null;
  display_name: string | null;
  avatarUrl: string | null;
  points: number;
  rank: number;
  current_streak: number;
  total_completions: number;
};

export const useDailyLeaderboard = (_limit = 50) => ({
  entries: [] as DailyLeaderboardEntry[],
  loading: false,
});
