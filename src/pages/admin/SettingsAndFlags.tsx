import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePlatformSettings, useSetSetting } from "@/hooks/admin/useAdminControl";
import { useFlagRegistry, useUpsertFlagRegistry } from "@/hooks/admin/useAdminCoverage";
import { Settings as SettingsIcon, Plus, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";


const KNOWN_FLAGS: { key: string; label: string; description: string }[] = [
  { key: "maintenance_mode", label: "Maintenance mode", description: "Show a maintenance banner site-wide." },
  { key: "signup_open", label: "Signups open", description: "Allow new users to register." },
  { key: "daily_challenge_enabled", label: "Daily challenge enabled", description: "Show the daily challenge UI." },
  { key: "ai_generate_enabled", label: "AI generation enabled", description: "Allow users to generate AI content." },
];

const SettingsAndFlags = () => {
  const { data: settings = [] } = usePlatformSettings();
  const setSetting = useSetSetting();

  const get = (k: string) => (settings as any[]).find((s) => s.key === k)?.value;

  // Custom KV
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("{}");

  return (
    <AdminShell>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold"><SettingsIcon className="h-5 w-5" /> Settings & Feature Flags</h1>
      <p className="mb-4 text-sm text-muted-foreground">Toggle platform-wide behavior without redeploying.</p>

      <Card className="space-y-4 p-4">
        <h2 className="text-sm font-semibold">Feature flags</h2>
        {KNOWN_FLAGS.map((f) => {
          const enabled = !!get(f.key)?.enabled;
          return (
            <div key={f.key} className="flex items-center justify-between gap-3 border-b border-border/30 pb-3 last:border-0 last:pb-0">
              <div>
                <Label>{f.label}</Label>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(v) => setSetting.mutate({ key: f.key, value: { enabled: v } })}
              />
            </div>
          );
        })}
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="mb-2 text-sm font-semibold">Landing banner</h2>
        <BannerEditor
          initial={get("landing_banner")?.text ?? ""}
          onSave={(text) => setSetting.mutate({ key: "landing_banner", value: { text } })}
        />
      </Card>

      <WeeklyContestConfigCard
        value={get("weekly_contest_config") ?? { day: 0, hour_utc: 15, minute_utc: 0, problem_count: 4, duration_minutes: 120 }}
        onSave={(v) =>
          setSetting.mutate(
            { key: "weekly_contest_config", value: v },
            {
              onSuccess: () => toast.success("Weekly contest schedule saved"),
              onError: (e: any) =>
                toast.error(e?.message?.replace(/^.*?:\s*/, "") ?? "Failed to save schedule"),
            },
          )
        }
      />


      <Card className="mt-4 p-4">
        <h2 className="mb-2 text-sm font-semibold">Custom key/value</h2>
        <div className="grid gap-2 sm:grid-cols-[200px_1fr_auto]">
          <Input placeholder="key" value={customKey} onChange={(e) => setCustomKey(e.target.value)} />
          <Input placeholder='{"foo":"bar"}' value={customValue} onChange={(e) => setCustomValue(e.target.value)} />
          <Button onClick={() => {
            try {
              const v = JSON.parse(customValue);
              if (customKey) setSetting.mutate({ key: customKey, value: v });
            } catch { alert("Invalid JSON"); }
          }}><Plus className="mr-1 h-4 w-4" /> Save</Button>
        </div>
        <div className="mt-3 max-h-64 overflow-auto rounded-md border border-border/40 p-2 text-xs">
          <pre>{JSON.stringify(settings, null, 2)}</pre>
        </div>
      </Card>

      <FlagRegistryCard />
    </AdminShell>
  );
};

const BannerEditor = ({ initial, onSave }: { initial: string; onSave: (text: string) => void }) => {
  const [v, setV] = useState(initial);
  useEffect(() => setV(initial), [initial]);
  return (
    <div className="flex flex-col gap-2">
      <Textarea value={v} onChange={(e) => setV(e.target.value)} rows={2} placeholder="Optional announcement text…" />
      <div><Button size="sm" onClick={() => onSave(v)}>Save banner</Button></div>
    </div>
  );
};

export default SettingsAndFlags;

import { validateWeeklyCfg, computeWeeklySchedule, DAYS, type WeeklyCfg } from "@/lib/admin/weeklyContest";

