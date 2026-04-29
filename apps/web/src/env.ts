import { z } from "zod";

export const env = z
  .object({
    NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
    NEXT_PUBLIC_WS_URL: z.string().url().default("http://localhost:4000"),
    // Supabase Configuration (Optional - only needed if using Supabase Auth/Storage)
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  })
  .parse(process.env);
