FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN DATABASE_URL=/tmp/build.db npm run build
RUN npm prune --omit=dev

# ---

FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle

RUN mkdir -p /app/data /app/uploads

EXPOSE 3000
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV BODY_SIZE_LIMIT=104857600
ENV DATABASE_URL=/app/data/openfishing.db
ENV UPLOAD_PATH=/app/uploads

CMD ["node", "build/index.js"]
