import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Plus, RefreshCw, Trash2, Upload, GitCompare } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatTile } from "@/components/league/LeagueBits";
import {
  useAddHandle,
  useRemoveHandle,
  useSnapshots,
  useSyncAll,
  useTrackedHandles,
} from "@/hooks/league/useLeague";

function BulkImportDialog() {
  const [raw, setRaw] = useState("");
  const add = useAddHandle();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const handles = raw
      .split(/[\s,;\n]+/)
      .map((h) => h.trim().replace(/^@/, ""))
      .filter(Boolean);
    if (!handles.length) return;
    setBusy(true);
    let ok = 0;
    for (const h of handles) {
      try {
        await add.mutateAsync({ handle: h });
        ok++;
      } catch {
        /* duplicate or invalid, keep going */
      }
    }
    setBusy(false);
    setRaw("");
    toast.success(`Imported ${ok} of ${handles.length} handles`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <Upload className="h-4 w-4 mr-2" /> Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk import friends</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Paste LeetCode handles separated by commas, spaces or new lines.
        </p>
        <Textarea rows={8} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="alice&#10;bob&#10;charlie" />
        <Button onClick={run} disabled={busy || !raw.trim()}>
          {busy ? "Importing…" : "Import"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function LeagueFriends() {
  const { data: handles = [] } = useTrackedHandles();
  const friends = handles.filter((h) => !h.is_self);
  const { data: snaps = [] } = useSnapshots(friends.map((f) => f.handle));
  const snapBy = useMemo(() => new Map(snaps.map((s) => [s.handle, s])), [snaps]);
  const remove = useRemoveHandle();
  const sync = useSyncAll();
  const add = useAddHandle();
  const [newHandle, setNewHandle] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"solved" | "rating" | "streak">("solved");

  const shown = friends
    .filter((f) => f.handle.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const sa = snapBy.get(a.handle);
      const sb = snapBy.get(b.handle);
      const pick = (s: any) =>
        sort === "solved" ? (s?.total_solved ?? 0) : sort === "rating" ? (s?.contest_rating ?? 0) : (s?.current_streak ?? 0);
      return pick(sb) - pick(sa);
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="text-sm font-semibold rounded-full border px-4 py-1.5">
          All Friends ({friends.length})
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="solved">Sort by: Total Solved</option>
            <option value="rating">Sort by: Rating</option>
            <option value="streak">Sort by: Streak</option>
          </select>
          <Link to="/league/compare">
            <Button variant="outline" className="rounded-full">
              <GitCompare className="h-4 w-4 mr-2" /> Compare
            </Button>
          </Link>
          <BulkImportDialog />
          <div className="flex gap-2">
            <Input
              className="w-44"
              placeholder="Add friend handle"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
            />
            <Button
              disabled={!newHandle.trim() || add.isPending}
              onClick={() =>
                add.mutate(
                  { handle: newHandle },
                  {
                    onSuccess: () => {
                      setNewHandle("");
                      toast.success("Friend added");
                    },
                    onError: (e: any) => toast.error(e?.message ?? "Could not add"),
                  },
                )
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Input
            className="w-44"
            placeholder="Search friends…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {shown.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          No friends tracked yet. Add a LeetCode handle to start comparing.
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((f) => {
          const s = snapBy.get(f.handle);
          return (
            <Card key={f.id} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {f.last_synced_at ? `Synced ${new Date(f.last_synced_at).toLocaleString()}` : "Not synced"}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => sync.mutate(f.handle)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <a href={`https://leetcode.com/u/${f.handle}/`} target="_blank" rel="noreferrer">
                    <Button size="icon" variant="ghost">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={s?.avatar_url ?? undefined} />
                  <AvatarFallback>{f.handle.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-bold truncate">{s?.display_name ?? f.handle}</div>
                  <div className="text-xs text-muted-foreground truncate">@{f.handle}</div>
                </div>
              </div>

              {f.sync_status === "error" && (
                <p className="text-xs text-destructive">{f.sync_error}</p>
              )}

              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Solved" value={s?.total_solved ?? "—"} accent="text-emerald-500" />
                <StatTile label="Rating" value={s?.contest_rating ?? "—"} accent="text-sky-500" />
                <StatTile label="Streak" value={`${s?.current_streak ?? 0}d`} accent="text-amber-500" />
              </div>

              <div className="rounded-lg border bg-muted/10 px-3 py-2 text-center text-xs text-muted-foreground">
                {s?.solved_today ? `${s.solved_today} solved today` : "No activity recorded today"}
              </div>

              <Link
                to={`/league/friends/${encodeURIComponent(f.handle)}`}
                className="block text-right text-sm text-primary hover:underline"
              >
                Compare Stats →
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
