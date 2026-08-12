import { Bookmark, Code2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/league/LeagueBits";
import { useSavedProblems, useToggleSaved } from "@/hooks/league/useLeague";

export default function LeagueBookmarks() {
  const { data: saved = [] } = useSavedProblems();
  const toggle = useToggleSaved();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2.5">
          <Bookmark className="h-6 w-6 text-primary fill-primary/10" /> Bookmarks
          <span className="text-sm font-normal text-muted-foreground ml-2">({saved.length} problems)</span>
        </h2>
      </div>

      {saved.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          Save problems from the activity feed and they'll show up here.
        </Card>
      )}

      <div className="space-y-2">
        {saved.map((s) => (
          <Card key={s.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{s.title ?? s.problem_slug}</div>
              <div className="text-xs text-muted-foreground">
                Saved {new Date(s.created_at).toLocaleDateString()}
              </div>
            </div>
            <DifficultyBadge difficulty={s.difficulty} />
            <a href={`https://leetcode.com/problems/${s.problem_slug}/`} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Code2 className="h-3 w-3 mr-1" /> Solve
              </Button>
            </a>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => toggle.mutate({ slug: s.problem_slug })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
