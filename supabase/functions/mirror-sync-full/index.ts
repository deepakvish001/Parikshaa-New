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

// ---------- schema drift ----------
async function checkDrift(primary: ReturnType<typeof createClient>) {
  const colSql = `select table_name || '.' || column_name as k
                  from information_schema.columns
                  where table_schema = 'public'`;

  const { data: pRaw, error } = await primary.rpc("mirror_local_q", { q: colSql });
  if (error) return { error: error.message, missingOnMirror: [] as string[] };

  const res = await fetch(`${mirrorUrl}/rest/v1/rpc/mirror_q`, {
    method: "POST",
    headers: mHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ q: colSql }),
  });
  if (!res.ok) return { error: (await res.text()).slice(0, 200), missingOnMirror: [] as string[] };

  const parse = (v: unknown): { k: string }[] => {
    if (typeof v === "string") return JSON.parse(v);
    return (v ?? []) as { k: string }[];
  };

  const pCols = new Set(parse(pRaw).map((r) => r.k));
  const mCols = new Set(parse(await res.json()).map((r) => r.k));
  const missing = [...pCols].filter((k) => !mCols.has(k));
  return { error: null, missingOnMirror: missing.slice(0, 200), missingCount: missing.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!mirrorUrl || !mirrorKey) return json({ error: "Mirror credentials not configured" }, 500);

  const primary = createClient(primaryUrl, primaryKey, { auth: { persistSession: false } });

  let only: string[] | null = null;
  try {
    const body = await req.json();
    if (Array.isArray(body?.only)) only = body.only;
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
    const r = await checkDrift(primary);
    out.schema = r as unknown as Json;
    await primary.from("mirror_sync_log").insert({
      kind: "schema",
      ok: !r.error && (r.missingCount ?? 0) === 0,
      details: r as unknown as Json,
    });
  }

  return json(out);
});
