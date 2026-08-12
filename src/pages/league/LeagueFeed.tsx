import { useMemo, useState } from "react";
import { BookOpen, Bookmark, Code2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DifficultyBadge } from "@/components/league/LeagueBits";
import {
  useActivityFeed,
  useSnapshots,
  useToggleSaved,
  useTrackedHandles,
} from "@/hooks/league/useLeague";

function relative(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function LeagueFeed() {
  const { data: handles = [] } = useTrackedHandles();
  const pool = useMemo(() => handles.map((h) => h.handle), [handles]);
  const { data: feed = [] } = useActivityFeed(pool, 100);
  const { data: snaps = [] } = useSnapshots(pool);
  const avatars = useMemo(() => new Map(snaps.map((s) => [s.handle, s.avatar_url])), [snaps]);
  const toggle = useToggleSaved();
  const [filter, setFilter] = useState<string>("all");

  const shown = feed.filter((f) => filter === "all" || (f.difficulty ?? "").toLowerCase() === filter);

  const groups = shown.reduce<Record<string, typeof shown>>((acc, item) => {
    const d = new Date(item.solved_at).toDateString();
    const label =
      d === new Date().toDateString()
        ? "TODAY"
        : d === new Date(Date.now() - 86400000).toDateString()
          ? "YESTERDAY"
          : d.toUpperCase();
    (acc[label] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Global Activity Feed</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All Activities</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {shown.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          No activity yet — sync your tracked handles to fill the feed.
        </Card>
      )}

      {Object.entries(groups).map(([label, items]) => (
        <div key={label} className="space-y-2">
          <div className="text-[11px] font-semibold tracking-wider text-muted-foreground">{label}</div>
          {items.map((f) => (
            <Card key={f.id} className="p-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatars.get(f.handle) ?? undefined} />
                  <AvatarFallback>{f.handle.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate">{f.handle}</span>
                    <span className="text-xs text-muted-foreground">{relative(f.solved_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm truncate">{f.title}</span>
                    <DifficultyBadge difficulty={f.difficulty} />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <a href={`https://leetcode.com/problems/${f.problem_slug}/`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Code2 className="h-3 w-3 mr-1" /> Solve
                      </Button>
                    </a>
                    <a href={`https://leetcode.com/problems/${f.problem_slug}/solutions/`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <BookOpen className="h-3 w-3 mr-1" /> Solution
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() =>
                        toggle.mutate(
                          { slug: f.problem_slug, title: f.title, difficulty: f.difficulty },
                          {
                            onSuccess: (r) => toast.success(r === "saved" ? "Saved" : "Removed"),
                            onError: (e: any) => toast.error(e?.message ?? "Failed"),
                          },
                        )
                      }
                    >
                      <Bookmark className="h-3 w-3 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
