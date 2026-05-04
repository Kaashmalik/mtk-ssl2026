# Shakir Super League (SSL)

## Project Overview

**Shakir Super League (SSL)** is a professional cricket league management platform built for tournament organizers, teams, and cricket enthusiasts. It delivers real-time match scoring, AI-powered commentary, live streaming, fantasy cricket, and comprehensive analytics — all wrapped in a modern, responsive web experience designed for the Pakistani cricket community.

## Live URL

Not deployed yet

## GitHub Repository

[https://github.com/Kaashmalik/mtk-ssl2026.git](https://github.com/Kaashmalik/mtk-ssl2026.git)

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Zustand
- **Backend:** NestJS v11 (microservices architecture), WebSocket gateways
- **Database:** PostgreSQL (Supabase), Redis (caching/sessions), ClickHouse (analytics)
- **Event Streaming:** Apache Kafka (real-time ball events, commentary)
- **ORM & Validation:** Drizzle ORM, Zod (runtime env validation)
- **Authentication:** Clerk (SSO, multi-tenant)
- **Payments:** Stripe (international), JazzCash (Pakistan local)
- **AI:** OpenAI GPT (multi-language commentary: English, Urdu, Punjabi, Pashto, Sindhi)
- **Streaming:** Mediasoup (WebRTC live match streaming)
- **Monitoring:** Sentry (error tracking)
- **Deployment:** Docker Compose, Nginx reverse proxy

## Key Features & Highlights

1. **Real-Time Ball-by-Ball Scoring** — NestJS-powered scoring service with WebSocket live sync, offline resilience (IndexedDB queue), undo/redo history, and O(1) incremental state updates. Includes win probability gauge, run-rate Manhattan charts, wagon wheel visualization, and ball timeline.

2. **AI Multi-Language Commentary** — GPT-driven commentary generation with circuit-breaker pattern and Redis caching. Supports five languages (English, Urdu, Punjabi, Pashto, Sindhi) with fallback templates for high availability.

3. **WebRTC Live Streaming** — Mediasoup-based streaming service for low-latency live match broadcasts with multi-room support and producer/consumer management.

4. **Fantasy Cricket & Analytics** — Full fantasy league schema with team creation, player selection, and automated points calculation. ClickHouse-powered analytics with leaderboards, player stats, and match insights. CQRS event-sourcing for immutable ball-event logs.
