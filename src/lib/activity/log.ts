import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side activity logger. Writes into public.user_activity_log via the
 * log_client_event RPC (auth required, always scoped to the caller).
 * Fire-and-forget: never throws, never blocks the UI.
 */
export async function logActivity(
  activityType: string,
  title: string,
  description?: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await (supabase as any).rpc("log_client_event", {
      _activity_type: activityType,
      _title: title,
      _description: description ?? null,
      _metadata: metadata,
    });
  } catch {
    // logging must never break the app
  }
}

const seen = new Set<string>();

/** De-duplicated logging (per browser session) for noisy events like page views. */
export function logActivityOnce(
  key: string,
  activityType: string,
  title: string,
  description?: string | null,
  metadata: Record<string, unknown> = {},
): void {
  if (seen.has(key)) return;
  seen.add(key);
  void logActivity(activityType, title, description, metadata);
}
