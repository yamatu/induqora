# syntax=docker/dockerfile:1

ARG NODE_VERSION=22
ARG PRISMA_VERSION=6.19.3

FROM node:${NODE_VERSION}-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1

# ---- dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci --no-audit --no-fund

# ---- build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time prerendering needs a database with the schema; content is filled in at runtime.
ENV NEXT_OUTPUT=standalone \
    DATABASE_URL=file:/tmp/build.db \
    SITE_URL=https://induqora.com
RUN npx prisma db push --skip-generate && npm run build

# ---- runtime ----
FROM base AS runner
ARG PRISMA_VERSION
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/app/data/induqora.db \
    UPLOAD_DIR=/app/data/uploads \
    BACKUP_DIR=/app/data/backups

# Prisma CLI is only used by the entrypoint to sync the schema (`prisma db push`).
RUN npm install -g prisma@${PRISMA_VERSION} --no-audit --no-fund && npm cache clean --force

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder /app/prisma/schema.prisma /app/prisma/seed.mjs ./prisma/
COPY --from=builder /app/prisma/content ./prisma/content
COPY docker/entrypoint.sh docker/warmup.mjs ./docker/

RUN sed -i 's/\r$//' ./docker/entrypoint.sh \
  && chmod +x ./docker/entrypoint.sh \
  && mkdir -p /app/data/uploads /app/data/backups \
  && chown -R node:node /app/data /app/.next

USER node
EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]
