import { z } from 'zod';

export const env = z.object({
  PORT: z.coerce.number().default(5004),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  KAFKA_BROKERS: z.string().default('localhost:9092'),
  MEDIASOUP_LISTEN_IP: z.string().default('0.0.0.0'),
  MEDIASOUP_ANNOUNCED_IP: z.string().optional(),
  MEDIASOUP_MIN_PORT: z.coerce.number().default(10000),
  MEDIASOUP_MAX_PORT: z.coerce.number().default(10100),
  RTC_MIN_PORT: z.coerce.number().default(40000),
  RTC_MAX_PORT: z.coerce.number().default(49999),
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
  // Grace period before a room is fully torn down after its last participant
  // disconnects, so a brief drop/reconnect does not kill the room.
  ROOM_CLOSE_GRACE_MS: z.coerce.number().int().min(0).max(300000).default(15000),
  STREAMING_ACCESS_TOKEN: z
    .string()
    .min(1)
    .optional()
    .superRefine((value, ctx) => {
      if ((process.env.NODE_ENV ?? 'development') === 'production' && !value) {
        ctx.addIssue({
          code: 'custom',
          message: 'STREAMING_ACCESS_TOKEN is required in production',
        });
      }
    }),
}).parse(process.env);
