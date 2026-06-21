# ADR: Backend Unification Decision

**Status:** Proposed
**Date:** 2026-06-20
**Decision Maker:** Engineering team + stakeholders

## Context

The codebase currently has a **dual-path backend architecture**:

### Path A — Next.js Apps (the *real* backend)
All core product CRUD flows through **Next.js server actions** and **admin API routes**,
which talk directly to Postgres via Drizzle ORM:

- `apps/web/src/app/actions/` — 10 server action files (~1,395 LOC) using `"use server"` + `db` from `@mtk/database`
- `apps/admin/src/app/api/` — 21 route handlers doing the same CRUD with `verifySuperAdmin()`
- **26 of 29** Next.js API route files import `db` and execute Drizzle queries directly

### Path B — NestJS Microservices (largely aspirational)
11 service directories exist under `services/`, but:

| Service | Status |
|---|---|
| `api` (tenants/SSL) | Tested in CI but **never Docker-built or deployed**; only `TenantsModule` + `SslModule` are registered |
| `ssl` module | **The only genuinely unique, non-duplicated backend logic** (ACME/Let's Encrypt). Invoked solely by the Vercel cron job. |
| `matches` module | **Stub** — every method returns hardcoded placeholders; not even registered in `app.module.ts` |
| `scoring` module (in api) | Real WS gateway code but **not wired into app.module.ts** — never runs |
| `scoring-service` | Real (separate service) — HTTP + Kafka + Redis for ball recording |
| `auth-service` | Real gRPC service, but **auth is actually Clerk** in the apps — two auth models coexist |
| `ai-commentary-service` | Real (Kafka consumer) |
| `analytics-service` | Real (ClickHouse leaderboards) |
| `notification-service` | Real (HTTP + Kafka) |
| `payment-service` | Real (Stripe webhook + gRPC) |
| `streaming-service` | Real (mediasoup) |
| `tournament-service` | Real (gRPC) — but duplicates web server actions |
| `api-gateway` | Real HTTP gateway for gRPC services |
| `edge-cache-service` | **Empty** — only has `eslint.config.mjs`, no source |

### Duplication
The same domain logic (tenants, matches, scoring, tournaments) is implemented **three times**:
1. Web server actions
2. Admin API routes
3. NestJS services

### The only thing that actually uses the NestJS API
The Vercel Cron job (`/api/cron/ssl-renewal`) calls `services/api` `/ssl/renew`, and it **gracefully no-ops** if `API_SERVICE_URL` is unset.

## Decision

**Adopt a hybrid "keep the specialists, retire the duplicates" strategy.**

### Keep (genuinely unique, not duplicated in Next.js):
- **`ssl` module** — the only place ACME/DNS-provider logic lives. Already fixed in Phase 3b.
- **`scoring-service`** — real-time ball recording with Kafka + Redis + WebSocket. Too complex to replicate in server actions.
- **`ai-commentary-service`** — Kafka consumer generating commentary from scoring events.
- **`analytics-service`** — ClickHouse queries; different data store, not duplicable in Drizzle.
- **`notification-service`** — push/email/sms fan-out with Kafka.
- **`payment-service`** — Stripe webhook handling.
- **`streaming-service`** — mediasoup WebRTC.
- **`auth-service`** — **evaluate for retirement** (Clerk handles auth in apps); keep only if gRPC services need it.

### Retire / consolidate:
- **`matches` module in `services/api`** — stub that duplicates web actions. Delete.
- **`scoring` module in `services/api`** (the WS gateway) — unwired. Either delete or consolidate into `scoring-service`.
- **`tournament-service`** — duplicates web server actions. Either delete or make web actions call it via gRPC (only worth it at scale).
- **`edge-cache-service`** — empty. Delete the directory.
- **`api-gateway`** — only needed if gRPC services are in the request path. Evaluate after auth-service decision.

### Do NOT do (yet):
- Do **not** migrate all server actions to NestJS. The server actions are working, typed, and tested. A big-bang migration would be high-risk, low-reward.
- Do **not** remove the gRPC services that have real, unique logic (scoring, analytics, notifications, payments, streaming, AI commentary).

## First migration step (Phase 4.1)

**Delete the dead code** to reduce confusion and maintenance burden:
1. Delete `services/edge-cache-service/` (empty directory)
2. Delete `services/api/src/matches/` (stub, unwired)
3. Remove the broken `use-match-data.ts` hook in web (calls the stub matches endpoint)
4. Document the retained services and their roles in `DEPLOY.md`

This is low-risk, high-clarity. The bigger consolidation (tournament-service retirement, auth-service evaluation) should follow as separate, scoped PRs.

## Consequences

- **Positive:** Clearer architecture — developers know CRUD lives in server actions, real-time/specialised logic lives in services.
- **Positive:** Less duplication → fewer places to find and fix bugs.
- **Positive:** Smaller deploy surface (fewer containers to run and monitor).
- **Negative:** The retained services still need their own deploy pipeline (currently only partially set up in CI).
- **Negative:** Auth remains split (Clerk in apps, gRPC auth-service) until a follow-up decision.
