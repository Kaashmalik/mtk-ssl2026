import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Supabase client factory
 * Creates a client instance with proper typing for multi-tenant support
 */
export function createSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Server-side Supabase client (uses service role key)
 * Bypasses RLS - use with caution, only in trusted server contexts
 */
export function createSupabaseServerClient(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Drizzle ORM database client
 * For direct database access with type-safe queries
 */
const connectionString = process.env.DATABASE_URL || "postgresql://ssl:ssl_dev_password@localhost:5432/ssl_dev";

// For query purposes (connection pooling with max 20 connections)
export const queryClient = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Drizzle ORM instance
export const db = drizzle(queryClient, { schema });

export async function closeDbConnection() {
  await queryClient.end({ timeout: 5 });
}

