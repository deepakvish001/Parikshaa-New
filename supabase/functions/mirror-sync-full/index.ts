import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const primaryUrl = Deno.env.get("SUPABASE_URL")!;
const primaryKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const mirrorUrl = Deno.env.get("MIRROR_SUPABASE_URL");
const mirrorKey = Deno.env.get("MIRROR_SUPABASE_SERVICE_ROLE_KEY");

type Json = Record<string, unknown>;

const json = (body: Json, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function mHeaders(extra: Record<string, string> = {}) {
  return {
    apikey: mirrorKey!,
    Authorization: `Bearer ${mirrorKey}`,
    ...extra,
  };
}

// ---------- storage ----------
async function listAll(
  client: ReturnType<typeof createClient>,
  bucket: string,
  prefix = "",
): Promise<{ path: string; size: number }[]> {
  const out: { path: string; size: number }[] = [];
  const { data, error } = await client.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error || !data) return out;
  for (const item of data) {
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    // folders have null id
    if ((item as { id: string | null }).id === null) {
      out.push(...(await listAll(client, bucket, full)));
    } else {
      out.push({ path: full, size: (item.metadata as { size?: number })?.size ?? -1 });
    }
  }
  return out;
}

async function syncStorage(primary: ReturnType<typeof createClient>) {
  const result = { buckets: 0, uploaded: 0, skipped: 0, errors: [] as string[] };

  const { data: buckets, error } = await primary.storage.listBuckets();
  if (error || !buckets) {
    result.errors.push(`listBuckets: ${error?.message}`);
    return result;
  }

  // existing mirror buckets
  const mbRes = await fetch(`${mirrorUrl}/storage/v1/bucket`, { headers: mHeaders() });
  const mBuckets: { id: string }[] = mbRes.ok ? await mbRes.json() : [];
  const mBucketIds = new Set(mBuckets.map((b) => b.id));

  for (const b of buckets) {
    result.buckets++;
    if (!mBucketIds.has(b.id)) {
      const cr = await fetch(`${mirrorUrl}/storage/v1/bucket`, {
        method: "POST",
        headers: mHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id: b.id, name: b.id, public: b.public }),
      });
      if (!cr.ok) result.errors.push(`bucket ${b.id}: ${(await cr.text()).slice(0, 200)}`);
    }

    const objects = await listAll(primary, b.id);
    if (objects.length === 0) continue;

    // mirror inventory for this bucket
    const inv = new Map<string, number>();
    const lr = await fetch(`${mirrorUrl}/storage/v1/object/list/${b.id}`, {
      method: "POST",
      headers: mHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ prefix: "", limit: 10000, sortBy: { column: "name", order: "asc" } }),
    });
    if (lr.ok) {
      const arr: { name: string; metadata?: { size?: number } }[] = await lr.json();
      for (const o of arr) inv.set(o.name, o.metadata?.size ?? -1);
    }

    for (const o of objects) {
      const known = inv.get(o.path);
      if (known !== undefined && known === o.size) {
        result.skipped++;
        continue;
      }
      const dl = await primary.storage.from(b.id).download(o.path);
      if (dl.error || !dl.data) {
        result.errors.push(`download ${b.id}/${o.path}: ${dl.error?.message}`);
        continue;
      }
      const bytes = new Uint8Array(await dl.data.arrayBuffer());
      const up = await fetch(
        `${mirrorUrl}/storage/v1/object/${b.id}/${o.path.split("/").map(encodeURIComponent).join("/")}`,
        {
          method: "POST",
          headers: mHeaders({
            "Content-Type": dl.data.type || "application/octet-stream",
            "x-upsert": "true",
          }),
          body: bytes,
        },
      );
      if (up.ok) result.uploaded++;
      else result.errors.push(`upload ${b.id}/${o.path}: ${(await up.text()).slice(0, 160)}`);
    }
  }
  return result;
}

