# Payment Service Dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/payment-service/package.json ./services/payment-service/
RUN pnpm install --frozen-lockfile --filter @ssl/payment-service...

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/payment-service/node_modules ./services/payment-service/node_modules
COPY . .
RUN pnpm --filter @ssl/payment-service build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5004
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nodejs /app/services/payment-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/payment-service/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/payment-service/package.json ./package.json
USER nestjs
EXPOSE 5004
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:5004/health || exit 1
CMD ["node", "dist/main.js"]
