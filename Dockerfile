# syntax=docker/dockerfile:1

# ---- build the React client ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN npm ci
COPY . .
RUN npm run build -w @vidya/client

# ---- production image: API serves the built client ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN npm ci --omit=dev -w @vidya/server -w @vidya/shared && npm cache clean --force
COPY packages/shared packages/shared
COPY apps/server apps/server
COPY --from=build /app/apps/client/dist apps/client/dist
RUN mkdir -p apps/server/uploads && chown -R node:node apps/server/uploads
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:5000/api/v1/health || exit 1
CMD ["node", "apps/server/src/server.js"]
