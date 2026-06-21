
import { createSupabaseServerClient } from "@mtk/database";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get Supabase server client for admin operations
 * Uses service role key to bypass RLS
 */
export function getSupabaseServer(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createSupabaseServerClient(supabaseUrl, supabaseServiceKey);
}

export { isSuperAdmin } from "./admin-auth";
