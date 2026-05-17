# Dev image: tsx watch with volume-mounted source for hot reload.
FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /app

# Install dependencies using workspace lockfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
RUN pnpm install --filter @routine/api --filter @routine/shared --frozen-lockfile

# Copy shared types (not hot-reloaded — types don't change at runtime)
COPY packages/shared/src ./packages/shared/src

# Copy config files
COPY packages/api/tsconfig.json ./packages/api/

# API source is mounted at runtime via docker-compose volume
WORKDIR /app/packages/api

CMD ["pnpm", "dev"]