// ---------- auth users ----------
async function syncAuth(primary: ReturnType<typeof createClient>) {
  const result = { scanned: 0, synced: 0, errors: [] as string[], cursor: null as string | null };

  const { data: last } = await primary
    .from("mirror_sync_log")
    .select("details")
    .eq("kind", "auth")
    .eq("ok", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const after =
    ((last?.details as { cursor?: string } | null)?.cursor) ?? "1970-01-01T00:00:00Z";

  const { data: users, error } = await primary.rpc("mirror_auth_export", {
    _after: after,
    _limit: 500,
  });
  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const rows = (users ?? []) as {
    id: string;
    email: string | null;
    phone: string | null;
    encrypted_password: string | null;
    email_confirmed_at: string | null;
    phone_confirmed_at: string | null;
    raw_user_meta_data: Json | null;
    raw_app_meta_data: Json | null;
    created_at: string;
    updated_at: string;
  }[];

  result.scanned = rows.length;
  let cursor = after;

  for (const u of rows) {
    const payload = [
      {
        id: u.id,
        email: u.email,
        phone: u.phone,
        encrypted_password: u.encrypted_password,
        email_confirmed_at: u.email_confirmed_at,
        phone_confirmed_at: u.phone_confirmed_at,
        raw_user_meta_data: u.raw_user_meta_data ?? {},
        raw_app_meta_data: u.raw_app_meta_data ?? {},
        created_at: u.created_at,
        updated_at: u.updated_at,
      },
    ];

    const sql = `
      set local session_replication_role = replica;
      insert into auth.users (
        instance_id, id, aud, role, email, phone, encrypted_password,
        email_confirmed_at, phone_confirmed_at,
        raw_user_meta_data, raw_app_meta_data, created_at, updated_at
      )
      select '00000000-0000-0000-0000-000000000000'::uuid, x.id, 'authenticated', 'authenticated',
             x.email, x.phone, x.encrypted_password,
             x.email_confirmed_at, x.phone_confirmed_at,
             x.raw_user_meta_data, x.raw_app_meta_data, x.created_at, x.updated_at
      from jsonb_to_recordset('${JSON.stringify(payload).replace(/'/g, "''")}'::jsonb)
        as x(id uuid, email text, phone text, encrypted_password text,
             email_confirmed_at timestamptz, phone_confirmed_at timestamptz,
             raw_user_meta_data jsonb, raw_app_meta_data jsonb,
             created_at timestamptz, updated_at timestamptz)
      on conflict (id) do update set
        email = excluded.email,
        phone = excluded.phone,
        encrypted_password = excluded.encrypted_password,
        email_confirmed_at = excluded.email_confirmed_at,
        raw_user_meta_data = excluded.raw_user_meta_data,
        raw_app_meta_data = excluded.raw_app_meta_data,
        updated_at = excluded.updated_at;`;

    const res = await fetch(`${mirrorUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: mHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ sql }),
    });
    if (res.ok) {
      result.synced++;
      cursor = u.updated_at;
    } else {
      result.errors.push(`${u.id}: ${(await res.text()).slice(0, 200)}`);
    }
  }

  result.cursor = cursor;
  return result;
}

// ---------- schema drift + auto replay ----------
const parseRows = <T,>(v: unknown): T[] => {
  if (typeof v === "string") return JSON.parse(v) as T[];
  return ((v ?? []) as T[]);
};

async function pq<T>(primary: ReturnType<typeof createClient>, q: string): Promise<T[]> {
  const { data, error } = await primary.rpc("mirror_local_q", { q });
  if (error) throw new Error(`primary query: ${error.message}`);
  return parseRows<T>(data);
}

async function mq<T>(q: string): Promise<T[]> {
  const res = await fetch(`${mirrorUrl}/rest/v1/rpc/mirror_q`, {
    method: "POST",
    headers: mHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ q }),
  });
  if (!res.ok) throw new Error(`mirror query: ${(await res.text()).slice(0, 200)}`);
  return parseRows<T>(await res.json());
}

async function mExec(sql: string): Promise<string | null> {
  const res = await fetch(`${mirrorUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: mHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ sql }),
  });
  if (res.ok) {
    await res.text();
    return null;
  }
  return (await res.text()).slice(0, 300);
}

