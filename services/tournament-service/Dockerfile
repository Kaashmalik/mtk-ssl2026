# Tournament Service Dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/tournament-service/package.json ./services/tournament-service/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --frozen-lockfile --filter @ssl/tournament-service...

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/tournament-service/node_modules ./services/tournament-service/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY . .
RUN pnpm --filter @ssl/tournament-service build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5002
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nodejs /app/services/tournament-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/tournament-service/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/tournament-service/package.json ./package.json
USER nestjs
EXPOSE 5002
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:5002/health || exit 1
CMD ["node", "dist/main.js"]
