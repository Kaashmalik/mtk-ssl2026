# Streaming Service Dockerfile (Mediasoup WebRTC)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/streaming-service/package.json ./services/streaming-service/
RUN pnpm install --frozen-lockfile --filter @ssl/streaming-service...

FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/streaming-service/node_modules ./services/streaming-service/node_modules
COPY . .
RUN pnpm --filter @ssl/streaming-service build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5008
RUN apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nodejs /app/services/streaming-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/streaming-service/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/streaming-service/package.json ./package.json
USER nestjs
EXPOSE 5008
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:5008/health || exit 1
CMD ["node", "dist/main.js"]
