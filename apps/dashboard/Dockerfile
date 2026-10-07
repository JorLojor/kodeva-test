FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g bun@1.2.13

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY packages/utils/package.json packages/utils/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN bun install --frozen-lockfile

COPY packages packages
COPY apps/dashboard apps/dashboard

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN bun run --cwd apps/dashboard build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html
EXPOSE 3000
