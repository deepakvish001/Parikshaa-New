import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatTile } from "@/components/admin/ui/StatTile";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Plus,
  Upload,
  Megaphone,
  Home,
  Users,
  Activity,
  TrendingUp,
  UserPlus,
  Code2,
  CheckCircle2,
  Flag,
} from "lucide-react";
import {
  useAdminKpis,
  useAdminTrendSubmissions,
  useAdminTrendSignups,
} from "@/hooks/admin/useAdminControl";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const AdminDashboard = () => {
  const { data: k } = useAdminKpis();
  const { data: subs = [] } = useAdminTrendSubmissions(30);
  const { data: signups = [] } = useAdminTrendSignups(30);

  const kpi = (key: string) => (k?.[key] ?? 0) as number;
  const openReports = kpi("open_reports");

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Live · last 30 days"
        title="Overview"
        description="Full ownership control center — monitor signal across users, content, and engagement."
        chips={[
          { label: `${kpi("total_users")} users`, tone: "default" },
          { label: `${kpi("dau")} DAU`, tone: "primary" },
          { label: `${kpi("published_problems")} live problems`, tone: "default" },
          {
            label: openReports > 0 ? `${openReports} open reports` : "No open reports",
            tone: openReports > 0 ? "danger" : "success",
          },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" /> Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/broadcast">
                <Megaphone className="mr-2 h-4 w-4" /> Broadcast
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/problems/import">
                <Upload className="mr-2 h-4 w-4" /> Import
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/admin/problems/new">
                <Plus className="mr-2 h-4 w-4" /> New problem
              </Link>
            </Button>
          </div>
        }
      />

      <section className="space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total users" value={kpi("total_users")} icon={Users} tone="primary" progress={Math.min(100, Math.round(kpi("total_users") / 10))} />
          <StatTile label="DAU (24h)" value={kpi("dau")} icon={Activity} tone="primary" progress={Math.min(100, kpi("dau") * 2)} />
          <StatTile label="WAU (7d)" value={kpi("wau")} icon={TrendingUp} progress={Math.min(100, kpi("wau") * 3)} />
          <StatTile label="Signups 7d" value={kpi("signups_7d")} icon={UserPlus} tone="success" progress={Math.min(100, kpi("signups_7d") * 8)} />
          <StatTile label="Submissions" value={kpi("submissions_total")} icon={Code2} progress={Math.min(100, kpi("submissions_total") / 10)} />
          <StatTile label="Accepted today" value={kpi("accepted_today")} icon={CheckCircle2} tone="success" progress={Math.min(100, kpi("accepted_today") * 10)} />
          <StatTile label="Published" value={kpi("published_problems")} icon={Code2} tone="primary" progress={Math.min(100, kpi("published_problems") / 10)} />
          <StatTile
            label="Open reports"
            value={openReports}
            icon={Flag}
            tone={openReports > 0 ? "danger" : "default"}
            progress={openReports > 0 ? Math.min(100, openReports * 20) : 8}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card/40 p-6 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Submissions vs. Accepted</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Last 30 days</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Submissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Accepted</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={subs}>
                  <defs>
                    <linearGradient id="grad-total" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-acc" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="day" hide />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#grad-total)" strokeWidth={2} />
                  <Area type="monotone" dataKey="accepted" stroke="hsl(var(--muted-foreground))" fill="url(#grad-acc)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/40 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Signups</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">New accounts, last 30 days</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={signups}>
                  <defs>
                    <linearGradient id="grad-signup" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="day" hide />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))" fill="url(#grad-signup)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="rounded-2xl border border-border/70 bg-card/40 p-6">
          <h3 className="mb-5 text-sm font-bold text-foreground">Content pipeline</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Published</p>
              <p className="mt-1 font-mono text-xl font-semibold">{kpi("published_problems")}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Drafts</p>
              <p className="mt-1 font-mono text-xl font-semibold">{kpi("draft_problems")}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Open reports</p>
              <p
                className={
                  "mt-1 font-mono text-xl font-semibold " +
                  (openReports > 0 ? "text-destructive" : "text-foreground")
                }
              >
                {openReports}
              </p>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
};

export default AdminDashboard;
