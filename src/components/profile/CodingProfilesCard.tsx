import { ProfileCard, EmptyCard } from "./ProfileCard";
import {
  SiLeetcode, SiCodeforces, SiCodechef, SiHackerrank,
  SiGeeksforgeeks, SiGithub,
} from "react-icons/si";
import { ExternalLink, LinkIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export interface CodingHandles {
  leetcode?: string | null;
  codeforces?: string | null;
  codechef?: string | null;
  hackerrank?: string | null;
  geeksforgeeks?: string | null;
  atcoder?: string | null;
  github?: string | null;
}

type PlatformDef = {
  key: keyof CodingHandles;
  label: string;
  color: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  domain: string;
};

const PLATFORMS: PlatformDef[] = [
  { key: "leetcode",      label: "LeetCode",      color: "#ffa116", Icon: SiLeetcode,      domain: "leetcode.com" },
  { key: "codeforces",    label: "Codeforces",    color: "#1f8acb", Icon: SiCodeforces,    domain: "codeforces.com" },
  { key: "codechef",      label: "CodeChef",      color: "#a78968", Icon: SiCodechef,      domain: "codechef.com" },
  { key: "hackerrank",    label: "HackerRank",    color: "#2ec866", Icon: SiHackerrank,    domain: "hackerrank.com" },
  { key: "geeksforgeeks", label: "GeeksforGeeks", color: "#2f8d46", Icon: SiGeeksforgeeks, domain: "geeksforgeeks.org" },
  { key: "github",        label: "GitHub",        color: "#e5e7eb", Icon: SiGithub,        domain: "github.com" },
];

const extractHandle = (url?: string | null) => {
  if (!url) return null;
  const clean = url.replace(/\/+$/, "");
  const m = clean.match(/\/(?:u\/|users\/|profile\/|@)?([^/?#]+)(?:[?#]|$)/);
  return m?.[1] ?? clean;
};

const ensureHttp = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

export function CodingProfilesCard({ handles, isPublic }: { handles: CodingHandles; isPublic?: boolean }) {
  const filled = PLATFORMS.filter((p) => !!handles[p.key]);

  const header = filled.length > 0 && (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200 tabular-nums">
      <LinkIcon className="h-3 w-3" />
      {filled.length} linked
    </span>
  );

  return (
    <ProfileCard title="Coding Profiles" rightSlot={header || undefined}>
      {filled.length === 0 ? (
        <EmptyCard message={isPublic ? "No coding profiles linked" : "Edit profile to add coding profiles"} />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filled.map((p) => {
            const url = ensureHttp(handles[p.key] as string);
            const handle = extractHandle(handles[p.key] as string);
            const { Icon } = p;
            return (
              <li key={p.key}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${p.label} profile: ${handle}`}
                  className="group relative flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-all hover:-translate-y-0.5 focus-parikshaa"
                  style={{
                    borderColor: `${p.color}30`,
                    background: `linear-gradient(135deg, ${p.color}12, ${p.color}04)`,
                  }}
                >
                  <span
                    className="grid place-items-center h-9 w-9 rounded-lg shrink-0 ring-1"
                    style={{
                      color: p.color,
                      background: `${p.color}1a`,
                      borderColor: `${p.color}40`,
                      boxShadow: `inset 0 0 10px ${p.color}22`,
                    }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[11px] font-semibold uppercase tracking-wider truncate"
                      style={{ color: p.color }}
                    >
                      {p.label}
                    </div>
                    <div className="text-[12.5px] text-foreground/90 truncate font-medium">
                      @{handle}
                    </div>
                  </div>

                  <ExternalLink
                    className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-hidden
                  />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </ProfileCard>
  );
}
