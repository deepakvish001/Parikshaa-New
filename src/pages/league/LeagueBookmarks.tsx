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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((s) => (
          <Card key={s.id} className="p-4 flex flex-col justify-between group hover:border-primary/50 transition-colors">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                    {s.title ?? s.problem_slug}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                    Saved {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
                <DifficultyBadge difficulty={s.difficulty} />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <a 
                href={`https://leetcode.com/problems/${s.problem_slug}/`} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 mr-2"
              >
                <Button size="sm" variant="outline" className="w-full h-8 text-xs bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Code2 className="h-3.5 w-3.5 mr-1.5" /> Solve
                </Button>
              </a>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => toggle.mutate({ slug: s.problem_slug })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
