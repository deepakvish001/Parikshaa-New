import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BATCH = 500;

const q = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

/**
 * Insert a row on the mirror with FK/trigger checks disabled.
 * Used when normal PostgREST upsert fails with 23503 (parent row not mirrored yet).
 * Returns null on success, or an error string.
 */
async function fkFallbackWith(
  mirrorUrl: string,
  mirrorKey: string,
  row: { table_name: string; row_pk: Record<string, unknown> | null; row_data: unknown },
): Promise<string | null> {
  const pkCols = Object.keys(row.row_pk ?? {});
  const data = row.row_data as Record<string, unknown>;
  if (!data) return "no row_data";
  const cols = Object.keys(data);
  const setList = cols
    .filter((c) => !pkCols.includes(c))
    .map((c) => `${q(c)} = excluded.${q(c)}`)
    .join(", ");
  const json = JSON.stringify(data).replace(/'/g, "''");
  const tbl = `public.${q(row.table_name)}`;
  const sql = `
    set local session_replication_role = replica;
    insert into ${tbl} (${cols.map(q).join(", ")})
    select ${cols.map((c) => `x.${q(c)}`).join(", ")}
    from jsonb_populate_record(null::${tbl}, '${json}'::jsonb) as x
    ${pkCols.length ? `on conflict (${pkCols.map(q).join(", ")}) do ${setList ? `update set ${setList}` : "nothing"}` : ""};`;

  const res = await fetch(`${mirrorUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: mirrorKey,
      Authorization: `Bearer ${mirrorKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  return res.ok ? null : (await res.text()).slice(0, 300);
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const primaryUrl = Deno.env.get("SUPABASE_URL")!;
  const primaryKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const mirrorUrl = Deno.env.get("MIRROR_SUPABASE_URL");
  const mirrorKey = Deno.env.get("MIRROR_SUPABASE_SERVICE_ROLE_KEY");

  if (!mirrorUrl || !mirrorKey) {
    return new Response(
      JSON.stringify({ error: "Mirror credentials not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const primary = createClient(primaryUrl, primaryKey, {
    auth: { persistSession: false },
  });

  const { data: rows, error } = await primary
    .from("mirror_outbox")
    .select("*")
    .is("synced_at", null)
    .lt("attempts", 12)
    .order("id", { ascending: true })
    .limit(BATCH);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ drained: 0, failed: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const mirrorHeaders = {
    apikey: mirrorKey,
    Authorization: `Bearer ${mirrorKey}`,
    "Content-Type": "application/json",
  };

  const fkFallback = (row: { table_name: string; row_pk: Record<string, unknown> | null; row_data: unknown }) =>
    fkFallbackWith(mirrorUrl, mirrorKey, row);


  const okIds: number[] = [];
  const errored: { id: number; msg: string }[] = [];

  // Preserve ordering per row so updates never overtake inserts.
  for (const row of rows) {
    try {
      let res: Response;
      if (row.op === "delete") {
        const pk = (row.row_pk ?? {}) as Record<string, unknown>;
        const qs = Object.entries(pk)
          .map(([k, v]) => `${encodeURIComponent(k)}=eq.${encodeURIComponent(String(v))}`)
          .join("&");
        if (!qs) {
          okIds.push(row.id);
          continue;
        }
        res = await fetch(`${mirrorUrl}/rest/v1/${row.table_name}?${qs}`, {
          method: "DELETE",
          headers: mirrorHeaders,
        });
      } else {
        const pkCols = Object.keys((row.row_pk ?? {}) as Record<string, unknown>);
        const target =
          `${mirrorUrl}/rest/v1/${row.table_name}` +
          (pkCols.length ? `?on_conflict=${pkCols.join(",")}` : "");
        const post = (body: unknown) =>
          fetch(target, {
            method: "POST",
            headers: {
              ...mirrorHeaders,
              Prefer: "resolution=merge-duplicates,return=minimal",
            },
            body: JSON.stringify(body),
          });

        res = await post(row.row_data);

        // Generated / identity columns can't be written. Drop the offending
        // column the mirror complains about and retry (repeat for each one).
        let payload = row.row_data as Record<string, unknown>;
        for (let i = 0; i < 8 && !res.ok; i++) {
          const t = await res.clone().text();
          const m = t.match(/column "([^"]+)" is a generated column/i) ??
            t.match(/cannot insert a non-DEFAULT value into column "([^"]+)"/i);
          if (!m || !(m[1] in payload)) break;
          payload = { ...payload };
          delete payload[m[1]];
          res = await post(payload);
        }
      }

      if (res.ok) {
        okIds.push(row.id);
      } else {
        const txt = (await res.text()).slice(0, 400);
        // FK violation = ordering issue (parent not mirrored yet).
        // Retry with replication-role=replica so FKs/triggers are bypassed.
        if (res.status === 409 && txt.includes("23503") && row.op !== "delete") {
          const fb = await fkFallback(row);
          if (fb === null) okIds.push(row.id);
          else errored.push({ id: row.id, msg: `fallback: ${fb}` });
        } else {
          errored.push({ id: row.id, msg: `${res.status} ${txt}` });
        }
      }


    } catch (e) {
      errored.push({ id: row.id, msg: String(e).slice(0, 400) });
    }
  }

  if (okIds.length) {
    await primary
      .from("mirror_outbox")
      .update({ synced_at: new Date().toISOString(), last_error: null })
      .in("id", okIds);
  }

  for (const e of errored) {
    await primary.rpc("mirror_mark_failure", { _id: e.id, _err: e.msg });
  }

  return new Response(
    JSON.stringify({ drained: okIds.length, failed: errored.length, sample: errored.slice(0, 3) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