const WeeklyContestConfigCard = ({ value, onSave }: { value: WeeklyCfg; onSave: (v: WeeklyCfg) => void }) => {
  const [v, setV] = useState<WeeklyCfg>(value);
  useEffect(() => setV(value), [JSON.stringify(value)]);
  const set = (k: keyof WeeklyCfg, val: number) => setV((p) => ({ ...p, [k]: val }));
  const validationError = validateWeeklyCfg(v);
  const preview = validationError ? null : computeWeeklySchedule(v);
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
  return (
    <Card className="mt-4 p-4">
      <h2 className="mb-1 text-sm font-semibold">Weekly contest scheduler</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Controls the automated cron that creates the next weekly rated contest from your private problem pool.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
        <div>
          <Label className="text-xs">Day (UTC)</Label>
          <select className="mt-1 w-full rounded-md border border-border/40 bg-background px-2 py-1.5 text-sm"
            value={v.day} onChange={(e) => set("day", Number(e.target.value))}>
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs">Hour UTC (0–23)</Label>
          <Input type="number" min={0} max={23} value={v.hour_utc} onChange={(e) => set("hour_utc", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Minute UTC</Label>
          <Input type="number" min={0} max={59} value={v.minute_utc} onChange={(e) => set("minute_utc", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Problems (2–10)</Label>
          <Input type="number" min={2} max={10} value={v.problem_count} onChange={(e) => set("problem_count", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Duration (min)</Label>
          <Input type="number" min={30} max={480} step={15} value={v.duration_minutes} onChange={(e) => set("duration_minutes", Number(e.target.value))} />
        </div>
      </div>

      {/* Schedule preview */}
      <div
        className={`mt-3 rounded-md border p-3 text-xs ${
          validationError
            ? "border-rose-400/30 bg-rose-500/5 text-rose-300"
            : "border-amber-400/25 bg-amber-500/5"
        }`}
        aria-live="polite"
      >
        {validationError ? (
          <span>Fix validation: {validationError}</span>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Next start</div>
              <div className="font-medium text-amber-200">{fmt(preview!.starts)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">End</div>
              <div className="font-medium">{fmt(preview!.ends)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Problems locked until</div>
              <div className="font-medium">{fmt(preview!.lockUntil)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Registration opens</div>
              <div className="font-medium">{fmt(preview!.registrationOpens)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {DAYS[v.day]} {String(v.hour_utc).padStart(2, "0")}:{String(v.minute_utc).padStart(2, "0")} UTC · {v.problem_count} problems · {v.duration_minutes}m
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const err = validateWeeklyCfg(v);
              if (err) { toast.error(err); return; }
              try {
                const { data, error } = await supabase.functions.invoke("schedule-weekly-contest", { body: {} });
                if (error) throw error;
                if ((data as any)?.skipped) toast.message(`Already scheduled: ${(data as any).contest_id}`);
                else toast.success(`Created ${(data as any)?.slug ?? "weekly contest"}`);
              } catch (e: any) {
                toast.error(e?.message ?? "Failed to create contest");
              }
            }}
          >
            Create weekly contest now
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const err = validateWeeklyCfg(v);
              if (err) { toast.error(err); return; }
              onSave(v);
            }}
          >
            Save schedule
          </Button>
        </div>
      </div>

    </Card>
  );
};






const FlagRegistryCard = () => {
  const { data: flags = [] } = useFlagRegistry();
  const upsert = useUpsertFlagRegistry();
  const [key, setKey] = useState("");
  const [type, setType] = useState("boolean");
  const [description, setDescription] = useState("");
  const [rolloutPct, setRolloutPct] = useState(100);
  const [schemaText, setSchemaText] = useState("{}");

  const submit = () => {
    if (!key.trim()) return;
    let parsed: any = {};
    try { parsed = JSON.parse(schemaText || "{}"); } catch { alert("Invalid schema JSON"); return; }
    upsert.mutate(
      { key: key.trim(), type, description, rolloutPct, schema: parsed },
      { onSuccess: () => { setKey(""); setDescription(""); setRolloutPct(100); setSchemaText("{}"); } },
    );
  };

  return (
    <Card className="mt-4 p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <FlaskConical className="h-4 w-4" /> Feature Flag Registry
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Declare typed flag schemas and rollout percentages. Use with platform settings above.
      </p>

      <div className="grid gap-2 sm:grid-cols-[1fr_140px_120px_auto]">
        <Input placeholder="key (e.g. ai_generation_enabled)" value={key} onChange={(e) => setKey(e.target.value)} />
        <Input placeholder="type" value={type} onChange={(e) => setType(e.target.value)} />
        <Input type="number" min={0} max={100} value={rolloutPct} onChange={(e) => setRolloutPct(Number(e.target.value))} />
        <Button onClick={submit} disabled={!key || upsert.isPending}><Plus className="mr-1 h-4 w-4" /> Save</Button>
      </div>
      <Input className="mt-2" placeholder="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Textarea className="mt-2 font-mono text-xs" rows={3} placeholder='JSON schema (e.g. {"type":"boolean"})' value={schemaText} onChange={(e) => setSchemaText(e.target.value)} />

      <div className="mt-4 space-y-1.5">
        {flags.length === 0 && <p className="text-xs text-muted-foreground">No flags registered yet.</p>}
        {flags.map((f) => (
          <div key={f.key} className="flex items-start justify-between gap-3 rounded-md border border-border/40 px-3 py-2 text-xs">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{f.key}</span>
                <Badge variant="outline">{f.type}</Badge>
                <Badge variant="secondary">{f.rollout_pct}%</Badge>
              </div>
              {f.description && <p className="mt-0.5 text-muted-foreground">{f.description}</p>}
              {f.schema && Object.keys(f.schema || {}).length > 0 && (
                <pre className="mt-1 overflow-auto rounded bg-muted/30 p-1.5 text-[10px]">{JSON.stringify(f.schema, null, 2)}</pre>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setKey(f.key); setType(f.type); setDescription(f.description ?? "");
                setRolloutPct(f.rollout_pct); setSchemaText(JSON.stringify(f.schema ?? {}, null, 2));
              }}
            >Edit</Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
