import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  CheckCircle2,
  Bookmark,
  Compass,
  Pencil,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CODING_CURRICULUM, type CurriculumTrack } from "@/data/codingCurriculum";
import { useSolvedSlugs, computeFolderProgress } from "@/hooks/useCurriculumProgress";
import { useAuth } from "@/contexts/AuthContext";

export interface ProblemCurriculumSidebarProps {
  activeSlug?: string;
  bookmarkedSlugs?: Set<string>;
  onToggleBookmark?: (slug: string) => void;
  className?: string;
}

/**
 * Left sidebar: Basic/Advanced pill tabs, folder count, collapsible folders
 * with per-problem solved + bookmark icons. Matches the reference screenshot.
 */
export function ProblemCurriculumSidebar({
  activeSlug,
  bookmarkedSlugs,
  onToggleBookmark,
  className,
}: ProblemCurriculumSidebarProps) {
  const { user } = useAuth();
  const { solved } = useSolvedSlugs();

  // Determine which track contains the active slug → default to that one
  const initialTrack: CurriculumTrack["id"] = useMemo(() => {
    if (!activeSlug) return "advanced";
    for (const t of CODING_CURRICULUM) {
      for (const f of t.folders) {
        if (f.problems.some((p) => p.slug === activeSlug)) return t.id;
      }
    }
    return "advanced";
  }, [activeSlug]);

  const [activeTrack, setActiveTrack] = useState<CurriculumTrack["id"]>(initialTrack);
  const track = CODING_CURRICULUM.find((t) => t.id === activeTrack) ?? CODING_CURRICULUM[0];

  // Folder that contains active slug should default to open
  const activeFolderId = useMemo(() => {
    for (const f of track.folders) {
      if (f.problems.some((p) => p.slug === activeSlug)) return f.id;
    }
    return track.folders[0]?.id;
  }, [track, activeSlug]);

  const [openFolders, setOpenFolders] = useState<Set<string>>(
    () => new Set(activeFolderId ? [activeFolderId] : []),
  );

  const trackProgress = useMemo(() => {
    const slugs: string[] = [];
    for (const f of track.folders) for (const p of f.problems) slugs.push(p.slug);
    const { done, total } = computeFolderProgress(slugs, solved);
    return { done, total };
  }, [track, solved]);

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card/40 backdrop-blur-xl border-r border-border/60 text-sm",
        className,
      )}
    >
      {/* Track switcher */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between gap-2 p-1 rounded-xl bg-muted/40 border border-border/40">
          {CODING_CURRICULUM.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTrack(t.id)}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeTrack === t.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
          <span className="px-2 text-xs tabular-nums text-amber-300/90 font-medium shrink-0">
            {trackProgress.done}/{trackProgress.total}
          </span>
        </div>
      </div>

      {/* Folders */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {track.folders.map((folder) => {
          const isOpen = openFolders.has(folder.id);
          const slugs = folder.problems.map((p) => p.slug);
          const { done, total } = computeFolderProgress(slugs, solved);
          return (
            <div key={folder.id}>
              <button
                type="button"
                onClick={() => toggleFolder(folder.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border border-transparent",
                  "hover:bg-muted/40 hover:border-border/50 text-left",
                )}
              >
                {isOpen ? (
                  <FolderOpen className="h-4 w-4 text-amber-400/90 shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="flex-1 truncate text-sm">{folder.label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {done}/{total}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </button>

              {isOpen && (
                <ul className="mt-1 ml-3 pl-3 border-l border-border/40 space-y-0.5">
                  {folder.problems.map((p) => {
                    const isActive = p.slug === activeSlug;
                    const isSolved = solved.has(p.slug);
                    const isBookmarked = bookmarkedSlugs?.has(p.slug);
                    return (
                      <li key={p.slug}>
                        <Link
                          to={`/library/problems/${p.slug}`}
                          className={cn(
                            "group flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs leading-snug",
                            "hover:bg-muted/40 transition-colors",
                            isActive &&
                              "bg-primary/10 text-primary border border-primary/30",
                          )}
                        >
                          <span className="flex-1 line-clamp-2">{p.label}</span>
                          <span
                            className={cn(
                              "shrink-0 h-4 w-4 grid place-items-center rounded-full",
                              isSolved
                                ? "text-emerald-400"
                                : "text-muted-foreground/40",
                            )}
                            aria-label={isSolved ? "Solved" : "Not solved"}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              onToggleBookmark?.(p.slug);
                            }}
                            className={cn(
                              "shrink-0 h-4 w-4 grid place-items-center rounded",
                              isBookmarked
                                ? "text-amber-300"
                                : "text-muted-foreground/40 hover:text-amber-300",
                            )}
                            aria-label="Bookmark"
                          >
                            <Bookmark className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer: track / nav / pencil + profile */}
      <div className="p-2 border-t border-border/50 space-y-2">
        <div className="flex items-center justify-between px-1.5 py-1">
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/40 text-xs text-foreground hover:bg-muted/60"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Track
          </button>
          <div className="flex items-center gap-1">
            <button className="h-7 w-7 grid place-items-center rounded-full hover:bg-muted/40 text-muted-foreground">
              <Compass className="h-3.5 w-3.5" />
            </button>
            <button className="h-7 w-7 grid place-items-center rounded-full hover:bg-muted/40 text-muted-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {user && (
          <Link
            to="/dashboard/profile"
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted/40 border border-transparent hover:border-border/40"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400/40 to-primary/40 grid place-items-center text-xs font-semibold text-foreground">
              {(user.email ?? "U").charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 text-xs truncate text-foreground/90">
              {user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Profile"}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        )}
      </div>
    </aside>
  );
}
