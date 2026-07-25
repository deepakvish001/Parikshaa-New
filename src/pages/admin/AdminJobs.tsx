import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, RefreshCcw, Download, ExternalLink, Search, Settings2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type FetchConfig = {
  keywords: string[];
  min_score: number;
  greenhouse_slugs: string[];
  lever_slugs: string[];
  ashby_slugs: string[];
  adzuna_enabled: boolean;
};

const DEFAULT_CFG: FetchConfig = {
  keywords: ["intern", "internship", "fresher", "entry level", "entry-level", "graduate", "new grad", "trainee", "junior", "associate", "apprentice"],
  min_score: 1,
  greenhouse_slugs: ["stripe", "airbnb", "coinbase", "figma", "dropbox", "instacart"],
  lever_slugs: ["netflix", "spotify", "palantir", "brex"],
  ashby_slugs: ["ramp", "linear", "posthog", "vercel"],
  adzuna_enabled: true,
};

const splitList = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

type Job = {
  id: string;
  company: string;
  title: string;
  role_type: string;
  location: string | null;
  is_remote: boolean;
  apply_url: string;
  description: string | null;
  tags: string[];
  source: string;
  source_id: string | null;
  company_logo_url: string | null;
  salary: string | null;
  posted_at: string;
  expires_at: string | null;
  is_active: boolean;
  updated_at: string;
};

