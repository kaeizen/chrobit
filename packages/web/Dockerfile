# Dev image: Vite dev server with volume-mounted source for hot reload.
FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/
RUN pnpm install --filter @routine/web --filter @routine/shared --frozen-lockfile

COPY packages/shared/src ./packages/shared/src
COPY packages/web/index.html ./packages/web/
COPY packages/web/vite.config.ts ./packages/web/
COPY packages/web/tsconfig.json ./packages/web/

# Web source is mounted at runtime via docker-compose volume
WORKDIR /app/packages/web

CMD ["pnpm", "dev", "--host"]
