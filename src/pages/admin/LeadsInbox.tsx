import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Loader2, Search, RefreshCcw, Trash2, Mail, Phone, ExternalLink,
  Copy, GraduationCap, Users, Inbox, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DemoRequest = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  org: string | null;
  use_case: string | null;
  candidates: string | null;
  notes: string | null;
  status: string | null;
  admin_notes: string | null;
  status_updated_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_page: string | null;
  user_agent: string | null;
};

type Subscriber = {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
};

type HistoryRow = {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
};

const STATUS_OPTS = ["all", "new", "contacted", "qualified", "won", "lost"] as const;
type StatusFilter = (typeof STATUS_OPTS)[number];
const REAL_STATUSES = STATUS_OPTS.filter((s) => s !== "all");

const PAGE_SIZE = 25;

type ReqSortKey = "created_at" | "name" | "email" | "status";
type SubSortKey = "created_at" | "email" | "source";

function copy(text: string, label = "Copied") {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} to clipboard`),
    () => toast.error("Copy failed"),
  );
}

function extractPhone(notes: string | null): string | null {
  if (!notes) return null;
  const m = notes.match(/Phone\s*\/?\s*WhatsApp:\s*([^\n]+)/i);
  return m ? m[1].trim() : null;
}

function SortHeader<T extends string>({
  label, k, sortKey, dir, onSort,
}: { label: string; k: T; sortKey: T; dir: "asc" | "desc"; onSort: (k: T) => void }) {
  const active = sortKey === k;
  return (
    <button
      onClick={() => onSort(k)}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      {active ? (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : null}
    </button>
  );
}

export default function LeadsInbox() {
  const [tab, setTab] = useState<"contacts" | "subscribers">("contacts");

  // ── Requests state ──
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loadingReq, setLoadingReq] = useState(false);
  const [studentOnly, setStudentOnly] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [reqSortKey, setReqSortKey] = useState<ReqSortKey>("created_at");
  const [reqSortDir, setReqSortDir] = useState<"asc" | "desc">("desc");
  const [reqPage, setReqPage] = useState(1);

  // ── Subscribers state ──
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subQ, setSubQ] = useState("");
  const [subSortKey, setSubSortKey] = useState<SubSortKey>("created_at");
  const [subSortDir, setSubSortDir] = useState<"asc" | "desc">("desc");
  const [subPage, setSubPage] = useState(1);

  // ── Detail drawer ──
  const [selected, setSelected] = useState<DemoRequest | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>("new");
  const [statusNote, setStatusNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [adminNotesDraft, setAdminNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const loadRequests = async () => {
    setLoadingReq(true);
    let query = supabase
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (studentOnly) query = query.eq("use_case", "student");
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setRequests((data ?? []) as DemoRequest[]);
    setLoadingReq(false);
  };

  const loadSubs = async () => {
    setLoadingSubs(true);
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("id,email,source,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) toast.error(error.message);
    else setSubs((data ?? []) as Subscriber[]);
    setLoadingSubs(false);
  };

  useEffect(() => {
    loadRequests();
    setReqPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentOnly, statusFilter]);

  useEffect(() => {
    if (tab === "subscribers" && subs.length === 0) loadSubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filteredRequests = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = !needle
      ? requests
      : requests.filter(
          (r) =>
            r.name?.toLowerCase().includes(needle) ||
            r.email?.toLowerCase().includes(needle) ||
            r.org?.toLowerCase().includes(needle) ||
            r.notes?.toLowerCase().includes(needle),
        );
    const sorted = [...base].sort((a, b) => {
      const av = (a[reqSortKey] ?? "") as string;
      const bv = (b[reqSortKey] ?? "") as string;
      if (av < bv) return reqSortDir === "asc" ? -1 : 1;
      if (av > bv) return reqSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [requests, q, reqSortKey, reqSortDir]);

  const pagedRequests = useMemo(() => {
    const start = (reqPage - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, reqPage]);
  const reqPageCount = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));

  const filteredSubs = useMemo(() => {
    const n = subQ.trim().toLowerCase();
    const base = !n
      ? subs
      : subs.filter((s) => s.email.toLowerCase().includes(n) || (s.source ?? "").toLowerCase().includes(n));
    const sorted = [...base].sort((a, b) => {
      const av = (a[subSortKey] ?? "") as string;
      const bv = (b[subSortKey] ?? "") as string;
      if (av < bv) return subSortDir === "asc" ? -1 : 1;
      if (av > bv) return subSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [subs, subQ, subSortKey, subSortDir]);

  const pagedSubs = useMemo(() => {
    const start = (subPage - 1) * PAGE_SIZE;
    return filteredSubs.slice(start, start + PAGE_SIZE);
  }, [filteredSubs, subPage]);
  const subPageCount = Math.max(1, Math.ceil(filteredSubs.length / PAGE_SIZE));

  const sortReq = (k: ReqSortKey) => {
    if (reqSortKey === k) setReqSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setReqSortKey(k); setReqSortDir(k === "created_at" ? "desc" : "asc"); }
  };
  const sortSub = (k: SubSortKey) => {
    if (subSortKey === k) setSubSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSubSortKey(k); setSubSortDir(k === "created_at" ? "desc" : "asc"); }
  };

  const openDetail = async (r: DemoRequest) => {
    setSelected(r);
    setPendingStatus(r.status ?? "new");
    setStatusNote("");
    setAdminNotesDraft(r.admin_notes ?? "");
    setHistory([]);
    setLoadingHist(true);
    const { data, error } = await supabase
      .from("demo_request_status_history")
      .select("id,from_status,to_status,note,created_at")
      .eq("request_id", r.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setHistory((data ?? []) as HistoryRow[]);
    setLoadingHist(false);
  };

  const saveStatus = async () => {
    if (!selected) return;
    setSavingStatus(true);
    const now = new Date().toISOString();
    const from = selected.status ?? "new";
    const to = pendingStatus;
    const { error } = await supabase
      .from("demo_requests")
      .update({ status: to, status_updated_at: now })
      .eq("id", selected.id);
    if (error) { setSavingStatus(false); return toast.error(error.message); }

    const { data: u } = await supabase.auth.getUser();
    const changed_by = u.user?.id ?? null;
    if (from !== to || statusNote.trim()) {
      const { data: hist, error: hErr } = await supabase
        .from("demo_request_status_history")
        .insert({ request_id: selected.id, from_status: from, to_status: to, note: statusNote.trim() || null, changed_by })
        .select("id,from_status,to_status,note,created_at")
        .single();
      if (hErr) toast.error(hErr.message);
      else if (hist) setHistory((prev) => [hist as HistoryRow, ...prev]);
    }
    setRequests((prev) => prev.map((x) => x.id === selected.id ? { ...x, status: to, status_updated_at: now } : x));
    setSelected({ ...selected, status: to, status_updated_at: now });
    setStatusNote("");
    setSavingStatus(false);
    toast.success(`Status set to ${to}`);
  };

  const saveAdminNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from("demo_requests")
      .update({ admin_notes: adminNotesDraft })
      .eq("id", selected.id);
    setSavingNotes(false);
    if (error) return toast.error(error.message);
    setRequests((prev) => prev.map((x) => x.id === selected.id ? { ...x, admin_notes: adminNotesDraft } : x));
    setSelected({ ...selected, admin_notes: adminNotesDraft });
    toast.success("Notes saved");
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase.from("demo_requests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRequests((prev) => prev.filter((r) => r.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success("Deleted");
  };

  const deleteSub = async (id: string) => {
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setSubs((prev) => prev.filter((s) => s.id !== id));
    toast.success("Subscriber removed");
  };

  const exportSubs = () => {
    const rows = [["email", "source", "created_at"], ...filteredSubs.map((s) => [s.email, s.source ?? "", s.created_at])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedPhone = selected ? extractPhone(selected.notes) : null;

  return (
    <>
      <Helmet><title>Leads & Subscribers · Admin</title></Helmet>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Inbox className="h-6 w-6 text-primary" />
              Leads &amp; Subscribers
            </h1>
            <p className="text-sm text-muted-foreground">
              Review recent student contact submissions and newsletter subscribers.
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="contacts" className="gap-2">
              <GraduationCap className="h-4 w-4" /> Contact submissions
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="gap-2">
              <Users className="h-4 w-4" /> Newsletter subscribers
            </TabsTrigger>
          </TabsList>

          {/* ── CONTACT SUBMISSIONS ── */}
          <TabsContent value="contacts" className="mt-4">
            <Card>
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    Contact submissions{" "}
                    <Badge variant="secondary" className="ml-1">{filteredRequests.length}</Badge>
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant={studentOnly ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStudentOnly((v) => !v)}
                    >
                      {studentOnly ? "Students only" : "All sources"}
                    </Button>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setReqPage(1); }}>
                      <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTS.map((s) => (
                          <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={loadRequests} disabled={loadingReq}>
                      {loadingReq ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, org, or notes…"
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setReqPage(1); }}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead><SortHeader label="When" k="created_at" sortKey={reqSortKey} dir={reqSortDir} onSort={sortReq} /></TableHead>
                        <TableHead><SortHeader label="Name" k="name" sortKey={reqSortKey} dir={reqSortDir} onSort={sortReq} /></TableHead>
                        <TableHead><SortHeader label="Email" k="email" sortKey={reqSortKey} dir={reqSortDir} onSort={sortReq} /></TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead><SortHeader label="Status" k="status" sortKey={reqSortKey} dir={reqSortDir} onSort={sortReq} /></TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingReq && requests.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
                      ) : pagedRequests.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No submissions.</TableCell></TableRow>
                      ) : pagedRequests.map((r) => {
                        const phone = extractPhone(r.notes);
                        return (
                          <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="font-medium">{r.name}</TableCell>
                            <TableCell className="text-xs">
                              <div className="flex flex-col gap-0.5">
                                <span>{r.email}</span>
                                {phone && <span className="text-muted-foreground">{phone}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[320px]">
                              <p className="line-clamp-2 text-sm text-foreground/90">{r.notes || "—"}</p>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium">{r.use_case ?? "—"}</span>
                                <span className="text-muted-foreground">{r.utm_content ?? r.utm_source ?? "direct"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{r.status ?? "new"}</Badge>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(r)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between border-t p-3 text-xs text-muted-foreground">
                  <span>Page {reqPage} of {reqPageCount} · {filteredRequests.length} total</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={reqPage <= 1} onClick={() => setReqPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={reqPage >= reqPageCount} onClick={() => setReqPage((p) => Math.min(reqPageCount, p + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SUBSCRIBERS ── */}
          <TabsContent value="subscribers" className="mt-4">
            <Card>
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    Newsletter subscribers{" "}
                    <Badge variant="secondary" className="ml-1">{filteredSubs.length}</Badge>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportSubs} disabled={filteredSubs.length === 0}>
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadSubs} disabled={loadingSubs}>
                      {loadingSubs ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search by email or source…" value={subQ} onChange={(e) => { setSubQ(e.target.value); setSubPage(1); }} className="pl-9" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead><SortHeader label="Email" k="email" sortKey={subSortKey} dir={subSortDir} onSort={sortSub} /></TableHead>
                        <TableHead><SortHeader label="Source" k="source" sortKey={subSortKey} dir={subSortDir} onSort={sortSub} /></TableHead>
                        <TableHead><SortHeader label="Subscribed" k="created_at" sortKey={subSortKey} dir={subSortDir} onSort={sortSub} /></TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingSubs && subs.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
                      ) : pagedSubs.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No subscribers.</TableCell></TableRow>
                      ) : pagedSubs.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{s.email}</span>
                              <button onClick={() => copy(s.email, "Email copied")} className="text-muted-foreground hover:text-primary">
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{s.source ?? "unknown"}</Badge></TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove subscriber?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This removes <strong>{s.email}</strong> from the newsletter list.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteSub(s.id)}>Remove</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between border-t p-3 text-xs text-muted-foreground">
                  <span>Page {subPage} of {subPageCount} · {filteredSubs.length} total</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={subPage <= 1} onClick={() => setSubPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={subPage >= subPageCount} onClick={() => setSubPage((p) => Math.min(subPageCount, p + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Lead Detail Drawer ── */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selected.name}
                  <Badge variant="outline" className="capitalize">{selected.status ?? "new"}</Badge>
                </SheetTitle>
                <SheetDescription>
                  Submitted {format(new Date(selected.created_at), "PPpp")}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Contact channels */}
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Contact channels</h3>
                  <div className="space-y-2 rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-2 hover:text-primary">
                        <Mail className="h-4 w-4" /> {selected.email}
                      </a>
                      <button onClick={() => copy(selected.email, "Email copied")} className="text-muted-foreground hover:text-primary">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    {selectedPhone && (
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={`https://wa.me/${selectedPhone.replace(/[^\d+]/g, "")}`}
                          target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-2 hover:text-primary"
                        >
                          <Phone className="h-4 w-4" /> {selectedPhone}
                        </a>
                        <button onClick={() => copy(selectedPhone, "Phone copied")} className="text-muted-foreground hover:text-primary">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {selected.org && <div className="text-xs text-muted-foreground">Org: {selected.org}</div>}
                    {selected.candidates && <div className="text-xs text-muted-foreground">Candidates: {selected.candidates}</div>}
                    {selected.use_case && <div className="text-xs text-muted-foreground">Use case: {selected.use_case}</div>}
                  </div>
                </section>

                {/* Message */}
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Message</h3>
                  <div className="whitespace-pre-wrap rounded-md border p-3 text-sm">{selected.notes || "—"}</div>
                </section>

                {/* UTM / Source */}
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">UTM &amp; Source</h3>
                  <div className="grid grid-cols-2 gap-2 rounded-md border p-3 text-xs">
                    {[
                      ["utm_source", selected.utm_source],
                      ["utm_medium", selected.utm_medium],
                      ["utm_campaign", selected.utm_campaign],
                      ["utm_term", selected.utm_term],
                      ["utm_content", selected.utm_content],
                    ].map(([k, v]) => (
                      <div key={k as string}>
                        <div className="text-muted-foreground">{k}</div>
                        <div className="truncate">{v || "—"}</div>
                      </div>
                    ))}
                    {selected.referrer && (
                      <div className="col-span-2">
                        <div className="text-muted-foreground">Referrer</div>
                        <div className="truncate">{selected.referrer}</div>
                      </div>
                    )}
                    {selected.landing_page && (
                      <div className="col-span-2">
                        <div className="text-muted-foreground">Landing page</div>
                        <a href={selected.landing_page} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 truncate hover:text-primary">
                          <ExternalLink className="h-3 w-3" /> {selected.landing_page}
                        </a>
                      </div>
                    )}
                    {selected.user_agent && (
                      <div className="col-span-2">
                        <div className="text-muted-foreground">User agent</div>
                        <div className="truncate">{selected.user_agent}</div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Status editor */}
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Update status</h3>
                  <div className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <Select value={pendingStatus} onValueChange={setPendingStatus}>
                        <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={saveStatus} disabled={savingStatus}>
                        {savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Optional note about this status change…"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      rows={2}
                    />
                    {selected.status_updated_at && (
                      <div className="text-[11px] text-muted-foreground">
                        Last changed {formatDistanceToNow(new Date(selected.status_updated_at), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </section>

                {/* Status history */}
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Status history</h3>
                  <div className="space-y-2">
                    {loadingHist ? (
                      <div className="text-xs text-muted-foreground">Loading…</div>
                    ) : history.length === 0 ? (
                      <div className="text-xs text-muted-foreground">No changes recorded yet.</div>
                    ) : history.map((h) => (
                      <div key={h.id} className="rounded-md border p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{h.from_status ?? "—"}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge className="capitalize">{h.to_status}</Badge>
                          <span className="ml-auto text-muted-foreground">
                            {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {h.note && <div className="mt-1 whitespace-pre-wrap text-foreground/90">{h.note}</div>}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Admin notes */}
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Internal notes</h3>
                  <Textarea
                    value={adminNotesDraft}
                    onChange={(e) => setAdminNotesDraft(e.target.value)}
                    rows={4}
                    placeholder="Private notes visible only to admins…"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={saveAdminNotes} disabled={savingNotes}>
                      {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save notes"}
                    </Button>
                  </div>
                </section>

                {/* Danger zone */}
                <section className="border-t pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete lead
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete submission?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes the request from <strong>{selected.email}</strong> and all its status history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteRequest(selected.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
