FROM node:22-alpine AS builder

RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    rsync

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

RUN node scripts/compile.mjs backend \
    && npm rebuild better-sqlite3 \
    && npx vite build

FROM node:22-alpine AS runner

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm rebuild better-sqlite3

COPY --from=builder /app/app ./app
COPY --from=builder /app/api ./api
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

RUN mkdir -p /app/app_storage \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 -G nodejs \
    && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 12321

ENV NODE_ENV=production

CMD ["node", "app/server.js"]
