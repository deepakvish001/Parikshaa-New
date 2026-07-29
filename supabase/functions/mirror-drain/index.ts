import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BATCH = 500;

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
        res = await fetch(
          `${mirrorUrl}/rest/v1/${row.table_name}` +
            (pkCols.length ? `?on_conflict=${pkCols.join(",")}` : ""),
          {
            method: "POST",
            headers: {
              ...mirrorHeaders,
              Prefer: "resolution=merge-duplicates,return=minimal",
            },
            body: JSON.stringify(row.row_data),
          },
        );
      }

      if (res.ok) {
        okIds.push(row.id);
      } else {
        errored.push({ id: row.id, msg: `${res.status} ${(await res.text()).slice(0, 400)}` });
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
