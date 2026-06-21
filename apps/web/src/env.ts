import { z } from "zod";

/**
 * Centralised, validated environment for the web app.
 *
 * Parsing happens at import time — a missing/invalid required variable will
 * throw a clear error at boot instead of failing silently deep in a request.
 *
 * Sentry note: env files use `SENTRY_DSN` (server-only, no `NEXT_PUBLIC_`
 * prefix). `instrumentation.ts` reads that variable. We deliberately do NOT
 * re-export it as `NEXT_PUBLIC_SENTRY_DSN` because the DSN is not secret but
 * exposing it to the client bundle is unnecessary when the server SDK handles
 * capture.
 */
export const env = z
  .object({
    NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
    NEXT_PUBLIC_WS_URL: z.string().url().default("http://localhost:4000"),
    // Supabase Configuration (Optional - only needed if using Supabase Auth/Storage)
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

    // --- Observability (all optional — features degrade gracefully) ---
    SENTRY_DSN: z.string().optional(),
    SENTRY_TRACES_SAMPLE_RATE: z
      .union([z.string(), z.number()])
      .transform((v) => (typeof v === "string" ? Number(v) : v))
      .pipe(z.number().min(0).max(1))
      .default(0.1),
    REDIS_URL: z.string().optional(),
    LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .default("info"),
  })
  .parse(process.env);
