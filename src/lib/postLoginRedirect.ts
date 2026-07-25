import { supabase } from "@/integrations/supabase/client";

/**
 * Determines where a user should land after authenticating.
 *   - Platform admin -> /admin
 *   - Default        -> /learn
 */
export async function getPostLoginPath(userId: string): Promise<string> {
  try {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles?.some((r) => r.role === "admin" || r.role === "owner")) {
      return "/admin";
    }
  } catch (err) {
    console.error("Failed to resolve post-login path:", err);
  }

  return "/learn";
}
