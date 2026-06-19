# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
# Copy ALL workspace package.json files so npm ci can validate
# the root package-lock.json (which covers every workspace).
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY mobile/package.json ./mobile/
COPY web/package.json ./web/
RUN npm install --workspace=backend --workspace=packages/shared --ignore-scripts

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
COPY backend ./backend
RUN cd packages/shared && npm run build
RUN cd backend && npx prisma generate && npm run build

# ---- runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/packages/shared ./packages/shared
COPY --from=build --chown=appuser:appgroup /app/backend/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/backend/src/modules/reports/pdf/templates ./dist/src/modules/reports/pdf/templates
COPY --from=build --chown=appuser:appgroup /app/backend/src/modules/reports/pdf/fonts ./dist/src/modules/reports/pdf/fonts
COPY --from=build --chown=appuser:appgroup /app/backend/prisma ./prisma
COPY --from=build --chown=appuser:appgroup /app/backend/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=appuser:appgroup /app/backend/package.json ./

USER appuser
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