const SKIP_TABLES = new Set(["mirror_outbox", "mirror_sync_log"]);

const Q = {
  enums: `select t.typname as name, e.enumlabel as label
          from pg_type t
          join pg_enum e on e.enumtypid = t.oid
          join pg_namespace n on n.oid = t.typnamespace
          where n.nspname = 'public'
          order by t.typname, e.enumsortorder`,
  columns: `select c.relname as tbl, a.attname as col,
                   format_type(a.atttypid, a.atttypmod) as coltype,
                   a.attnotnull as notnull,
                   pg_get_expr(d.adbin, d.adrelid) as coldefault,
                   a.attnum as pos
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
            left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
            where n.nspname = 'public' and c.relkind = 'r'
            order by c.relname, a.attnum`,
  constraints: `select c.relname as tbl, x.conname as name, x.contype as kind,
                       pg_get_constraintdef(x.oid) as def
                from pg_constraint x
                join pg_class c on c.oid = x.conrelid
                join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and x.contype in ('p','u','c','f')`,
  indexes: `select tablename as tbl, indexname as name, indexdef as def
            from pg_indexes where schemaname = 'public'`,
  rls: `select c.relname as tbl, c.relrowsecurity as enabled
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'`,
  policies: `select tablename as tbl, policyname as name, permissive, roles::text as roles,
                    cmd, coalesce(qual,'') as qual, coalesce(with_check,'') as wcheck
             from pg_policies where schemaname = 'public'`,
  functions: `select p.proname as name,
                     pg_get_function_identity_arguments(p.oid) as args,
                     pg_get_functiondef(p.oid) as def
              from pg_proc p
              join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.prokind in ('f','p')`,
};

type ColRow = { tbl: string; col: string; coltype: string; notnull: boolean; coldefault: string | null; pos: number };
type ConRow = { tbl: string; name: string; kind: string; def: string };
type IdxRow = { tbl: string; name: string; def: string };
type PolRow = { tbl: string; name: string; permissive: string; roles: string; cmd: string; qual: string; wcheck: string };
type FnRow = { name: string; args: string; def: string };

function colDdl(c: ColRow) {
  let s = `"${c.col}" ${c.coltype}`;
  if (c.coldefault) s += ` default ${c.coldefault}`;
  if (c.notnull) s += " not null";
  return s;
}

