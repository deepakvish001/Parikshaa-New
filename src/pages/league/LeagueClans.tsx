import { useState } from "react";
import { Globe, KeyRound, Plus, Users, Crown } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useBrowseClans,
  useCreateClan,
  useJoinClan,
  useLeaveClan,
  useMyClans,
} from "@/hooks/league/useClans";

function CreateClanDialog() {
  const create = useCreateClan();
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full flex-1">
          <Plus className="h-4 w-4 mr-2" /> Create Clan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a clan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Clan name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Tag (e.g. WAR)" value={tag} onChange={(e) => setTag(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex items-center gap-2">
            <Switch id="pub" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="pub">Public clan (anyone can find and join)</Label>
          </div>
          <Button
            className="w-full"
            disabled={!name.trim() || create.isPending}
            onClick={() =>
              create.mutate(
                { name: name.trim(), tag: tag.trim() || undefined, description: description.trim() || undefined, is_public: isPublic },
                {
                  onSuccess: () => toast.success("Clan created"),
                  onError: (e: any) => toast.error(e?.message ?? "Could not create clan"),
                },
              )
            }
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InviteCodeDialog() {
  const join = useJoinClan();
  const [code, setCode] = useState("");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full flex-1">
          <KeyRound className="h-4 w-4 mr-2" /> Enter Invite Code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join with invite code</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input placeholder="ABCD1234" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button
            disabled={!code.trim() || join.isPending}
            onClick={() =>
              join.mutate(
                { inviteCode: code },
                {
                  onSuccess: () => toast.success("Joined clan"),
                  onError: (e: any) => toast.error(e?.message ?? "Could not join"),
                },
              )
            }
          >
            Join
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LeagueClans() {
  const { data: mine = [] } = useMyClans();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"browse" | "top">("browse");
  const { data: browse = [] } = useBrowseClans(search);
  const join = useJoinClan();
  const leave = useLeaveClan();

  const mineIds = new Set(mine.map((m) => m.clan?.id));
  const discoverable = browse.filter((c) => !mineIds.has(c.id));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="space-y-4">
        <div className="flex gap-2">
          <InviteCodeDialog />
          <CreateClanDialog />
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-primary" /> My Clans
          <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-xs">{mine.length}</span>
        </div>

        {mine.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            You haven't joined a clan yet.
          </Card>
        )}

        {mine.map(({ clan, role }) =>
          clan ? (
            <Card key={clan.id} className="overflow-hidden">
              <div className="h-28 bg-muted/40 bg-cover bg-center" style={clan.banner_url ? { backgroundImage: `url(${clan.banner_url})` } : undefined} />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold">{clan.name}</h3>
                    <p className="text-sm text-muted-foreground">{clan.description}</p>
                  </div>
                  {clan.tag && (
                    <span className="text-[10px] font-semibold rounded bg-muted px-2 py-1">[{clan.tag}]</span>
                  )}
                </div>
                <div className="flex items-center justify-between border-t pt-3 text-xs">
                  <span className="text-muted-foreground">Invite code: <b className="text-foreground">{clan.invite_code}</b></span>
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 capitalize">
                    {role === "owner" && <Crown className="h-3 w-3 text-amber-400" />} {role}
                  </span>
                </div>
                {role !== "owner" && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => leave.mutate(clan.id)}>
                    Leave clan
                  </Button>
                )}
              </div>
            </Card>
          ) : null,
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-1 rounded-full border bg-card/60 p-1">
            {(["browse", "top"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium",
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {t === "browse" ? "Browse Clans" : "Top Clans"}
              </button>
            ))}
          </div>
          <Input
            className="w-56"
            placeholder="Search public clans…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {discoverable.length === 0 ? (
          <Card className="p-16 text-center">
            <h3 className="text-lg font-bold">No new clans to discover</h3>
            <p className="text-sm text-muted-foreground mt-2">
              You have joined all available public clans, or no clans match your search.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {discoverable.map((c) => (
              <Card key={c.id} className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-500" />
                  <h3 className="font-bold">{c.name}</h3>
                  {c.tag && <span className="text-[10px] rounded bg-muted px-2 py-0.5">[{c.tag}]</span>}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    join.mutate(
                      { clanId: c.id },
                      {
                        onSuccess: () => toast.success(`Joined ${c.name}`),
                        onError: (e: any) => toast.error(e?.message ?? "Could not join"),
                      },
                    )
                  }
                >
                  Join clan
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
