FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chmod -R +x node_modules/.bin

ARG NEXTAUTH_URL=http://localhost:3100
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
# INTERNAL_API_URL is read at build time because Next.js evaluates
# next.config.ts during `next build` for standalone output. Setting it
# only as a runtime env var on the container hits the fallback baked
# into the image (`http://localhost:8000`) and all `/be/*` proxy calls
# fail with ECONNREFUSED.
ARG INTERNAL_API_URL=http://localhost:8000
# App Insights browser SDK connection string (F.6a). NEXT_PUBLIC_ so it is
# inlined into the client bundle at build; empty default = telemetry disabled
# (local/CI builds are a no-op). It is an ingestion key, safe to expose client
# side, same as the api's.
ARG NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING=
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL
ENV NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING=$NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING
# NEXTAUTH_SECRET is runtime-only — passed via Container App env vars, NOT baked into image

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
# Bind to all interfaces. The Next standalone server binds to $HOSTNAME,
# which Docker sets to the container id, so it would otherwise NOT listen on
# localhost - breaking the in-container HEALTHCHECK below (and any localhost
# uptime probe). 0.0.0.0 also covers the container IP the platform proxies to.
ENV HOSTNAME=0.0.0.0
# Liveness probe for Docker/Coolify (F.5). Hits the /api/health route via
# node's fetch (no curl in the image); a non-ok status or connection error
# exits non-zero and marks the container unhealthy. Azure Container Apps
# ignores Docker HEALTHCHECK and uses its own probes, so this pays off on
# the qa Docker host.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