async function syncSchema(primary: ReturnType<typeof createClient>, apply: boolean) {
  const applied: string[] = [];
  const errors: string[] = [];
  const pending: string[] = [];

  const run = async (label: string, sql: string) => {
    if (!apply) {
      pending.push(label);
      return;
    }
    const err = await mExec(sql);
    if (err) errors.push(`${label}: ${err}`);
    else applied.push(label);
  };

  // 1) enums
  const [pEnums, mEnums] = await Promise.all([
    pq<{ name: string; label: string }>(primary, Q.enums),
    mq<{ name: string; label: string }>(Q.enums),
  ]);
  const groupEnum = (rows: { name: string; label: string }[]) => {
    const m = new Map<string, string[]>();
    for (const r of rows) m.set(r.name, [...(m.get(r.name) ?? []), r.label]);
    return m;
  };
  const pe = groupEnum(pEnums), me = groupEnum(mEnums);
  for (const [name, labels] of pe) {
    if (!me.has(name)) {
      await run(
        `create type ${name}`,
        `create type public."${name}" as enum (${labels.map((l) => `'${l.replace(/'/g, "''")}'`).join(",")});`,
      );
    } else {
      const have = new Set(me.get(name));
      for (const l of labels) {
        if (!have.has(l)) {
          await run(
            `enum ${name} += ${l}`,
            `alter type public."${name}" add value if not exists '${l.replace(/'/g, "''")}';`,
          );
        }
      }
    }
  }

  // 2) tables + columns
  const [pCols, mCols] = await Promise.all([
    pq<ColRow>(primary, Q.columns),
    mq<ColRow>(Q.columns),
  ]);
  const byTable = (rows: ColRow[]) => {
    const m = new Map<string, ColRow[]>();
    for (const r of rows) {
      if (SKIP_TABLES.has(r.tbl)) continue;
      m.set(r.tbl, [...(m.get(r.tbl) ?? []), r]);
    }
    return m;
  };
  const pt = byTable(pCols), mt = byTable(mCols);
  const newTables: string[] = [];

  for (const [tbl, cols] of pt) {
    if (!mt.has(tbl)) {
      newTables.push(tbl);
      const body = cols.map(colDdl).join(", ");
      await run(
        `create table ${tbl}`,
        `create table if not exists public."${tbl}" (${body});
         grant select, insert, update, delete on public."${tbl}" to authenticated;
         grant select on public."${tbl}" to anon;
         grant all on public."${tbl}" to service_role;`,
      );
    } else {
      const have = new Set(mt.get(tbl)!.map((c) => c.col));
      for (const c of cols) {
        if (!have.has(c.col)) {
          await run(
            `${tbl}.${c.col} add column`,
            `alter table public."${tbl}" add column if not exists ${colDdl(c)};`,
          );
        }
      }
    }
  }

  // 3) constraints (pk/unique/check first, fk last)
  const [pCons, mCons] = await Promise.all([
    pq<ConRow>(primary, Q.constraints),
    mq<ConRow>(Q.constraints),
  ]);
  const haveCon = new Set(mCons.map((c) => `${c.tbl}.${c.name}`));
  const ordered = [...pCons].sort((a, b) => (a.kind === "f" ? 1 : 0) - (b.kind === "f" ? 1 : 0));
  for (const c of ordered) {
    if (SKIP_TABLES.has(c.tbl) || haveCon.has(`${c.tbl}.${c.name}`)) continue;
    const label = `constraint ${c.tbl}.${c.name}`;
    const base = `alter table public."${c.tbl}" add constraint "${c.name}" ${c.def};`;
    if (!apply) {
      pending.push(label);
      continue;
    }
    const err = await mExec(base);
    if (!err) {
      applied.push(label);
      continue;
    }
    // pre-existing rows can violate a fk/check that the primary already satisfies —
    // add it NOT VALID so it still guards future writes
    if ((c.kind === "f" || c.kind === "c") && /23514|23503/.test(err)) {
      const err2 = await mExec(
        `alter table public."${c.tbl}" add constraint "${c.name}" ${c.def} not valid;`,
      );
      if (!err2) {
        applied.push(`${label} (not valid)`);
        continue;
      }
      errors.push(`${label}: ${err2}`);
    } else {
      errors.push(`${label}: ${err}`);
    }
  }


  // 4) indexes
  const [pIdx, mIdx] = await Promise.all([
    pq<IdxRow>(primary, Q.indexes),
    mq<IdxRow>(Q.indexes),
  ]);
  const haveIdx = new Set(mIdx.map((i) => i.name));
  for (const i of pIdx) {
    if (SKIP_TABLES.has(i.tbl) || haveIdx.has(i.name)) continue;
    await run(`index ${i.name}`, `${i.def.replace(/^create /i, "create ")};`);
  }

  // 5) RLS + policies
  const [pRls, pPol, mPol] = await Promise.all([
    pq<{ tbl: string; enabled: boolean }>(primary, Q.rls),
    pq<PolRow>(primary, Q.policies),
    mq<PolRow>(Q.policies),
  ]);
  for (const r of pRls) {
    if (SKIP_TABLES.has(r.tbl) || !r.enabled || !newTables.includes(r.tbl)) continue;
    await run(`rls ${r.tbl}`, `alter table public."${r.tbl}" enable row level security;`);
  }
  const havePol = new Set(mPol.map((p) => `${p.tbl}.${p.name}`));
  for (const p of pPol) {
    if (SKIP_TABLES.has(p.tbl) || havePol.has(`${p.tbl}.${p.name}`)) continue;
    const roles = (p.roles || "{public}").replace(/[{}]/g, "");
    const sql = `create policy "${p.name}" on public."${p.tbl}" as ${p.permissive === "PERMISSIVE" ? "permissive" : "restrictive"} for ${p.cmd.toLowerCase() === "all" ? "all" : p.cmd.toLowerCase()} to ${roles}` +
      (p.qual ? ` using (${p.qual})` : "") +
      (p.wcheck ? ` with check (${p.wcheck})` : "") + ";";
    await run(`policy ${p.tbl}.${p.name}`, sql);
  }

  // 6) functions (create or replace, skip mirror-internal ones)
  const pFns = await pq<FnRow>(primary, Q.functions);
  const mFns = await mq<FnRow>(Q.functions);
  const mFnMap = new Map(mFns.map((f) => [`${f.name}(${f.args})`, f.def]));
  for (const f of pFns) {
    if (f.name.startsWith("mirror_")) continue;
    const key = `${f.name}(${f.args})`;
    if (mFnMap.get(key) === f.def) continue;
    await run(`function ${key}`, `${f.def};`);
  }

  // 7) make sure new primary tables get capture triggers
  let attached: unknown = null;
  if (apply && newTables.length > 0) {
    const { data } = await primary.rpc("mirror_attach_all");
    attached = data ?? true;
  }

  return {
    error: null as string | null,
    applied: applied.slice(0, 200),
    appliedCount: applied.length,
    pending: pending.slice(0, 200),
    pendingCount: pending.length,
    errors: errors.slice(0, 50),
    newTables,
    attached,
  };
}

