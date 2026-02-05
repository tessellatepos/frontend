# Builder stage: build the Vite app
FROM node:25-alpine AS builder

ARG FRONTEND_DIR=frontend

# Put frontend package.json and sources under /app/frontend so file://../common resolves to /app/common
WORKDIR /app/frontend

# Copy package files and the local common package so file://../common resolves
COPY ${FRONTEND_DIR}/package*.json ./
# place common as a sibling: /app/common
COPY common /app/common

# Install (including devDeps) to run the build
RUN npm ci

# Build the local `common` package using the installed TypeScript compiler so its lib/ exists
# Use the project's tsc (from node_modules) to avoid installing TypeScript inside common
RUN ./node_modules/.bin/tsc -b ../common

# Copy project files needed for the build
COPY ${FRONTEND_DIR}/tsconfig.json ./
COPY ${FRONTEND_DIR}/tsconfig.node.json ./
COPY ${FRONTEND_DIR}/tsconfig.app.json ./
COPY ${FRONTEND_DIR}/vite.config.ts ./
COPY ${FRONTEND_DIR}/index.html ./
COPY ${FRONTEND_DIR}/public ./public
COPY ${FRONTEND_DIR}/src ./src
COPY ${FRONTEND_DIR}/components.json ./

# Build the production bundle
RUN npm run build

# Production stage: serve with nginx
FROM nginx:stable-alpine AS production

# Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy built files
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy a small nginx config to enable SPA fallback
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
