# ==============================================================================
# Multi-stage Dockerfile for Workshop API
# ==============================================================================

# 1. Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# bcrypt is a native module; compile it here, where the build tools are available.
RUN apk add --no-cache python3 make g++

# Copy package*.json first: if the code changes but dependencies do not,
# Docker can reuse this layer and build faster.
COPY package*.json ./
# npm install uses package-lock.json when available.
RUN npm install

COPY . .
# Compile, then remove devDependencies while keeping the compiled bcrypt module.
RUN npm run build && npm prune --omit=dev

# 2. Runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

# NODE_ENV is provided through .env via docker-compose.
# In production, synchronize is disabled and TypeORM does not create tables.

# package.json is required at runtime because it declares "type": "module" (ESM).
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Do not run as root inside the container.
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]