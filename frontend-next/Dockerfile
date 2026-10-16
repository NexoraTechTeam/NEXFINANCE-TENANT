FROM node:20-alpine AS base

# ── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG BACKEND_URL=http://nexfin-saas-backend:5000
ENV BACKEND_URL=${BACKEND_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Production runner ─────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache curl && \
    addgroup -g 1001 -S nodejs && \
    adduser  -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["node", "server.js"]
