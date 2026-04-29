import { z } from "zod";

export const env = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().optional(),
    REDIS_URL: z.string().optional(),
    KAFKA_BROKERS: z.string().optional(),
    CORS_ORIGINS: z.string().optional(),
  })
  .parse(process.env);
