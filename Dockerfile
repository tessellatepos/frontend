FROM node:26-alpine AS builder
RUN npm install -g pnpm@11.24.0
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
# The just-published sdk packages are younger than pnpm's release-age policy; drop these once they are a day old.
ENV pnpm_config_verify_deps_before_run=false
RUN pnpm install --frozen-lockfile --ignore-scripts '--config.minimumReleaseAgeExclude=@tessellatepos/*'

COPY . .
RUN pnpm run build

# Serve the static SPA (react-router ssr:false emits build/client)
FROM nginx:stable-alpine AS production
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/build/client /usr/share/nginx/html

# envsubst renders this at startup; only BACKEND_URL and the resolver are substituted
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV BACKEND_URL=http://backend:3000
# Docker's embedded DNS; override for other orchestrators (e.g. kube-dns)
ENV DNS_RESOLVER=127.0.0.11
ENV NGINX_ENVSUBST_FILTER="BACKEND_URL|DNS_RESOLVER"

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
