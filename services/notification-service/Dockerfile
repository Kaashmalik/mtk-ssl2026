# Notification Service Dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/notification-service/package.json ./services/notification-service/
RUN pnpm install --frozen-lockfile --filter @ssl/notification-service...

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/notification-service/node_modules ./services/notification-service/node_modules
COPY . .
RUN pnpm --filter @ssl/notification-service build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5005
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nodejs /app/services/notification-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/notification-service/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/notification-service/package.json ./package.json
USER nestjs
EXPOSE 5005
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:5005/health || exit 1
CMD ["node", "dist/main.js"]
