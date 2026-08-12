import { NavLink, Outlet } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSyncAll } from "@/hooks/league/useLeague";

const TABS = [
  { to: "/league", label: "Overview", end: true },
  { to: "/league/friends", label: "Friends" },
  { to: "/league/ranks", label: "Ranks" },
  { to: "/league/clans", label: "Clans" },
  { to: "/league/feed", label: "Feed" },
  { to: "/league/contests", label: "Contests" },
  { to: "/league/bookmarks", label: "Bookmarks" },
];

export default function LeagueLayout() {
  const sync = useSyncAll();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <nav className="flex flex-wrap items-center gap-1 rounded-full border bg-card/60 p-1">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        <Button
          onClick={() =>
            sync.mutate(undefined, {
              onSuccess: (r) => toast.success(`Synced ${r?.synced ?? 0} handle(s)`),
              onError: (e: any) => toast.error(e?.message ?? "Sync failed"),
            })
          }
          disabled={sync.isPending}
          className="rounded-full"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", sync.isPending && "animate-spin")} />
          Sync All
        </Button>
      </div>

      <Outlet />
    </div>
  );
}
