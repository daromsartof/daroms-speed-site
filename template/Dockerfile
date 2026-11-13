# syntax=docker/dockerfile:1.7
# Self-host image: Next.js standalone output on Node 22, non-root user.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# core/ is the framework (submodule or copy); .dockerignore drops its templates and docs.
COPY core ./core
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app ./
COPY . .
# preview builds: --build-arg DSS_ENV=preview (robots disallow, noindex)
ARG DSS_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1 DSS_DEPLOY_TARGET=docker DSS_ENV=$DSS_ENV
RUN pnpm build

FROM node:22-alpine AS run
WORKDIR /app
ARG DSS_ENV=production
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 DSS_ENV=$DSS_ENV
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "server.js"]
