FROM oven/bun:1.2.13-alpine

WORKDIR /app

RUN addgroup --system --gid 1001 bunuser && \
    adduser --system --uid 1001 bunuser

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY packages/utils/package.json packages/utils/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN bun install --frozen-lockfile --production

COPY --chown=bunuser:bunuser packages packages
COPY --chown=bunuser:bunuser apps/api apps/api

USER bunuser
WORKDIR /app/apps/api

ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
