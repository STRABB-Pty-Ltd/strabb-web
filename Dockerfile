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
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL
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
CMD ["node", "server.js"]