async function checkDrift(primary: ReturnType<typeof createClient>, apply: boolean) {
  try {
    return await syncSchema(primary, apply);
  } catch (e) {
    return {
      error: (e as Error).message,
      applied: [] as string[],
      appliedCount: 0,
      pending: [] as string[],
      pendingCount: 0,
      errors: [] as string[],
      newTables: [] as string[],
      attached: null,
    };
  }
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!mirrorUrl || !mirrorKey) return json({ error: "Mirror credentials not configured" }, 500);

  const primary = createClient(primaryUrl, primaryKey, { auth: { persistSession: false } });

  let only: string[] | null = null;
  let applySchema = true;
  try {
    const body = await req.json();
    if (Array.isArray(body?.only)) only = body.only;
    if (body?.applySchema === false || body?.dryRun === true) applySchema = false;
  } catch (_) { /* no body */ }


  const want = (k: string) => !only || only.includes(k);
  const out: Json = {};

  if (want("storage")) {
    const r = await syncStorage(primary);
    out.storage = r;
    await primary.from("mirror_sync_log").insert({
      kind: "storage",
      ok: r.errors.length === 0,
      details: r as unknown as Json,
    });
  }

  if (want("auth")) {
    const r = await syncAuth(primary);
    out.auth = r;
    await primary.from("mirror_sync_log").insert({
      kind: "auth",
      ok: r.errors.length === 0,
      details: r as unknown as Json,
    });
  }

  if (want("schema")) {
    const r = await checkDrift(primary, applySchema);
    out.schema = r as unknown as Json;
    await primary.from("mirror_sync_log").insert({
      kind: "schema",
      ok: !r.error && r.errors.length === 0,
      details: r as unknown as Json,
    });
  }


  return json(out);
});
