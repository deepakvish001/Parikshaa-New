import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { AlertTriangle, RefreshCw, Download, Upload, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  useAdminProblems,
  useDeleteProblem,
  useDuplicateProblem,
  useTogglePublish,
  usePublishedProblemCount,
} from "@/hooks/useAdminProblems";
import { useDbCodingProblems } from "@/hooks/useCodingProblems";
import { useCodingProblemsRealtime } from "@/hooks/useCodingProblemsRealtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Trash2, Pencil, Copy, X, Globe, Lock, Trophy } from "lucide-react";
import { AddProblemToContestDialog } from "@/components/admin/AddProblemToContestDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const diffColor = (d: string) =>
  d === "easy"
    ? "bg-emerald-500/15 text-emerald-500"
    : d === "hard"
      ? "bg-rose-500/15 text-rose-500"
      : "bg-amber-500/15 text-amber-500";

const AdminProblemsList = () => {
  useCodingProblemsRealtime();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [topic, setTopic] = useState<string>("all");
  const [published, setPublished] = useState<string>("all");
  const [incompleteOnly, setIncompleteOnly] = useState<boolean>(false);
  const { data: problems = [], isLoading, isFetching, refetch } = useAdminProblems(search);
  const del = useDeleteProblem();
  const toggle = useTogglePublish();
  const duplicate = useDuplicateProblem();
  const qc = useQueryClient();
  const [rescanning, setRescanning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleOne = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const bulkDelete = async () => {
    const slugs = Array.from(selected);
    if (slugs.length === 0) return;
    setBulkDeleting(true);
    let ok = 0;
    const failures: { slug: string; error: string }[] = [];
    try {
      for (const slug of slugs) {
        const { error } = await supabase.from("coding_problems").delete().eq("slug", slug);
        if (error) failures.push({ slug, error: error.message });
        else ok++;
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-problems"] }),
        qc.invalidateQueries({ queryKey: ["coding-problems-db"] }),
        qc.invalidateQueries({ queryKey: ["coding-problems", "published-count"] }),
      ]);
      setSelected(new Set());
      if (failures.length === 0) {
        toast.success("Deleted", { description: `${ok} problem${ok === 1 ? "" : "s"} removed.` });
      } else {
        toast.warning("Bulk delete finished with errors", {
          description: `${ok} deleted · ${failures.length} failed. First: ${failures[0].slug} — ${failures[0].error}`,
        });
        console.warn("[bulk delete] failures", failures);
      }
    } catch (err: any) {
      toast.error("Bulk delete failed", { description: err?.message ?? "Unknown error" });
    } finally {
      setBulkDeleting(false);
    }
  };

  // Re-scan all problems: incomplete status is derived client-side from the
  // related tables (starter / sample tests / sql spec / description), so a
  // "scan" is just a forced refetch of the underlying queries. We invalidate
  // everything that feeds into the badge so both admin and library agree.
  const rescanIncomplete = async () => {
    setRescanning(true);
    try {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-problems"] }),
        qc.invalidateQueries({ queryKey: ["coding-problems-db"] }),
        qc.invalidateQueries({ queryKey: ["coding-problems", "published-count"] }),
      ]);
      const { data } = await refetch();
      const total = data?.length ?? 0;
      const flagged = (data ?? []).filter((p) => p._incomplete).length;
      const live = (data ?? []).filter((p) => p._incomplete && p.is_published).length;
      toast.success("Re-scan complete", {
        description: `Checked ${total} problem${total === 1 ? "" : "s"} · ${flagged} flagged incomplete (${live} live).`,
      });
    } catch (err: any) {
      toast.error("Re-scan failed", {
        description: err?.message ?? "Unknown error",
      });
    } finally {
      setRescanning(false);
    }
  };

  // Export every incomplete problem as a single JSON file. Each entry is the
  // exact payload shape accepted by `admin_save_problem`, so editing the file
  // and re-uploading round-trips losslessly.
  const exportIncompleteJson = async () => {
    setExporting(true);
    try {
      const incompleteSlugs = problems.filter((p) => p._incomplete).map((p) => p.slug);
      if (incompleteSlugs.length === 0) {
        toast.info("Nothing to export", { description: "No incomplete problems found." });
        return;
      }
      const payloads: any[] = [];
      // Fetch full payloads in parallel, capped to avoid hammering the RPC.
      const CHUNK = 8;
      for (let i = 0; i < incompleteSlugs.length; i += CHUNK) {
        const batch = incompleteSlugs.slice(i, i + CHUNK);
        const results = await Promise.all(
          batch.map((slug) =>
            supabase.rpc("admin_get_full_problem", { _slug: slug }).then((r) => ({ slug, r })),
          ),
        );
        for (const { slug, r } of results) {
          if (r.error || !(r.data as any)?.problem) continue;
          const f = r.data as any;
          payloads.push({
            slug: f.problem.slug,
            title: f.problem.title,
            difficulty: f.problem.difficulty,
            topics: f.problem.topics ?? [],
            description: f.problem.description ?? "",
            examples: f.problem.examples ?? [],
            constraints: f.problem.constraints ?? [],
            hints: f.problem.hints ?? [],
            cpu_time_limit_sec: Number(f.problem.cpu_time_limit_sec ?? 2),
            memory_limit_kb: f.problem.memory_limit_kb ?? 256000,
            is_published: !!f.problem.is_published,
            starter_code: f.starter_code ?? {},
            reference_solution: f.reference_solution ?? {},
            sample_tests: f.sample_tests ?? [],
            hidden_tests: f.hidden_tests ?? [],
            sql_spec: f.sql_spec ?? null,
            _incomplete_reasons:
              problems.find((p) => p.slug === slug)?._incompleteReasons ?? [],
          });
        }
      }
      const blob = new Blob([JSON.stringify(payloads, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incomplete-problems-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Exported", {
        description: `${payloads.length} incomplete problem${payloads.length === 1 ? "" : "s"} downloaded.`,
      });
    } catch (err: any) {
      toast.error("Export failed", { description: err?.message ?? "Unknown error" });
    } finally {
      setExporting(false);
    }
  };

  // Re-import edited JSON. Slug is the PRIMARY KEY and `admin_save_problem`
  // upserts on it, so re-uploading the same slug UPDATES the row in place —
  // duplicates are impossible at the DB level.
  const onImportFile = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON file");
      }
      const items: any[] = Array.isArray(parsed) ? parsed : [parsed];
      if (items.length === 0) throw new Error("File contains no problems");

      // De-duplicate by slug within the uploaded file itself — later entries
      // win, matching the "override" behaviour the DB upsert already provides.
      const bySlug = new Map<string, any>();
      const missingSlug: any[] = [];
      for (const raw of items) {
        if (!raw || typeof raw !== "object" || !raw.slug) {
          missingSlug.push(raw);
          continue;
        }
        bySlug.set(String(raw.slug), raw);
      }

      // Pre-check which slugs already exist so we can report created vs overridden.
      const slugs = Array.from(bySlug.keys());
      const existingSlugs = new Set<string>();
      if (slugs.length > 0) {
        const { data: existing } = await supabase
          .from("coding_problems")
          .select("slug")
          .in("slug", slugs);
        (existing ?? []).forEach((r: any) => existingSlugs.add(r.slug));
      }

      let created = 0;
      let overridden = 0;
      const failures: { slug: string; error: string }[] = [];
      missingSlug.forEach((raw) =>
        failures.push({ slug: String(raw?.slug ?? "?"), error: "Missing slug" }),
      );

      for (const [slug, raw] of bySlug) {
        const { _incomplete_reasons, _incomplete, _incompleteReasons, ...payload } = raw;
        const { error } = await supabase.rpc("admin_save_problem", {
          payload: payload as any,
        });
        if (error) {
          failures.push({ slug, error: error.message });
        } else if (existingSlugs.has(slug)) {
          overridden++;
        } else {
          created++;
        }
      }

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-problems"] }),
        qc.invalidateQueries({ queryKey: ["coding-problems-db"] }),
        qc.invalidateQueries({ queryKey: ["coding-problems", "published-count"] }),
      ]);

      const summary = `${created} new · ${overridden} overridden`;
      if (failures.length === 0) {
        toast.success("Import complete", { description: summary });
      } else {
        toast.warning("Import finished with errors", {
          description: `${summary} · ${failures.length} failed. First: ${failures[0].slug} — ${failures[0].error}`,
        });
        console.warn("[problems import] failures", failures);
      }
    } catch (err: any) {
      toast.error("Import failed", { description: err?.message ?? "Unknown error" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // For the count-mismatch banner: compare admin's published count with the
  // library's published count derived from `useDbCodingProblems`.
  const { data: libProblems } = useDbCodingProblems();
  const { data: publishedCount } = usePublishedProblemCount();

  const { data: contestCount = null } = useQuery({
    queryKey: ["admin", "contests", "count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contests" as any)
        .select("*", { count: "exact", head: true } as any);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const allTopics = useMemo(() => {
    const s = new Set<string>();
    problems.forEach((p) => (p.topics ?? []).forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [problems]);

  const [uploadSort, setUploadSort] = useState<"none" | "asc" | "desc">("none");

  const filtered = useMemo(() => {
    const base = problems.filter((p) => {
      if (difficulty !== "all" && p.difficulty !== difficulty) return false;
      if (topic !== "all" && !(p.topics ?? []).includes(topic)) return false;
      if (published === "published" && !p.is_published) return false;
      if (published === "draft" && p.is_published) return false;
      if (incompleteOnly && !p._incomplete) return false;
      return true;
    });
    if (uploadSort === "none") return base;
    const ts = (p: any) =>
      new Date(p.created_at ?? p.updated_at ?? 0).getTime() || 0;
    const sorted = [...base].sort((a, b) => ts(a) - ts(b));
    if (uploadSort === "desc") sorted.reverse();
    return sorted;
  }, [problems, difficulty, topic, published, incompleteOnly, uploadSort]);

  // 1-based upload order index for every problem (stable across filters).
  const indexBySlug = useMemo(() => {
    const m = new Map<string, number>();
    problems.forEach((p, i) => m.set(p.slug, i + 1));
    return m;
  }, [problems]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  useEffect(() => {
    setPage(1);
  }, [search, difficulty, topic, published, incompleteOnly, pageSize, uploadSort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  const incompleteCount = useMemo(
    () => problems.filter((p) => p._incomplete).length,
    [problems],
  );
  const incompletePublishedCount = useMemo(
    () => problems.filter((p) => p._incomplete && p.is_published).length,
    [problems],
  );

  // Count-mismatch detection between admin (source of truth) and the
  // library hook (what learners actually see). Both query the same DB so
  // they should always match; if they don't, surface a banner.
  const adminPublishedCount = problems.filter((p) => p.is_published).length;
  const libCount = libProblems?.length ?? null;
  // Only compare once the admin list has actually loaded rows. Otherwise the
  // banner spuriously fires during the initial fetch (problems=[] → 0) while
  // the lightweight head-count query has already resolved.
  const adminReady = !isLoading && !isFetching && problems.length > 0;
  const countMismatch =
    adminReady && libCount !== null && adminPublishedCount > 0 && libCount !== adminPublishedCount;
  const dbMismatch =
    adminReady &&
    typeof publishedCount === "number" &&
    publishedCount !== adminPublishedCount;

  const filtersActive =
    difficulty !== "all" ||
    topic !== "all" ||
    published !== "all" ||
    incompleteOnly ||
    !!search;

  const clearFilters = () => {
    setSearch("");
    setDifficulty("all");
    setTopic("all");
    setPublished("all");
    setIncompleteOnly(false);
  };

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Coding Problems</h1>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {problems.length} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={rescanIncomplete}
            disabled={rescanning || isFetching}
            title="Re-fetch all problems and recompute the incomplete badge"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${rescanning || isFetching ? "animate-spin" : ""}`}
            />
            {rescanning ? "Re-scanning…" : "Re-scan incomplete"}
          </Button>
          <Button
            variant="outline"
            onClick={exportIncompleteJson}
            disabled={exporting || incompleteCount === 0}
            title="Download all incomplete problems as a single JSON file"
          >
            <Download className={`mr-2 h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
            {exporting ? "Exporting…" : `Download incomplete (${incompleteCount})`}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
            }}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            title="Upload an edited JSON to upsert problems by slug (no duplicates — slug is the primary key)"
          >
            <Upload className={`mr-2 h-4 w-4 ${importing ? "animate-pulse" : ""}`} />
            {importing ? "Importing…" : "Upload JSON"}
          </Button>
          <Button asChild>
            <Link to="/admin/problems/new">
              <Plus className="mr-2 h-4 w-4" /> New Problem
            </Link>
          </Button>
        </div>

      </div>

      {contestCount === 0 && (
        <div className="mb-4 flex flex-wrap items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="font-medium text-amber-600 dark:text-amber-400">
              No contests exist yet
            </p>
            <p className="text-xs text-muted-foreground">
              The “Add to contest” action (<Trophy className="inline h-3 w-3" />) will appear empty until you create one.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/contests/new">Create contest</Link>
          </Button>
        </div>
      )}

      {(countMismatch || dbMismatch) && (
        <div className="mb-4 flex flex-wrap items-start gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div className="flex-1">
            <p className="font-medium text-rose-600 dark:text-rose-400">
              Published count mismatch
            </p>
            <p className="text-xs text-muted-foreground">
              Admin reports <b>{adminPublishedCount}</b> published problem
              {adminPublishedCount === 1 ? "" : "s"}
              {typeof publishedCount === "number" && (
                <>
                  {" "}
                  · DB head-count: <b>{publishedCount}</b>
                </>
              )}
              {libCount !== null && (
                <>
                  {" "}
                  · Library hook shows: <b>{libCount}</b>
                </>
              )}
              . Refresh the page; if it persists, an admin fetch may have been
              truncated.
            </p>
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: `All ${problems.length}` },
          { key: "published", label: `Public ${adminPublishedCount}` },
          { key: "draft", label: `Private ${problems.filter((p) => !p.is_published).length}` },
        ].map((c) => (
          <button
            key={c.key}
            onClick={() => setPublished(c.key)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              published === c.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIncompleteOnly((v) => !v)}
          aria-pressed={incompleteOnly}
          title="Show only problems missing description, sample tests, starter code, or SQL spec"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
            incompleteOnly
              ? "border-amber-500/60 bg-amber-500/15 text-amber-500"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          Incomplete {incompleteCount}
          {incompletePublishedCount > 0 && (
            <span className="ml-1 text-[10px] opacity-80">
              ({incompletePublishedCount} live)
            </span>
          )}
        </button>
      </div>


      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="pl-9"
          />
        </div>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulty</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent className="max-h-[260px]">
            <SelectItem value="all">All topics</SelectItem>
            {allTopics.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={published} onValueChange={setPublished}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All visibility</SelectItem>
            <SelectItem value="published">Public (in library)</SelectItem>
            <SelectItem value="draft">Private (admin only)</SelectItem>
          </SelectContent>
        </Select>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
          <span className="font-medium">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={bulkDeleting}>
                  <Trash2 className="mr-1 h-3 w-3" />
                  {bulkDeleting ? "Deleting…" : `Delete ${selected.size}`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selected.size} problem{selected.size === 1 ? "" : "s"}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the selected problems and all their starter code,
                    tests, and reference solutions. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={bulkDelete}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete {selected.size}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <TooltipProvider delayDuration={150}>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  className="rounded-none"
                  checked={
                    paged.length > 0 && paged.every((p) => selected.has(p.slug))
                      ? true
                      : paged.some((p) => selected.has(p.slug))
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(v) => {
                    if (v) {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        paged.forEach((p) => next.add(p.slug));
                        return next;
                      });
                    } else {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        paged.forEach((p) => next.delete(p.slug));
                        return next;
                      });
                    }
                  }}
                  aria-label="Select all rows on this page"
                />
              </TableHead>
              <TableHead className="w-14 text-xs text-muted-foreground">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead className="hidden lg:table-cell">Topics</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="hidden xl:table-cell whitespace-nowrap">
                <button
                  type="button"
                  onClick={() =>
                    setUploadSort((s) =>
                      s === "none" ? "desc" : s === "desc" ? "asc" : "none",
                    )
                  }
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  title="Sort by upload time"
                  aria-label={`Sort by uploaded time (${uploadSort})`}
                >
                  Uploaded
                  {uploadSort === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : uploadSort === "desc" ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                  )}
                </button>
              </TableHead>

              <TableHead className="text-right">Actions</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  {problems.length === 0
                    ? "No problems yet. Create one or import from JSON."
                    : "No problems match the current filters."}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((p) => (
                <TableRow key={p.slug} data-state={selected.has(p.slug) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      className="rounded-none"
                      checked={selected.has(p.slug)}
                      onCheckedChange={() => toggleOne(p.slug)}
                      aria-label={`Select ${p.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                    {indexBySlug.get(p.slug)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{p.title}</span>
                      {p._incomplete && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500"
                              aria-label="Incomplete problem data"
                            >
                              <AlertTriangle className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div className="font-semibold mb-0.5">Incomplete</div>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {(p._incompleteReasons ?? []).map((r) => (
                                  <li key={r}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                    {p.slug}
                  </TableCell>
                  <TableCell>
                    <Badge className={diffColor(p.difficulty)}>{p.difficulty}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(p.topics ?? []).slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                      {(p.topics?.length ?? 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(p.topics?.length ?? 0) - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                data-testid={`visibility-toggle-${p.slug}`}
                                data-state={p.is_published ? "public" : "private"}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                  p.is_published
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                    : "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                }`}
                              >
                                {p.is_published ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                {p.is_published ? "Public" : "Private"}
                              </button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            {p.is_published
                              ? "Visible in the user library. Click to make Private."
                              : "Visible only in the admin panel and to contestants if attached to an active contest. Click to publish."}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {p.is_published ? `Make "${p.title}" Private?` : `Publish "${p.title}" to library?`}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {p.is_published
                              ? "Learners will no longer see this problem in the public library. It stays visible to admins and to registered contestants if attached to a live contest."
                              : "This makes the problem visible to all learners in /library/problems."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            data-testid={`visibility-confirm-${p.slug}`}
                            onClick={() => {
                              const next = !p.is_published;
                              toggle.mutate(
                                { slug: p.slug, publish: next },
                                {
                                  onSuccess: () => {
                                    toast(next ? "Published to library" : "Made Private", {
                                      description: `"${p.title}" — ${next ? "visible to learners" : "hidden from the library"}.`,
                                      duration: 6000,
                                      action: {
                                        label: "Undo",
                                        onClick: () => toggle.mutate({ slug: p.slug, publish: !next }),
                                      },
                                    });
                                  },
                                },
                              );
                            }}
                          >
                            {p.is_published ? "Make Private" : "Publish"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {(() => {
                      const iso = (p as any).created_at ?? p.updated_at;
                      if (!iso) return "—";
                      const d = new Date(iso);
                      if (Number.isNaN(d.getTime())) return "—";
                      const date = d.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      });
                      const time = d.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      });
                      return (
                        <span title={d.toLocaleString()}>
                          {date} · {time}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">

                    <div className="flex justify-end gap-1">
                      <AddProblemToContestDialog
                        problemSlug={p.slug}
                        problemTitle={p.title}
                        trigger={
                          <Button variant="ghost" size="icon" title="Add to contest">
                            <Trophy className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button asChild variant="ghost" size="icon" title="Edit">
                        <Link to={`/admin/problems/${p.slug}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Duplicate as draft"
                            disabled={duplicate.isPending}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Duplicate "{p.title}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Creates an unpublished draft copy with all starter code,
                              tests, and reference solutions. The new slug will be
                              auto-suffixed with <code>-copy</code>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => duplicate.mutate(p.slug)}>
                              Create draft copy
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{p.title}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes the problem and all its starter code,
                              tests, and reference solutions. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => del.mutate(p.slug)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {filtered.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">
              {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filtered.length)}
            </span>{" "}
            of <span className="font-medium text-foreground">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[25, 50, 100, 200].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={currentPage <= 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Prev
            </Button>
            <span className="tabular-nums">
              Page <span className="font-medium text-foreground">{currentPage}</span> / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage >= pageCount}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pageCount)}
              disabled={currentPage >= pageCount}
            >
              Last
            </Button>
            <span className="ml-1">Go to</span>
            <Input
              type="number"
              min={1}
              max={pageCount}
              defaultValue={currentPage}
              key={currentPage}
              className="h-8 w-16"
              aria-label="Jump to page"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const n = Number((e.target as HTMLInputElement).value);
                  if (Number.isFinite(n)) setPage(Math.min(pageCount, Math.max(1, Math.floor(n))));
                }
              }}
              onBlur={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 1 && n <= pageCount) setPage(Math.floor(n));
              }}
            />
          </div>
        </div>
      )}
      </TooltipProvider>
    </AdminShell>
  );
};

export default AdminProblemsList;
