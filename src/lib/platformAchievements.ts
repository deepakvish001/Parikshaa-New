// Stub: platform achievements derivation removed (B2B/external scraping retired).
export type PlatformId =
  | "leetcode"
  | "github"
  | "codeforces"
  | "codechef"
  | "geeksforgeeks"
  | "hackerrank";

export type PlatformBadge = {
  id: string;
  platform: PlatformId;
  title: string;
  label: string;
  description?: string;
  hint?: string;
  earnedAt?: string | null;
  icon?: string;
};

export const TONE_CLASSES: Record<string, string> = {};
export const PLATFORM_LABEL: Record<PlatformId, string> = {
  leetcode: "LeetCode",
  github: "GitHub",
  codeforces: "Codeforces",
  codechef: "CodeChef",
  geeksforgeeks: "GeeksforGeeks",
  hackerrank: "HackerRank",
};

export const derivePlatformAchievements = (_input?: unknown): PlatformBadge[] => [];
