import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const Schema = z.object({
  email: z.string().trim().email().max(255),
  source: z.string().max(80).optional().default("landing_footer"),
  // Honeypot fields — must remain empty
  website: z.string().max(0).optional().nullable(),
  company_website: z.string().max(0).optional().nullable(),
  rendered_at: z.number().int().positive().optional(),
});

const lastByEmail = new Map<string, number>();
const ipHits = new Map<string, number[]>();
const EMAIL_WINDOW_MS = 30_000;
const IP_WINDOW_MS = 60 * 60 * 1000;
const IP_MAX = 10;

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Honeypot
    if (
      (typeof body?.website === "string" && body.website.length > 0) ||
      (typeof body?.company_website === "string" && body.company_website.length > 0)
    ) {
      console.warn("[subscribe-newsletter] honeypot triggered", { ip: getClientIp(req) });
      return new Response(
        JSON.stringify({ error: "Submission blocked by anti-spam checks.", code: "honeypot" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (typeof body?.rendered_at === "number" && Date.now() - body.rendered_at < 1200) {
      return new Response(
        JSON.stringify({ error: "Submission looked automated. Please try again.", code: "too_fast" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid email", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { email, source } = parsed.data;
    const emailKey = email.toLowerCase();
    const now = Date.now();

    const ip = getClientIp(req);
    const ipRecent = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
    if (ipRecent.length >= IP_MAX) {
      return new Response(
        JSON.stringify({ error: "Too many subscribe attempts from your network. Try later.", code: "rate_limited_ip" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    ipHits.set(ip, [...ipRecent, now]);

    const last = lastByEmail.get(emailKey) ?? 0;
    if (now - last < EMAIL_WINDOW_MS) {
      return new Response(
        JSON.stringify({ error: "Please wait a moment and retry.", code: "rate_limited_email" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    lastByEmail.set(emailKey, now);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: emailKey, source });

    const duplicate = !!error && error.message.toLowerCase().includes("duplicate");
    if (error && !duplicate) {
      console.error("[subscribe-newsletter] insert failed", error);
      return new Response(
        JSON.stringify({ error: "Failed to subscribe. Please try again.", code: "db_error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, duplicate }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[subscribe-newsletter] error", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", code: "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
