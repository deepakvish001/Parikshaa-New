import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import {
  History,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { usePagedCodeRuns, type CodeRunRow } from "@/hooks/useCodeRuns";

const PAGE_SIZE = 20;

const statusTone = (status?: string | null) => {
  const s = (status ?? "").toLowerCase();
  if (s.includes("accept")) return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (s.includes("error") || s.includes("fail") || s.includes("wrong"))
    return "bg-destructive/15 text-destructive border-destructive/30";
  if (s.includes("time") || s.includes("limit"))
    return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  return "bg-muted text-muted-foreground border-border";
};

const Row = ({ run }: { run: CodeRunRow }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full grid grid-cols-12 items-center gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors text-sm"
      >
        <div className="col-span-1 text-muted-foreground">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <div className="col-span-4 min-w-0">
          <Link
            to={`/library/problems/${run.problem_slug}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium truncate hover:underline inline-flex items-center gap-1"
          >
            {run.problem_slug}
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>
        </div>
        <div className="col-span-2">
          <Badge variant="outline" className="text-[10px] uppercase">
            {run.language}
          </Badge>
        </div>
        <div className="col-span-2">
          <span className={`inline-block rounded border px-1.5 py-0.5 text-[11px] ${statusTone(run.status)}`}>
            {run.status ?? "unknown"}
          </span>
        </div>
        <div className="col-span-2 text-xs text-muted-foreground">
          {run.time_ms != null ? `${run.time_ms} ms` : "—"}
          {run.memory_kb != null ? ` · ${Math.round(run.memory_kb / 1024)} MB` : ""}
        </div>
        <div className="col-span-1 text-right text-xs text-muted-foreground" title={format(new Date(run.created_at), "PPpp")}>
          {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 grid gap-3 md:grid-cols-3 text-xs">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Stdin</div>
            <pre className="bg-muted/40 border rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-56">
              {run.stdin || <span className="italic text-muted-foreground">(empty)</span>}
            </pre>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Stdout</div>
            <pre className="bg-muted/40 border rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-56">
              {run.stdout || <span className="italic text-muted-foreground">(empty)</span>}
            </pre>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Stderr / Compile
            </div>
            <pre className="bg-muted/40 border rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-56 text-destructive">
              {run.stderr || run.compile_output || (
                <span className="italic text-muted-foreground">(none)</span>
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

const RunHistory = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState<string>("all");

  const { runs, total, loading } = usePagedCodeRuns({
    page,
    pageSize: PAGE_SIZE,
    search,
    language,
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Sign in to view your run history</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your code executions are private and tied to your account.
        </p>
        <Button asChild className="mt-4">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <Helmet>
        <title>Run History · Parikshaa</title>
        <meta name="description" content="Your recent code executions with inputs, outputs, and status." />
      </Helmet>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <History className="h-5 w-5" /> Run History
          </h1>
          <p className="text-sm text-muted-foreground">
            Your recent code executions — expand a row to see the exact input, output, and errors.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by problem, source, or status…"
                className="pl-7 h-9"
              />
            </div>
            <Select
              value={language}
              onValueChange={(v) => {
                setLanguage(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border/60 bg-muted/30">
            <div className="col-span-1" />
            <div className="col-span-4">Problem</div>
            <div className="col-span-2">Language</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Time · Memory</div>
            <div className="col-span-1 text-right">When</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading runs…
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium">No runs yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Hit <strong>Run</strong> on any coding problem to record an execution here.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/library/problems">Browse problems</Link>
              </Button>
            </div>
          ) : (
            runs.map((r) => <Row key={r.id} run={r} />)
          )}
        </CardContent>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} · {total} runs
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunHistory;
