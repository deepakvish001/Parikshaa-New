import { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GraduationCap, MapPin, BookOpen, Briefcase, Globe, Phone, BookOpenCheck, Target, Sparkles, Heart,
} from "lucide-react";
import { ProblemSolvingStatsList, LeaderboardMiniCard } from "./CodolioCards";

export interface IdentityData {
  fullName: string;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  occupation?: string | null;
  website?: string | null;
  mobile?: string | null;
  college?: string | null;
  course?: string | null;
  branch?: string | null;
  studyYear?: string | null;
  location?: string | null;
  github?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  leetcode?: string | null;
  codeforces?: string | null;
  codechef?: string | null;
  hackerrank?: string | null;
  geeksforgeeks?: string | null;
  resume?: string | null;
  skills?: string[];
  interests?: string[];
  goals?: string[];
  aspirations?: string[];
  followers?: number;
  following?: number;
}

const InfoRow = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <div className="flex items-start gap-2">
    <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
    <span className="text-foreground/90 break-words min-w-0">{children}</span>
  </div>
);

const ensureHttp = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

const TagList = ({ title, items, icon }: { title: string; items?: string[]; icon: ReactNode }) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
        {icon} {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="text-[11px] px-2 py-0.5 rounded-full border border-amber-400/25 bg-amber-500/[0.06] text-amber-100/90"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

export function IdentityCard({
  data,
  actions,
  statsUpdatedAt,
}: {
  data: IdentityData;
  actions: ReactNode;
  statsUpdatedAt?: Partial<Record<"leetcode" | "geeksforgeeks" | "codechef" | "codeforces" | "hackerrank", number | null | undefined>>;
}) {
  const initials =
    data.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const eduParts = [data.course, data.branch, data.studyYear].filter(Boolean).join(" • ");
  const hasBasic = data.college || data.location || data.occupation || data.website || data.mobile || eduParts;

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-5 space-y-5 sticky lg:top-4 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)] ring-1 ring-amber-400/10">
      <div className="flex items-start gap-3">
        <Avatar className="h-14 w-14 ring-2 ring-amber-400/40 shadow-[0_0_18px_-4px_hsl(var(--primary)/0.45)]">
          <AvatarImage src={data.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-gradient-to-br from-amber-500/25 to-orange-500/20 text-amber-100 text-base font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-xl font-semibold tracking-tight truncate antialiased subpixel-antialiased">{data.fullName}</h1>
          {data.username && (
            <p className="text-xs font-medium text-amber-300/90 truncate">{data.username}</p>
          )}
        </div>
      </div>

      {data.bio && (
        <p className="text-[13px] leading-relaxed text-foreground/85 whitespace-pre-wrap">{data.bio}</p>
      )}

      {(typeof data.followers === "number" || typeof data.following === "number") && (
        <div className="flex items-center gap-4 text-[12px]">
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-foreground tabular-nums">{data.followers ?? 0}</span>
            <span className="text-muted-foreground">Followers</span>
          </div>
          <div className="h-3 w-px bg-border/60" />
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-foreground tabular-nums">{data.following ?? 0}</span>
            <span className="text-muted-foreground">Following</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">{actions}</div>

      {hasBasic && (
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Basic Information</h3>
          <div className="space-y-1.5 text-[13px]">
            {data.occupation && <InfoRow icon={<Briefcase className="h-4 w-4" />}>{data.occupation}</InfoRow>}
            {data.college && <InfoRow icon={<GraduationCap className="h-4 w-4" />}>{data.college}</InfoRow>}
            {eduParts && <InfoRow icon={<BookOpenCheck className="h-4 w-4" />}>{eduParts}</InfoRow>}
            {data.location && <InfoRow icon={<MapPin className="h-4 w-4" />}>{data.location}</InfoRow>}
            {data.website && (
              <InfoRow icon={<Globe className="h-4 w-4" />}>
                <a href={ensureHttp(data.website)} target="_blank" rel="noreferrer" className="text-amber-200 hover:text-amber-100 underline-offset-2 hover:underline break-all">
                  {data.website.replace(/^https?:\/\//, "")}
                </a>
              </InfoRow>
            )}
            {data.mobile && <InfoRow icon={<Phone className="h-4 w-4" />}>{data.mobile}</InfoRow>}
          </div>
        </div>
      )}

      <TagList title="Interests" items={data.interests} icon={<Heart className="h-3 w-3" />} />
      <TagList title="Goals" items={data.goals} icon={<Target className="h-3 w-3" />} />
      <TagList title="Aspirations" items={data.aspirations} icon={<Sparkles className="h-3 w-3" />} />

      <ProblemSolvingStatsList
        urls={{
          leetcode: data.leetcode,
          geeksforgeeks: data.geeksforgeeks,
          codechef: data.codechef,
          codeforces: data.codeforces,
          hackerrank: data.hackerrank,
        }}
        updatedAt={statsUpdatedAt}
      />

      <LeaderboardMiniCard />

    </div>
  );
}