const emptyJob: Partial<Job> = {
  company: "", title: "", role_type: "Fresher", location: "", is_remote: false,
  apply_url: "", description: "", tags: [], source: "manual", salary: "",
  is_active: true,
};

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<Job> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [cfgOpen, setCfgOpen] = useState(false);
  const [cfg, setCfg] = useState<FetchConfig>(DEFAULT_CFG);
  const [cfgLoading, setCfgLoading] = useState(false);
  const [cfgSaving, setCfgSaving] = useState(false);
  const [cfgErrors, setCfgErrors] = useState<{ keywords?: string; min_score?: string }>({});
  const [lastRun, setLastRun] = useState<{
    finished_at: string; fetched: number; unique: number; upserted: number; new: number; updated: number; errors?: string[];
  } | null>(null);

  const loadLastRun = async () => {
    const { data } = await supabase
      .from("platform_settings").select("value").eq("key", "jobs_fetch_last_run").maybeSingle();
    if (data?.value) setLastRun(data.value as any);
  };


  const loadCfg = async () => {
    setCfgLoading(true);
    const { data } = await supabase
      .from("platform_settings").select("value").eq("key", "jobs_fetch_config").maybeSingle();
    const v = (data?.value ?? {}) as Partial<FetchConfig>;
    setCfg({
      keywords: Array.isArray(v.keywords) && v.keywords.length ? v.keywords : DEFAULT_CFG.keywords,
      min_score: Number(v.min_score) > 0 ? Number(v.min_score) : DEFAULT_CFG.min_score,
      greenhouse_slugs: Array.isArray(v.greenhouse_slugs) ? v.greenhouse_slugs : DEFAULT_CFG.greenhouse_slugs,
      lever_slugs: Array.isArray(v.lever_slugs) ? v.lever_slugs : DEFAULT_CFG.lever_slugs,
      ashby_slugs: Array.isArray(v.ashby_slugs) ? v.ashby_slugs : DEFAULT_CFG.ashby_slugs,
      adzuna_enabled: v.adzuna_enabled !== false,
    });
    setCfgLoading(false);
  };

  const validateCfg = (c: FetchConfig): { keywords?: string; min_score?: string } => {
    const errs: { keywords?: string; min_score?: string } = {};
    const kws = c.keywords.map((k) => k.trim()).filter(Boolean);
    if (kws.length === 0) errs.keywords = "Add at least one keyword.";
    else if (kws.length > 50) errs.keywords = "Maximum 50 keywords.";
    else if (kws.some((k) => k.length < 2 || k.length > 40)) errs.keywords = "Each keyword must be 2–40 characters.";
    else if (new Set(kws.map((k) => k.toLowerCase())).size !== kws.length) errs.keywords = "Duplicate keywords are not allowed.";
    const s = Number(c.min_score);
    if (!Number.isInteger(s) || s < 1 || s > 10) errs.min_score = "Must be an integer between 1 and 10.";
    else if (s > kws.length) errs.min_score = `Cannot exceed keyword count (${kws.length}).`;
    return errs;
  };

  const saveCfg = async () => {
    const errs = validateCfg(cfg);
    setCfgErrors(errs);
    if (Object.keys(errs).length) return toast.error(Object.values(errs)[0]!);
    setCfgSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("platform_settings").upsert({
      key: "jobs_fetch_config",
      value: cfg as any,
      updated_by: userRes.user?.id ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    setCfgSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Fetcher settings saved");
    setCfgOpen(false);
  };

  const openCfg = async () => { setCfgOpen(true); setCfgErrors({}); await loadCfg(); };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_openings").select("*").order("posted_at", { ascending: false }).limit(500);
    if (error) toast.error(error.message);
    setJobs((data ?? []) as Job[]);
    setLoading(false);
  };

  useEffect(() => { load(); loadLastRun(); }, []);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      if (roleFilter !== "all" && j.role_type !== roleFilter) return false;
      if (sourceFilter !== "all" && j.source !== sourceFilter) return false;
      if (!q) return true;
      return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    });
  }, [jobs, query, roleFilter, sourceFilter]);

  const runAutoFetch = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-jobs");
      if (error) throw error;
      toast.success(`New ${data?.new ?? 0} · Updated ${data?.updated ?? 0} · Total ${data?.upserted ?? 0}`);
      await Promise.all([load(), loadLastRun()]);
    } catch (e: any) {
      toast.error(e.message ?? "Fetch failed");
    } finally {
      setFetching(false);
    }
  };

  const toggleActive = async (job: Job) => {
    const { error } = await supabase.from("job_openings").update({ is_active: !job.is_active }).eq("id", job.id);
    if (error) return toast.error(error.message);
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, is_active: !j.is_active } : j)));
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.company || !editing.title || !editing.apply_url) {
      return toast.error("Company, title and apply URL are required");
    }
    setSaving(true);
    const payload: any = {
      company: editing.company,
      title: editing.title,
      role_type: editing.role_type ?? "Fresher",
      location: editing.location || null,
      is_remote: !!editing.is_remote,
      apply_url: editing.apply_url,
      description: editing.description || null,
      tags: Array.isArray(editing.tags) ? editing.tags : String(editing.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      salary: editing.salary || null,
      is_active: editing.is_active ?? true,
      source: editing.source ?? "manual",
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("job_openings").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("job_openings").insert(payload));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Updated" : "Created");
    setEditing(null);
    await load();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from("job_openings").delete().eq("id", confirmDelete.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setConfirmDelete(null);
    await load();
  };

  const exportCsv = () => {
    const header = ["company", "title", "role_type", "location", "is_remote", "apply_url", "source", "posted_at", "is_active"];
    const rows = filtered.map((j) => header.map((k) => JSON.stringify((j as any)[k] ?? "")).join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `job_openings_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const sources = Array.from(new Set(jobs.map((j) => j.source)));

  return (
    <>
      <Helmet><title>Jobs · Admin</title></Helmet>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Job Openings</h1>
          <p className="text-sm text-muted-foreground">Manage internship & fresher openings. Auto-fetch pulls from Remotive, Adzuna and public boards.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={openCfg}><Settings2 className="mr-1.5 h-4 w-4" /> Fetcher settings</Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCcw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
          <Button variant="secondary" size="sm" onClick={runAutoFetch} disabled={fetching}>
            {fetching ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-1.5 h-4 w-4" />}
            Auto-fetch now
          </Button>
          <Button size="sm" onClick={() => setEditing({ ...emptyJob })}><Plus className="mr-1.5 h-4 w-4" /> New</Button>
        </div>
      </div>

      {lastRun && (
        <Card className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 p-3 text-sm">
          <span className="text-muted-foreground">Last Auto-fetch:</span>
          <span className="font-medium">{formatDistanceToNow(new Date(lastRun.finished_at), { addSuffix: true })}</span>
          <span className="text-xs text-muted-foreground">({new Date(lastRun.finished_at).toLocaleString()})</span>
          <Badge variant="secondary">New {lastRun.new}</Badge>
          <Badge variant="outline">Updated {lastRun.updated}</Badge>
          <Badge variant="outline">Unique {lastRun.unique}</Badge>
          <Badge variant="outline">Fetched {lastRun.fetched}</Badge>
          {lastRun.errors && lastRun.errors.length > 0 && (
            <Badge variant="destructive">{lastRun.errors.length} error{lastRun.errors.length > 1 ? "s" : ""}</Badge>
          )}
        </Card>
      )}


      <Card className="mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search title / company" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="Internship">Internship</SelectItem>
            <SelectItem value="Fresher">Fresher</SelectItem>
            <SelectItem value="Entry">Entry</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No openings yet. Click <b>Auto-fetch now</b> or <b>New</b>.</TableCell></TableRow>
            ) : filtered.map((j) => (
              <TableRow key={j.id}>
                <TableCell className="max-w-[280px]">
                  <div className="truncate font-medium">{j.title}</div>
                  {j.is_remote && <Badge variant="outline" className="mt-1 text-[10px]">Remote</Badge>}
                </TableCell>
                <TableCell>{j.company}</TableCell>
                <TableCell><Badge variant="secondary">{j.role_type}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{j.location ?? "—"}</TableCell>
                <TableCell><Badge variant="outline">{j.source}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(j.posted_at), { addSuffix: true })}</TableCell>
                <TableCell><Switch checked={j.is_active} onCheckedChange={() => toggleActive(j)} /></TableCell>
                <TableCell className="text-right">
                  <a href={j.apply_url} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button></a>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(j)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(j)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit sheet */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{editing?.id ? "Edit opening" : "New opening"}</SheetTitle></SheetHeader>
          {editing && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-2"><Label>Title *</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Company *</Label><Input value={editing.company ?? ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Role type</Label>
                  <Select value={editing.role_type ?? "Fresher"} onValueChange={(v) => setEditing({ ...editing, role_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Fresher">Fresher</SelectItem>
                      <SelectItem value="Entry">Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Location</Label><Input value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label>Apply URL *</Label><Input type="url" value={editing.apply_url ?? ""} onChange={(e) => setEditing({ ...editing, apply_url: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>Salary / Stipend</Label><Input value={editing.salary ?? ""} onChange={(e) => setEditing({ ...editing, salary: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Tags (comma-separated)</Label><Input value={Array.isArray(editing.tags) ? editing.tags.join(", ") : (editing.tags as any) ?? ""} onChange={(e) => setEditing({ ...editing, tags: e.target.value as any })} /></div>
              </div>
              <div className="grid gap-2"><Label>Description</Label><Textarea rows={5} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!editing.is_remote} onCheckedChange={(v) => setEditing({ ...editing, is_remote: v })} /> Remote</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /> Active</label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete opening?</AlertDialogTitle>
            <AlertDialogDescription>“{confirmDelete?.title}” at {confirmDelete?.company}. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fetcher settings */}
      <Dialog open={cfgOpen} onOpenChange={setCfgOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fetcher settings</DialogTitle>
            <DialogDescription>
              Configure keywords, minimum match score and which public boards to pull from. Applied on the next Auto-fetch.
            </DialogDescription>
          </DialogHeader>
          {cfgLoading ? (
            <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Keywords (comma or newline separated)</Label>
                <Textarea
                  rows={3}
                  value={cfg.keywords.join(", ")}
                  onChange={(e) => {
                    const next = { ...cfg, keywords: splitList(e.target.value) };
                    setCfg(next);
                    setCfgErrors(validateCfg(next));
                  }}
                  aria-invalid={!!cfgErrors.keywords}
                />
                {cfgErrors.keywords ? (
                  <p className="text-xs text-destructive">{cfgErrors.keywords}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">2–40 chars each, max 50, no duplicates. Titles must match at least the minimum score below.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Minimum match score</Label>
                  <Input
                    type="number" min={1} max={10}
                    value={cfg.min_score}
                    onChange={(e) => {
                      const next = { ...cfg, min_score: Math.max(1, Math.min(10, Math.floor(Number(e.target.value) || 1))) };
                      setCfg(next);
                      setCfgErrors(validateCfg(next));
                    }}
                    aria-invalid={!!cfgErrors.min_score}
                  />
                  {cfgErrors.min_score && <p className="text-xs text-destructive">{cfgErrors.min_score}</p>}
                </div>
                <label className="mt-6 flex items-center gap-2 text-sm">
                  <Switch checked={cfg.adzuna_enabled} onCheckedChange={(v) => setCfg({ ...cfg, adzuna_enabled: v })} />
                  Adzuna enabled
                </label>
              </div>
              <div className="grid gap-2">
                <Label>Greenhouse slugs</Label>
                <Textarea rows={2} value={cfg.greenhouse_slugs.join(", ")}
                  onChange={(e) => setCfg({ ...cfg, greenhouse_slugs: splitList(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Lever slugs</Label>
                <Textarea rows={2} value={cfg.lever_slugs.join(", ")}
                  onChange={(e) => setCfg({ ...cfg, lever_slugs: splitList(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Ashby slugs</Label>
                <Textarea rows={2} value={cfg.ashby_slugs.join(", ")}
                  onChange={(e) => setCfg({ ...cfg, ashby_slugs: splitList(e.target.value) })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCfg(DEFAULT_CFG); setCfgErrors({}); }}>Reset defaults</Button>
            <Button onClick={saveCfg} disabled={cfgSaving || cfgLoading || Object.keys(cfgErrors).length > 0}>
              {cfgSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
