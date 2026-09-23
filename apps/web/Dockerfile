# syntax=docker/dockerfile:1
# Build context: repository root (needs pnpm workspace + packages/shared).
#   docker build -f apps/web/Dockerfile .

FROM node:24-alpine AS build
ARG PNPM_VERSION=12.6.0
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /repo

# Manifests first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter web...

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter web build

FROM nginx:1-alpine
# Rendered to /etc/nginx/conf.d/default.conf at startup (envsubst).
COPY apps/web/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
ENV API_UPSTREAM=http://api:8080 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
