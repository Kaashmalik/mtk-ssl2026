# Auth Service Dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/auth-service/package.json ./services/auth-service/
RUN pnpm install --frozen-lockfile --filter @ssl/auth-service...

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/auth-service/node_modules ./services/auth-service/node_modules
COPY . .
RUN pnpm --filter @ssl/auth-service build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nodejs /app/services/auth-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/auth-service/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/auth-service/package.json ./package.json
USER nestjs
EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:5001/health || exit 1
CMD ["node", "dist/main.js"]
