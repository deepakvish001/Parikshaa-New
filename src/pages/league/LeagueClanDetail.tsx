import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Users, 
  Trophy, 
  Settings, 
  Shield, 
  UserPlus, 
  LogOut, 
  ArrowLeft,
  CheckCircle2,
  Flame,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  useMyClans,
  useClanMembers,
  useLeaveClan,
} from "@/hooks/league/useClans";
import { useSnapshots } from "@/hooks/league/useLeague";
import { MetricCard, StatTile } from "@/components/league/LeagueBits";

export default function LeagueClanDetail() {
  const { id = "" } = useParams();
  const { data: myClans = [] } = useMyClans();
  const myClan = myClans.find(m => m.clan.id === id);
  const clan = myClan?.clan;
  
  const { data: rawMembers = [] } = useClanMembers(id);
  const leave = useLeaveClan();
  
  // In a real app, we'd fetch profile data for members. 
  // For now, we assume the user_id matches a tracked handle or we fetch handles.
  // This is a simplification.
  const memberIds = useMemo(() => rawMembers.map(m => m.user_id), [rawMembers]);
  
  const [search, setSearch] = useState("");

  if (!clan) {
    return (
      <Card className="p-10 text-center">
        <h2 className="text-xl font-bold">Clan not found</h2>
        <p className="text-muted-foreground mt-2">You might not be a member of this clan or it doesn't exist.</p>
        <Link to="/league/clans" className="mt-4 inline-block">
          <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Clans</Button>
        </Link>
      </Card>
    );
  }

  const isOwner = myClan.role === "owner";
  const isAdmin = isOwner || myClan.role === "admin";

  return (
    <div className="space-y-6">
      <div className="relative h-48 rounded-xl overflow-hidden border bg-muted/40">
        {clan.banner_url ? (
          <img src={clan.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
            <Shield className="h-16 w-16 text-primary/20" />
          </div>
        )}
        <div className="absolute bottom-4 left-6 flex items-end gap-4">
          <Avatar className="h-20 w-20 border-4 border-background ring-2 ring-border shadow-xl">
            <AvatarImage src={clan.logo_url ?? undefined} />
            <AvatarFallback className="text-2xl font-bold">{clan.tag || clan.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="pb-1">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">{clan.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {clan.tag && <Badge variant="secondary" className="font-bold">[{clan.tag}]</Badge>}
              <span className="text-sm text-white/80 drop-shadow-sm flex items-center gap-1">
                <Users className="h-3 w-3" /> {rawMembers.length} Members
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">About Clan</h3>
            <p className="text-lg">{clan.description || "No description provided."}</p>
          </Card>

          <Tabs defaultValue="members" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-12 p-0 gap-6">
              <TabsTrigger value="members" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold">
                Members
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold">
                Recent Activity
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold">
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="members" className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search members..." 
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {isAdmin && (
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" /> Invite
                  </Button>
                )}
              </div>

              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Member</th>
                      <th className="px-4 py-3 text-left font-semibold">Role</th>
                      <th className="px-4 py-3 text-right font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rawMembers.map((m) => (
                      <tr key={m.user_id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">User {m.user_id.slice(0, 5)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={m.role === 'owner' ? 'default' : 'secondary'} className="capitalize">
                            {m.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right text-muted-foreground">
                          {new Date(m.joined_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="pt-6">
              <Card className="p-10 text-center text-muted-foreground">
                Clan activity feed coming soon.
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="pt-6">
               <Card className="p-6 space-y-4">
                  <h3 className="font-bold">Clan Settings</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Invite Code</label>
                    <div className="flex gap-2">
                      <Input value={clan.invite_code} readOnly className="bg-muted font-mono" />
                      <Button variant="outline">Copy</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Share this code to let others join your clan.</p>
                  </div>
                  <div className="pt-4 border-t">
                    <Button variant="destructive" size="sm" onClick={() => toast.error("Not implemented")}>
                      Disband Clan
                    </Button>
                  </div>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Clan Stats</h3>
            <div className="grid gap-3">
              <StatTile label="Total Solved" value="—" accent="text-emerald-500" />
              <StatTile label="Avg Rating" value="—" accent="text-sky-500" />
              <StatTile label="Global Rank" value="N/A" />
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Actions</h3>
            <div className="grid gap-2">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link to="/league/ranks">
                  <Trophy className="h-4 w-4 mr-2" /> View Leaderboard
                </Link>
              </Button>
              {!isOwner && (
                <Button 
                  className="w-full justify-start text-destructive hover:text-destructive" 
                  variant="ghost"
                  onClick={() => leave.mutate(clan.id)}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Leave Clan
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
