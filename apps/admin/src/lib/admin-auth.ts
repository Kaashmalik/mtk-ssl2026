import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

/**
 * Verify the current request is from a super admin.
 * Uses Clerk v6 auth() which natively supports Next.js 15 async dynamic APIs.
 * Returns the userId string on success, null otherwise.
 */
export async function verifySuperAdmin(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("email, role")
    .eq("id", userId)
    .single();

  const isRoleAdmin = user?.role === "super_admin";
  const isEmailAdmin = SUPER_ADMIN_EMAIL && user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  if (!isRoleAdmin && !isEmailAdmin) {
    return null;
  }

  return userId;
}

/**
 * Check if a given email is a super admin
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
  if (SUPER_ADMIN_EMAIL && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("email", email)
      .single();
    return data?.role === "super_admin";
  } catch {
    return false;
  }
}

